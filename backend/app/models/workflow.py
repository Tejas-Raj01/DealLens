import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class WorkflowRun(Base):
    __tablename__ = "workflow_runs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    target_company = Column(String(255), nullable=False, index=True)
    document_ids = Column(JSON, nullable=False, default=list)  # list of UUID strings
    status = Column(String(32), nullable=False, default="PENDING", index=True)  # PENDING, RUNNING, COMPLETED, FAILED
    total_duration_ms = Column(Float, nullable=True, default=0.0)
    total_tokens_used = Column(Integer, nullable=True, default=0)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    steps = relationship("WorkflowStep", back_populates="workflow_run", cascade="all, delete-orphan", order_by="WorkflowStep.step_order")
    report = relationship("Report", back_populates="workflow_run", uselist=False, cascade="all, delete-orphan")


class WorkflowStep(Base):
    __tablename__ = "workflow_steps"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_run_id = Column(UUID(as_uuid=True), ForeignKey("workflow_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    step_name = Column(String(128), nullable=False)
    step_order = Column(Integer, nullable=False)
    status = Column(String(32), nullable=False, default="PENDING")  # PENDING, RUNNING, COMPLETED, FAILED, SKIPPED
    input_data = Column(JSON, nullable=True, default=dict)
    output_data = Column(JSON, nullable=True, default=dict)
    logs = Column(Text, nullable=True, default="")
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, nullable=False, default=0)
    duration_ms = Column(Float, nullable=True, default=0.0)
    token_usage = Column(Integer, nullable=True, default=0)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    workflow_run = relationship("WorkflowRun", back_populates="steps")
