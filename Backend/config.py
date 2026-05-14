"""
Configuration file for the Multi-Agent Medical Chatbot

This file contains all the configuration parameters for the project.

If you want to change the LLM and Embedding model:

you can do it by changing all 'llm' and 'embedding_model' variables present in multiple classes below.

Each llm definition has unique temperature value relevant to the specific class.
"""

import os
from functools import lru_cache
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_community.embeddings import HuggingFaceEmbeddings

# Load environment variables from .env file
load_dotenv(override=True)


@lru_cache(maxsize=1)
def get_shared_hf_embeddings(model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
    """Return a single shared embedding model instance for the process."""
    return HuggingFaceEmbeddings(model_name=model_name)

class AgentDecisoinConfig:
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model = os.getenv("model_name", "gemini-2.5-flash-lite"),  # Gemini model name
            google_api_key = os.getenv("GOOGLE_API_KEY"),  # Google API key
            temperature = 0.1  # Deterministic
        )

class ConversationConfig:
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model = os.getenv("model_name", "gemini-2.5-flash-lite"),  # Gemini model name
            google_api_key = os.getenv("GOOGLE_API_KEY"),  # Google API key
            temperature = 0.7  # Creative but factual
        )

class WebSearchConfig:
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model = os.getenv("model_name", "gemini-2.5-flash-lite"),  # Gemini model name
            google_api_key = os.getenv("GOOGLE_API_KEY"),  # Google API key
            temperature = 0.3  # Slightly creative but factual
        )
        self.context_limit = 20     # include last 20 messsages (10 Q&A pairs) in history

# class RAGConfig:
#     def __init__(self):
#         self.vector_db_type = "qdrant"
#         self.embedding_dim = 768  # Google embedding dimension
#         self.local_embedding_dim = 384  # all-MiniLM-L6-v2 dimension
#         self.google_embedding_model_name = os.getenv("GOOGLE_EMBEDDING_MODEL_NAME", "models/text-embedding-004")
#         self.distance_metric = "Cosine"  # Add this with a default value
#         self.use_local = True  # Add this with a default value
#         self.vector_local_path = "./data/qdrant_db"  # Add this with a default value
#         self.doc_local_path = "./data/docs_db"
#         self.parsed_content_dir = "./data/parsed_docs"
#         self.url = os.getenv("QDRANT_URL")
#         self.api_key = os.getenv("QDRANT_API_KEY")
#         self.collection_name = "medical_assistance_rag"  # Ensure a valid name
#         self.chunk_size = 512  # Modify based on documents and performance
#         self.chunk_overlap = 50  # Modify based on documents and performance
#         # Optional extra embedding configuration
#         self.local_embedding_model_name = os.getenv("LOCAL_EMBEDDING_MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2")
#         self.use_local_hf_embeddings = os.getenv("USE_LOCAL_HF_EMBEDDINGS", "false").strip().lower() == "true"
#         self.local_embedding_model = (
#             HuggingFaceEmbeddings(model_name=self.local_embedding_model_name)
#             if self.use_local_hf_embeddings else None
#         )
#         # Select active embedding backend
#         if self.use_local_hf_embeddings:
#             self.embedding_model = self.local_embedding_model
#             self.embedding_dim = self.local_embedding_dim
#         else:
#             self.embedding_model = GoogleGenerativeAIEmbeddings(
#                 model=self.google_embedding_model_name,
#                 google_api_key=os.getenv("GOOGLE_API_KEY")
#             )
#             self.embedding_dim = 768
#         self.llm = ChatGoogleGenerativeAI(
#             model = os.getenv("model_name", "gemini-2.5-flash-lite"),  # Gemini model name
#             google_api_key = os.getenv("GOOGLE_API_KEY"),  # Google API key
#             temperature = 0.3  # Slightly creative but factual
#         )
#         self.summarizer_model = ChatGoogleGenerativeAI(
#             model = os.getenv("model_name", "gemini-2.5-flash-lite"),  # Gemini model name
#             google_api_key = os.getenv("GOOGLE_API_KEY"),  # Google API key
#             temperature = 0.5  # Slightly creative but factual
#         )
#         self.chunker_model = ChatGoogleGenerativeAI(
#             model = os.getenv("model_name", "gemini-2.5-flash-lite"),  # Gemini model name
#             google_api_key = os.getenv("GOOGLE_API_KEY"),  # Google API key
#             temperature = 0.0  # factual
#         )
#         self.response_generator_model = ChatGoogleGenerativeAI(
#             model = os.getenv("model_name", "gemini-2.5-flash-lite"),  # Gemini model name
#             google_api_key = os.getenv("GOOGLE_API_KEY"),  # Google API key
#             temperature = 0.3  # Slightly creative but factual
#         )
#         self.top_k = 5
#         self.vector_search_type = 'similarity'  # or 'mmr'

