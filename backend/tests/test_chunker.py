from app.services.parser import ParsedPage
from app.services.chunker import document_chunker


def test_page_aware_chunking_preserves_pages():
    pages = [
        ParsedPage(page_number=1, text="Page one text content. Revenue was $100M in FY2024."),
        ParsedPage(page_number=2, text="Page two text content. Net income grew by 20% to $25M.")
    ]

    chunks = document_chunker.chunk_pages(pages)

    assert len(chunks) == 2
    assert chunks[0].page_number == 1
    assert "Revenue was $100M" in chunks[0].content
    assert chunks[1].page_number == 2
    assert "Net income grew" in chunks[1].content
