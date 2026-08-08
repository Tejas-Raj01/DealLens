from uuid import UUID
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.workflow import WorkflowRun, WorkflowStep
from app.models.report import Report
from app.schemas.workflow import WorkflowCreate, WorkflowResponse, WorkflowStepResponse
from app.schemas.report import ReportResponse
from app.tasks.worker import execute_workflow_task, execute_workflow_sync

router = APIRouter(prefix="", tags=["Workflows & Reports"])


@router.post("/workflows/due-diligence", response_model=WorkflowResponse, status_code=status.HTTP_202_ACCEPTED)
async def create_due_diligence_workflow(
    payload: WorkflowCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """
    Trigger an automated 7-step Due-Diligence Workflow over target company documents.
    Returns 202 Accepted with workflow tracking ID.
    """
    if not payload.document_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one document ID must be provided to run due diligence."
        )

    # Create WorkflowRun record
    doc_id_strs = [str(d) for d in payload.document_ids]
    run = WorkflowRun(
        title=payload.title or f"Due Diligence - {payload.target_company}",
        target_company=payload.target_company,
        document_ids=doc_id_strs,
        status="PENDING"
    )

    db.add(run)
    await db.commit()
    await db.refresh(run)

    # Dispatch background execution
    try:
        execute_workflow_task.delay(str(run.id))
    except Exception as e:
        print(f"[Workflow API] Celery delay failed ({e}), dispatching background execution.")
        background_tasks.add_task(execute_workflow_sync, str(run.id))

    # Re-query with loaded steps relationship
    result = await db.execute(
        select(WorkflowRun).options(selectinload(WorkflowRun.steps)).where(WorkflowRun.id == run.id)
    )
    return result.scalars().first()


@router.get("/workflows", response_model=List[WorkflowResponse])
async def list_workflows(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """List all due-diligence workflow runs."""
    result = await db.execute(
        select(WorkflowRun)
        .options(selectinload(WorkflowRun.steps))
        .order_by(WorkflowRun.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


@router.get("/workflows/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow(
    workflow_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Retrieve detailed workflow execution state, total duration, and step status."""
    result = await db.execute(
        select(WorkflowRun)
        .options(selectinload(WorkflowRun.steps))
        .where(WorkflowRun.id == workflow_id)
    )
    run = result.scalars().first()
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workflow run with ID {workflow_id} not found."
        )
    return run


@router.get("/workflows/{workflow_id}/steps", response_model=List[WorkflowStepResponse])
async def get_workflow_steps(
    workflow_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Retrieve step-by-step audit logs, execution timing, inputs, and outputs for observability."""
    result = await db.execute(
        select(WorkflowStep)
        .where(WorkflowStep.workflow_run_id == workflow_id)
        .order_by(WorkflowStep.step_order.asc())
    )
    return result.scalars().all()


@router.get("/reports/{report_id}", response_model=ReportResponse)
async def get_report(
    report_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Retrieve generated investment report with embedded grounded citations."""
    result = await db.execute(
        select(Report)
        .options(selectinload(Report.citations))
        .where(Report.id == report_id)
    )
    report = result.scalars().first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with ID {report_id} not found."
        )
    return report
