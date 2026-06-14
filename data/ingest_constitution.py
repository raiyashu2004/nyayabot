"""
Constitution Ingestion Script
Chunks the Constitution of India into overlapping passages,
embeds them with multilingual-e5-large, and stores in pgvector.

Data source: indiacode.nic.in (free, official)
Expected runtime: ~2 minutes
"""

import asyncio
import asyncpg
import json
import re
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from services.embeddings import EmbeddingService

# ── Config ────────────────────────────────────────────────
DATABASE_URL = "postgresql://nyaya:nyaya_secret@127.0.0.1:5432/nyayabot"
CHUNK_SIZE   = 500    # tokens (approx characters / 4)
CHUNK_OVERLAP = 80

embedder = EmbeddingService()


# ── Constitution data ─────────────────────────────────────
# In production: parse the full HTML/PDF from indiacode.nic.in
# Here we show the structure with key articles as a sample.

CONSTITUTION_ARTICLES = [
    {
        "part": "Part III — Fundamental Rights",
        "article": "Article 12",
        "title": "Definition of State",
        "citation": "Article 12, Constitution of India",
        "domain": "constitutional",
        "content": """Article 12 defines 'State' for the purposes of Part III (Fundamental Rights). 
It includes the Government and Parliament of India, the Government and the Legislature of each State, 
and all local or other authorities within the territory of India or under the control of the Government of India.
The Supreme Court has interpreted 'other authorities' broadly to include statutory corporations, government companies, 
and instrumentalities of the State. Key cases: Electricity Board, Rajasthan v. Mohan Lal (1967) - 
held that government companies performing government functions are 'State'. 
Ajay Hasia v. Khalid Mujib (1981) - laid down 6 tests to determine if a body is 'State'."""
    },
    {
        "part": "Part III — Fundamental Rights",
        "article": "Article 13",
        "title": "Laws inconsistent with or in derogation of the Fundamental Rights",
        "citation": "Article 13, Constitution of India",
        "domain": "constitutional",
        "content": """Article 13 is the guardian of Fundamental Rights. 
Clause (1): All pre-constitutional laws inconsistent with Fundamental Rights are void to the extent of inconsistency.
Clause (2): The State shall not make any law that takes away or abridges the Fundamental Rights — any such law is void.
Clause (3): 'Law' includes ordinances, orders, bye-laws, rules, regulations, notifications, customs, and usages.
The doctrine of severability applies — only the inconsistent part is void, not the entire law.
Key case: Keshavananda Bharati v. State of Kerala (1973) — Parliament cannot amend the Constitution to destroy its basic structure."""
    },
    {
        "part": "Part III — Fundamental Rights",
        "article": "Article 14",
        "title": "Equality before law",
        "citation": "Article 14, Constitution of India",
        "domain": "constitutional",
        "content": """Article 14 guarantees equality before law and equal protection of laws.
'Equality before law' is a negative concept — the State shall not discriminate.
'Equal protection of laws' is a positive concept — the State must treat equals equally.
The article prohibits class legislation but permits reasonable classification.
Test for valid classification: (1) intelligible differentia — the classification must be based on clear difference; 
(2) rational nexus — the differentia must have a rational relation to the object of the law.
The Supreme Court in E.P. Royappa v. State of Tamil Nadu (1974) held that arbitrariness itself is antithetical to equality.
In Maneka Gandhi v. UoI (1978), the court read Articles 14, 19, and 21 together as a golden triangle."""
    },
    {
        "part": "Part III — Fundamental Rights",
        "article": "Article 15",
        "title": "Prohibition of discrimination on grounds of religion, race, caste, sex or place of birth",
        "citation": "Article 15, Constitution of India",
        "domain": "constitutional",
        "content": """Article 15(1) prohibits State discrimination on grounds of religion, race, caste, sex, or place of birth.
Article 15(2) extends this prohibition to access to shops, public restaurants, hotels, wells, tanks, bathing ghats, roads.
Article 15(3) permits special provisions for women and children — exception to equality.
Article 15(4) permits special provisions for socially and educationally backward classes or SC/STs — inserted by 1st Amendment.
Article 15(5) permits reservation in educational institutions for OBCs, SC/STs — inserted by 93rd Amendment.
Key case: Indra Sawhney v. UoI (1992) — Mandal Commission case — upheld OBC reservation, capped total reservation at 50%."""
    },
    {
        "part": "Part III — Fundamental Rights",
        "article": "Article 19",
        "title": "Protection of certain rights regarding freedom of speech, etc.",
        "citation": "Article 19, Constitution of India",
        "domain": "constitutional",
        "content": """Article 19 guarantees six freedoms to citizens:
(a) Freedom of speech and expression
(b) Freedom to assemble peaceably and without arms  
(c) Freedom to form associations or unions
(d) Freedom to move freely throughout the territory of India
(e) Freedom to reside and settle in any part of India
(g) Freedom to practise any profession, or to carry on any occupation, trade or business

Reasonable restrictions can be imposed under Articles 19(2) to 19(6).
For 19(1)(a): Restrictions on grounds of sovereignty, integrity, security, friendly relations with foreign States, 
public order, decency, morality, contempt of court, defamation, or incitement to an offence.
Key cases: Romesh Thappar v. State of Madras (1950); Shreya Singhal v. UoI (2015) — struck down Section 66A of IT Act."""
    },
    {
        "part": "Part III — Fundamental Rights",
        "article": "Article 21",
        "title": "Protection of Life and Personal Liberty",
        "citation": "Article 21, Constitution of India",
        "domain": "constitutional",
        "content": """Article 21: No person shall be deprived of his life or personal liberty except according to procedure established by law.
The Supreme Court has given this article its widest possible interpretation.
In Maneka Gandhi v. UoI (1978), the court overruled A.K. Gopalan (1950) and held that procedure must be fair, just, and reasonable.
Rights read into Article 21 by the Supreme Court:
1. Right to live with human dignity — Francis Coralie Mullin v. Administrator, Union Territory of Delhi (1981)
2. Right to livelihood — Olga Tellis v. Bombay Municipal Corporation (1985)
3. Right to health — Paschim Banga Khet Mazdoor Samity v. State of W.B. (1996)
4. Right to speedy trial — Hussainara Khatoon v. State of Bihar (1979)
5. Right to legal aid — M.H. Hoskot v. State of Maharashtra (1978)
6. Right to privacy — K.S. Puttaswamy v. UoI (2017) — 9-judge bench
7. Right to education — Mohini Jain v. State of Karnataka (1992); now under Article 21A
8. Right against custodial violence — D.K. Basu v. State of W.B. (1997)
9. Right to bail — Gudikanti Narasimhulu v. Public Prosecutor (1978)"""
    },
    {
        "part": "Part III — Fundamental Rights",
        "article": "Article 22",
        "title": "Protection against arrest and detention in certain cases",
        "citation": "Article 22, Constitution of India",
        "domain": "constitutional",
        "content": """Article 22 provides safeguards to arrested/detained persons:
(1) Right to be informed of grounds of arrest
(1) Right to consult and be defended by a legal practitioner of choice
(2) Right to be produced before a Magistrate within 24 hours of arrest
(2) No detention beyond 24 hours without Magistrate's order
These rights are NOT available to: enemy aliens; persons detained under Preventive Detention laws.
For preventive detention: maximum 3 months without Advisory Board; detained person must be told grounds (unless against public interest); right to make representation.
Key cases: A.K. Gopalan v. State of Madras (1950); Haradhan Saha v. State of W.B. (1974)."""
    },
    {
        "part": "Part IV — Directive Principles of State Policy",
        "article": "Articles 36–51",
        "title": "Directive Principles of State Policy",
        "citation": "Articles 36-51, Constitution of India",
        "domain": "constitutional",
        "content": """Directive Principles of State Policy (DPSP) are non-justiciable guidelines for governance.
Article 38: State to secure a social order for welfare of people — reduce income inequalities.
Article 39: Equal pay for equal work (39(d)); Right to adequate livelihood (39(a)).
Article 39A: Equal justice and free legal aid (added by 42nd Amendment).
Article 41: Right to work, education, and public assistance in cases of unemployment, old age, sickness.
Article 44: Uniform Civil Code — directive to secure UCC for all citizens.
Article 45: Early childhood care and education for children below 6 years.
Article 46: Promotion of educational and economic interests of SC, ST, and weaker sections.
Article 48A: Protection and improvement of environment and safeguarding of forests and wildlife.
Key principle: In case of conflict, Fundamental Rights generally prevail over DPSPs, 
but the court in Minerva Mills (1980) held they must be read harmoniously."""
    },
]


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """Split text into overlapping chunks by approximate word count."""
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = min(start + chunk_size, len(words))
        chunks.append(" ".join(words[start:end]))
        start += chunk_size - overlap
    return chunks


