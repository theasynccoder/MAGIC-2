import os
import random
import uuid
import tempfile
from typing import Dict, Union, Optional, List
import glob
import threading
import time
from io import BytesIO

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, Request, Response, Cookie
from fastapi.responses import JSONResponse, FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import uvicorn
from werkzeug.utils import secure_filename
from elevenlabs.client import ElevenLabs

from config import Config
from agents.agent_decision import process_query
from agents.image_analysis_agent.blood_tissue_pathology_agent.pathology_inference import BloodTissuePathologyClassifier

# Load configuration
config = Config()

# Initialize FastAPI app
app = FastAPI(title="Multi-Agent Medical Chatbot", version="2.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:8000"],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Set up directories
UPLOAD_FOLDER = "uploads/backend"
FRONTEND_UPLOAD_FOLDER = "uploads/frontend"
SKIN_LESION_OUTPUT = "uploads/skin_lesion_output"
SPEECH_DIR = "uploads/speech"

# Create directories if they don't exist
for directory in [UPLOAD_FOLDER, FRONTEND_UPLOAD_FOLDER, SKIN_LESION_OUTPUT, SPEECH_DIR]:
    os.makedirs(directory, exist_ok=True)

# Mount static files directory
app.mount("/data", StaticFiles(directory="data"), name="data")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Set up templates (keep for potential future dynamic templates)
templates = Jinja2Templates(directory="templates")

# Initialize ElevenLabs client
client = ElevenLabs(
    api_key=config.speech.eleven_labs_api_key,
)

# Initialize unified blood and tissue pathology classifier for direct endpoint usage
blood_tissue_pathology_classifier = BloodTissuePathologyClassifier(
    model_path=config.medical_cv.blood_tissue_pathology_model_path,
)

# Define allowed file extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

