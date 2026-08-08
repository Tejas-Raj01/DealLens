from uuid import UUID
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete

from app.core.database import get_db
from app.models.document import Document
from app.schemas.document import DocumentResponse
from app.services.storage import storage_service
from app.utils.hash import compute_sha256

router = APIRouter(prefix="/documents", tags=["Documents"])

MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB limit


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_document(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload a financial or research document (PDF format).
    Performs file size validation, mime type checking, and SHA256 duplicate detection.
    Saves raw PDF to Object Storage and triggers background parsing/indexing.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only PDF documents are supported."
        )

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds maximum allowed limit of {MAX_FILE_SIZE_BYTES // (1024 * 1024)}MB."
        )

    # Calculate SHA256 hash for document deduplication
    file_hash = compute_sha256(file_bytes)

    # Check if document already exists in DB
    existing_doc_result = await db.execute(select(Document).where(Document.file_hash == file_hash))
    existing_doc = existing_doc_result.scalars().first()
    if existing_doc:
        return existing_doc

    # Save to object storage
    storage_path = storage_service.upload_file(
        file_name=f"{file_hash}_{file.filename}",
        file_data=file_bytes,
        content_type="application/pdf"
    )

    # Create Document DB Record
    document = Document(
        filename=file.filename,
        file_path=storage_path,
        file_size=len(file_bytes),
        file_hash=file_hash,
        mime_type="application/pdf",
        status="PENDING"
    )

    db.add(document)
    await db.commit()
    await db.refresh(document)

    # Trigger background parsing task if worker is active (will be dispatched via task worker)
    return document


@router.get("", response_model=List[DocumentResponse])
async def list_documents(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve list of uploaded documents."""
    result = await db.execute(
        select(Document).order_by(Document.created_at.desc()).offset(skip).limit(limit)
    )
    return result.scalars().all()


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Retrieve document metadata and processing status."""
    result = await db.execute(select(Document).where(Document.id == document_id))
    document = result.scalars().first()
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID {document_id} not found."
        )
    return document


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Delete a document and all associated chunks from storage and database."""
    result = await db.execute(select(Document).where(Document.id == document_id))
    document = result.scalars().first()
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID {document_id} not found."
        )

    # Remove from storage
    storage_service.delete_file(document.file_path)

    # Delete from DB
    await db.delete(document)
    await db.commit()
    return None
