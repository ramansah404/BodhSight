import pytest
from fastapi import HTTPException

from app.core.authorization import Agent10Identity, allowed_department, filter_scoped_course_rows, require_aggregate_access, require_course_access


def test_faculty_rows_are_limited_to_allocated_courses():
    identity = Agent10Identity(role="FACULTY", course_codes={"CS301"})
    rows = [{"course_code": "CS301"}, {"course_code": "CS302"}]
    assert filter_scoped_course_rows(identity, rows) == [{"course_code": "CS301"}]


def test_hod_cannot_select_another_department():
    identity = Agent10Identity(role="HOD", department_codes={"CSE"})
    with pytest.raises(HTTPException) as error:
        allowed_department(identity, "MECH")
    assert error.value.status_code == 403


def test_faculty_cannot_use_aggregate_only_endpoint():
    with pytest.raises(HTTPException) as error:
        require_aggregate_access(Agent10Identity(role="FACULTY"))
    assert error.value.status_code == 403


def test_faculty_cannot_request_unallocated_course():
    identity = Agent10Identity(role="FACULTY", course_codes={"CS301"})
    with pytest.raises(HTTPException) as error:
        require_course_access(identity, None, "CS302")
    assert error.value.status_code == 403
