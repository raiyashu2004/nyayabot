"""
RAG Pipeline — Core of JurisAI's anti-hallucination system.

How it works:
1. Embed the user query
2. Retrieve top-K semantically similar chunks from pgvector
3. Build a grounded prompt with ONLY retrieved context
4. LLM answers strictly from context — never from memory
5. Citations extracted and returned alongside the answer
"""

from typing import Optional
from dataclasses import dataclass

from services.embeddings import EmbeddingService
from services.llm import LLMService
from utils.database import get_db_pool


@dataclass
class RetrievedChunk:
    chunk_id: str
    source_type: str        # "constitution" | "judgment" | "statute"
    source_title: str       # e.g. "Article 21 – Protection of Life and Personal Liberty"
    citation: str           # e.g. "AIR 1978 SC 597" or "Article 21, Constitution of India"
    court: Optional[str]    # "Supreme Court" | "Delhi High Court" | None
    year: Optional[int]
    content: str
    similarity: float


@dataclass
class RAGResponse:
    answer: str
    sources: list[RetrievedChunk]
    confidence: float       # 0–1, based on best chunk similarity
    fallback: bool          # True if below confidence threshold


SYSTEM_PROMPT = """You are JurisAI, an AI legal assistant specializing in Indian law.

STRICT RULES:
1. Answer ONLY from the provided CONTEXT sections below. Never use your own knowledge or training data for legal facts.
2. Cite every factual claim with the specific source given (Article number, case name, section, etc.).
3. If the context does not contain enough information to answer the question, say: "I could not find a reliable source for this in my legal database. Please consult a qualified advocate."
4. Never make up case names, citations, or legal provisions.
5. Always note that your answer is for informational purposes and not legal advice.
6. Format citations clearly like: [Article 21, Constitution of India] or [K.S. Puttaswamy v. UoI, (2017) 10 SCC 1].

OUTPUT FORMAT:
- Lead with a direct answer.
- Support with cited legal provisions and precedents from the context.
- End with: "SOURCES USED:" followed by a numbered list of citations.

Respond in clear, plain English. Avoid Latin maxims unless necessary, and explain them when used."""


CONFIDENCE_THRESHOLD = 0.72


class RAGPipeline:

    def __init__(self):
        self.embedder = EmbeddingService()
        self.llm = LLMService()

    async def query(
        self,
        question: str,
        domain: Optional[str] = None,    # "constitutional" | "criminal" | "civil" etc.
        top_k: int = 8,
    ) -> RAGResponse:
        """
        Main RAG query pipeline.
        Returns a grounded answer with citations — never hallucinates.
        """

        # Step 1: Embed the user query
        query_embedding = await self.embedder.embed(question)

        # Step 2: Retrieve relevant chunks from vector DB
        chunks = await self._retrieve_chunks(
            embedding=query_embedding,
            domain=domain,
            top_k=top_k,
        )

        # Step 3: Check confidence — if best match is poor, return fallback
        if not chunks or chunks[0].similarity < CONFIDENCE_THRESHOLD:
            return RAGResponse(
                answer=(
                    "I could not find a reliable source for this question in my legal database. "
                    "This may be outside my current knowledge base, or phrased in a way I don't recognize. "
                    "Please consult a qualified advocate or refer to official legal resources."
                ),
                sources=[],
                confidence=chunks[0].similarity if chunks else 0.0,
                fallback=True,
            )

        # Step 4: Build grounded prompt with retrieved context
        context_text = self._build_context(chunks)
        prompt = self._build_prompt(question, context_text)

        # Step 5: Call LLM — strictly grounded in context
        answer = await self.llm.complete(
            system=SYSTEM_PROMPT,
            user=prompt,
            max_tokens=1500,
        )

        return RAGResponse(
            answer=answer,
            sources=chunks,
            confidence=chunks[0].similarity,
            fallback=False,
        )

    async def _retrieve_chunks(
        self,
        embedding: list[float],
        domain: Optional[str],
        top_k: int,
    ) -> list[RetrievedChunk]:
        """
        Query pgvector for semantically similar chunks.
        Optionally filter by legal domain for precision.
        """
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            # Build query — filter by domain if provided
            domain_filter = "AND domain = $3" if domain else ""
            params = [embedding, top_k]
            if domain:
                params.append(domain)

            rows = await conn.fetch(
                f"""
                SELECT
                    chunk_id,
                    source_type,
                    source_title,
                    citation,
                    court,
                    year,
                    content,
                    1 - (embedding <=> $1::vector) AS similarity
                FROM legal_chunks
                WHERE 1 - (embedding <=> $1::vector) > 0.55
                {domain_filter}
                ORDER BY embedding <=> $1::vector
                LIMIT $2
                """,
                *params,
            )

        return [
            RetrievedChunk(
                chunk_id=r["chunk_id"],
                source_type=r["source_type"],
                source_title=r["source_title"],
                citation=r["citation"],
                court=r["court"],
                year=r["year"],
                content=r["content"],
                similarity=round(r["similarity"], 4),
            )
            for r in rows
        ]

    def _build_context(self, chunks: list[RetrievedChunk]) -> str:
        """Format retrieved chunks as numbered context blocks."""
        sections = []
        for i, chunk in enumerate(chunks, 1):
            sections.append(
                f"--- CONTEXT [{i}] ---\n"
                f"Source: {chunk.citation}\n"
                f"Type: {chunk.source_type.upper()}\n"
                f"Court/Body: {chunk.court or 'Legislature'}\n"
                f"Year: {chunk.year or 'N/A'}\n\n"
                f"{chunk.content}\n"
            )
        return "\n".join(sections)

    def _build_prompt(self, question: str, context: str) -> str:
        return (
            f"CONTEXT FROM LEGAL DATABASE:\n\n"
            f"{context}\n\n"
            f"{'='*60}\n\n"
            f"QUESTION: {question}\n\n"
            f"Answer strictly from the context above. Cite sources explicitly."
        )
