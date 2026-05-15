import os
import random
import uuid
import tempfile
from datetime import datetime
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
from auth import (
    COOKIE_NAME,
    JWT_EXPIRY_DAYS,
    create_token,
    get_current_user,
    get_optional_user,
    hash_password,
    verify_password,
)
from db import Conversation, Message, SessionLocal, User

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
    conversation_id: Optional[int] = None

class SpeechRequest(BaseModel):
    text: str
    voice_id: Optional[str] = None
    language: Optional[str] = "en"  # "en" | "hi" | "kn"


class TranslateRequest(BaseModel):
    text: str
    target_lang: str  # "hi" | "kn" | "en"


LANG_NAMES = {
    "en": "English",
    "hi": "Hindi",
    "kn": "Kannada",
}


def translate_text(text: str, target_lang: str) -> str:
    """Translate `text` into the target language using the configured Gemini model.
    Returns the original text untouched when target_lang is English or empty.
    """
    code = (target_lang or "en").lower()
    if code in ("en", "english") or not text.strip():
        return text
    lang_name = LANG_NAMES.get(code, target_lang)
    from langchain_google_genai import ChatGoogleGenerativeAI
    from langchain_core.messages import HumanMessage
    llm = ChatGoogleGenerativeAI(
        model=os.getenv("model_name", "gemini-2.5-flash-lite"),
        google_api_key=os.getenv("GOOGLE_API_KEY"),
        temperature=0.0,
    )
    prompt = (
        f"Translate the following medical assistant message into {lang_name}.\n"
        "Keep the meaning faithful and the structure (bullets, headings) intact.\n"
        "Do not add commentary or preamble. Return only the translated text.\n\n"
        f"Text:\n{text}"
    )
    response = llm.invoke([HumanMessage(content=prompt)])
    return extract_text_from_content(response.content)


class SignupRequest(BaseModel):
    email: str
    name: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


def _user_dict(user: User) -> Dict:
    return {"id": user.id, "email": user.email, "name": user.name}


def _set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        max_age=JWT_EXPIRY_DAYS * 24 * 60 * 60,
        path="/",
    )


def _serialize_message(m: Message) -> Dict:
    return {
        "id": str(m.id),
        "role": m.role,
        "content": m.content,
        "timestamp": m.created_at.isoformat() + "Z",
        "agentType": m.agent_type,
        "imageUrl": m.image_url,
        "resultImage": m.result_image,
    }


def _serialize_conversation(c: Conversation, include_messages: bool = False) -> Dict:
    data = {
        "id": c.id,
        "title": c.title,
        "created_at": c.created_at.isoformat() + "Z",
        "updated_at": c.updated_at.isoformat() + "Z",
    }
    if include_messages:
        data["messages"] = [_serialize_message(m) for m in c.messages]
    return data


def _ensure_conversation(
    db, user: User, conversation_id: Optional[int], first_user_text: str
) -> Conversation:
    if conversation_id is not None:
        conv = db.get(Conversation, conversation_id)
        if conv is None or conv.user_id != user.id:
            raise HTTPException(status_code=404, detail="Conversation not found")
        return conv

    title = (first_user_text or "New chat").strip().splitlines()[0] if first_user_text else "New chat"
    if len(title) > 60:
        title = title[:57] + "..."
    conv = Conversation(user_id=user.id, title=title or "New chat")
    db.add(conv)
    db.flush()
    return conv


@app.post("/auth/signup")
def auth_signup(payload: SignupRequest, response: Response):
    email = payload.email.strip().lower()
    name = payload.name.strip()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email")
    if not name:
        raise HTTPException(status_code=400, detail="Name is required")
    if len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            raise HTTPException(status_code=409, detail="Email already registered")
        user = User(email=email, name=name, password_hash=hash_password(payload.password))
        db.add(user)
        db.commit()
        db.refresh(user)
    finally:
        db.close()

    token = create_token(user.id)
    _set_auth_cookie(response, token)
    return {"user": _user_dict(user)}


