from uuid import UUID
from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, ConfigDict


class CitationResponse(BaseModel):
    id: UUID
    report_id: UUID
    claim_text: str
    document_id: UUID
    page_number: int
    chunk_id: Optional[UUID] = None
    matching_passage: str
    verification_status: str
    confidence_score: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReportResponse(BaseModel):
    id: UUID
    workflow_run_id: UUID
    company_name: str
    executive_summary: str
    financial_highlights: Dict[str, Any]
    risk_factors: List[Dict[str, Any]]
    cross_doc_discrepancies: List[Dict[str, Any]]
    recommendation: str
    created_at: datetime
    citations: List[CitationResponse] = []

    model_config = ConfigDict(from_attributes=True)


class FindingResponse(BaseModel):
    id: str
    title: str
    category: str  # FINANCIAL, PROFITABILITY, GROWTH, RISK, OPERATIONS, POSITIVE_SIGNAL
    factual_statement: str
    interpretation: str
    why_it_matters: str
    confidence: float
    severity: Optional[str] = None
    source_document: str
    page: int
    evidence_text: str


class CompanyInvestigationResponse(BaseModel):
    company_name: str
    documents_analyzed: int
    pages_analyzed: int
    executive_summary: str
    findings: List[FindingResponse]
    financial_flow: Dict[str, Any]
    cross_doc_consistency: List[Dict[str, Any]]
    unclear_items: List[str]
