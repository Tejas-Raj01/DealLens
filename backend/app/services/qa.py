import time
from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.question import QuestionRequest, QuestionResponse, CitationDetail
from app.services.retrieval import retrieval_service, RetrievedChunk
from app.services.citation_verifier import citation_verifier
from app.core.config import settings


class QAService:
    """
    RAG Question Answering Service with Strict Provenance Citations.
    """

    async def answer_question(
        self,
        db: AsyncSession,
        request: QuestionRequest
    ) -> QuestionResponse:
        start_time = time.time()

        # Step 1: Hybrid Retrieval
        chunks: List[RetrievedChunk] = await retrieval_service.search(
            db=db,
            query=request.query,
            document_ids=request.document_ids,
            top_k=request.top_k
        )

        if not chunks:
            return QuestionResponse(
                query=request.query,
                answer="No relevant document evidence found for your query in the knowledge base.",
                citations=[],
                retrieved_chunks_count=0,
                execution_time_ms=round((time.time() - start_time) * 1000, 2)
            )

        # Step 2: Context Formatting & Prompt Construction
        context_str = ""
        citations: List[CitationDetail] = []

        for idx, chunk in enumerate(chunks, start=1):
            context_str += f"\n--- Evidence [{idx}] (Doc: {chunk.document_filename}, Page: {chunk.page_number}) ---\n{chunk.content}\n"
            
            # Perform verification
            status, conf, passage = citation_verifier.verify_claim(request.query, chunk.content)

            citations.append(
                CitationDetail(
                    document_id=chunk.document_id,
                    document_name=chunk.document_filename,
                    page_number=chunk.page_number,
                    passage=passage or chunk.content[:250] + "...",
                    confidence=conf
                )
            )

        # Step 3: LLM Generation / Synthesis
        answer_text = await self._generate_grounded_answer(request.query, context_str, chunks)

        execution_time_ms = round((time.time() - start_time) * 1000, 2)

        return QuestionResponse(
            query=request.query,
            answer=answer_text,
            citations=citations,
            retrieved_chunks_count=len(chunks),
            execution_time_ms=execution_time_ms
        )

    async def _generate_grounded_answer(
        self,
        query: str,
        context_str: str,
        chunks: List[RetrievedChunk]
    ) -> str:
        """Call LLM API or fallback to deterministic grounded answer generator."""
        if settings.OPENAI_API_KEY:
            try:
                import openai
                client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
                prompt = f"""
                You are a senior financial analyst and investment researcher. Answer the query based ONLY on the provided context evidence.
                Attach inline citations formatted as [Doc: <filename>, Page: <page_number>] for every factual claim. Do not invent facts not present in context.

                Context Evidence:
                {context_str}

                User Question:
                {query}
                """
                response = client.chat.completions.create(
                    model=settings.LLM_MODEL,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.1
                )
                return response.choices[0].message.content
            except Exception as e:
                print(f"[QAService] OpenAI API call failed: {e}. Utilizing fallback synthesis engine.")

        # Grounded Fallback Answer Synthesis
        first_chunk = chunks[0]
        summary_passage = first_chunk.content[:400].strip()
        return f"Based on evidence from {first_chunk.document_filename} (Page {first_chunk.page_number}):\n\n\"{summary_passage}...\"\n\n[Citation: {first_chunk.document_filename}, Page {first_chunk.page_number}]"


qa_service = QAService()
