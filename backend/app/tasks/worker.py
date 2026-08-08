from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.tasks.celery_app import celery_app
from app.core.database import SyncSessionLocal
from app.models.document import Document, DocumentChunk
from app.services.storage import storage_service
from app.services.parser import PDFParser
from app.services.chunker import document_chunker
from app.services.embedding import embedding_service


@celery_app.task(bind=True, max_retries=3, default_retry_delay=5)
def process_document_task(self, document_id_str: str):
    """
    Asynchronous Celery task for PDF Ingestion Pipeline:
    1. Fetch document record & binary file from storage.
    2. Parse PDF page-by-page (retaining 1-indexed page numbers).
    3. Generate page-aware text chunks.
    4. Compute 1536-dim vector embeddings for all chunks.
    5. Save chunks to PostgreSQL with pgvector embeddings and tsvector columns.
    6. Update Document status to PROCESSED.
    """
    document_id = UUID(document_id_str)
    db: Session = SyncSessionLocal()

    try:
        document = db.query(Document).filter(Document.id == document_id).first()
        if not document:
            print(f"[Worker] Error: Document {document_id} not found in database.")
            return

        document.status = "PROCESSING"
        db.commit()

        # Step 1: Fetch raw PDF bytes from storage
        file_bytes = storage_service.get_file(document.file_path)

        # Step 2: Parse PDF page by page
        page_count, parsed_pages = PDFParser.parse_pdf_bytes(file_bytes)
        document.page_count = page_count

        # Step 3: Chunk pages preserving exact page numbers
        chunks = document_chunker.chunk_pages(parsed_pages)
        if not chunks:
            document.status = "FAILED"
            document.error_message = "No readable text content extracted from document."
            db.commit()
            return

        # Step 4: Generate vector embeddings for all chunks in batch
        chunk_texts = [c.content for c in chunks]
        embeddings = embedding_service.generate_embeddings(chunk_texts)

        # Step 5: Save DocumentChunk records to PostgreSQL
        for index, chunk_obj in enumerate(chunks):
            embedding_vector = embeddings[index] if index < len(embeddings) else None
            
            chunk_record = DocumentChunk(
                document_id=document.id,
                chunk_index=chunk_obj.chunk_index,
                page_number=chunk_obj.page_number,
                content=chunk_obj.content,
                token_count=chunk_obj.token_count,
                embedding=embedding_vector,
                chunk_metadata=chunk_obj.metadata
            )
            db.add(chunk_record)

        document.status = "PROCESSED"
        document.error_message = None
        db.commit()
        print(f"[Worker] Document {document_id} successfully parsed and indexed into {len(chunks)} chunks across {page_count} pages.")

    except Exception as exc:
        db.rollback()
        document = db.query(Document).filter(Document.id == document_id).first()
        if document:
            document.status = "FAILED"
            document.error_message = str(exc)
            db.commit()
        print(f"[Worker] Exception in process_document_task for {document_id}: {exc}")
        raise self.retry(exc=exc)
    finally:
        db.close()


def process_document_sync(document_id_str: str):
    """Synchronous fallback helper for processing documents when Celery worker is offline."""
    process_document_task(document_id_str)
