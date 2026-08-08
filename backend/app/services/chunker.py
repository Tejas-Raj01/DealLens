from typing import List, Dict, Any
from app.services.parser import ParsedPage
from app.core.config import settings


class TextChunk:
    def __init__(
        self,
        chunk_index: int,
        page_number: int,
        content: str,
        token_count: int,
        metadata: Dict[str, Any] = None
    ):
        self.chunk_index = chunk_index
        self.page_number = page_number
        self.content = content
        self.token_count = token_count
        self.metadata = metadata or {}


class DocumentChunker:
    """
    Page-aware text chunking engine for financial and due-diligence documents.
    Enforces strict page-boundary preservation so every chunk carries its true source page number.
    """

    def __init__(self, chunk_size: int = settings.CHUNK_SIZE, overlap: int = settings.CHUNK_OVERLAP):
        self.chunk_size = chunk_size
        self.overlap = overlap

    def chunk_pages(self, pages: List[ParsedPage]) -> List[TextChunk]:
        chunks: List[TextChunk] = []
        global_chunk_index = 0

        for page in pages:
            page_number = page.page_number
            text = page.text.strip()

            if not text:
                continue

            # Split text into paragraphs/lines
            paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
            if not paragraphs:
                paragraphs = [text]

            current_chunk = ""
            current_tokens = 0

            for para in paragraphs:
                para_tokens = len(para.split())  # Fast approximation for token count

                if current_tokens + para_tokens > self.chunk_size and current_chunk:
                    chunks.append(
                        TextChunk(
                            chunk_index=global_chunk_index,
                            page_number=page_number,
                            content=current_chunk.strip(),
                            token_count=current_tokens,
                            metadata=page.metadata
                        )
                    )
                    global_chunk_index += 1

                    # Keep overlap from end of current chunk
                    words = current_chunk.split()
                    overlap_words = words[-self.overlap:] if len(words) >= self.overlap else words
                    current_chunk = " ".join(overlap_words) + "\n\n" + para
                    current_tokens = len(current_chunk.split())
                else:
                    if current_chunk:
                        current_chunk += "\n\n" + para
                    else:
                        current_chunk = para
                    current_tokens += para_tokens

            if current_chunk.strip():
                chunks.append(
                    TextChunk(
                        chunk_index=global_chunk_index,
                        page_number=page_number,
                        content=current_chunk.strip(),
                        token_count=current_tokens,
                        metadata=page.metadata
                    )
                )
                global_chunk_index += 1

        return chunks


document_chunker = DocumentChunker()
