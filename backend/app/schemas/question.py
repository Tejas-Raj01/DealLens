from uuid import UUID
from typing import Optional, List
from pydantic import BaseModel, Field


class QuestionRequest(BaseModel):
    query: str = Field(..., description="Target question or search string")
    document_ids: Optional[List[UUID]] = Field(default=None, description="Optional filter to scope search to specific documents")
    top_k: int = Field(default=5, ge=1, le=20)


class CitationDetail(BaseModel):
    document_id: UUID
    document_name: str
    page_number: int
    passage: str
    confidence: float


class QuestionResponse(BaseModel):
    query: str
    answer: str
    citations: List[CitationDetail]
    retrieved_chunks_count: int
    execution_time_ms: float
