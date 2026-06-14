"""
Judgment Ingestion Script — Indian Kanoon API
Fetches Supreme Court + High Court judgments and stores in pgvector.

API docs: https://api.indiankanoon.org/
Free tier: 100 requests/day | Paid: unlimited

Strategy:
1. Search landmark judgments by topic
2. Fetch full text for each
3. Chunk → embed → store

Expected runtime: 3–4 hours for 50,000 judgments
"""

import asyncio
import asyncpg
import httpx
import re
import sys
import os
from pathlib import Path
from datetime import datetime

sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))
from services.embeddings import EmbeddingService

DATABASE_URL        = os.getenv("DATABASE_URL", "postgresql://nyaya:nyaya_secret@localhost:5432/nyayabot")
INDIANKANOON_TOKEN  = os.getenv("INDIANKANOON_API_KEY", "")
IK_BASE             = "https://api.indiankanoon.org"
CHUNK_SIZE          = 450
CHUNK_OVERLAP       = 75

embedder = EmbeddingService()

# Topics to seed the search — expand this list for production
SEED_TOPICS = [
    # Constitutional
    ("right to privacy article 21", "constitutional"),
    ("fundamental rights writ petition", "constitutional"),
    ("reasonable classification article 14", "constitutional"),
    ("freedom of speech 19(1)(a)", "constitutional"),
    ("right to bail personal liberty", "constitutional"),
    ("emergency article 352 fundamental rights", "constitutional"),
    # Criminal
    ("anticipatory bail section 438 crpc", "criminal"),
    ("section 302 IPC murder sentence", "criminal"),
    ("custodial torture article 21 compensation", "criminal"),
    ("dowry death section 304B IPC", "criminal"),
    ("pocso act child sexual abuse", "criminal"),
    ("ndps act bail conditions", "criminal"),
    # Civil
    ("specific performance contract enforcement", "civil"),
    ("limitation period civil suit", "civil"),
    ("res judicata order 47 CPC", "civil"),
    # Family
    ("divorce cruelty matrimonial causes", "family"),
    ("maintenance section 125 crpc wife", "family"),
    ("child custody best interests", "family"),
    ("muslim personal law triple talaq", "family"),
    # Property
    ("adverse possession limitation act", "property"),
    ("benami transaction prohibition act", "property"),
    ("rera real estate consumer protection", "property"),
    # Labor
    ("wrongful termination industrial disputes act", "labor"),
    ("gratuity payment act eligibility", "labor"),
    ("maternity benefit act 1961", "labor"),
]


def strip_html(text: str) -> str:
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def chunk_text(text: str) -> list[str]:
    words = text.split()
    chunks, start = [], 0
    while start < len(words):
        end = min(start + CHUNK_SIZE, len(words))
        chunks.append(" ".join(words[start:end]))
        start += CHUNK_SIZE - CHUNK_OVERLAP
    return chunks


def extract_year(doc: dict) -> int | None:
    date_str = doc.get("publishdate", "")
    if date_str and len(date_str) >= 4:
        try:
            return int(date_str[:4])
        except ValueError:
            pass
    return None


async def fetch_search_results(client: httpx.AsyncClient, query: str, page: int = 0) -> list[dict]:
    try:
        resp = await client.post(
            f"{IK_BASE}/search/",
            data={"formInput": query, "pagenum": page},
            headers={"Authorization": f"Token {INDIANKANOON_TOKEN}"},
            timeout=15.0,
        )
        resp.raise_for_status()
        return resp.json().get("docs", [])
    except Exception as e:
        print(f"  ⚠️  Search failed for '{query}': {e}")
        return []


async def fetch_full_text(client: httpx.AsyncClient, doc_id: str) -> str:
    try:
        resp = await client.get(
            f"{IK_BASE}/doc/{doc_id}/",
            headers={"Authorization": f"Token {INDIANKANOON_TOKEN}"},
            timeout=20.0,
        )
        resp.raise_for_status()
        data = resp.json()
        raw = data.get("doc", "") or data.get("judgment", "")
        return strip_html(raw)
    except Exception:
        return ""


