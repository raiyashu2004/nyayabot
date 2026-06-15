"""
JurisAI — Indian Legal AI
FastAPI Application Entrypoint
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager

from routers import chat, documents, cases, auth
from services.embeddings import EmbeddingService
from utils.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize services on startup."""
    print("🏛️  JurisAI starting up...")
    try:
        await init_db()
        print("✅  Database connected")
    except Exception as e:
        print(f"⚠️  Database connection failed: {e}. Running without DB.")
    
    try:
        await EmbeddingService.initialize()
        print("✅  Embedding model loaded")
    except Exception as e:
        print(f"⚠️  Embedding model failed: {e}")
        
    print("🚀  JurisAI ready")
    yield
    print("👋  JurisAI shutting down")


app = FastAPI(
    title="JurisAI API",
    description="Indian Legal AI — RAG-powered assistant for Indian law",
    version="1.0.0",
    lifespan=lifespan,
)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://nyayabot.in", "https://nyayabot-six.vercel.app"],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Routers
app.include_router(auth.router,      prefix="/api/auth",      tags=["Auth"])
app.include_router(chat.router,      prefix="/api/chat",      tags=["Legal Chat"])
app.include_router(documents.router, prefix="/api/documents", tags=["Document Analyser"])
app.include_router(cases.router,     prefix="/api/cases",     tags=["Case Finder"])


@app.get("/")
async def root():
    return {
        "status": "JurisAI Backend is Live",
        "message": "The API is running successfully. Please use the frontend React app to interact with the bot.",
        "docs": "/docs"
    }

@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "JurisAI API"}
