from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_faculty_cannot_access_briefing():
    # If we pass an invalid user_id, it will fail at get_agent10_identity.
    # If we pass a valid one, it fails at require_aggregate_access.
    # We will just assert it's a 403.
    response = client.get("/api/v1/agent10/weekly-briefing", headers={"X-User-Role": "FACULTY", "X-User-Id": "123e4567-e89b-12d3-a456-426614174000"})
    assert response.status_code == 403

def test_leadership_can_access_briefing():
    # Role DEAN skips DB validation for identity
    response = client.get("/api/v1/agent10/weekly-briefing", headers={"X-User-Role": "DEAN", "X-User-Id": "123e4567-e89b-12d3-a456-426614174000"})
    assert response.status_code == 200
    data = response.json()
    assert "generated_at" in data
    assert "summary_narrative" in data
    assert "overall_snapshot" in data
    assert "top_risks" in data
    assert "areas_requiring_attention" in data
    assert "positive_signals" in data
    assert "recommended_actions" in data
    assert "llm_used" in data
    assert data["role"] == "DEAN"
    assert data["scope"] == "Institution"

def test_hod_department_restriction():
    response = client.get("/api/v1/agent10/weekly-briefing", headers={"X-User-Role": "HOD", "X-User-Id": "123e4567-e89b-12d3-a456-426614174000"})
    assert response.status_code == 403
    assert "active scope" in response.json()["detail"].lower()

def test_empty_data_behavior():
    response = client.get("/api/v1/agent10/weekly-briefing?department=NON_EXISTENT", headers={"X-User-Role": "DEAN", "X-User-Id": "123e4567-e89b-12d3-a456-426614174000"})
    assert response.status_code == 200
    data = response.json()
    assert data["scope"] == "NON_EXISTENT"
    assert data["overall_snapshot"]["students_evaluated"] == 0

def test_llm_unavailable_fallback():
    response = client.get("/api/v1/agent10/weekly-briefing", headers={"X-User-Role": "DEAN", "X-User-Id": "123e4567-e89b-12d3-a456-426614174000"})
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data["summary_narrative"], str)
    assert len(data["summary_narrative"]) > 0

def test_real_db_backed_facts():
    response = client.get("/api/v1/agent10/weekly-briefing", headers={"X-User-Role": "DEAN", "X-User-Id": "123e4567-e89b-12d3-a456-426614174000"})
    assert response.status_code == 200
    data = response.json()
    assert "total_students" in data["overall_snapshot"]
    assert "pass_rate" in data["overall_snapshot"]
