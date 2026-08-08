from uuid import UUID
from typing import List, Optional, Dict, Any
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, or_, and_, func

from app.models.document import DocumentChunk, Document
from app.services.embedding import embedding_service
from app.core.config import settings


class RetrievedChunk:
    def __init__(
        self,
        chunk_id: UUID,
        document_id: UUID,
        document_filename: str,
        page_number: int,
        content: str,
        score: float,
        chunk_index: int,
        metadata: Optional[Dict[str, Any]] = None
    ):
        self.chunk_id = chunk_id
        self.document_id = document_id
        self.document_filename = document_filename
        self.page_number = page_number
        self.content = content
        self.score = score
        self.chunk_index = chunk_index
        self.metadata = metadata or {}


class HybridRetrievalService:
    """
    Production Hybrid RAG Retrieval Service.
    Combines Vector Cosine Distance (pgvector) with Keyword Full-Text Search (tsvector)
    via Reciprocal Rank Fusion (RRF).
    """

    def __init__(self, k_constant: int = 60):
        self.k_constant = k_constant

    async def search(
        self,
        db: AsyncSession,
        query: str,
        document_ids: Optional[List[UUID]] = None,
        top_k: int = settings.TOP_K_RETRIEVAL
    ) -> List[RetrievedChunk]:
        if not query.strip():
            return []

        # 1. Generate query embedding
        query_embeddings = embedding_service.generate_embeddings([query])
        query_vec = query_embeddings[0] if query_embeddings else []

        # 2. Perform Vector Cosine Similarity Search
        vector_results = await self._vector_search(db, query_vec, document_ids, limit=top_k * 3)

        # 3. Perform Postgres Keyword Full-Text Search
        keyword_results = await self._keyword_search(db, query, document_ids, limit=top_k * 3)

        # 4. Fuse using Reciprocal Rank Fusion (RRF)
        fused_chunks = self._reciprocal_rank_fusion(vector_results, keyword_results, top_k=top_k)

        return fused_chunks

    async def _vector_search(
        self,
        db: AsyncSession,
        query_vec: List[float],
        document_ids: Optional[List[UUID]],
        limit: int
    ) -> List[Dict[str, Any]]:
        """pgvector Cosine distance search."""
        if not query_vec:
            return []

        # Format vector for pgvector literal in SQL query
        vec_str = f"[{','.join(str(x) for x in query_vec)}]"

        where_clause = ""
        params = {"vec": vec_str, "limit": limit}

        if document_ids:
            doc_id_strs = [f"'{str(d)}'" for d in document_ids]
            where_clause = f"WHERE c.document_id IN ({','.join(doc_id_strs)})"

        query_sql = text(f"""
            SELECT 
                c.id, c.document_id, d.filename, c.page_number, c.content, c.chunk_index, c.chunk_metadata,
                (1 - (c.embedding <=> :vec::vector)) as similarity
            FROM document_chunks c
            JOIN documents d ON c.document_id = d.id
            {where_clause}
            ORDER BY c.embedding <=> :vec::vector ASC
            LIMIT :limit
        """)

        result = await db.execute(query_sql, params)
        rows = result.fetchall()

        return [
            {
                "chunk_id": row[0],
                "document_id": row[1],
                "document_filename": row[2],
                "page_number": row[3],
                "content": row[4],
                "chunk_index": row[5],
                "metadata": row[6],
                "score": float(row[7]) if row[7] is not None else 0.0
            }
            for row in rows
        ]

    async def _keyword_search(
        self,
        db: AsyncSession,
        query: str,
        document_ids: Optional[List[UUID]],
        limit: int
    ) -> List[Dict[str, Any]]:
        """Postgres Full-Text keyword search."""
        cleaned_query = " | ".join(query.strip().split())
        
        where_clause = "WHERE to_tsvector('english', c.content) @@ plainto_tsquery('english', :query)"
        params = {"query": query, "limit": limit}

        if document_ids:
            doc_id_strs = [f"'{str(d)}'" for d in document_ids]
            where_clause += f" AND c.document_id IN ({','.join(doc_id_strs)})"

        query_sql = text(f"""
            SELECT 
                c.id, c.document_id, d.filename, c.page_number, c.content, c.chunk_index, c.chunk_metadata,
                ts_rank_cd(to_tsvector('english', c.content), plainto_tsquery('english', :query)) as rank
            FROM document_chunks c
            JOIN documents d ON c.document_id = d.id
            {where_clause}
            ORDER BY rank DESC
            LIMIT :limit
        """)

        try:
            result = await db.execute(query_sql, params)
            rows = result.fetchall()

            return [
                {
                    "chunk_id": row[0],
                    "document_id": row[1],
                    "document_filename": row[2],
                    "page_number": row[3],
                    "content": row[4],
                    "chunk_index": row[5],
                    "metadata": row[6],
                    "score": float(row[7]) if row[7] is not None else 0.0
                }
                for row in rows
            ]
        except Exception as e:
            print(f"[HybridRetrievalService] Keyword search warning: {e}")
            return []

    def _reciprocal_rank_fusion(
        self,
        vector_results: List[Dict[str, Any]],
        keyword_results: List[Dict[str, Any]],
        top_k: int
    ) -> List[RetrievedChunk]:
        """Combine search results via Reciprocal Rank Fusion (RRF)."""
        rrf_scores: Dict[UUID, float] = {}
        chunk_data: Dict[UUID, Dict[str, Any]] = {}

        # Add vector ranks
        for rank, item in enumerate(vector_results):
            cid = item["chunk_id"]
            rrf_scores[cid] = rrf_scores.get(cid, 0.0) + (1.0 / (self.k_constant + rank + 1))
            chunk_data[cid] = item

        # Add keyword ranks
        for rank, item in enumerate(keyword_results):
            cid = item["chunk_id"]
            rrf_scores[cid] = rrf_scores.get(cid, 0.0) + (1.0 / (self.k_constant + rank + 1))
            if cid not in chunk_data:
                chunk_data[cid] = item

        # Sort by RRF score descending
        sorted_chunks = sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True)[:top_k]

        return [
            RetrievedChunk(
                chunk_id=cid,
                document_id=chunk_data[cid]["document_id"],
                document_filename=chunk_data[cid]["document_filename"],
                page_number=chunk_data[cid]["page_number"],
                content=chunk_data[cid]["content"],
                score=score,
                chunk_index=chunk_data[cid]["chunk_index"],
                metadata=chunk_data[cid]["metadata"]
            )
            for cid, score in sorted_chunks
        ]


retrieval_service = HybridRetrievalService()
