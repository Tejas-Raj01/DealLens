from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.question import QuestionRequest, QuestionResponse
from app.services.qa import qa_service
from app.services.retrieval import retrieval_service

router = APIRouter(prefix="", tags=["Search & Questions"])


@router.post("/search", summary="Perform hybrid search across indexed documents")
async def search_documents(
    request: QuestionRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Search document knowledge base using Hybrid RAG (pgvector Cosine Search + Full-Text Search + RRF).
    Returns relevant chunks with page numbers and scores.
    """
    chunks = await retrieval_service.search(
        db=db,
        query=request.query,
        document_ids=request.document_ids,
        top_k=request.top_k
    )
    return {
        "query": request.query,
        "results_count": len(chunks),
        "chunks": [
            {
                "chunk_id": c.chunk_id,
                "document_id": c.document_id,
                "document_filename": c.document_filename,
                "page_number": c.page_number,
                "content": c.content,
                "score": c.score,
                "metadata": c.metadata
            }
            for c in chunks
        ]
    }


@router.post("/questions/ask", response_model=QuestionResponse, summary="Ask RAG question with grounded citations")
async def ask_question(
    request: QuestionRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Ask a question over uploaded documents.
    Returns grounded AI answer with strict page and passage citations verified by citation guardrails.
    """
    return await qa_service.answer_question(db=db, request=request)