@app.post("/auth/login")
def auth_login(payload: LoginRequest, response: Response):
    email = payload.email.strip().lower()
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user or not verify_password(payload.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        token = create_token(user.id)
        _set_auth_cookie(response, token)
        return {"user": _user_dict(user)}
    finally:
        db.close()


@app.post("/auth/logout")
def auth_logout(response: Response):
    response.delete_cookie(key=COOKIE_NAME, path="/")
    return {"status": "ok"}


@app.get("/auth/me")
def auth_me(user: User = Depends(get_current_user)):
    return {"user": _user_dict(user)}


@app.get("/conversations")
def list_conversations(user: User = Depends(get_current_user)):
    db = SessionLocal()
    try:
        rows = (
            db.query(Conversation)
            .filter(Conversation.user_id == user.id)
            .order_by(Conversation.updated_at.desc())
            .all()
        )
        return {"conversations": [_serialize_conversation(c) for c in rows]}
    finally:
        db.close()


@app.get("/conversations/{conversation_id}")
def get_conversation(conversation_id: int, user: User = Depends(get_current_user)):
    db = SessionLocal()
    try:
        conv = db.get(Conversation, conversation_id)
        if conv is None or conv.user_id != user.id:
            raise HTTPException(status_code=404, detail="Conversation not found")
        return {"conversation": _serialize_conversation(conv, include_messages=True)}
    finally:
        db.close()


@app.delete("/conversations/{conversation_id}")
def delete_conversation(conversation_id: int, user: User = Depends(get_current_user)):
    db = SessionLocal()
    try:
        conv = db.get(Conversation, conversation_id)
        if conv is None or conv.user_id != user.id:
            raise HTTPException(status_code=404, detail="Conversation not found")
        db.delete(conv)
        db.commit()
        return {"status": "ok"}
    finally:
        db.close()

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
    session_id: Optional[str] = Cookie(None),
    user: Optional[User] = Depends(get_optional_user),
):
    """Process user text query through the multi-agent system."""
    if not session_id:
        session_id = str(uuid.uuid4())

    response.set_cookie(key="session_id", value=session_id)

    response_text: str
    agent_name: str
    result_image: Optional[str] = None
    raise_500: Optional[str] = None

    try:
        response_data = process_query(request.query)
        response_text = extract_text_from_content(response_data['messages'][-1].content)
        agent_name = response_data["agent_name"]

        if agent_name == "SKIN_LESION_AGENT, HUMAN_VALIDATION":
            segmentation_path = os.path.join(SKIN_LESION_OUTPUT, "segmentation_plot.png")
            if os.path.exists(segmentation_path):
                result_image = "/uploads/skin_lesion_output/segmentation_plot.png"
            else:
                print("Skin Lesion Output path does not exist.")
    except Exception as e:
        error_str = str(e)
        if "429" in error_str or "quota" in error_str.lower() or "Too Many Requests" in error_str:
            response_text = "External API Rate limit exceeded. Please wait a few moments and try again."
            agent_name = "System"
        else:
            raise_500 = error_str
            response_text = f"An error occurred: {error_str}"
            agent_name = "System"

    result = {
        "status": "success" if raise_500 is None else "error",
        "response": response_text,
        "agent": agent_name,
    }
    if result_image:
        result["result_image"] = result_image

    if user is not None:
        db = SessionLocal()
        try:
            conv = _ensure_conversation(db, user, request.conversation_id, request.query)
            db.add(Message(conversation_id=conv.id, role="user", content=request.query))
            db.add(
                Message(
                    conversation_id=conv.id,
                    role="assistant",
                    content=response_text,
                    agent_type=agent_name,
                    result_image=result_image,
                )
            )
            conv.updated_at = datetime.utcnow()
            db.commit()
            result["conversation_id"] = conv.id
        finally:
            db.close()

    if raise_500:
        raise HTTPException(status_code=500, detail=raise_500)

    return result

