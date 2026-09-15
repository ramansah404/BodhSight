from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator


class CanonicalAcademicRecord(BaseModel):
    """One normalized academic fact at student/course/period grain."""

    student_id: str | None = None
    roll_no: str | None = None
    student_name: str | None = None
    department: str | None = None
    programme: str | None = None
    batch: str | None = None
    regulation: str | None = None
    semester: str | None = None
    academic_year: str | None = None
    section: str | None = None
    course_code: str | None = None
    course_name: str | None = None
    faculty_id: str | None = None
    faculty: str | None = None
    internal_marks: float | None = None
    external_marks: float | None = None
    total_marks: float | None = None
    max_marks: float | None = None
    cgpa: float | None = None
    backlog_count: int | None = None
    grade: str | None = None
    result: str | None = None
    attendance: float | None = None
    assessment: str | None = None
    source_row: int | None = Field(default=None, exclude=True)
    parse_errors: dict[str, str] = Field(default_factory=dict, exclude=True)


class IngestionRequest(BaseModel):
    source_agent: str = Field(min_length=1, max_length=80)
    schema_version: str = Field(default="1.0", min_length=1, max_length=20)
    source_type: str = Field(default="academic_records", min_length=1, max_length=80)
    academic_year: str | None = None
    semester: str | None = None
    records: list[dict[str, Any]] = Field(min_length=1)

    @field_validator("source_agent", "source_type")
    @classmethod
    def strip_metadata(cls, value: str) -> str:
        return value.strip()


class ValidationErrorItem(BaseModel):
    row: int
    field: str
    message: str


class IngestionResponse(BaseModel):
    status: Literal["completed", "partial", "failed"]
    received: int
    accepted: int
    rejected: int
    errors: list[ValidationErrorItem] = []
    batch_id: str | None = None
    source_agent: str
    source_type: str