async def ingest_judgments():
    if not INDIANKANOON_TOKEN:
        print("❌  INDIANKANOON_API_KEY not set. Get one at https://api.indiankanoon.org/")
        print("   Running in demo mode — sample judgments only.")
        await _ingest_sample_judgments()
        return

    print("⚖️  Starting judgment ingestion from Indian Kanoon...")
    await embedder.initialize()

    conn = await asyncpg.connect(DATABASE_URL)
    processed_ids = set()

    async with httpx.AsyncClient() as client:
        for (query, domain) in SEED_TOPICS:
            print(f"\n📚  Topic: {query}")
            docs = await fetch_search_results(client, query)

            for doc in docs[:15]:  # Fetch top 15 per topic
                doc_id = str(doc.get("tid", ""))
                if not doc_id or doc_id in processed_ids:
                    continue
                processed_ids.add(doc_id)

                # Get full judgment text
                full_text = await fetch_full_text(client, doc_id)
                if not full_text or len(full_text) < 200:
                    full_text = strip_html(doc.get("headline", ""))

                if not full_text:
                    continue

                title    = doc.get("title", "Unknown v. Unknown")
                citation = doc.get("citation") or doc.get("docsource", title)
                court    = doc.get("court", "Supreme Court of India")
                year     = extract_year(doc)

                # Chunk the judgment text
                chunks = chunk_text(full_text)
                vectors = await embedder.embed_batch(chunks, is_passage=True)

                for i, (chunk, vector) in enumerate(zip(chunks, vectors)):
                    chunk_id = f"judg_{doc_id}_{i}"
                    await conn.execute(
                        """
                        INSERT INTO legal_chunks
                            (chunk_id, source_type, domain, source_title, citation, court, year, content, chunk_index, embedding)
                        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
                        ON CONFLICT (chunk_id) DO NOTHING
                        """,
                        chunk_id, "judgment", domain, title, citation, court, year, chunk, i, vector,
                    )

                print(f"    ✅  {title[:60]}... — {len(chunks)} chunks")
                await asyncio.sleep(0.3)   # Rate limiting

    await conn.close()
    print(f"\n🎉  Judgment ingestion complete — {len(processed_ids)} judgments stored")


