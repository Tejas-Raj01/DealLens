import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["status"] == "healthy"
    assert "DealLens" in json_data["service"]


def test_invalid_file_extension_rejected():
    response = client.post(
        "/api/v1/documents/upload",
        files={"file": ("test.txt", b"some plain text", "text/plain")}
    )
    assert response.status_code == 400
    assert "Only PDF documents are supported" in response.json()["detail"]
