"""
NyayaBot — Indian Legal AI
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
    print("🏛️  NyayaBot starting up...")
    await init_db()
    await EmbeddingService.initialize()
    print("✅  Embedding model loaded")
    print("✅  Database connected")
    print("🚀  NyayaBot ready")
    yield
    print("👋  NyayaBot shutting down")


app = FastAPI(
    title="NyayaBot API",
    description="Indian Legal AI — RAG-powered assistant for Indian law",
    version="1.0.0",
    lifespan=lifespan,
)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://nyayabot.in"],
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


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "NyayaBot API"}
