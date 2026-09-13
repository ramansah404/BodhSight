from __future__ import annotations

from typing import List, Optional
from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, UploadFile
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.ingestion import CommitRequest, CommitResponse, ExtractionField, ExtractionResponse, FieldPatchRequest, UploadFileResult, UploadResponse, UploadStatusResponse, ValidationPreviewResponse
from app.services.ingestion_service import IngestionService, delete_upload, get_upload

router = APIRouter()


def require_upload_role(x_user_role: Optional[str] = Header(default=None)) -> str:
    role = (x_user_role or "").strip().upper()
    if role not in {"FACULTY", "HOD"}:
        raise HTTPException(403, "Only Faculty and HOD users may perform ingestion writes.")
    return role


def require_actor(x_user_id: Optional[str] = Header(default=None)) -> str:
    if not x_user_id:
        raise HTTPException(401, "X-User-Id is required for ingestion writes.")
    return x_user_id


def _file_result(file: dict) -> UploadFileResult:
    return UploadFileResult(**{key: file[key] for key in ("file_id", "filename", "document_id", "extraction_job_id", "status", "content_hash")})


@router.post("/upload", response_model=UploadResponse, status_code=201)
async def upload_files(files: List[UploadFile] = File(...), course_offering_id: Optional[str] = Form(default=None), max_marks: float = Form(default=50), formula_version: str = Form(default="phase2-v1"), db: Session = Depends(get_db), _role: str = Depends(require_upload_role), actor_id: str = Depends(require_actor)):
    payload = []
    for upload in files:
        payload.append((upload.filename or "", upload.content_type, await upload.read()))
    context = IngestionService(db).create_upload(payload, course_offering_id, max_marks, formula_version, actor_id)
    status = "NEEDS_REVIEW" if any(file["status"] == "NEEDS_REVIEW" for file in context.files) else "COMPLETED"
    return UploadResponse(upload_id=context.upload_id, status=status, files=[_file_result(file) for file in context.files])


@router.get("/{upload_id}/status", response_model=UploadStatusResponse)
def upload_status(upload_id: str, db: Session = Depends(get_db)):
    context = get_upload(upload_id)
    errors, _ = IngestionService(db).validate(context)
    status = "NEEDS_REVIEW" if errors or any(file["status"] == "NEEDS_REVIEW" for file in context.files) else "COMPLETED"
    return UploadStatusResponse(upload_id=upload_id, status=status, files=[_file_result(file) for file in context.files], errors=errors)


@router.get("/{upload_id}/extraction", response_model=ExtractionResponse)
def extraction(upload_id: str, db: Session = Depends(get_db)):
    context = get_upload(upload_id)
    file = context.files[0]
    service = IngestionService(db)
    return ExtractionResponse(upload_id=upload_id, extraction_job_id=file["extraction_job_id"], status=file["status"], fields=[ExtractionField(field_id=str(field["extracted_field_id"]), field_name=field["field_name"], raw_value=field["raw_value"], normalised_value=field["normalised_value"], confidence=float(field["confidence"]), page_no=field["page_no"], verification_status=field["verification_status"], corrected_value=field["corrected_value"]) for field in service._field_rows(file["extraction_job_id"])])


@router.patch("/{upload_id}/fields/{field_id}", response_model=ExtractionField)
def patch_extraction_field(upload_id: str, field_id: str, request: FieldPatchRequest, db: Session = Depends(get_db), _role: str = Depends(require_upload_role), actor_id: str = Depends(require_actor)):
    context = get_upload(upload_id)
    if not any(db.execute(text("SELECT 1 FROM knowledge.extracted_field WHERE extracted_field_id = :field_id AND extraction_job_id = :job_id"), {"field_id": field_id, "job_id": file["extraction_job_id"]}).scalar_one_or_none() for file in context.files):
        raise HTTPException(404, "Extraction field not found for this upload.")
    IngestionService(db).patch_field(field_id, request.value, actor_id)
    field = db.execute(text("SELECT extracted_field_id, field_name, raw_value, normalised_value, confidence, page_no, verification_status, corrected_value FROM knowledge.extracted_field WHERE extracted_field_id = :field_id"), {"field_id": field_id}).mappings().one()
    return ExtractionField(field_id=str(field["extracted_field_id"]), field_name=field["field_name"], raw_value=field["raw_value"], normalised_value=field["normalised_value"], confidence=float(field["confidence"]), page_no=field["page_no"], verification_status=field["verification_status"], corrected_value=field["corrected_value"])


@router.post("/{upload_id}/validate-and-preview", response_model=ValidationPreviewResponse)
def validate_preview(upload_id: str, db: Session = Depends(get_db), _role: str = Depends(require_upload_role)):
    context = get_upload(upload_id)
    errors, row_count = IngestionService(db).validate(context)
    return ValidationPreviewResponse(upload_id=upload_id, valid=not errors, errors=errors, row_count=row_count)


@router.post("/{upload_id}/commit", response_model=CommitResponse)
def commit_upload(upload_id: str, request: CommitRequest, db: Session = Depends(get_db), role: str = Depends(require_upload_role), actor_id: str = Depends(require_actor)):
    context = get_upload(upload_id)
    count = IngestionService(db).commit(context, actor_id, role, request.justification)
    return CommitResponse(upload_id=upload_id, status="COMMITTED", committed_count=count, audit_count=count)


@router.delete("/{upload_id}", status_code=204)
def remove_upload(upload_id: str, db: Session = Depends(get_db), _role: str = Depends(require_upload_role), _actor_id: str = Depends(require_actor)):
    delete_upload(db, upload_id)
