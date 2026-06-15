"""
routers/chat.py — Updated chat router using LangChain conversation chains.
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
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

class GenericChatRequest(BaseModel):
    system_prompt: str
    user_message: str
    history: Optional[list[dict]] = None

class HistoryMessage(BaseModel):
    role:    str
    content: str

class ChatResponse(BaseModel):
    answer:     str
    session_id: str
    turn_count: int

@router.post("/generic-stream")
async def generic_stream(req: GenericChatRequest):
    """
    Acts as a LangChain-powered proxy for the existing React frontend UI.
    Receives the System Prompt and User Message, and streams the LangChain response back.
    """
    from langchain_google_genai import ChatGoogleGenerativeAI
    from langchain_core.messages import SystemMessage, HumanMessage
    import os
    
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(500, "GEMINI_API_KEY is missing on the server.")
        
    llm = ChatGoogleGenerativeAI(
        model="gemini-3.1-flash-lite",
        google_api_key=api_key,
        temperature=0.1,
        streaming=True
    )
    
    from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
    
    messages = [SystemMessage(content=req.system_prompt)]
    if req.history:
        for msg in req.history:
            if msg.get("role") == "user":
                messages.append(HumanMessage(content=msg.get("text", "")))
            elif msg.get("role") == "ai":
                messages.append(AIMessage(content=msg.get("text", "")))
    messages.append(HumanMessage(content=req.user_message))
    
    async def generate():
        async for chunk in llm.astream(messages):
            # Format newlines properly for SSE so we don't break the client parser
            chunk_text = chunk.content.replace('\n', '\\n')
            yield f"data: {chunk_text}\n\n"
            
    return StreamingResponse(generate(), media_type="text/event-stream")

@router.post("/generic")
async def generic_call(req: GenericChatRequest):
    try:
        from langchain_google_genai import ChatGoogleGenerativeAI
        from langchain_core.messages import SystemMessage, HumanMessage
        import os
        
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return {"text": "GEMINI_API_KEY is missing on the server."}
            
        llm = ChatGoogleGenerativeAI(
            model="gemini-3.1-flash-lite",
            google_api_key=api_key,
            temperature=0.1
        )
        
        from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
        
        messages = [SystemMessage(content=req.system_prompt)]
        if req.history:
            for msg in req.history:
                if msg.get("role") == "user":
                    messages.append(HumanMessage(content=msg.get("text", "")))
                elif msg.get("role") == "ai":
                    messages.append(AIMessage(content=msg.get("text", "")))
        messages.append(HumanMessage(content=req.user_message))
        
        response = await llm.ainvoke(messages)
        return {"text": response.content}
    except Exception as e:
        import traceback
        err_str = f"Error: {str(e)}\n{traceback.format_exc()}"
        print(err_str)
        return {"text": err_str}

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
