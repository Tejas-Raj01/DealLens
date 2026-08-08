import io
from typing import List, Dict, Any, Tuple
from pypdf import PdfReader
import pdfplumber


class ParsedPage:
    def __init__(self, page_number: int, text: str, metadata: Dict[str, Any] = None):
        self.page_number = page_number
        self.text = text
        self.metadata = metadata or {}


class PDFParser:
    """
    Provenance-preserving PDF parser.
    Extracts text page-by-page while preserving exact 1-indexed page numbers.
    Utilizes pdfplumber with PyPDF fallback to handle financial tables and structured reports.
    """

    @staticmethod
    def parse_pdf_bytes(pdf_bytes: bytes) -> Tuple[int, List[ParsedPage]]:
        pages: List[ParsedPage] = []
        page_count = 0

        # Attempt 1: Extract with pdfplumber for table & layout extraction
        try:
            with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
                page_count = len(pdf.pages)
                for index, page in enumerate(pdf.pages):
                    page_number = index + 1  # 1-indexed page numbering
                    text = page.extract_text() or ""
                    
                    # Extract tables if present
                    tables = page.extract_tables()
                    table_summary = ""
                    if tables:
                        table_summary = f"\n[Extracted Tables on Page {page_number}]:\n"
                        for table in tables:
                            for row in table:
                                cleaned_row = [str(cell).strip() if cell else "" for cell in row]
                                table_summary += " | ".join(cleaned_row) + "\n"

                    full_text = text.strip() + ("\n" + table_summary if table_summary else "")
                    pages.append(ParsedPage(page_number=page_number, text=full_text, metadata={"has_tables": bool(tables)}))

                if any(p.text for p in pages):
                    return page_count, pages
        except Exception as e:
            print(f"[PDFParser] pdfplumber parse failed: {e}. Falling back to PyPDF.")

        # Fallback Attempt 2: PyPDF
        try:
            reader = PdfReader(io.BytesIO(pdf_bytes))
            page_count = len(reader.pages)
            pages = []
            for index, page in enumerate(reader.pages):
                page_number = index + 1
                text = page.extract_text() or ""
                pages.append(ParsedPage(page_number=page_number, text=text.strip()))
            return page_count, pages
        except Exception as e:
            raise ValueError(f"Failed to parse PDF document: {str(e)}")
