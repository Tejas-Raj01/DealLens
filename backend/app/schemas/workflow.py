from uuid import UUID
from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, ConfigDict


class WorkflowCreate(BaseModel):
    title: Optional[str] = "Due Diligence Audit"
    target_company: str
    document_ids: List[UUID]


class WorkflowStepResponse(BaseModel):
    id: UUID
    workflow_run_id: UUID
    step_name: str
    step_order: int
    status: str
    input_data: Optional[Dict[str, Any]] = None
    output_data: Optional[Dict[str, Any]] = None
    logs: Optional[str] = ""
    error_message: Optional[str] = None
    retry_count: int
    duration_ms: Optional[float] = 0.0
    token_usage: Optional[int] = 0
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class WorkflowResponse(BaseModel):
    id: UUID
    title: str
    target_company: str
    document_ids: List[UUID]
    status: str
    total_duration_ms: Optional[float] = 0.0
    total_tokens_used: Optional[int] = 0
    error_message: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    steps: List[WorkflowStepResponse] = []

    model_config = ConfigDict(from_attributes=True)
