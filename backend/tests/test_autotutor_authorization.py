import asyncio
from unittest.mock import ANY, patch

import pytest
from fastapi import HTTPException

from app.api.routers.agent10 import generate_autotutor
from app.core.authorization import Agent10Identity
from app.schemas.agent10 import AutoTutorRequest


WEAK_QUESTION = {
    "paper_question_id": "question-id",
    "question_no": "Q1a",
    "question_text": "Implement a circular queue",
    "marks_obtained": 4,
    "max_marks": 15,
    "unit_no": 1,
    "unit_title": "Arrays and Linked Lists",
    "co_no": 1,
    "co_statement": "Apply linear data structures to solve problems",
    "course_code": "CS301",
}

AI_RESPONSE = {
    "ai_diagnosis": "Dynamic diagnosis",
    "targeted_explanation": "Dynamic explanation",
    "practice_plan": "Dynamic practice plan",
    "resources": ["Dynamic resource"],
}


def _invoke(request: AutoTutorRequest, identity: Agent10Identity):
    with patch("app.db.queries.get_weakest_question", return_value=WEAK_QUESTION) as weakest_question, \
         patch("app.agents.agent10.llm.generate_auto_tutor", return_value=AI_RESPONSE), \
         patch("app.api.routers.agent10.require_course_access") as require_access:
        result = asyncio.run(generate_autotutor(request, object(), identity))
    return result, weakest_question, require_access


def test_faculty_autotutor_is_limited_to_assigned_courses():
    identity = Agent10Identity(role="FACULTY", course_codes={"CS301"})
    result, weakest_question, require_access = _invoke(AutoTutorRequest(student_id="student-id"), identity)

    assert result["question_no"] == "Q1a"
    assert weakest_question.call_args.kwargs["course_codes"] == ["CS301"]
    assert weakest_question.call_args.kwargs["department_ids"] is None
    require_access.assert_called_once_with(identity, ANY, "CS301")


def test_hod_autotutor_is_limited_to_department_scope():
    identity = Agent10Identity(role="HOD", department_ids={"department-id"})
    _, weakest_question, require_access = _invoke(AutoTutorRequest(student_id="student-id"), identity)

    assert weakest_question.call_args.kwargs["course_codes"] is None
    assert weakest_question.call_args.kwargs["department_ids"] == ["department-id"]
    require_access.assert_called_once_with(identity, ANY, "CS301")


def test_faculty_cannot_request_an_unassigned_course():
    identity = Agent10Identity(role="FACULTY", course_codes={"CS301"})
    with pytest.raises(HTTPException) as error:
        asyncio.run(
            generate_autotutor(
                AutoTutorRequest(student_id="student-id", course_code="CS302"),
                object(),
                identity,
            )
        )
    assert error.value.status_code == 403
