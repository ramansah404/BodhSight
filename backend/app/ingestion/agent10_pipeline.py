from __future__ import annotations

import csv
import io
import re
from dataclasses import dataclass
from typing import Any, Iterable

import pandas as pd
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.schemas.ingestion import (
    CanonicalAcademicRecord,
    IngestionResponse,
    ValidationErrorItem,
)


ROLE_SOURCE_ALIASES = {
    "agent1": "agent1_curriculum",
    "agent3": "agent3_allocation",
    "agent34": "agent34_results",
    "csv": "human_upload",
    "xlsx": "human_upload",
}


def _key(value: Any) -> str:
    return re.sub(r"[^a-z0-9]", "", str(value or "").lower())


FIELD_ALIASES: dict[str, set[str]] = {
    "student_id": {"studentid", "studentuuid", "id"},
    "roll_no": {"rollno", "rollnumber", "registerno", "admissionno", "studentrollno"},
    "student_name": {"studentname", "name", "fullname"},
    "department": {"department", "dept", "departmentcode"},
    "programme": {"programme", "program", "programmecode"},
    "batch": {"batch", "batchlabel"},
    "regulation": {"regulation", "regulationcode"},
    "semester": {"semester", "term", "termno", "semestername"},
    "academic_year": {"academicyear", "year", "ay", "academicyearlabel"},
    "section": {"section", "sectioncode"},
    "course_code": {"coursecode", "course", "subjectcode", "papercode"},
    "course_name": {"coursename", "subject", "title", "coursetitle"},
    "faculty_id": {"facultyid", "facultyemployeeid", "employeeno"},
    "faculty": {"faculty", "facultyname", "teacher", "instructor"},
    "internal_marks": {"internalmarks", "internal", "internalmark", "midmarks"},
    "external_marks": {"externalmarks", "external", "externalmark", "finalmarks"},
    "total_marks": {"totalmarks", "total", "marks", "score"},
    "max_marks": {"maxmarks", "maximum", "totalmaxmarks"},
    "cgpa": {"cgpa", "gpa"},
    "backlog_count": {"backlogcount", "backlogs", "backlog"},
    "grade": {"grade", "lettergrade"},
    "result": {"result", "resultstatus", "passfail", "status"},
    "attendance": {"attendance", "attendancepct", "attendancepercentage", "attendancerate"},
    "assessment": {"assessment", "assessmentname", "assessmenttype", "examtype"},
}


def normalize_row(raw: dict[str, Any], row_number: int, *, defaults: dict[str, Any] | None = None) -> CanonicalAcademicRecord:
    defaults = defaults or {}
    normalized = {_key(k): v for k, v in raw.items()}
    values: dict[str, Any] = {"source_row": row_number}
    parse_errors: dict[str, str] = {}
    for field, aliases in FIELD_ALIASES.items():
        for alias in aliases:
            if alias in normalized and normalized[alias] not in (None, ""):
                values[field] = normalized[alias]
                break
        if field not in values and field in defaults:
            values[field] = defaults[field]

    numeric_fields = {
        "internal_marks", "external_marks", "total_marks", "max_marks", "attendance", "cgpa", "backlog_count"
    }
    for field in numeric_fields:
        if field in values and values[field] not in (None, ""):
            try:
                values[field] = float(str(values[field]).strip())
                if field == "backlog_count":
                    values[field] = int(values[field])
            except (TypeError, ValueError):
                parse_errors[field] = "Value must be numeric"
                values[field] = None
    for field in ("roll_no", "student_id", "course_code", "semester", "academic_year", "grade", "result"):
        if field in values and values[field] is not None:
            values[field] = str(values[field]).strip()
    values["parse_errors"] = parse_errors
    return CanonicalAcademicRecord.model_validate(values)


def normalize_records(records: Iterable[dict[str, Any]], *, defaults: dict[str, Any] | None = None) -> list[CanonicalAcademicRecord]:
    return [normalize_row(row, index, defaults=defaults) for index, row in enumerate(records, start=2)]


def parse_csv(content: bytes, *, defaults: dict[str, Any] | None = None, required_aliases: set[str] | None = None) -> list[CanonicalAcademicRecord]:
    try:
        decoded = content.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise ValueError("CSV must be UTF-8 encoded") from exc
    reader = csv.DictReader(io.StringIO(decoded))
    if not reader.fieldnames:
        raise ValueError("CSV must contain a header row")
    if required_aliases:
        headers = {_key(header) for header in reader.fieldnames}
        missing = sorted(required_aliases - headers)
        if missing:
            raise ValueError(f"CSV is missing required columns: {', '.join(missing)}")
    return normalize_records(reader, defaults=defaults)