#         self.huggingface_token = os.getenv("HUGGINGFACE_TOKEN")

#         self.reranker_model = "cross-encoder/ms-marco-TinyBERT-L-6"
#         self.reranker_top_k = 3

#         self.max_context_length = 8192  # (Change based on your need) # 1024 proved to be too low (retrieved content length > context length = no context added) in formatting context in response_generator code

#         self.include_sources = True  # Show links to reference documents and images along with corresponding query response

#         # ADJUST ACCORDING TO ASSISTANT'S BEHAVIOUR BASED ON THE DATA INGESTED:
#         self.min_retrieval_confidence = 0.40  # The auto routing from RAG agent to WEB_SEARCH agent is dependent on this value

#         self.context_limit = 20     # include last 20 messsages (10 Q&A pairs) in history

class RAGConfig:
    def __init__(self):
        self.vector_db_type = "qdrant"
        # Using local HuggingFace embeddings (no Gemini quota usage)
        self.embedding_dim = 384  # Dimension for all-MiniLM-L6-v2
        self.distance_metric = "Cosine"  # Add this with a default value
        self.use_local = True  # Add this with a default value
        self.vector_local_path = "./data/qdrant_db"  # Add this with a default value
        self.doc_local_path = "./data/docs_db"
        self.parsed_content_dir = "./data/parsed_docs"
        self.url = os.getenv("QDRANT_URL")
        self.api_key = os.getenv("QDRANT_API_KEY")
        self.collection_name = "medical_assistance_rag"  # Ensure a valid name
        self.chunk_size = 512  # Modify based on documents and performance
        self.chunk_overlap = 50  # Modify based on documents and performance
        # Initialize local HuggingFace embeddings (no external LLM calls)
        self.embedding_model = get_shared_hf_embeddings("sentence-transformers/all-MiniLM-L6-v2")
        self.llm = ChatGoogleGenerativeAI(
            model = os.getenv("model_name", "gemini-1.5-flash"),  # Gemini model name
            google_api_key = os.getenv("GOOGLE_API_KEY"),  # Google API key
            temperature = 0.3  # Slightly creative but factual
        )
        self.summarizer_model = ChatGoogleGenerativeAI(
            model = os.getenv("model_name", "gemini-1.5-flash"),  # Gemini model name
            google_api_key = os.getenv("GOOGLE_API_KEY"),  # Google API key
            temperature = 0.5  # Slightly creative but factual
        )
        self.chunker_model = ChatGoogleGenerativeAI(
            model = os.getenv("model_name", "gemini-1.5-flash"),  # Gemini model name
            google_api_key = os.getenv("GOOGLE_API_KEY"),  # Google API key
            temperature = 0.0  # factual
        )
        self.response_generator_model = ChatGoogleGenerativeAI(
            model = os.getenv("model_name", "gemini-1.5-flash"),  # Gemini model name
            google_api_key = os.getenv("GOOGLE_API_KEY"),  # Google API key
            temperature = 0.3  # Slightly creative but factual
        )
        self.top_k = 5
        self.vector_search_type = 'similarity'  # or 'mmr'

        self.huggingface_token = os.getenv("HUGGINGFACE_TOKEN")

        self.reranker_model = "cross-encoder/ms-marco-TinyBERT-L-6"
        self.reranker_top_k = 3

        self.max_context_length = 8192  # (Change based on your need) # 1024 proved to be too low (retrieved content length > context length = no context added) in formatting context in response_generator code

        self.include_sources = True  # Show links to reference documents and images along with corresponding query response

        # ADJUST ACCORDING TO ASSISTANT'S BEHAVIOUR BASED ON THE DATA INGESTED:
        self.min_retrieval_confidence = 0.40  # The auto routing from RAG agent to WEB_SEARCH agent is dependent on this value

        self.context_limit = 20     # include last 20 messsages (10 Q&A pairs) in history

