"""Database connection pool."""

import asyncpg
from typing import Optional
import os

_pool: Optional[asyncpg.Pool] = None


async def get_db_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(
            dsn=os.getenv("DATABASE_URL", "postgresql://juris:juris_secret@localhost:5432/juris"),
            min_size=2,
            max_size=10,
        )
    return _pool


async def init_db():
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        await conn.execute("CREATE EXTENSION IF NOT EXISTS vector;")
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS legal_chunks (
                chunk_id TEXT PRIMARY KEY,
                source_type TEXT NOT NULL,
                domain TEXT,
                source_title TEXT NOT NULL,
                citation TEXT NOT NULL,
                court TEXT,
                year INTEGER,
                content TEXT NOT NULL,
                chunk_index INTEGER DEFAULT 0,
                embedding vector(768)
            );
        """)