def parse_xlsx(content: bytes, *, defaults: dict[str, Any] | None = None) -> list[CanonicalAcademicRecord]:
    try:
        frame = pd.read_excel(io.BytesIO(content), engine="openpyxl")
    except ImportError as exc:
        raise ValueError("XLSX processing is unavailable because the openpyxl dependency is missing") from exc
    except Exception as exc:
        raise ValueError(f"Unable to read XLSX file: {exc}") from exc
    if frame.empty:
        return []
    return normalize_records(frame.where(pd.notna(frame), None).to_dict(orient="records"), defaults=defaults)


def parse_pdf(content: bytes, *, defaults: dict[str, Any] | None = None, required_aliases: set[str] | None = None) -> list[CanonicalAcademicRecord]:
    import PyPDF2
    import io
    import re
    
    try:
        pdf = PyPDF2.PdfReader(io.BytesIO(content))
        text_content = ""
        for page in pdf.pages:
            text_content += page.extract_text() + "\n"
    except Exception as exc:
        raise ValueError(f"Unable to read PDF file: {exc}") from exc
        
    # Naive extraction for demo purposes:
    # Expect lines like: "2021BCS001 85 9.1 0" or CSV inside PDF
    records = []
    lines = text_content.split('\n')
    header_found = False
    headers = []
    
    for line in lines:
        line = line.strip()
        if not line: continue
        # Try to detect CSV-like or space-separated headers
        parts = re.split(r'[,\t ]+', line)
        if not header_found and any(h.lower() in {"rollno", "cgpa", "attendance", "student_id"} for h in parts):
            headers = [_key(h) for h in parts]
            header_found = True
            continue
            
        if header_found and len(parts) >= min(2, len(headers)):
            record = {}
            for i, val in enumerate(parts):
                if i < len(headers):
                    record[headers[i]] = val
            records.append(record)
            
    if not records:
        raise ValueError("Could not automatically extract structured tables from the PDF. Please ensure it contains clear rows and columns.")
        
    return normalize_records(records, defaults=defaults)



def validate_records(records: list[CanonicalAcademicRecord], *, source_type: str) -> list[ValidationErrorItem]:
    errors: list[ValidationErrorItem] = []
    seen: set[tuple[str, str, str, str]] = set()
    legacy_profile = source_type in {"attendance", "legacy_student_profile"}
    allowed_results = {"PASS", "FAIL", "ABSENT", "WITHHELD", "MALPRACTICE"}
    allowed_grades = {"O", "A+", "A", "B+", "B", "C", "D", "E", "F", "S", "U"}

    for record in records:
        row = record.source_row or 0
        for field, message in record.parse_errors.items():
            errors.append(ValidationErrorItem(row=row, field=field, message=message))
        if not record.student_id and not record.roll_no:
            errors.append(ValidationErrorItem(row=row, field="student_id", message="Student ID or roll number is required"))
        if not legacy_profile:
            for field, value in (("course_code", record.course_code), ("semester", record.semester), ("academic_year", record.academic_year)):
                if not value:
                    errors.append(ValidationErrorItem(row=row, field=field, message=f"{field.replace('_', ' ').title()} is required"))
        if record.attendance is not None and not 0 <= record.attendance <= 100:
            errors.append(ValidationErrorItem(row=row, field="attendance", message="Attendance must be between 0 and 100"))
        if record.cgpa is not None and not 0 <= record.cgpa <= 10:
            errors.append(ValidationErrorItem(row=row, field="cgpa", message="CGPA must be between 0 and 10"))
        if record.backlog_count is not None and record.backlog_count < 0:
            errors.append(ValidationErrorItem(row=row, field="backlog_count", message="Backlogs cannot be negative"))
        for field in ("internal_marks", "external_marks", "total_marks", "max_marks", "cgpa", "backlog_count"):
            value = getattr(record, field)
            if value is not None and value < 0:
                errors.append(ValidationErrorItem(row=row, field=field, message="Marks cannot be negative"))
        if record.max_marks is not None and record.total_marks is not None and record.total_marks > record.max_marks:
            errors.append(ValidationErrorItem(row=row, field="total_marks", message="Total exceeds allowed maximum"))
        if record.internal_marks is not None and record.external_marks is not None and record.total_marks is not None:
            if abs(record.internal_marks + record.external_marks - record.total_marks) > 0.01:
                errors.append(ValidationErrorItem(row=row, field="total_marks", message="Total must equal internal plus external marks"))
        if record.result and record.result.upper() not in allowed_results:
            errors.append(ValidationErrorItem(row=row, field="result", message=f"Invalid result value '{record.result}'"))
        if record.grade and record.grade.upper() not in allowed_grades:
            errors.append(ValidationErrorItem(row=row, field="grade", message=f"Invalid grade value '{record.grade}'"))
        duplicate_key = (record.roll_no or record.student_id or "", record.course_code or "", record.semester or "", record.academic_year or "")
        if duplicate_key in seen:
            errors.append(ValidationErrorItem(row=row, field="record", message="Duplicate academic record"))
        seen.add(duplicate_key)
    return errors


