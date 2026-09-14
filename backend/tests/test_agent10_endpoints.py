import pytest
from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_course_performance_returns_structured_rows():
    response = client.get(
        "/api/v1/agent10/performance/courses",
        headers={"X-User-Role": "Dean"},
    )

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if data:
        assert {"course_code", "course_name", "pass_rate", "priority"}.issubset(data[0])


def test_exceptions_returns_structured_rows():
    response = client.get(
        "/api/v1/agent10/exceptions",
        headers={"X-User-Role": "Dean"},
    )

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if data:
        assert {"id", "severity", "title", "evidence"}.issubset(data[0])


def test_course_and_exception_empty_scope_is_successful():
    params = {"department": "__NO_SUCH_DEPARTMENT__"}

    courses = client.get(
        "/api/v1/agent10/performance/courses",
        params=params,
        headers={"X-User-Role": "Dean"},
    )
    exceptions = client.get(
        "/api/v1/agent10/exceptions",
        params=params,
        headers={"X-User-Role": "Dean"},
    )

    assert courses.status_code == 200
    assert exceptions.status_code == 200
    assert courses.json() == []
    assert exceptions.json() == []


def test_hod_department_scope_overrides_requested_department():
    response = client.get(
        "/api/v1/agent10/performance/courses",
        params={"department": "MECH"},
        headers={
            "X-User-Role": "HOD",
            "X-User-Department": "CSE",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert all(row["department"] == "CSE" for row in data)
