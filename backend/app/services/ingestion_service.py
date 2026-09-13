from __future__ import annotations

import hashlib
import json
import re
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.routers.agent10 import dashboard_cache, course_perf_cache, dept_perf_cache, exceptions_cache, priorities_cache, recommendations_cache, sections_cache, summary_cache, trends_cache
from app.schemas.ingestion import ValidationError
from app.services.file_parsers import FileParseError, ParsedTable, parse_file


@dataclass
class UploadContext:
    upload_id: str
    files: List[Dict[str, Any]]


class IngestionService:
    def __init__(self, db: Session):
        self.db = db

    def _field_rows(self, job_id: str) -> List[Dict[str, Any]]:
        result = self.db.execute(text("""
            SELECT extracted_field_id, field_name, raw_value, normalised_value, confidence,
                   page_no, verification_status, corrected_value
            FROM knowledge.extracted_field WHERE extraction_job_id = :job_id
            ORDER BY extracted_field_id
        """), {"job_id": job_id})
        return [dict(row._mapping) for row in result]

    def _field_payload(self, job_id: str) -> Dict[int, Dict[str, Any]]:
        values: Dict[int, Dict[str, Any]] = {}
        for field in self._field_rows(job_id):
            match = re.match(r"row_(\d+)\.(.+)", field["field_name"])
            if not match:
                continue
            row_no = int(match.group(1))
            values.setdefault(row_no, {})[match.group(2)] = field["corrected_value"] if field["corrected_value"] is not None else (field["normalised_value"] or field["raw_value"] or "")
        return values

    @staticmethod
    def _normalise_header(header: str) -> str:
        aliases = {
            "roll": "student_roll_no", "roll_no": "student_roll_no", "roll_number": "student_roll_no",
            "registration_no": "student_roll_no", "registration_number": "student_roll_no",
            "student": "student_name", "name": "student_name", "student_name": "student_name",
            "total": "total_marks", "total_marks": "total_marks", "internal": "internal_marks",
            "internal_marks": "internal_marks", "assignment": "assignment_marks", "assign": "assignment_marks",
            "absent": "absent_flag",
        }
        return aliases.get(header, header)

    def _normalise_table(self, table: ParsedTable) -> List[Dict[str, Any]]:
        rows = []
        for source_row in table.rows:
            row = {self._normalise_header(key): value for key, value in source_row.items()}
            rows.append(row)
        return rows

    def create_upload(self, files: List[Tuple[str, Optional[str], bytes]], course_offering_id: Optional[str], max_marks: float, formula_version: str, actor_user_id: Optional[str]) -> UploadContext:
        if not files or len(files) > 5:
            raise HTTPException(400, "An upload must contain between 1 and 5 files.")
        upload_id = str(uuid.uuid4())
        results = []
        try:
            for filename, content_type, content in files:
                content_hash = hashlib.sha256(content).hexdigest()
                duplicate = self.db.execute(text("SELECT document_id FROM knowledge.document WHERE content_hash = :content_hash"), {"content_hash": content_hash}).scalar_one_or_none()
                if duplicate:
                    raise HTTPException(409, f"The file {filename} has already been uploaded.")
                try:
                    table = parse_file(filename, content_type, content)
                except FileParseError as exc:
                    raise HTTPException(400, str(exc)) from exc
                document_id = str(uuid.uuid4())
                job_id = str(uuid.uuid4())
                institution_id = self.db.execute(text("SELECT institution_id FROM core.institution ORDER BY institution_id LIMIT 1")).scalar_one_or_none()
                if not institution_id:
                    raise HTTPException(500, "No institution is configured.")
                self.db.execute(text("""
                    INSERT INTO knowledge.document(document_id, institution_id, title, document_class, mime_type, storage_uri, content_hash)
                    VALUES (:document_id, :institution_id, :title, 'MARKS_CARD', :mime_type, :storage_uri, :content_hash)
                """), {"document_id": document_id, "institution_id": institution_id, "title": filename, "mime_type": content_type, "storage_uri": f"ingestion://{upload_id}/{content_hash}"})
                extraction_status = "NEEDS_REVIEW" if table.metadata.get("needs_review") else "COMPLETED"
                extraction_method = "TABLE" if table.source_type != "PDF" else "HYBRID"
                self.db.execute(text("""
                    INSERT INTO knowledge.extraction_job(extraction_job_id, document_id, source_uri, detected_document_type, extraction_method, status, started_at, finished_at)
                    VALUES (:job_id, :document_id, :source_uri, :document_type, :method, :status, now(), now())
                """), {"job_id": job_id, "document_id": document_id, "source_uri": f"ingestion://{upload_id}/{content_hash}", "document_type": table.source_type, "method": extraction_method, "status": extraction_status})
                for index, raw_row in enumerate(self._normalise_table(table), start=1):
                    for field_name, value in raw_row.items():
                        self.db.execute(text("""
                            INSERT INTO knowledge.extracted_field(extraction_job_id, field_name, raw_value, normalised_value, confidence, verification_status)
                            VALUES (:job_id, :field_name, :raw_value, :normalised_value, :confidence, :verification_status)
                        """), {"job_id": job_id, "field_name": f"row_{index}.{field_name}", "raw_value": str(value), "normalised_value": str(value), "confidence": 0.5 if extraction_status == "NEEDS_REVIEW" else 1.0, "verification_status": "NEEDS_REVIEW" if extraction_status == "NEEDS_REVIEW" else "AUTO"})
                results.append({"file_id": str(uuid.uuid4()), "filename": filename, "document_id": document_id, "extraction_job_id": job_id, "status": extraction_status, "content_hash": content_hash, "course_offering_id": course_offering_id, "max_marks": max_marks, "formula_version": formula_version, "actor_user_id": actor_user_id})
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise
        _UPLOADS[upload_id] = UploadContext(upload_id, results)
        return _UPLOADS[upload_id]

    def validate(self, context: UploadContext) -> Tuple[List[ValidationError], int]:
        errors: List[ValidationError] = []
        total_rows = 0
        for file in context.files:
            rows = self._field_payload(file["extraction_job_id"])
            total_rows += len(rows)
            seen = set()
            for row_no, row in rows.items():
                roll = row.get("student_roll_no", "").strip()
                if not roll:
                    errors.append(ValidationError(code="REQUIRED_FIELD", message="student_roll_no is required", row_no=row_no, field_name="student_roll_no"))
                    continue
                if roll in seen:
                    errors.append(ValidationError(code="DUPLICATE_STUDENT", message=f"Student {roll} appears more than once", row_no=row_no, field_name="student_roll_no"))
                seen.add(roll)
                for key, value in row.items():
                    if key in {"student_roll_no", "student_name", "absent_flag"} or value == "":
                        continue
                    if key.endswith("marks") or key.startswith("mid") or key.startswith("assignment"):
                        try:
                            numeric = float(value)
                        except (TypeError, ValueError):
                            errors.append(ValidationError(code="NON_NUMERIC_MARK", message=f"{key} must be numeric", row_no=row_no, field_name=key))
                            continue
                        if numeric < 0 or numeric > float(file["max_marks"]):
                            errors.append(ValidationError(code="MARK_OUT_OF_RANGE", message=f"{key} must be between 0 and {file['max_marks']}", row_no=row_no, field_name=key))
                if file.get("course_offering_id"):
                    registered = self.db.execute(text("""
                        SELECT 1 FROM academics.student_registration sr
                        JOIN people.student s ON s.student_id = sr.student_id
                        WHERE sr.course_offering_id = :offering AND s.roll_no = :roll AND sr.status = 'REGISTERED'
                    """), {"offering": file["course_offering_id"], "roll": roll}).scalar_one_or_none()
                    if not registered:
                        errors.append(ValidationError(code="NOT_REGISTERED", message=f"Student {roll} is not registered for this course offering", row_no=row_no, field_name="student_roll_no"))
            if not file.get("course_offering_id"):
                errors.append(ValidationError(code="COURSE_REQUIRED", message="course_offering_id is required to validate marks"))
        return errors, total_rows

    def patch_field(self, field_id: str, value: Optional[str], actor_user_id: str) -> None:
        result = self.db.execute(text("""UPDATE knowledge.extracted_field SET corrected_value = :value, normalised_value = :value, verification_status = 'CORRECTED', verified_by_user_id = :user_id, verified_at = now() WHERE extracted_field_id = :field_id"""), {"field_id": field_id, "value": value, "user_id": actor_user_id})
        if result.rowcount != 1:
            raise HTTPException(404, "Extraction field not found.")
        self.db.commit()

    def commit(self, context: UploadContext, actor_user_id: str, actor_role: str, justification: str) -> int:
        errors, _ = self.validate(context)
        if errors:
            raise HTTPException(422, {"message": "Validation failed", "errors": [error.model_dump() for error in errors]})
        count = 0
        try:
            for file in context.files:
                if not file.get("course_offering_id"):
                    raise HTTPException(422, "course_offering_id is required to commit marks.")
                allowed = self.db.execute(text("""
                    SELECT 1 FROM identity.user_role ur JOIN identity.role r ON r.role_id = ur.role_id
                    WHERE ur.user_id = :user_id AND r.code = :role AND ur.valid_from <= current_date
                      AND (ur.valid_to IS NULL OR ur.valid_to >= current_date)
                      AND ((:role = 'FACULTY' AND ur.scope_type = 'COURSE_OFFERING' AND ur.scope_id = :offering)
                        OR (:role = 'HOD' AND ur.scope_type = 'DEPARTMENT' AND ur.scope_id = (SELECT department_id FROM academics.course_offering WHERE course_offering_id = :offering)))
                """), {"user_id": actor_user_id, "role": actor_role, "offering": file["course_offering_id"]}).scalar_one_or_none()
                if not allowed:
                    raise HTTPException(403, "You are not authorized for this course offering.")
                for row_no, row in self._field_payload(file["extraction_job_id"]).items():
                    student = self.db.execute(text("SELECT student_id FROM people.student WHERE roll_no = :roll"), {"roll": row["student_roll_no"]}).scalar_one_or_none()
                    components = {key: float(value) for key, value in row.items() if key not in {"student_roll_no", "student_name", "total_marks", "absent_flag"} and value != ""}
                    computed = float(row.get("total_marks") or sum(components.values()))
                    existing = self.db.execute(text("SELECT internal_mark_id, components, computed_marks FROM assessment.internal_mark WHERE course_offering_id = :offering AND student_id = :student"), {"offering": file["course_offering_id"], "student": student}).mappings().first()
                    self.db.execute(text("""
                        INSERT INTO assessment.internal_mark(course_offering_id, student_id, components, formula_version, computed_marks, max_marks, is_provisional)
                        VALUES (:offering, :student, CAST(:components AS jsonb), :formula, :computed, :max_marks, true)
                        ON CONFLICT (course_offering_id, student_id) DO UPDATE SET components = EXCLUDED.components, formula_version = EXCLUDED.formula_version, computed_marks = EXCLUDED.computed_marks, max_marks = EXCLUDED.max_marks, is_provisional = true
                    """), {"offering": file["course_offering_id"], "student": student, "components": json.dumps(components), "formula": file["formula_version"], "computed": computed, "max_marks": file["max_marks"]})
                    self.db.execute(text("""
                        INSERT INTO identity.audit_log(actor_user_id, actor_role, action, object_schema, object_table, subject_person_id, before_value, after_value, justification)
                        SELECT :actor, :role, :action, 'assessment', 'internal_mark', p.person_id, CAST(:before AS jsonb), CAST(:after AS jsonb), :justification
                        FROM people.student s JOIN people.person p ON p.person_id = s.person_id WHERE s.student_id = :student
                    """), {"actor": actor_user_id, "role": actor_role, "action": "UPDATE" if existing else "CREATE", "student": student, "before": json.dumps(dict(existing) if existing else {}), "after": json.dumps({"upload_id": context.upload_id, "computed_marks": computed}), "justification": justification})
                    count += 1
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise
        for cache in (dashboard_cache, course_perf_cache, dept_perf_cache, exceptions_cache, priorities_cache, recommendations_cache, sections_cache, summary_cache, trends_cache):
            cache.cache.clear()
        return count


_UPLOADS: Dict[str, UploadContext] = {}

def get_upload(upload_id: str) -> UploadContext:
    context = _UPLOADS.get(upload_id)
    if not context:
        raise HTTPException(404, "Upload not found.")
    return context

def delete_upload(db: Session, upload_id: str) -> None:
    context = get_upload(upload_id)
    try:
        for file in context.files:
            db.execute(text("DELETE FROM knowledge.document WHERE document_id = (SELECT document_id FROM knowledge.extraction_job WHERE extraction_job_id = :job_id)"), {"job_id": file["extraction_job_id"]})
        db.commit()
    except Exception:
        db.rollback()
        raise
    _UPLOADS.pop(upload_id, None)