@dataclass
class PersistResult:
    accepted: int
    errors: list[ValidationErrorItem]


def _lookup_student(db: Session, record: CanonicalAcademicRecord):
    if record.student_id:
        row = db.execute(text("SELECT student_id FROM people.student WHERE student_id::text = :id"), {"id": record.student_id}).fetchone()
    else:
        row = db.execute(text("SELECT student_id FROM people.student WHERE roll_no = :roll"), {"roll": record.roll_no}).fetchone()
    return row[0] if row else None


def _lookup_offering(db: Session, record: CanonicalAcademicRecord):
    return db.execute(text("""
        SELECT co.course_offering_id, co.course_version_id, co.term_id
        FROM academics.course_offering co
        JOIN curriculum.course_version cv ON cv.course_version_id = co.course_version_id
        JOIN core.term t ON t.term_id = co.term_id
        JOIN core.academic_year ay ON ay.academic_year_id = t.academic_year_id
        WHERE cv.course_code = :course_code
          AND (t.label = :semester OR t.term_no::text = :semester OR :semester IS NULL)
          AND (ay.label = :academic_year OR :academic_year IS NULL)
        ORDER BY co.status = 'ACTIVE' DESC
        LIMIT 1
    """), {"course_code": record.course_code, "semester": record.semester, "academic_year": record.academic_year}).fetchone()


