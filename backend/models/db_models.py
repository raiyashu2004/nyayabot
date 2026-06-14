"""
Database models — SQLAlchemy + pgvector schema.

Tables:
- legal_chunks     : embedded text chunks (the vector store)
- users            : registered lawyers/users
- chat_sessions    : conversation history
- document_uploads : uploaded documents + analysis results
"""

from sqlalchemy import (
    Column, String, Integer, Float, Text, DateTime,
    ForeignKey, JSON, Boolean, Index
)
from sqlalchemy.orm import DeclarativeBase, relationship
from sqlalchemy.dialects.postgresql import UUID
from pgvector.sqlalchemy import Vector
from datetime import datetime
import uuid


class Base(DeclarativeBase):
    pass


# ─── Core vector store ───────────────────────────────────

class LegalChunk(Base):
    """
    A single chunk of legal text with its embedding.
    This is the heart of the RAG system.
    """
    __tablename__ = "legal_chunks"

    chunk_id    = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    source_type = Column(String(20), nullable=False)   # constitution|judgment|statute
    domain      = Column(String(30), nullable=True)    # constitutional|criminal|civil|family|property|labor
    source_title= Column(String(500), nullable=False)  # Human-readable title
    citation    = Column(String(300), nullable=False)  # Formal legal citation
    court       = Column(String(100), nullable=True)   # Supreme Court / HC name
    year        = Column(Integer, nullable=True)
    content     = Column(Text, nullable=False)          # The actual chunk text
    chunk_index = Column(Integer, default=0)            # Position within source doc
    embedding   = Column(Vector(1024), nullable=False)  # multilingual-e5-large

    __table_args__ = (
        # IVFFlat index for fast approximate nearest-neighbour search
        Index(
            "ix_legal_chunks_embedding",
            "embedding",
            postgresql_using="ivfflat",
            postgresql_with={"lists": 100},
            postgresql_ops={"embedding": "vector_cosine_ops"},
        ),
        Index("ix_legal_chunks_source_type", "source_type"),
        Index("ix_legal_chunks_domain", "domain"),
        Index("ix_legal_chunks_year", "year"),
    )


# ─── Users ───────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email        = Column(String(255), unique=True, nullable=False)
    name         = Column(String(255), nullable=False)
    password_hash= Column(String(255), nullable=False)
    role         = Column(String(20), default="user")   # user|lawyer|admin
    bar_number   = Column(String(50), nullable=True)    # For verified lawyers
    created_at   = Column(DateTime, default=datetime.utcnow)
    is_active    = Column(Boolean, default=True)

    sessions    = relationship("ChatSession", back_populates="user")
    documents   = relationship("DocumentUpload", back_populates="user")


# ─── Chat sessions ────────────────────────────────────────

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id    = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    domain     = Column(String(30), nullable=True)
    title      = Column(String(255), nullable=True)    # Auto-generated from first message
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user       = relationship("User", back_populates="sessions")
    messages   = relationship("ChatMessage", back_populates="session", order_by="ChatMessage.created_at")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id   = Column(UUID(as_uuid=True), ForeignKey("chat_sessions.id"), nullable=False)
    role         = Column(String(10), nullable=False)   # user|assistant
    content      = Column(Text, nullable=False)
    sources_used = Column(JSON, nullable=True)           # List of citations used
    confidence   = Column(Float, nullable=True)
    created_at   = Column(DateTime, default=datetime.utcnow)

    session      = relationship("ChatSession", back_populates="messages")


# ─── Document uploads ─────────────────────────────────────

class DocumentUpload(Base):
    __tablename__ = "document_uploads"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id         = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    filename        = Column(String(255), nullable=False)
    file_size       = Column(Integer, nullable=True)     # bytes
    storage_path    = Column(String(500), nullable=True) # S3 key or local path
    doc_type        = Column(String(100), nullable=True) # Detected document type
    status          = Column(String(20), default="pending")  # pending|analysing|done|failed
    analysis_result = Column(JSON, nullable=True)        # Full DocumentAnalysis as JSON
    created_at      = Column(DateTime, default=datetime.utcnow)
    completed_at    = Column(DateTime, nullable=True)

    user            = relationship("User", back_populates="documents")
