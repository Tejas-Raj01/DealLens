from uuid import UUID
from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, ConfigDict


class DocumentBase(BaseModel):
    filename: str
    file_size: int
    mime_type: str


class DocumentCreate(DocumentBase):
    file_hash: str
    file_path: str


class DocumentResponse(DocumentBase):
    id: UUID
    file_hash: str
    page_count: int
    status: str
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DocumentChunkResponse(BaseModel):
    id: UUID
    document_id: UUID
    chunk_index: int
    page_number: int
    content: str
    token_count: int
    chunk_metadata: Optional[dict[str, Any]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
