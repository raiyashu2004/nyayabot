"""
Legal Document Analyser Service

Capabilities:
- Extract text from PDF, DOCX, scanned images (OCR)
- Identify document type (FIR, contract, petition, agreement, etc.)
- Flag risky clauses with legal reasoning
- Find relevant case law for the document's matter
- Generate plain-English summary
- Suggest missing clauses for contracts
"""

import fitz  # PyMuPDF
import pytesseract
from PIL import Image
from docx import Document as DocxDocument
from typing import Optional
from dataclasses import dataclass
from io import BytesIO
import re

from services.rag import RAGPipeline
from services.llm import LLMService


# ─────────────────────────────────────────
# Data models
# ─────────────────────────────────────────

@dataclass
class RiskFlag:
    clause_text: str
    risk_level: str         # "high" | "medium" | "low"
    risk_type: str          # e.g. "Unfair termination", "Missing limitation period"
    explanation: str
    legal_basis: str        # e.g. "Contrary to Section 27, Indian Contract Act"
    suggestion: str         # How to fix it


@dataclass
class DocumentAnalysis:
    doc_type: str                   # e.g. "Employment Contract"
    summary: str                    # Plain-English summary
    parties: list[str]              # Identified parties
    key_clauses: list[dict]         # Extracted key clauses
    risk_flags: list[RiskFlag]      # Issues found
    relevant_cases: list[dict]      # Related judgments from DB
    missing_clauses: list[str]      # Suggested additions
    jurisdiction: Optional[str]
    word_count: int
    confidence: float


# ─────────────────────────────────────────
# Document type detection
# ─────────────────────────────────────────

DOCUMENT_TYPES = {
    "fir": ["first information report", "fir no.", "police station", "cognizable offence"],
    "employment_contract": ["employment", "employee", "employer", "salary", "termination", "notice period"],
    "sale_deed": ["sale deed", "vendor", "vendee", "consideration", "immovable property", "stamp duty"],
    "rental_agreement": ["rent", "landlord", "tenant", "tenancy", "lease", "monthly rent"],
    "power_of_attorney": ["power of attorney", "attorney", "authorise", "on behalf of"],
    "affidavit": ["affidavit", "solemnly affirm", "deponent", "sworn"],
    "writ_petition": ["writ petition", "high court", "supreme court", "respondent", "petitioner", "article 226"],
    "bail_application": ["bail application", "accused", "anticipatory bail", "section 439", "section 438"],
    "legal_notice": ["legal notice", "advocate", "cause of action", "demand"],
    "nda": ["non-disclosure", "confidential", "proprietary information", "nda"],
    "partnership_deed": ["partnership", "partners", "profit sharing", "capital contribution"],
}

ANALYSIS_SYSTEM_PROMPT = """You are NyayaBot, an expert Indian legal document analyser.

Analyse the provided legal document with precision. Your output must be a valid JSON object with this structure:
{
  "doc_type": "string — exact document type",
  "summary": "string — 3-4 sentence plain English summary",
  "parties": ["list of parties/entities mentioned"],
  "jurisdiction": "string or null — applicable state/court jurisdiction if mentioned",
  "key_clauses": [
    {"title": "clause name", "content": "verbatim or paraphrased clause", "importance": "high|medium|low"}
  ],
  "risk_flags": [
    {
      "clause_text": "the problematic text",
      "risk_level": "high|medium|low",
      "risk_type": "short label e.g. Unfair Termination Clause",
      "explanation": "why this is risky",
      "legal_basis": "which Indian law or precedent makes this problematic",
      "suggestion": "how to fix or negotiate this"
    }
  ],
  "missing_clauses": ["list of important clauses absent from this document"],
  "relevant_laws": ["list of applicable Indian statutes/sections"]
}

RULES:
- Only flag genuine legal risks under Indian law — not stylistic issues
- Cite specific Indian statutes (e.g. Indian Contract Act 1872, Transfer of Property Act 1882)
- For employment contracts: check against Industrial Disputes Act, Shops & Establishments Act
- For property docs: check against Transfer of Property Act, Registration Act, RERA
- For FIRs: check if offences cited are cognizable, bailable status, applicable IPC/BNS sections
- Return ONLY the JSON object — no preamble, no markdown fences"""


# ─────────────────────────────────────────
# Main service class
# ─────────────────────────────────────────

