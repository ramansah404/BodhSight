from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.api.routers.chat import get_groq_client
from app.main import app

client = TestClient(app)


def test_settings_loads_groq_api_key_from_repo_env(monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "test-groq-key")
    settings = Settings()
    assert settings.GROQ_API_KEY == "test-groq-key"


def test_groq_client_reports_missing_key_without_exposing_a_secret(monkeypatch):
    from app.api.routers import chat

    monkeypatch.setattr(chat.settings, "GROQ_API_KEY", None)
    with pytest.raises(ValueError, match="GROQ_API_KEY is not configured"):
        get_groq_client()


def test_valid_csv_upload_returns_success_summary():
    csv_bytes = b"Roll No,Attendance,CGPA,Backlogs\n24CSE001,82,7.8,1\n24CSE014,68,5.9,2\n"
    response = client.post(
        "/api/v1/ingestion/upload",
        files={"file": ("student_data.csv", csv_bytes, "text/csv")},
        data={"document_type": "attendance"},
        headers={"X-User-Role": "Dean", "X-User-Name": "QA User"},
    )

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["success"] is True
    assert body["status"] == "QUEUED"
    assert body["file_info"]["rows_valid"] == 2
    assert body["file_info"]["rows_rejected"] == 0


def test_invalid_csv_upload_returns_validation_error():
    csv_bytes = b"RollNo,Attendance,CGPA\n24CSE001,82,7.8\n"
    response = client.post(
        "/api/v1/ingestion/upload",
        files={"file": ("bad_student_data.csv", csv_bytes, "text/csv")},
        data={"document_type": "attendance"},
        headers={"X-User-Role": "Dean", "X-User-Name": "QA User"},
    )

    assert response.status_code == 422, response.text
    assert "required columns" in response.json()["detail"].lower()


def test_malformed_csv_row_is_reported_without_server_error():
    csv_bytes = b"Roll No,Attendance,CGPA,Backlogs\n24CSE001,not-a-number,7.8,1\n"
    response = client.post(
        "/api/v1/ingestion/upload",
        files={"file": ("malformed_student_data.csv", csv_bytes, "text/csv")},
        data={"document_type": "attendance"},
        headers={"X-User-Role": "Dean", "X-User-Name": "QA User"},
    )

    assert response.status_code == 200, response.text
    assert response.json()["file_info"]["rows_rejected"] == 1