def persist_records(db: Session, records: list[CanonicalAcademicRecord], *, source: str, file_ref: str | None = None) -> PersistResult:
    accepted = 0
    errors: list[ValidationErrorItem] = []
    for record in records:
        try:
            student_id = _lookup_student(db, record)
            if not student_id:
                raise ValueError("Student identifier was not found in the academic database")

            if record.course_code:
                offering = _lookup_offering(db, record)
                if not offering:
                    raise ValueError("Course, semester, or academic year does not match an existing course offering")
                offering_id, course_version_id, term_id = offering
                result = (record.result or ("PASS" if record.grade and record.grade.upper() not in {"F", "U"} else "FAIL")).upper()
                if any(value is not None for value in (record.internal_marks, record.external_marks, record.total_marks, record.grade)):
                    db.execute(text("""
                        INSERT INTO assessment.course_result
                          (student_id, course_version_id, term_id, course_offering_id, exam_type,
                           internal_marks, external_marks, total_marks, max_marks, grade, result_status)
                        VALUES (:student_id, :course_version_id, :term_id, :offering_id, 'REGULAR',
                                :internal_marks, :external_marks, :total_marks, :max_marks, :grade, :result)
                        ON CONFLICT (student_id, course_version_id, term_id, attempt_no, exam_type)
                        DO UPDATE SET internal_marks = EXCLUDED.internal_marks,
                                      external_marks = EXCLUDED.external_marks,
                                      total_marks = EXCLUDED.total_marks,
                                      max_marks = EXCLUDED.max_marks,
                                      grade = EXCLUDED.grade,
                                      result_status = EXCLUDED.result_status
                    """), {"student_id": student_id, "course_version_id": course_version_id, "term_id": term_id,
                           "offering_id": offering_id, "internal_marks": record.internal_marks,
                           "external_marks": record.external_marks, "total_marks": record.total_marks,
                           "max_marks": record.max_marks, "grade": record.grade, "result": result})
                if record.attendance is not None:
                    attended = round(record.attendance)
                    db.execute(text("""
                        INSERT INTO attendance.attendance_summary
                          (student_id, course_offering_id, term_id, as_of_date, classes_held,
                           classes_attended, raw_pct, adjusted_pct, band, risk_level, computed_by_agent)
                        VALUES (:student_id, :offering_id, :term_id, CURRENT_DATE, 100, :attended,
                                :attendance, :attendance,
                                CASE WHEN :attendance >= 75 THEN 'GTE_75' WHEN :attendance >= 70 THEN 'B70_75'
                                     WHEN :attendance >= 65 THEN 'B65_70' WHEN :attendance >= 60 THEN 'B60_65'
                                     WHEN :attendance >= 50 THEN 'B50_60' ELSE 'LT_50' END,
                                CASE WHEN :attendance >= 75 THEN 'NONE' WHEN :attendance >= 65 THEN 'WATCH'
                                     WHEN :attendance >= 50 THEN 'AT_RISK' ELSE 'CRITICAL' END,
                                :source)
                        ON CONFLICT (student_id, course_offering_id, term_id, as_of_date)
                        DO UPDATE SET classes_attended = EXCLUDED.classes_attended,
                                      raw_pct = EXCLUDED.raw_pct, adjusted_pct = EXCLUDED.adjusted_pct,
                                      band = EXCLUDED.band, risk_level = EXCLUDED.risk_level
                    """), {"student_id": student_id, "offering_id": offering_id, "term_id": term_id,
                           "attended": attended, "attendance": record.attendance, "source": source})
            elif record.attendance is not None or record.cgpa is not None or record.backlog_count is not None or record.student_name is not None:
                # Preserve the existing Manual Entry data path when the deployment has its
                # optional override columns. Full academic rows use the official tables above.
                columns = db.execute(text("""
                    SELECT column_name FROM information_schema.columns
                    WHERE table_schema = 'people' AND table_name = 'student'
                      AND column_name IN ('demo_attendance_override', 'demo_marks_override', 'demo_backlog_override')
                """)).scalars().all()
                updates = {}
                if record.attendance is not None and "demo_attendance_override" in columns:
                    updates["demo_attendance_override"] = record.attendance
                if record.internal_marks is not None and "demo_marks_override" in columns:
                    updates["demo_marks_override"] = record.internal_marks
                if record.cgpa is not None and "demo_marks_override" in columns:
                    updates["demo_marks_override"] = record.cgpa
                if record.backlog_count is not None and "demo_backlog_override" in columns:
                    updates["demo_backlog_override"] = record.backlog_count
                if not updates:
                    raise ValueError("The record has no persistable academic field")
                assignments = ", ".join(f"{column} = :{column}" for column in updates)
                db.execute(text(f"UPDATE people.student SET {assignments} WHERE student_id = :student_id"), {**updates, "student_id": student_id})
            else:
                raise ValueError("Record contains no persistable academic values")
            accepted += 1
        except Exception as exc:
            errors.append(ValidationErrorItem(row=record.source_row or 0, field="record", message=str(exc)))
    return PersistResult(accepted=accepted, errors=errors)


def process_records(db: Session, records: list[CanonicalAcademicRecord], *, source: str, source_type: str, file_ref: str | None = None) -> IngestionResponse:
    validation_errors = validate_records(records, source_type=source_type)
    invalid_rows = {error.row for error in validation_errors}
    valid_records = [record for record in records if (record.source_row or 0) not in invalid_rows]
    persist_result = persist_records(db, valid_records, source=source, file_ref=file_ref)
    all_errors = validation_errors + persist_result.errors
    accepted = persist_result.accepted
    rejected = len(records) - accepted
    status = "completed" if rejected == 0 else ("partial" if accepted else "failed")
    report = {"errors": [error.model_dump() for error in all_errors]}
    batch_id = db.execute(text("""
        INSERT INTO attendance.ingestion_batch
          (source, file_ref, row_count, accepted_count, rejected_count, validation_report, status, processed_at)
        VALUES (:source, :file_ref, :row_count, :accepted, :rejected, CAST(:report AS jsonb), :status, CURRENT_TIMESTAMP)
        RETURNING ingestion_batch_id::text
    """), {"source": source, "file_ref": file_ref, "row_count": len(records), "accepted": accepted,
           "rejected": rejected, "report": __import__("json").dumps(report),
           "status": "ACCEPTED" if status == "completed" else ("PARTIAL" if accepted else "FAILED")}).scalar_one()
    db.commit()
    return IngestionResponse(status=status, received=len(records), accepted=accepted, rejected=rejected,
                             errors=all_errors, batch_id=batch_id, source_agent=source, source_type=source_type)