class MedicalCVConfig:
    def __init__(self):
        self.brain_tumor_model_path = "./agents/image_analysis_agent/brain_tumor_agent/models/model.pth"
        self.chest_xray_model_path = "./agents/image_analysis_agent/chest_xray_agent/models/covid_chest_xray_model.pth"
        self.skin_lesion_model_path = "./agents/image_analysis_agent/skin_lesion_agent/models/checkpointN25_.pth.tar"
        self.skin_lesion_segmentation_output_path = "./uploads/skin_lesion_output/segmentation_plot.png"
        
        # Unified Blood and Tissue Pathology Classifier
        # Handles: Blood Diseases (Anemia, Thalassemia, Leukemia) and Tissue Pathology (Lung)
        self.blood_tissue_pathology_model_path = "./agents/image_analysis_agent/blood_tissue_pathology_agent/models/model.pth"
        self.blood_tissue_pathology_confidence_threshold = float(os.getenv("BLOOD_TISSUE_PATHOLOGY_CONFIDENCE_THRESHOLD", "0.6"))
        
        # Deprecated: Use blood_tissue_pathology_model_path instead
        # self.medical_pathology_model_path = "./agents/image_analysis_agent/medical_pathology_agent/models/medical_model.pth"
        # self.medical_pathology_hf_model_id = os.getenv("HF_MEDICAL_PATHOLOGY_MODEL_ID", "google/vit-base-patch16-224")
        # self.medical_pathology_confidence_threshold = float(os.getenv("MEDICAL_PATHOLOGY_CONFIDENCE_THRESHOLD", "0.6"))
        
        self.llm = ChatGoogleGenerativeAI(
            model = os.getenv("model_name", "gemini-2.5-flash-lite"),  # Gemini model name
            google_api_key = os.getenv("GOOGLE_API_KEY"),  # Google API key
            temperature = 0.1  # Keep deterministic for classification tasks
        )

class SpeechConfig:
    def __init__(self):
        self.eleven_labs_api_key = os.getenv("ELEVEN_LABS_API_KEY")  # Replace with your actual key
        self.eleven_labs_voice_id = os.getenv("ELEVEN_LABS_VOICE_ID", "").strip()

class ValidationConfig:
    def __init__(self):
        self.require_validation = {
            "CONVERSATION_AGENT": False,
            "RAG_AGENT": False,
            "WEB_SEARCH_AGENT": False,
            "BRAIN_TUMOR_AGENT": True,
            "CHEST_XRAY_AGENT": True,
            "SKIN_LESION_AGENT": True,
            "MEDICAL_PATHOLOGY_AGENT": True
        }
        self.validation_timeout = 300
        self.default_action = "reject"

class APIConfig:
    def __init__(self):
        self.host = "0.0.0.0"
        self.port = int(os.getenv("PORT", 8001))
        self.debug = True
        self.rate_limit = 10
        self.max_image_upload_size = 5  # max upload size in MB

class UIConfig:
    def __init__(self):
        self.theme = "light"
        # self.max_chat_history = 50
        self.enable_speech = True
        self.enable_image_upload = True

class Config:
    def __init__(self):
        self.agent_decision = AgentDecisoinConfig()
        self.conversation = ConversationConfig()
        self.rag = RAGConfig()
        self.medical_cv = MedicalCVConfig()
        self.web_search = WebSearchConfig()
        self.api = APIConfig()
        self.speech = SpeechConfig()
        self.validation = ValidationConfig()
        self.ui = UIConfig()
        self.eleven_labs_api_key = os.getenv("ELEVEN_LABS_API_KEY")
        self.tavily_api_key = os.getenv("TAVILY_API_KEY")
        self.max_conversation_history = 20  # Include last 20 messsages (10 Q&A pairs) in history


@lru_cache(maxsize=1)
def get_config() -> Config:
    """Return one shared Config instance per process."""
    return Config()

# # Example usage
# config = Config()
