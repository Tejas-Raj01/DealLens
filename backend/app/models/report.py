import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_run_id = Column(UUID(as_uuid=True), ForeignKey("workflow_runs.id", ondelete="CASCADE"), nullable=False, unique=True)
    company_name = Column(String(255), nullable=False)
    executive_summary = Column(Text, nullable=False)
    financial_highlights = Column(JSON, nullable=False, default=dict)
    risk_factors = Column(JSON, nullable=False, default=list)
    cross_doc_discrepancies = Column(JSON, nullable=False, default=list)
    recommendation = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    workflow_run = relationship("WorkflowRun", back_populates="report")
    citations = relationship("Citation", back_populates="report", cascade="all, delete-orphan")


class Citation(Base):
    __tablename__ = "citations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    report_id = Column(UUID(as_uuid=True), ForeignKey("reports.id", ondelete="CASCADE"), nullable=False, index=True)
    claim_text = Column(Text, nullable=False)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    page_number = Column(Integer, nullable=False)
    chunk_id = Column(UUID(as_uuid=True), ForeignKey("document_chunks.id", ondelete="SET NULL"), nullable=True)
    matching_passage = Column(Text, nullable=False)
    verification_status = Column(String(32), nullable=False, default="VERIFIED")  # VERIFIED, UNVERIFIED, CONTRADICTED
    confidence_score = Column(Float, nullable=False, default=1.0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    report = relationship("Report", back_populates="citations")
