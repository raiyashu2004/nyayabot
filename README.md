# NyayaBot — Indian Legal AI Assistant

A RAG-powered legal AI trained on the Indian Constitution, Supreme Court & High Court judgments, and central statutes. Built for lawyers, law students, and citizens seeking verified legal information.

## Features

- **Legal Chat AI** — Ask questions about Indian law with cited answers (no hallucination)
- **Case Finder** — Find past judgments relevant to your matter
- **Document Analyser** — Upload contracts, FIRs, petitions, agreements — get risk flags, clause analysis, and relevant case law
- **Petition Drafter** — AI-assisted drafting with proper legal format
- **Multi-domain** — Constitutional, Criminal, Civil, Family, Property, Labor law

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | FastAPI (Python 3.11+) |
| Vector DB | pgvector (PostgreSQL) |
| Embeddings | `multilingual-e5-large` via HuggingFace |
| LLM | Anthropic Claude API |
| PDF Parsing | PyMuPDF (fitz) |
| Document OCR | Tesseract (for scanned docs) |
| Auth | JWT + bcrypt |
| Storage | AWS S3 / local filesystem |

## Project Structure

```
nyayabot/
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page-level components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── utils/          # API client, helpers
│   │   └── styles/         # Global styles
│   └── package.json
├── backend/                # FastAPI application
│   ├── main.py             # App entrypoint
│   ├── routers/            # API route handlers
│   │   ├── chat.py         # Legal chat endpoints
│   │   ├── documents.py    # Document analyser endpoints
│   │   ├── cases.py        # Case finder endpoints
│   │   └── auth.py         # Auth endpoints
│   ├── services/           # Business logic
│   │   ├── rag.py          # RAG pipeline (core)
│   │   ├── embeddings.py   # Embedding generation
│   │   ├── llm.py          # LLM wrapper (Claude)
│   │   ├── document_parser.py  # PDF/DOCX parsing
│   │   └── case_retriever.py   # Case law search
│   ├── models/             # SQLAlchemy + Pydantic models
│   ├── utils/              # Shared utilities
│   └── requirements.txt
├── data/                   # Data ingestion scripts
│   ├── ingest_constitution.py
│   ├── ingest_judgments.py
│   └── ingest_statutes.py
└── docker-compose.yml
```

## Quick Start

### 1. Clone and set up environment

```bash
git clone https://github.com/yourname/nyayabot
cd nyayabot

# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Frontend
cd ../frontend
npm install
```

### 2. Configure environment variables

```bash
# backend/.env
ANTHROPIC_API_KEY=your_key_here
DATABASE_URL=postgresql://user:pass@localhost:5432/nyayabot
INDIANKANOON_API_KEY=your_key_here  # from indiankanoon.org/api/
AWS_ACCESS_KEY_ID=...               # for document storage
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=nyayabot-documents
JWT_SECRET=your_secret_here
```

### 3. Set up the database

```bash
# Start PostgreSQL with pgvector
docker-compose up -d db

# Run migrations
cd backend
alembic upgrade head
```

### 4. Ingest legal data

```bash
cd data
python ingest_constitution.py     # ~2 mins
python ingest_statutes.py         # ~15 mins
python ingest_judgments.py        # ~3-4 hours for full SC corpus
```

### 5. Run the application

```bash
# Terminal 1 — Backend
cd backend && uvicorn main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend && npm run dev
```

App runs at `http://localhost:5173`

## Data Sources

| Source | Data | How to get |
|---|---|---|
| India Code | Constitution + all central statutes | indiacode.nic.in (free) |
| Indian Kanoon API | SC + HC judgments | indiankanoon.org/api (free tier available) |
| SCC Online | Premium judgment database | Subscription (for production) |
| eCourts | District court orders | ecourts.gov.in (free) |

## Anti-Hallucination Design

1. **RAG-only answers** — LLM only answers from retrieved chunks, never from parametric memory
2. **Confidence threshold** — If best chunk similarity < 0.72, responds: "I could not find a reliable source for this in my database."
3. **Mandatory citations** — System prompt requires citing article/section/case for every factual claim
4. **Source display** — Every answer shows clickable source tags with full citation
5. **Fallback disclaimer** — Out-of-scope queries redirect to qualified legal counsel

## Deployment

See `docs/deployment.md` for full AWS / Railway / Docker deployment guide.

## License

MIT — free to use, modify, and deploy.
