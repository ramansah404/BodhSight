from io import BytesIO

import pandas as pd

from app.ingestion.adapters import adapt_source_records
from app.ingestion.agent10_pipeline import normalize_records, parse_xlsx, validate_records


def test_agent34_json_record_normalizes_to_canonical_fields():
    records = normalize_records(
        adapt_source_records(
            "agent34",
            [{
                "register_no": "24CSE001",
                "subject_code": "CS301",
                "internal": 20,
                "external": 50,
                "total": 70,
                "result_status": "PASS",
            }],
        ),
        defaults={"academic_year": "2025-26", "semester": "1"},
    )

    assert records[0].roll_no == "24CSE001"
    assert records[0].course_code == "CS301"
    assert records[0].total_marks == 70
    assert validate_records(records, source_type="results") == []


def test_invalid_json_record_returns_structured_validation_errors():
    records = normalize_records([{
        "roll_no": "24CSE001",
        "course_code": "CS301",
        "semester": "1",
        "academic_year": "2025-26",
        "internal_marks": 30,
        "external_marks": 50,
        "total_marks": 90,
        "attendance": 101,
        "result": "UNKNOWN",
    }])

    errors = validate_records(records, source_type="results")
    fields = {error.field for error in errors}
    assert {"total_marks", "attendance", "result"}.issubset(fields)
    assert all(error.row == 2 for error in errors)


def test_xlsx_rows_are_parsed_through_the_same_normalizer():
    buffer = BytesIO()
    pd.DataFrame([{
        "Roll No": "24CSE001",
        "Course Code": "CS301",
        "Semester": "1",
        "Academic Year": "2025-26",
        "Attendance": 82,
    }]).to_excel(buffer, index=False, engine="openpyxl")

    records = parse_xlsx(buffer.getvalue())
    assert len(records) == 1
    assert records[0].roll_no == "24CSE001"
    assert records[0].attendance == 82
