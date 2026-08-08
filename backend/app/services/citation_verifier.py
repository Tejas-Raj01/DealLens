import re
from typing import List, Dict, Any, Tuple
from uuid import UUID


class VerifiedCitation:
    def __init__(
        self,
        document_id: UUID,
        document_name: str,
        page_number: int,
        claim_text: str,
        matching_passage: str,
        verification_status: str,
        confidence_score: float
    ):
        self.document_id = document_id
        self.document_name = document_name
        self.page_number = page_number
        self.claim_text = claim_text
        self.matching_passage = matching_passage
        self.verification_status = verification_status  # VERIFIED, UNVERIFIED, CONTRADICTED
        self.confidence_score = confidence_score


class CitationVerifier:
    """
    Grounded Citation Verification Guardrail.
    Verifies that claims in generated reports map back to exact page numbers and passages
    in source document chunks. Prevents hallucinations and ungrounded statements.
    """

    @staticmethod
    def verify_claim(
        claim: str,
        target_chunk_content: str
    ) -> Tuple[str, float, str]:
        """
        Verify if a given claim/quote is supported by the target chunk content.
        Returns (verification_status, confidence_score, matching_passage).
        """
        claim_clean = claim.lower().strip()
        chunk_clean = target_chunk_content.lower().strip()

        # 1. Exact Substring Match
        if claim_clean in chunk_clean:
            return "VERIFIED", 1.0, claim

        # 2. Key Term & Number Precision Match (Crucial for financial figures like revenue, % growth, years)
        claim_words = set(re.findall(r'\w+', claim_clean))
        numbers_in_claim = set(re.findall(r'\b\d+(?:\.\d+)?%?\b', claim_clean))
        
        if not claim_words:
            return "UNVERIFIED", 0.0, ""

        chunk_words = set(re.findall(r'\w+', chunk_clean))
        numbers_in_chunk = set(re.findall(r'\b\d+(?:\.\d+)?%?\b', chunk_clean))

        # Check if numbers match (if claim contains financial numbers, they MUST exist in the chunk)
        if numbers_in_claim and not numbers_in_claim.issubset(numbers_in_chunk):
            return "CONTRADICTED", 0.2, target_chunk_content[:200]

        word_overlap = len(claim_words.intersection(chunk_words)) / len(claim_words)

        if word_overlap >= 0.7:
            return "VERIFIED", round(word_overlap, 2), target_chunk_content[:300]
        elif word_overlap >= 0.4:
            return "UNVERIFIED", round(word_overlap, 2), target_chunk_content[:300]

        return "UNVERIFIED", round(word_overlap, 2), ""


citation_verifier = CitationVerifier()