async def ingest_constitution():
    """Main ingestion function."""
    print("🏛️  Starting Constitution ingestion...")

    # Initialize embedder
    await embedder.initialize()

    conn = await asyncpg.connect(DATABASE_URL)

    # Ensure pgvector extension
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
            embedding vector(1024)
        );
    """)
    await conn.execute("""
        CREATE INDEX IF NOT EXISTS ix_legal_chunks_embedding 
        ON legal_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
    """)

    total_chunks = 0
    for article in CONSTITUTION_ARTICLES:
        chunks = chunk_text(article["content"])
        texts_to_embed = chunks
        vectors = await embedder.embed_batch(texts_to_embed, is_passage=True)

        for i, (chunk_text_piece, vector) in enumerate(zip(chunks, vectors)):
            chunk_id = f"const_{article['article'].replace(' ', '_')}_{i}"
            await conn.execute(
                """
                INSERT INTO legal_chunks 
                    (chunk_id, source_type, domain, source_title, citation, court, year, content, chunk_index, embedding)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
                ON CONFLICT (chunk_id) DO UPDATE SET
                    content = EXCLUDED.content, embedding = EXCLUDED.embedding
                """,
                chunk_id,
                "constitution",
                article["domain"],
                f"{article['article']} — {article['title']}",
                article["citation"],
                None,
                None,
                chunk_text_piece,
                i,
                str(vector),
            )
            total_chunks += 1

        print(f"  ✅ {article['article']} — {len(chunks)} chunks")

    await conn.close()
    print(f"\n🎉 Constitution ingestion complete — {total_chunks} chunks stored")


if __name__ == "__main__":
    asyncio.run(ingest_constitution())