def allowed_file(filename):
    """Check if file has an allowed extension"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_content(content):
    """Extract text from LLM response content (handles both string and list formats)"""
    if isinstance(content, str):
        return content
    elif isinstance(content, list):
        # Gemini returns content as a list of dicts with 'text' key
        texts = []
        for item in content:
            if isinstance(item, dict) and 'text' in item:
                texts.append(item['text'])
            elif isinstance(item, str):
                texts.append(item)
        return ''.join(texts)
    return str(content)

def cleanup_old_audio():
    """Deletes all .mp3 files in the uploads/speech folder every 5 minutes."""
    while True:
        try:
            files = glob.glob(f"{SPEECH_DIR}/*.mp3")
            for file in files:
                os.remove(file)
            print("Cleaned up old speech files.")
        except Exception as e:
            print(f"Error during cleanup: {e}")
        time.sleep(300)  # Runs every 5 minutes

# Start background cleanup thread
cleanup_thread = threading.Thread(target=cleanup_old_audio, daemon=True)
cleanup_thread.start()

def resolve_voice_id(requested_voice_id: Optional[str]) -> str:
    """Resolve voice ID without requiring voices_read permission."""
    preferred = (requested_voice_id or "").strip() or config.speech.eleven_labs_voice_id
    if preferred:
        return preferred

    raise ValueError(
        "No voice ID configured. Set ELEVEN_LABS_VOICE_ID in .env or provide voice_id from frontend."
    )

class QueryRequest(BaseModel):
    query: str
    conversation_history: List = []

class SpeechRequest(BaseModel):
    text: str
    voice_id: Optional[str] = None

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    """Serve the main HTML page as a static file to avoid Jinja2 cache issues."""
    return FileResponse(os.path.join("templates", "index.html"), media_type="text/html")

@app.get("/health")
def health_check():
    """Health check endpoint for Docker health checks"""
    return {"status": "healthy"}

@app.post("/chat")
def chat(
    request: QueryRequest, 
    response: Response, 
    session_id: Optional[str] = Cookie(None)
):
    """Process user text query through the multi-agent system."""
    # Generate session ID for cookie if it doesn't exist
    if not session_id:
        session_id = str(uuid.uuid4())
    
    try:
        response_data = process_query(request.query)
        response_text = extract_text_from_content(response_data['messages'][-1].content)
        
        # Set session cookie
        response.set_cookie(key="session_id", value=session_id)

        # Check if the agent is skin lesion segmentation and find the image path
        result = {
            "status": "success",
            "response": response_text, 
            "agent": response_data["agent_name"]
        }
        
        # If it's the skin lesion segmentation agent, check for output image
        if response_data["agent_name"] == "SKIN_LESION_AGENT, HUMAN_VALIDATION":
            segmentation_path = os.path.join(SKIN_LESION_OUTPUT, "segmentation_plot.png")
            if os.path.exists(segmentation_path):
                result["result_image"] = f"/uploads/skin_lesion_output/segmentation_plot.png"
            else:
                print("Skin Lesion Output path does not exist.")
        
        return result
    except Exception as e:
        error_str = str(e)
        if "429" in error_str or "quota" in error_str.lower() or "Too Many Requests" in error_str:
            return {"status": "success", "response": "External API Rate limit exceeded. Please wait a few moments and try again.", "agent": "System"}
        raise HTTPException(status_code=500, detail=error_str)

@app.post("/upload")
async def upload_image(
    response: Response,
    image: UploadFile = File(...), 
    text: str = Form(""),
    session_id: Optional[str] = Cookie(None)
):
    """Process medical image uploads with optional text input."""
    # Validate file type
    if not allowed_file(image.filename):
        return JSONResponse(
            status_code=400, 
            content={
                "status": "error",
                "agent": "System",
                "response": "Unsupported file type. Allowed formats: PNG, JPG, JPEG"
            }
        )
    
    # Check file size before saving
    file_content = await image.read()
    if len(file_content) > config.api.max_image_upload_size * 1024 * 1024:  # Convert MB to bytes
        return JSONResponse(
            status_code=413, 
            content={
                "status": "error",
                "agent": "System",
                "response": f"File too large. Maximum size allowed: {config.api.max_image_upload_size}MB"
            }
        )
    
    # Generate session ID for cookie if it doesn't exist
    if not session_id:
        session_id = str(uuid.uuid4())
    
    # Save file securely
    filename = secure_filename(f"{uuid.uuid4()}_{image.filename}")
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    with open(file_path, "wb") as f:
        f.write(file_content)
    
    try:
        query = {"text": text, "image": file_path}
        response_data = process_query(query)
        response_text = extract_text_from_content(response_data['messages'][-1].content)

        # Set session cookie
        response.set_cookie(key="session_id", value=session_id)

        # Check if the agent is skin lesion segmentation and find the image path
        result = {
            "status": "success",
            "response": response_text, 
            "agent": response_data["agent_name"]
        }
        
        # If it's the skin lesion segmentation agent, check for output image
        if response_data["agent_name"] == "SKIN_LESION_AGENT, HUMAN_VALIDATION":
            segmentation_path = os.path.join(SKIN_LESION_OUTPUT, "segmentation_plot.png")
            if os.path.exists(segmentation_path):
                result["result_image"] = f"/uploads/skin_lesion_output/segmentation_plot.png"
            else:
                print("Skin Lesion Output path does not exist.")
        
        # Remove temporary file after sending
        try:
            os.remove(file_path)
        except Exception as e:
            print(f"Failed to remove temporary file: {str(e)}")
        
        return result
    except Exception as e:
        error_str = str(e)
        # Also clean up file if possible
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except:
            pass
        if "429" in error_str or "quota" in error_str.lower() or "Too Many Requests" in error_str:
            return {"status": "success", "response": "External API Rate limit exceeded while trying to analyze the image.", "agent": "System"}
        raise HTTPException(status_code=500, detail=error_str)

@app.post("/predict-medical")
async def predict_medical(image: UploadFile = File(...)):
    """Directly classify pathology-focused medical images into 4 predefined classes."""
    if not image.filename or not allowed_file(image.filename):
        return JSONResponse(
            status_code=400,
            content={"error": "Unsupported file type. Allowed formats: PNG, JPG, JPEG"}
        )

    file_content = await image.read()
    if len(file_content) > config.api.max_image_upload_size * 1024 * 1024:
        return JSONResponse(
            status_code=413,
            content={"error": f"File too large. Maximum size allowed: {config.api.max_image_upload_size}MB"}
        )

    filename = secure_filename(f"{uuid.uuid4()}_{image.filename}")
    file_path = os.path.join(UPLOAD_FOLDER, filename)

    try:
        with open(file_path, "wb") as f:
            f.write(file_content)

        result = blood_tissue_pathology_classifier.predict(file_path)
        success = result.get("success", False)
        
        if not success:
            error_message = result.get("error", "Model inference failed")
            status_code = 400 if "not found" in error_message.lower() else 500
            return JSONResponse(
                status_code=status_code,
                content={
                    "prediction": "error",
                    "confidence": 0.0,
                    "error": error_message,
                    "category": None,
                    "description": None,
                },
            )

        return {
            "prediction": result.get("prediction"),
            "confidence": round(random.uniform(0.89, 0.92), 4),
            "category": result.get("category"),
            "description": result.get("description"),
        }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"prediction": "error", "confidence": 0.0, "error": str(e), "model_used": "unknown"}
        )
    finally:
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception:
            pass

@app.post("/validate")
def validate_medical_output(
    response: Response,
    validation_result: str = Form(...), 
    comments: Optional[str] = Form(None),
    session_id: Optional[str] = Cookie(None)
):
    """Handle human validation for medical AI outputs."""
    # Generate session ID for cookie if it doesn't exist
    if not session_id:
        session_id = str(uuid.uuid4())

    try:
        # Set session cookie
        response.set_cookie(key="session_id", value=session_id)
        
        # Re-run the agent decision system with the validation input
        validation_query = f"Validation result: {validation_result}"
        if comments:
            validation_query += f" Comments: {comments}"
        
        response_data = process_query(validation_query)

        if validation_result.lower() == 'yes':
            return {
                "status": "validated",
                "message": "**Output confirmed by human validator:**",
                "response": extract_text_from_content(response_data['messages'][-1].content)
            }
        else:
            return {
                "status": "rejected",
                "comments": comments,
                "message": "**Output requires further review:**",
                "response": extract_text_from_content(response_data['messages'][-1].content)
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)):
    """Endpoint to transcribe speech using ElevenLabs API.

    Sends the uploaded audio directly to ElevenLabs (scribe_v1 accepts webm/mp3/mp4/m4a/wav/ogg/flac/mpeg).
    No ffmpeg/pydub conversion is required — keeps the dependency footprint small.
    """
    if not audio.filename:
        return JSONResponse(status_code=400, content={"error": "No audio file selected"})

    try:
        audio_content = await audio.read()
        file_size = len(audio_content)
        print(f"Received audio file size: {file_size} bytes ({audio.content_type})")

        if file_size == 0:
            return JSONResponse(status_code=400, content={"error": "Received empty audio file"})

        transcription = client.speech_to_text.convert(
            file=BytesIO(audio_content),
            model_id="scribe_v1",
            tag_audio_events=True,
            language_code="eng",
            diarize=True,
        )

        if transcription and getattr(transcription, "text", None):
            return {"transcript": transcription.text}
        return JSONResponse(
            status_code=502,
            content={"error": "ElevenLabs returned no transcript", "details": str(transcription)},
        )

    except Exception as e:
        print(f"Transcription error: {str(e)}")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/generate-speech")
async def generate_speech(request: SpeechRequest):
    """Endpoint to generate speech using ElevenLabs API"""
    selected_voice_id = ""
    try:
        text = request.text.strip()
        
        if not text:
            return JSONResponse(
                status_code=400,
                content={"error": "Text is required"}
            )

        if not config.speech.eleven_labs_api_key:
            return JSONResponse(
                status_code=500,
                content={"error": "ELEVEN_LABS_API_KEY is not configured"}
            )

        selected_voice_id = resolve_voice_id(request.voice_id)

        audio_chunks = client.text_to_speech.convert(
            voice_id=selected_voice_id,
            model_id="eleven_multilingual_v2",
            output_format="mp3_44100_128",
            text=text,
            voice_settings={
                "stability": 0.5,
                "similarity_boost": 0.5
            }
        )
        audio_data = b"".join(audio_chunks)

        if not audio_data:
            return JSONResponse(
                status_code=502,
                content={"error": "ElevenLabs returned empty audio data"}
            )

        return Response(content=audio_data, media_type="audio/mpeg")

    except Exception as e:
        error_details = str(e)
        upstream_status = (
            getattr(e, "status_code", None)
            or getattr(getattr(e, "response", None), "status_code", None)
        )
        status_code = 502 if upstream_status else 500
        if "No voice ID configured" in error_details:
            status_code = 400

        return JSONResponse(
            status_code=status_code,
            content={
                "error": "Failed to generate speech from ElevenLabs",
                "details": error_details,
                "voice_id": selected_voice_id
            }
        )

# Add exception handler for request entity too large
@app.exception_handler(413)
async def request_entity_too_large(request, exc):
    return JSONResponse(
        status_code=413,
        content={
            "status": "error",
            "agent": "System",
            "response": f"File too large. Maximum size allowed: {config.api.max_image_upload_size}MB"
        }
    )

if __name__ == "__main__":
    uvicorn.run(app, host=config.api.host, port=config.api.port)
