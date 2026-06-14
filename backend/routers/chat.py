"""
routers/chat.py — Updated chat router using LangChain conversation chains.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
import uuid

from services.langchain_chat import session_manager
from utils.auth import get_current_user

router = APIRouter()


class ChatRequest(BaseModel):
    question:   str
    session_id: Optional[str] = None
    domain:     Optional[str] = "all"
    stream:     bool = False


class HistoryMessage(BaseModel):
    role:    str
    content: str


class ChatResponse(BaseModel):
    answer:     str
    session_id: str
    turn_count: int


@router.post("/ask", response_model=ChatResponse)
async def ask(req: ChatRequest, user=Depends(get_current_user)):
    if not req.question.strip():
        raise HTTPException(400, "Question cannot be empty.")
    if len(req.question) > 3000:
        raise HTTPException(400, "Question too long. Max 3000 characters.")

    session_id = req.session_id or str(uuid.uuid4())
    chain = session_manager.get_or_create(session_id, req.domain or "all")

    try:
        answer = await chain.chat(req.question)
    except Exception as e:
        raise HTTPException(500, f"LLM error: {str(e)}")

    history = chain.get_history()

    return ChatResponse(
        answer=answer,
        session_id=session_id,
        turn_count=len([m for m in history if m["role"] == "user"]),
    )


@router.post("/clear")
async def clear_session(session_id: str, user=Depends(get_current_user)):
    session_manager.clear_session(session_id)
    return {"message": "Session memory cleared.", "session_id": session_id}


@router.get("/history/{session_id}")
async def get_history(session_id: str, user=Depends(get_current_user)):
    if session_id not in session_manager._sessions:
        raise HTTPException(404, "Session not found.")
    chain = session_manager._sessions[session_id]
    return {"session_id": session_id, "history": chain.get_history()}


@router.get("/sessions/stats")
async def session_stats(user=Depends(get_current_user)):
    session_manager.cleanup_expired()
    return session_manager.stats()


@router.get("/domains")
async def get_domains():
    return {"domains": [
        {"id": "all",            "label": "All Domains"},
        {"id": "constitutional", "label": "Constitutional Law"},
        {"id": "criminal",       "label": "Criminal Law (IPC/BNS)"},
        {"id": "civil",          "label": "Civil Law (CPC)"},
        {"id": "family",         "label": "Family Law"},
        {"id": "property",       "label": "Property Law"},
        {"id": "labor",          "label": "Labour Law"},
    ]}
