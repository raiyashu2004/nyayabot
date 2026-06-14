"""
services/langchain_chat.py — LangChain conversational legal assistant.
"""

import os
import asyncio
from typing import Optional
from datetime import datetime, timedelta

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.memory import ConversationBufferWindowMemory
from langchain.chains import ConversationChain
from langchain.prompts import PromptTemplate

GEMINI_API_KEY    = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL      = "gemini-2.5-flash-latest"
MEMORY_WINDOW     = 10
SESSION_TTL_HOURS = 2

DOMAIN_CONTEXTS = {
    "constitutional": "\nFOCUS: Constitutional law — Articles, Fundamental Rights, DPSPs, SC constitutional bench judgments.",
    "criminal":       "\nFOCUS: Criminal law — IPC/BNS sections, CrPC/BNSS procedure, bail, evidence law.",
    "civil":          "\nFOCUS: Civil law — CPC procedure, limitation, specific performance, injunctions.",
    "family":         "\nFOCUS: Family law — Hindu/Muslim/Christian personal law, matrimonial relief, custody, maintenance.",
    "property":       "\nFOCUS: Property law — Transfer of Property Act, RERA, registration, stamp duty.",
    "labor":          "\nFOCUS: Labour law — employment rights, termination, gratuity, PF, Industrial Disputes Act.",
}

BASE_PROMPT = """You are NyayaBot, a professional AI legal assistant specialising EXCLUSIVELY in Indian law.

SCOPE: Only answer questions about Indian Constitutional, Criminal, Civil, Family, Property, Labour, Corporate, and Tax law, and Indian court judgments.

CONVERSATION AWARENESS:
- You have the full conversation history below
- When the user references earlier points ("explain that further", "what about X from before"), connect your answer explicitly to what was discussed
- Track evolving legal queries across turns
- If the user changes topic, acknowledge it and address the new topic fresh

STRICT REFUSAL: If a question is NOT about Indian law, respond only with:
"I am NyayaBot, scoped exclusively to Indian law. I cannot assist with questions outside this domain."
Do NOT answer: medicine, technology, cooking, science, maths, foreign law, or general knowledge.

ANSWER FORMAT:
1. Direct Answer
2. Legal Basis — specific Article/Section/Statute
3. Case Law — real SC/HC judgments with citations (e.g. AIR 1978 SC 597)
4. Practical Implication
5. CITATIONS USED

Never fabricate citations. Close with: "For specific legal advice, consult a qualified advocate."{domain_context}

Current conversation:
{history}
Human: {input}
NyayaBot:"""


class LegalConversationChain:
    def __init__(self, session_id: str, domain: str = "all"):
        self.session_id  = session_id
        self.domain      = domain
        self.last_active = datetime.utcnow()

        domain_ctx = DOMAIN_CONTEXTS.get(domain, "")

        self.llm = ChatGoogleGenerativeAI(
            model=GEMINI_MODEL,
            google_api_key=GEMINI_API_KEY,
            temperature=0.1,
            max_output_tokens=2000,
            convert_system_message_to_human=True,
        )

        self.memory = ConversationBufferWindowMemory(
            k=MEMORY_WINDOW,
            human_prefix="Human",
            ai_prefix="NyayaBot",
        )

        prompt = PromptTemplate(
            input_variables=["history", "input"],
            template=BASE_PROMPT.replace("{domain_context}", domain_ctx),
        )

        self.chain = ConversationChain(
            llm=self.llm,
            memory=self.memory,
            prompt=prompt,
            verbose=False,
        )

    async def chat(self, message: str) -> str:
        self.last_active = datetime.utcnow()
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: self.chain.predict(input=message)
        )
        return response

    def get_history(self) -> list[dict]:
        messages = self.memory.chat_memory.messages
        return [
            {"role": "user" if m.type == "human" else "assistant", "content": m.content}
            for m in messages
        ]

    def clear_memory(self):
        self.memory.clear()

    def is_expired(self) -> bool:
        return datetime.utcnow() - self.last_active > timedelta(hours=SESSION_TTL_HOURS)


class SessionManager:
    def __init__(self):
        self._sessions: dict[str, LegalConversationChain] = {}

    def get_or_create(self, session_id: str, domain: str = "all") -> LegalConversationChain:
        if session_id not in self._sessions or self._sessions[session_id].is_expired():
            self._sessions[session_id] = LegalConversationChain(session_id, domain)
        return self._sessions[session_id]

    def clear_session(self, session_id: str):
        if session_id in self._sessions:
            self._sessions[session_id].clear_memory()

    def delete_session(self, session_id: str):
        self._sessions.pop(session_id, None)

    def cleanup_expired(self):
        expired = [sid for sid, s in self._sessions.items() if s.is_expired()]
        for sid in expired:
            del self._sessions[sid]
        return len(expired)

    def stats(self) -> dict:
        return {"active_sessions": len(self._sessions), "session_ids": list(self._sessions.keys())}


session_manager = SessionManager()