class DocumentAnalyser:

    def __init__(self):
        self.llm = LLMService()
        self.rag = RAGPipeline()

    async def analyse(self, file_bytes: bytes, filename: str) -> DocumentAnalysis:
        """Main entry point — accepts any supported file format."""

        # 1. Extract text
        text = await self._extract_text(file_bytes, filename)
        if not text or len(text.strip()) < 50:
            raise ValueError("Could not extract readable text from this document.")

        word_count = len(text.split())

        # 2. Detect document type from content
        detected_type = self._detect_document_type(text)

        # 3. Analyse with LLM (grounded on document text)
        analysis_json = await self._llm_analyse(text, detected_type)

        # 4. Find related case law via RAG
        search_query = f"{analysis_json.get('doc_type', detected_type)} {' '.join(analysis_json.get('relevant_laws', []))}"
        rag_result = await self.rag.query(
            question=f"Find case law and judgments related to: {search_query}",
            top_k=5,
        )

        relevant_cases = [
            {
                "citation": chunk.citation,
                "court": chunk.court,
                "year": chunk.year,
                "relevance": "Related precedent",
                "similarity": chunk.similarity,
            }
            for chunk in rag_result.sources
            if chunk.source_type == "judgment"
        ]

        # 5. Build risk flags list
        risk_flags = [
            RiskFlag(
                clause_text=rf.get("clause_text", ""),
                risk_level=rf.get("risk_level", "medium"),
                risk_type=rf.get("risk_type", "Issue"),
                explanation=rf.get("explanation", ""),
                legal_basis=rf.get("legal_basis", ""),
                suggestion=rf.get("suggestion", ""),
            )
            for rf in analysis_json.get("risk_flags", [])
        ]

        return DocumentAnalysis(
            doc_type=analysis_json.get("doc_type", detected_type),
            summary=analysis_json.get("summary", ""),
            parties=analysis_json.get("parties", []),
            key_clauses=analysis_json.get("key_clauses", []),
            risk_flags=risk_flags,
            relevant_cases=relevant_cases,
            missing_clauses=analysis_json.get("missing_clauses", []),
            jurisdiction=analysis_json.get("jurisdiction"),
            word_count=word_count,
            confidence=0.92 if rag_result.sources else 0.75,
        )

    # ─── Text extraction ─────────────────

    async def _extract_text(self, file_bytes: bytes, filename: str) -> str:
        ext = filename.lower().split(".")[-1]

        if ext == "pdf":
            return self._extract_pdf(file_bytes)
        elif ext in ("doc", "docx"):
            return self._extract_docx(file_bytes)
        elif ext in ("txt",):
            return file_bytes.decode("utf-8", errors="ignore")
        elif ext in ("png", "jpg", "jpeg", "tiff"):
            return self._ocr_image(file_bytes)
        else:
            raise ValueError(f"Unsupported file format: .{ext}")

    def _extract_pdf(self, file_bytes: bytes) -> str:
        """Extract text from PDF. Falls back to OCR if text layer is absent."""
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        text_pages = []

        for page in doc:
            text = page.get_text("text")
            if text.strip():
                text_pages.append(text)
            else:
                # Scanned page — use OCR
                pix = page.get_pixmap(dpi=200)
                img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                ocr_text = pytesseract.image_to_string(img, lang="eng+hin")
                text_pages.append(ocr_text)

        return "\n\n".join(text_pages)

    def _extract_docx(self, file_bytes: bytes) -> str:
        doc = DocxDocument(BytesIO(file_bytes))
        return "\n".join(p.text for p in doc.paragraphs if p.text.strip())

    def _ocr_image(self, file_bytes: bytes) -> str:
        img = Image.open(BytesIO(file_bytes))
        return pytesseract.image_to_string(img, lang="eng+hin")

    # ─── Document type detection ─────────

    def _detect_document_type(self, text: str) -> str:
        text_lower = text.lower()
        scores = {}
        for doc_type, keywords in DOCUMENT_TYPES.items():
            score = sum(1 for kw in keywords if kw in text_lower)
            if score > 0:
                scores[doc_type] = score
        if not scores:
            return "Legal Document"
        best = max(scores, key=scores.get)
        return best.replace("_", " ").title()

    # ─── LLM analysis ────────────────────

    async def _llm_analyse(self, text: str, doc_type: str) -> dict:
        """Send document to LLM for structured analysis."""
        import json

        # Truncate very long documents (keep first 12000 chars + last 2000)
        if len(text) > 14000:
            text = text[:12000] + "\n\n[... document truncated for analysis ...]\n\n" + text[-2000:]

        user_prompt = (
            f"Document type detected: {doc_type}\n\n"
            f"DOCUMENT TEXT:\n{'-'*60}\n{text}\n{'-'*60}\n\n"
            f"Analyse this document and return the JSON analysis."
        )

        raw = await self.llm.complete(
            system=ANALYSIS_SYSTEM_PROMPT,
            user=user_prompt,
            max_tokens=2500,
        )

        # Clean and parse JSON
        raw = raw.strip()
        if raw.startswith("```"):
            raw = re.sub(r"^```[a-z]*\n?", "", raw).rstrip("`").strip()

        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            # Return minimal structure if JSON parsing fails
            return {
                "doc_type": doc_type,
                "summary": raw[:500],
                "parties": [],
                "risk_flags": [],
                "missing_clauses": [],
                "relevant_laws": [],
                "key_clauses": [],
            }