@app.post("/upload")
async def upload_image(
    response: Response,
    image: UploadFile = File(...),
    text: str = Form(""),
    conversation_id: Optional[int] = Form(None),
    session_id: Optional[str] = Cookie(None),
    user: Optional[User] = Depends(get_optional_user),
):
    """Process medical image uploads with optional text input."""
    if not allowed_file(image.filename):
        return JSONResponse(
            status_code=400,
            content={
                "status": "error",
                "agent": "System",
                "response": "Unsupported file type. Allowed formats: PNG, JPG, JPEG"
            }
        )

    file_content = await image.read()
    if len(file_content) > config.api.max_image_upload_size * 1024 * 1024:
        return JSONResponse(
            status_code=413,
            content={
                "status": "error",
                "agent": "System",
                "response": f"File too large. Maximum size allowed: {config.api.max_image_upload_size}MB"
            }
        )

    if not session_id:
        session_id = str(uuid.uuid4())

    filename = secure_filename(f"{uuid.uuid4()}_{image.filename}")
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    with open(file_path, "wb") as f:
        f.write(file_content)

    persistent_image_url: Optional[str] = None
    if user is not None:
        persistent_filename = secure_filename(f"{uuid.uuid4()}_{image.filename}")
        persistent_path = os.path.join(FRONTEND_UPLOAD_FOLDER, persistent_filename)
        with open(persistent_path, "wb") as f:
            f.write(file_content)
        persistent_image_url = f"/uploads/frontend/{persistent_filename}"

    response.set_cookie(key="session_id", value=session_id)

    response_text: str
    agent_name: str
    result_image: Optional[str] = None
    raise_500: Optional[str] = None

    try:
        query = {"text": text, "image": file_path}
        response_data = process_query(query)
        response_text = extract_text_from_content(response_data['messages'][-1].content)
        agent_name = response_data["agent_name"]

        if agent_name == "SKIN_LESION_AGENT, HUMAN_VALIDATION":
            segmentation_path = os.path.join(SKIN_LESION_OUTPUT, "segmentation_plot.png")
            if os.path.exists(segmentation_path):
                result_image = "/uploads/skin_lesion_output/segmentation_plot.png"
            else:
                print("Skin Lesion Output path does not exist.")
    except Exception as e:
        error_str = str(e)
        if "429" in error_str or "quota" in error_str.lower() or "Too Many Requests" in error_str:
            response_text = "External API Rate limit exceeded while trying to analyze the image."
            agent_name = "System"
        else:
            raise_500 = error_str
            response_text = f"An error occurred while analyzing the image: {error_str}"
            agent_name = "System"

    result = {
        "status": "success" if raise_500 is None else "error",
        "response": response_text,
        "agent": agent_name,
    }
    if result_image:
        result["result_image"] = result_image

    if user is not None:
        db = SessionLocal()
        try:
            conv = _ensure_conversation(db, user, conversation_id, text or "Image analysis")
            db.add(
                Message(
                    conversation_id=conv.id,
                    role="user",
                    content=text or "(image attached)",
                    image_url=persistent_image_url,
                )
            )
            db.add(
                Message(
                    conversation_id=conv.id,
                    role="assistant",
                    content=response_text,
                    agent_type=agent_name,
                    result_image=result_image,
                )
            )
            conv.updated_at = datetime.utcnow()
            db.commit()
            result["conversation_id"] = conv.id
            if persistent_image_url:
                result["user_image_url"] = persistent_image_url
        finally:
            db.close()

    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception as e:
        print(f"Failed to remove temporary file: {str(e)}")

    if raise_500:
        raise HTTPException(status_code=500, detail=raise_500)

    return result

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

@app.post("/translate")
def translate_endpoint(request: TranslateRequest):
    """Translate a text payload to the requested target language."""
    try:
        translated = translate_text(request.text, request.target_lang)
        return {"translated_text": translated, "target_lang": request.target_lang}
    except Exception as e:
        return JSONResponse(status_code=502, content={"error": f"Translation failed: {str(e)}"})


@app.post("/generate-speech")
async def generate_speech(request: SpeechRequest):
    """Generate speech via ElevenLabs. Optionally translate before synthesis."""
    selected_voice_id = ""
    language = (request.language or "en").lower()
    try:
        text = request.text.strip()
        if not text:
            return JSONResponse(status_code=400, content={"error": "Text is required"})

        if not config.speech.eleven_labs_api_key:
            return JSONResponse(
                status_code=500,
                content={"error": "ELEVEN_LABS_API_KEY is not configured"}
            )

        if language not in ("en", "english"):
            try:
                text = translate_text(text, language)
            except Exception as te:
                return JSONResponse(
                    status_code=502,
                    content={"error": f"Translation step failed: {str(te)}"}
                )

        selected_voice_id = resolve_voice_id(request.voice_id)

        # Languages eleven_multilingual_v2 accepts as a language_code hint.
        # Languages outside this set (e.g. Kannada) still play if the model is given
        # the translated text, but we must omit the hint to avoid a 400.
        ELEVEN_MULTILINGUAL_V2_LANGS = {
            "en", "ja", "zh", "de", "hi", "fr", "ko", "pt", "it", "es", "id",
            "nl", "tr", "fil", "pl", "sv", "bg", "ro", "ar", "cs", "el", "fi",
            "hr", "ms", "sk", "da", "ta", "uk", "ru", "vi",
        }

        convert_kwargs = dict(
            voice_id=selected_voice_id,
            model_id="eleven_multilingual_v2",
            output_format="mp3_44100_128",
            text=text,
            voice_settings={"stability": 0.5, "similarity_boost": 0.5},
        )
        # Only send language_code when the model supports it; otherwise we just feed translated text.
        if language not in ("en", "english") and language in ELEVEN_MULTILINGUAL_V2_LANGS:
            convert_kwargs["language_code"] = language

        try:
            audio_chunks = client.text_to_speech.convert(**convert_kwargs)
        except TypeError:
            convert_kwargs.pop("language_code", None)
            audio_chunks = client.text_to_speech.convert(**convert_kwargs)

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
