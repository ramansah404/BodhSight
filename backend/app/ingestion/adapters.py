from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class Agent10InputAdapter(ABC):
    source_agent: str

    @abstractmethod
    def adapt(self, records: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """Convert source-specific records to canonical field names."""


class Agent1CurriculumAdapter(Agent10InputAdapter):
    source_agent = "agent1"

    def adapt(self, records: list[dict[str, Any]]) -> list[dict[str, Any]]:
        return [
            {
                **record,
                "programme": record.get("programme") or record.get("program_code"),
                "course_code": record.get("course_code") or record.get("code"),
                "course_name": record.get("course_name") or record.get("title"),
                "regulation": record.get("regulation") or record.get("regulation_code"),
            }
            for record in records
        ]


class Agent3AllocationAdapter(Agent10InputAdapter):
    source_agent = "agent3"

    def adapt(self, records: list[dict[str, Any]]) -> list[dict[str, Any]]:
        return [
            {
                **record,
                "course_code": record.get("course_code") or record.get("course"),
                "faculty_id": record.get("faculty_id") or record.get("employee_no"),
                "faculty": record.get("faculty") or record.get("faculty_name"),
                "section": record.get("section") or record.get("section_code"),
                "academic_year": record.get("academic_year") or record.get("year"),
            }
            for record in records
        ]


class Agent34ResultsAdapter(Agent10InputAdapter):
    source_agent = "agent34"

    def adapt(self, records: list[dict[str, Any]]) -> list[dict[str, Any]]:
        return [
            {
                **record,
                "roll_no": record.get("roll_no") or record.get("register_no"),
                "course_code": record.get("course_code") or record.get("subject_code"),
                "internal_marks": record.get("internal_marks") or record.get("internal"),
                "external_marks": record.get("external_marks") or record.get("external"),
                "total_marks": record.get("total_marks") or record.get("total"),
                "result": record.get("result") or record.get("result_status"),
            }
            for record in records
        ]


class HumanAcademicFileAdapter(Agent10InputAdapter):
    source_agent = "human_upload"

    def adapt(self, records: list[dict[str, Any]]) -> list[dict[str, Any]]:
        return records


ADAPTERS: dict[str, Agent10InputAdapter] = {
    adapter.source_agent: adapter
    for adapter in (
        Agent1CurriculumAdapter(),
        Agent3AllocationAdapter(),
        Agent34ResultsAdapter(),
        HumanAcademicFileAdapter(),
    )
}


def adapt_source_records(source_agent: str, records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    adapter = ADAPTERS.get(source_agent.lower(), HumanAcademicFileAdapter())
    return adapter.adapt(records)
