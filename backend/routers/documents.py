"""
Documents Router — Legal Document Analyser endpoints.
"""

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime

from services.document_analyser import DocumentAnalyser
from utils.auth import get_current_user

router = APIRouter()
analyser = DocumentAnalyser()

ALLOWED_TYPES = {
    "application/pdf", "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain", "image/png", "image/jpeg", "image/tiff",
}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB


class RiskFlagSchema(BaseModel):
    clause_text: str
    risk_level: str
    risk_type: str
    explanation: str
    legal_basis: str
    suggestion: str


class AnalysisResponse(BaseModel):
    document_id: str
    filename: str
    doc_type: str
    summary: str
    parties: list[str]
    key_clauses: list[dict]
    risk_flags: list[RiskFlagSchema]
    relevant_cases: list[dict]
    missing_clauses: list[str]
    jurisdiction: Optional[str]
    word_count: int
    confidence: float
    analysed_at: str


@router.post("/analyse", response_model=AnalysisResponse)
async def analyse_document(
    file: UploadFile = File(...),
    user=Depends(get_current_user),
):
    """
    Upload a legal document (PDF, DOCX, TXT, image) for analysis.

    Returns:
    - Document type detection
    - Plain-English summary
    - Risk flags with legal basis (Indian law)
    - Relevant past case law
    - Missing clauses suggestions
    """

    # Validate file type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            400,
            f"Unsupported file type: {file.content_type}. "
            "Supported: PDF, DOCX, TXT, PNG, JPG, TIFF"
        )

    # Read and validate file size
    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(400, "File too large. Maximum size is 20 MB.")
    if len(file_bytes) < 100:
        raise HTTPException(400, "File appears to be empty.")

    # Run analysis
    try:
        result = await analyser.analyse(file_bytes, file.filename)
    except ValueError as e:
        raise HTTPException(422, str(e))
    except Exception as e:
        raise HTTPException(500, f"Analysis failed: {str(e)}")

    return AnalysisResponse(
        document_id=str(uuid.uuid4()),
        filename=file.filename,
        doc_type=result.doc_type,
        summary=result.summary,
        parties=result.parties,
        key_clauses=result.key_clauses,
        risk_flags=[
            RiskFlagSchema(
                clause_text=rf.clause_text,
                risk_level=rf.risk_level,
                risk_type=rf.risk_type,
                explanation=rf.explanation,
                legal_basis=rf.legal_basis,
                suggestion=rf.suggestion,
            )
            for rf in result.risk_flags
        ],
        relevant_cases=result.relevant_cases,
        missing_clauses=result.missing_clauses,
        jurisdiction=result.jurisdiction,
        word_count=result.word_count,
        confidence=result.confidence,
        analysed_at=datetime.utcnow().isoformat(),
    )


@router.get("/supported-types")
async def supported_types():
    return {
        "formats": ["PDF", "DOCX", "DOC", "TXT", "PNG", "JPG", "TIFF"],
        "document_types": [
            "Employment Contract", "Sale Deed", "Rental Agreement",
            "Power of Attorney", "Affidavit", "Writ Petition",
            "Bail Application", "Legal Notice", "NDA",
            "Partnership Deed", "FIR", "Any legal document"
        ],
        "max_size_mb": 20,
    }