async def _ingest_sample_judgments():
    """Ingest a curated list of landmark SC judgments (no API key needed)."""
    LANDMARK_CASES = [
        {
            "title": "K.S. Puttaswamy v. Union of India",
            "citation": "(2017) 10 SCC 1",
            "court": "Supreme Court of India",
            "year": 2017,
            "domain": "constitutional",
            "content": """Nine-judge Constitution Bench unanimously held that the right to privacy is a fundamental right protected under Article 21 of the Constitution. The court overruled M.P. Sharma v. Satish Chandra (1954) and Kharak Singh v. State of Uttar Pradesh (1963) to the extent they held that privacy is not a fundamental right. The judgment held that privacy is intrinsic to life and liberty and an inalienable natural right. Three-part test for State interference: (1) legality — backed by law; (2) legitimate aim — must serve valid State interest; (3) proportionality — must be proportional to objective. The right to privacy includes: informational privacy, privacy of choice, spatial privacy, bodily integrity. Subsequent application: Navtej Singh Johar v. UoI (2018) decriminalised consensual homosexual acts under Section 377 IPC relying on this right."""
        },
        {
            "title": "Maneka Gandhi v. Union of India",
            "citation": "AIR 1978 SC 597",
            "court": "Supreme Court of India",
            "year": 1978,
            "domain": "constitutional",
            "content": """Seven-judge Constitution Bench overruled A.K. Gopalan v. State of Madras (1950). Held: Articles 14, 19 and 21 are not mutually exclusive — they must be read as a golden triangle. Procedure under Article 21 must be fair, just and reasonable — not merely any procedure enacted by legislature. The word 'law' in Article 21 does not include arbitrary or unjust law. The government cannot impound a passport without following principles of natural justice. Established the principle that any procedure depriving liberty must satisfy three tests: (1) must be prescribed by law; (2) law must pass test of Article 19; (3) law must not be arbitrary under Article 14."""
        },
        {
            "title": "Indra Sawhney v. Union of India",
            "citation": "AIR 1993 SC 477",
            "court": "Supreme Court of India",
            "year": 1992,
            "domain": "constitutional",
            "content": """Nine-judge bench (Mandal Commission case). Upheld 27% reservation for OBCs under Article 16(4). Key holdings: (1) Total reservation cannot exceed 50% — Balaji rule confirmed; (2) Creamy layer must be excluded from OBC reservation; (3) No reservation in promotions — only initial appointments; (4) Backward classes under Article 16(4) need not be the same as socially and educationally backward classes under Article 15(4); (5) Caste can be the starting point for identifying backwardness but should not be the sole criterion. The 50% cap is a constitutional requirement, not a rule of convenience. Exceptions to 50% cap only in extraordinary circumstances for remote areas."""
        },
        {
            "title": "Kesavananda Bharati v. State of Kerala",
            "citation": "AIR 1973 SC 1461",
            "court": "Supreme Court of India",
            "year": 1973,
            "domain": "constitutional",
            "content": """Thirteen-judge bench — largest ever in Indian constitutional history. Held by 7:6 majority: Parliament can amend any provision of the Constitution under Article 368, but cannot alter or destroy the basic structure or essential features of the Constitution. Overruled Golaknath v. State of Punjab (1967). Basic structure includes: supremacy of Constitution, republican and democratic form of government, secular character, separation of powers, federal character, unity and integrity of India, sovereignty, individual freedom, mandate to build welfare State, judicial review, rule of law. Subsequent application: struck down 42nd Amendment in Minerva Mills v. UoI (1980)."""
        },
        {
            "title": "Satender Kumar Antil v. CBI",
            "citation": "(2022) 10 SCC 51",
            "court": "Supreme Court of India",
            "year": 2022,
            "domain": "criminal",
            "content": """Comprehensive guidelines on bail issued by the Supreme Court. Classification of offences for bail purposes: Category A — offences punishable with 7 years or less: bail should be granted unless specific reasons exist; Category B — offences punishable with more than 7 years; Category C — offences under special acts with stringent bail conditions (NDPS, PMLA, UAPA). Held: Courts should not mechanically refuse bail. Undertrial prisoners cannot be jailed for longer than the maximum sentence prescribed. Factors for bail: nature of offence, criminal antecedents, possibility of fleeing, tampering with evidence, threat to witness. Directed setting up of fast-track bail processing systems. Bail applications must be decided within specified timeframes."""
        },
        {
            "title": "D.K. Basu v. State of West Bengal",
            "citation": "AIR 1997 SC 610",
            "court": "Supreme Court of India",
            "year": 1996,
            "domain": "criminal",
            "content": """Landmark judgment on custodial rights. Issued 11 mandatory requirements for arrest and detention: (1) Police must bear accurate identification — name tags; (2) Memo of arrest to be prepared and attested by witness; (3) Arrestee entitled to inform a relative or friend; (4) Arrestee must be informed of right to have a friend informed; (5) Entry in diary at police control room; (6) Arrestee to be examined by doctor on request; (7) Copy of arrest memo to be given to relative; (8) Arrestee must be produced before Magistrate within 24 hours; (9) Right to be examined by doctor every 48 hours; (10) Copies of documents to be sent to Illaqa Magistrate; (11) Lawyer's presence during interrogation. Failure = contempt of court + departmental action. These requirements are in addition to Article 22 safeguards."""
        },
    ]

    await embedder.initialize()
    conn = await asyncpg.connect(DATABASE_URL)
    total = 0

    for case in LANDMARK_CASES:
        chunks = chunk_text(case["content"])
        vectors = await embedder.embed_batch(chunks, is_passage=True)
        for i, (chunk, vec) in enumerate(zip(chunks, vectors)):
            chunk_id = f"judg_sample_{case['citation'].replace(' ', '_')}_{i}"
            await conn.execute(
                """
                INSERT INTO legal_chunks
                    (chunk_id, source_type, domain, source_title, citation, court, year, content, chunk_index, embedding)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
                ON CONFLICT (chunk_id) DO NOTHING
                """,
                chunk_id, "judgment", case["domain"], case["title"],
                case["citation"], case["court"], case["year"], chunk, i, vec,
            )
            total += 1
        print(f"  ✅  {case['title']} — {len(chunks)} chunks")

    await conn.close()
    print(f"\n✅  Sample judgments ingested — {total} chunks stored")


if __name__ == "__main__":
    asyncio.run(ingest_judgments())
