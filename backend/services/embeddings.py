"""
Embedding Service — multilingual-e5-large for Indian legal text.

Why multilingual-e5-large:
- Understands Hindi + English legal terms
- Strong semantic similarity for legal domain
- 1024-dim embeddings stored in pgvector
"""

from sentence_transformers import SentenceTransformer
from typing import ClassVar, Optional
import asyncio


class EmbeddingService:
    _model: ClassVar[Optional[SentenceTransformer]] = None
    MODEL_NAME = "intfloat/multilingual-e5-large"
    DIMENSION = 1024

    @classmethod
    async def initialize(cls):
        """Load model on startup (run once)."""
        loop = asyncio.get_event_loop()
        cls._model = await loop.run_in_executor(
            None,
            lambda: SentenceTransformer(cls.MODEL_NAME)
        )

    async def embed(self, text: str) -> list[float]:
        """Embed a single query string."""
        if not self._model:
            await self.initialize()
        loop = asyncio.get_event_loop()
        # e5 models need "query: " prefix for queries
        vector = await loop.run_in_executor(
            None,
            lambda: self._model.encode(f"query: {text}", normalize_embeddings=True).tolist()
        )
        return vector

    async def embed_batch(self, texts: list[str], is_passage: bool = True) -> list[list[float]]:
        """
        Embed a batch of document chunks for ingestion.
        Passages use "passage: " prefix; queries use "query: ".
        """
        if not self._model:
            await self.initialize()
        prefix = "passage: " if is_passage else "query: "
        prefixed = [f"{prefix}{t}" for t in texts]
        loop = asyncio.get_event_loop()
        vectors = await loop.run_in_executor(
            None,
            lambda: self._model.encode(
                prefixed,
                normalize_embeddings=True,
                batch_size=32,
                show_progress_bar=True,
            ).tolist()
        )
        return vectors
