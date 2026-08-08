from app.services.citation_verifier import citation_verifier


def test_exact_substring_match_verified():
    claim = "Revenue increased by 14.2% YoY"
    chunk = "In FY2025, revenue increased by 14.2% YoY driven by enterprise adoption."
    
    status, score, passage = citation_verifier.verify_claim(claim, chunk)
    assert status == "VERIFIED"
    assert score == 1.0
    assert claim in passage


def test_contradiction_detected_on_number_mismatch():
    claim = "Revenue increased by 25.0% YoY"
    chunk = "In FY2025, revenue increased by 14.2% YoY driven by enterprise adoption."
    
    status, score, passage = citation_verifier.verify_claim(claim, chunk)
    assert status == "CONTRADICTED"
    assert score < 0.5
