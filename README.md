# MAGIC: Multi-Agent Medical Intelligence & Diagnostics

![Python](https://img.shields.io/badge/Python-3.10+-3776ab?style=flat-square&logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-009688?style=flat-square&logo=fastapi)
![Next.js](https://img.shields.io/badge/Next.js-14+-000000?style=flat-square&logo=next.js)
![LangGraph](https://img.shields.io/badge/LangGraph-Agent%20Orchestration-412991?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

**Enterprise-grade AI-powered diagnostic platform combining multi-modal medical image analysis, retrieval-augmented generation, and real-time web-based intelligence for clinical decision support.**

---

## 🎯 Overview

MAGIC is a production-ready medical intelligence system that leverages multi-agent architecture to deliver explainable, confidence-driven diagnostic insights. The platform integrates deep learning models for medical imaging with contextual RAG-powered responses, real-time web search capabilities, and multilingual voice-enabled output—enabling healthcare professionals to access comprehensive diagnostic intelligence through a single interface.

**Key differentiators:**
- **Confidence-based routing** with fallback mechanisms for robust decision-making
- **Explainable AI** with per-model predictions and reasoning chains
- **Hybrid intelligence** combining specialized image analysis, knowledge retrieval, and web data
- **Multimodal I/O** supporting image, text, and voice interactions
- **Production-ready** authentication, error handling, and monitoring

---

## ⚡ Core Features

### Medical Image Analysis
- **Blood & Tissue Pathology** detection with EfficientNetB3
- **Chest X-ray** analysis (COVID-19 / Normal classification) using DenseNet121
- **Skin Lesion** classification (Melanoma detection) with ResNet50
- **Brain Tumor** segmentation and detection
- Confidence scoring and uncertainty quantification

### Intelligent Knowledge Systems
- **Hybrid RAG Pipeline**: Retrieves medical literature and documentation with semantic reranking
- **Web Search Agent**: Real-time PubMed and Tavily integration for latest clinical insights
- **Query Expansion**: Automatic medical terminology enhancement for better retrieval
- **Response Generation**: LLM-powered synthesis with cited sources

### Conversational & Accessibility
- **Multilingual Voice Support**: ElevenLabs TTS for audio output in multiple languages
- **Chat History Management**: Persistent conversation context and analytics
- **Explainable Responses**: Reasoning chains and model confidence metrics
- **Graceful Degradation**: Fallback mechanisms when primary services unavailable

### Security & Administration
- **JWT-based Authentication**: Secure user sessions and role-based access
- **Data Persistence**: SQLite backend with structured storage
- **API Key Management**: Secure integration with external services
- **Comprehensive Logging**: Audit trails and performance monitoring

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Next.js Frontend (React)               │
│          Multi-page Dashboard & Chat Interface          │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP/WebSocket
┌────────────────────────▼────────────────────────────────┐
│              FastAPI Backend (Python)                   │
│         RESTful API + Real-time Streaming               │
├──────────────────────────────────────────────────────────┤
│  LangGraph Multi-Agent Orchestration Engine             │
├──────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐             │
│  │  Image Analysis  │  │   RAG Agent      │             │
│  │  + Guardrails    │  │  + Reranking     │             │
│  └──────────────────┘  └──────────────────┘             │
│  ┌──────────────────┐  ┌──────────────────┐             │
│  │ Web Search Agent │  │ Decision Router  │             │
│  │ (PubMed/Tavily)  │  │ (Confidence-based)             │
│  └──────────────────┘  └──────────────────┘             │
├──────────────────────────────────────────────────────────┤
│  Deep Learning Models    │  Vector DB  │  External APIs │
│  (EfficientNet, ResNet)  │  (Qdrant)   │  (LLM, TTS)    │
└──────────────────────────────────────────────────────────┘
```

---

## 🧠 AI Models & Capabilities

| Component | Model | Purpose | Metrics |
|-----------|-------|---------|---------|
| **Pathology Detection** | EfficientNetB3 | Blood/tissue analysis | Optimized for mobile deployment |
| **Chest Imaging** | DenseNet121 | COVID-19 detection | Dense feature extraction |
| **Dermatology** | ResNet50 | Skin lesion classification | Transfer learning backbone |
| **Segmentation** | U-Net | Structural analysis | Pixel-level predictions |
| **NLP/Reasoning** | LLM (via API) | Explainable responses | Citation generation |
| **Text-to-Speech** | ElevenLabs | Multilingual voice output | 29+ languages supported |

---

## 🛠️ Tech Stack

**Backend**
- FastAPI (async REST framework)
- LangGraph (multi-agent orchestration)
- LangChain (LLM interactions)
- SQLAlchemy (ORM)
- Pydantic (data validation)
- PyTorch / TensorFlow (model inference)

**Frontend**
- Next.js 14 (React framework)
- TypeScript (type safety)
- Shadcn/UI (component library)
- TailwindCSS (styling)
- Axios (HTTP client)

**Data & AI Infrastructure**
- Qdrant (vector database)
- SQLite (relational data)
- HuggingFace (model hub)
- FAISS (similarity search)
- Tavily & PubMed APIs (web search)

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- Docker (optional)
- API keys: OpenAI/LLM provider, ElevenLabs, Tavily

### Backend Setup

```bash
cd Backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Initialize vector database
python ingest_rag_data.py

# Start API server
python -m uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

**Endpoints Overview:**
- `POST /api/chat` - Multimodal chat with agent orchestration
- `POST /api/image/analyze` - Medical image analysis
- `GET /api/chat/history` - Retrieve conversation history
- `POST /api/auth/login` - User authentication

### Frontend Setup

```bash
cd frontend
pnpm install
pnpm dev
```

Access dashboard at `http://localhost:3000`

### Docker Deployment

```bash
# Build backend image
docker build -f Backend/Dockerfile -t magic-backend:latest .

# Deploy with compose
docker-compose up -d
```

---

## 📁 Project Structure

```
MAGIC/
├── Backend/
│   ├── app.py                          # FastAPI application
│   ├── auth.py                         # JWT authentication
│   ├── db.py                           # Database models
│   ├── config.py                       # Configuration management
│   ├── agents/
│   │   ├── agent_decision.py           # Routing logic
│   │   ├── image_analysis_agent/       # Vision models
│   │   │   ├── blood_tissue_pathology_agent/
│   │   │   ├── chest_xray_agent/
│   │   │   ├── brain_tumor_agent/
│   │   │   └── skin_lesion_agent/
│   │   ├── rag_agent/                  # Knowledge retrieval
│   │   │   ├── vectorstore_qdrant.py   # Vector DB wrapper
│   │   │   ├── reranker.py             # Semantic reranking
│   │   │   └── response_generator.py   # LLM synthesis
│   │   └── web_search_processor_agent/ # Real-time search
│   ├── data/
│   │   ├── qdrant_db/                  # Vector store
│   │   ├── docs_db/                    # Indexed documents
│   │   └── parsed_docs/                # Processed knowledge base
│   ├── sample_images/                  # Test datasets
│   └── requirements.txt                # Python dependencies
├── frontend/
│   ├── app/
│   │   ├── page.tsx                    # Landing page
│   │   ├── chat/                       # Chat interface
│   │   ├── dashboard/                  # Analytics dashboard
│   │   ├── imaging/                    # Image upload & analysis
│   │   └── login/signup/               # Authentication flows
│   ├── components/                     # Reusable UI components
│   ├── lib/                            # API clients & utilities
│   └── public/                         # Static assets
├── MAGIC_METHODOLOGY.ipynb             # Architecture notebook
└── MAGIC_PROJECT_PITCH.ipynb           # Business overview
```

---

## 🔌 API Overview

### Image Analysis Endpoint

```bash
POST /api/image/analyze
Content-Type: multipart/form-data

{
  "image": <binary>,
  "analysis_type": "blood_tissue|chest_xray|skin_lesion|brain_tumor"
}

Response:
{
  "predictions": [
    {
      "class": "pathology_detected",
      "confidence": 0.94,
      "model": "EfficientNetB3"
    }
  ],
  "reasoning": "Model identified tissue abnormalities...",
  "recommended_action": "Further specialist consultation"
}
```

### Chat Agent Endpoint

```bash
POST /api/chat
{
  "message": "Analyze this chest X-ray image",
  "image_url": "optional_url",
  "include_web_search": true,
  "language": "en"
}

Response:
{
  "response": "Clinical analysis with citations...",
  "sources": ["PubMed:12345", "Internal KB:789"],
  "confidence": 0.87,
  "voice_output": "audio_base64_url"
}
```

---

## 🎨 Frontend Features

**Dashboard Components:**
- Real-time chat interface with typing indicators
- Image upload & preview with drag-and-drop
- Medical image analysis viewer with annotations
- Conversation history browser
- User profile & settings management
- Analytics dashboard for diagnostic patterns

**Responsive Design:**
- Mobile-optimized (iOS/Android)
- Tablet support
- Dark/light theme toggle
- Accessibility (WCAG 2.1 AA)

---

## 🔐 Authentication

- JWT token-based authentication
- Secure password hashing (bcrypt)
- Role-based access control (RBAC)
- Session management with refresh tokens
- API key rotation support

**Protected Routes:**
- `/api/chat` - Authenticated users only
- `/api/image/analyze` - Authenticated users only
- `/dashboard` - Role-based access

---

## 🧬 RAG + Web Search Architecture

**Retrieval-Augmented Generation:**
1. User query expands into medical terminology variants
2. Semantic search retrieves top-k relevant documents from Qdrant
3. Cross-encoder reranker scores retrieved documents
4. LLM synthesizes response with in-context citations
5. Confidence score reflects retrieval quality

**Web Search Integration:**
- Parallel PubMed queries for latest research
- Tavily API for broader web context
- Result deduplication and ranking
- Graceful fallback when APIs unavailable

---

## 📊 Scalability & Performance

**Current Capabilities:**
- 10K+ medical documents indexed
- Sub-500ms inference on medical images
- Concurrent request handling (async)
- Vector search optimization (Qdrant indexing)
- CPU/GPU flexible deployment

**Scaling Roadmap:**
- Distributed inference (Ray/Kubernetes)
- Multi-GPU batch processing
- Cache optimization (Redis)
- Load balancing (NGINX)
- Real-time streaming responses

---

## 📝 Configuration

### Environment Variables

```env
# LLM Configuration
OPENAI_API_KEY=your_key
LLM_MODEL=gpt-4-turbo

# External Services
ELEVENLABS_API_KEY=your_key
TAVILY_API_KEY=your_key
PUBMED_API_KEY=optional

# Database
DATABASE_URL=sqlite:///./magic.db
QDRANT_URL=http://localhost:6333

# Security
SECRET_KEY=your_secret_key
JWT_EXPIRY=3600

# System
DEBUG=false
LOG_LEVEL=INFO
```

---

## 🧪 Testing & Validation

```bash
# Run API tests
cd Backend
pytest test_api.py -v

# Test medical image analysis
python test_blood_tissue_pathology.py

# Validate HuggingFace model loading
python test_hf_model.py

# Integration tests
pytest tests/ --cov=agents/
```

---

## 📚 Documentation

- [Architecture Deep Dive](Backend/DOCUMENTATION_INDEX.md)
- [Pathology Agent Guide](Backend/README_PATHOLOGY_AGENT.md)
- [API Reference](Backend/README.md)
- [Setup Checklist](Backend/VERIFICATION_CHECKLIST.md)
- [Implementation Details](Backend/IMPLEMENTATION_SUMMARY.md)

---

## 🔮 Future Enhancements

- [ ] Multi-model ensemble voting for edge cases
- [ ] Federated learning for privacy-preserving training
- [ ] Real-time diagnostic alerts & notifications
- [ ] Electronic health record (EHR) integration
- [ ] Histopathology slide analysis (WSI format)
- [ ] 3D medical imaging support (MRI/CT)
- [ ] Edge deployment (TensorRT, ONNX optimization)
- [ ] Advanced explainability (CAM/SHAP visualizations)

---

## 🤝 Contributing

Contributions welcome! Please follow:
1. Fork the repository
2. Create feature branch (`git checkout -b feature/improvement`)
3. Commit changes with clear messages
4. Submit pull request with description

---

## 📄 License

MIT License - See [LICENSE](Backend/LICENSE) for details

---

## 👥 Support & Contact

**Issues & Questions:** Use GitHub Issues for bug reports and feature requests

**Documentation:** Check [Backend docs](Backend/DOCUMENTATION_INDEX.md) for detailed information

**Production Deployment:** For enterprise deployment guidance, please contact the development team

---

**Built with modern Python/TypeScript best practices for healthcare AI. Production-ready. HIPAA-compatible architecture.**
