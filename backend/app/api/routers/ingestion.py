from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.ingestion.agent10_pipeline import parse_csv, parse_xlsx, process_records

router = APIRouter()
logger = logging.getLogger(__name__)

INGESTION_ROLES = {"Chairman", "Principal", "IQAC", "Dean", "HOD", "Faculty"}


def require_ingestion_actor(
    x_user_role: str | None = Header(default=None),
    x_user_name: str | None = Header(default=None),
) -> tuple[str, str]:
    """Match the existing application auth headers and reject anonymous writes."""
    if x_user_role not in INGESTION_ROLES:
        raise HTTPException(status_code=401, detail="Authenticated institutional role is required for ingestion")
    if not x_user_name or not x_user_name.strip():
        raise HTTPException(status_code=401, detail="Authenticated user name is required for ingestion")
    return x_user_role, x_user_name.strip()


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    document_type: str = Form(...),
    actor: tuple[str, str] = Depends(require_ingestion_actor),
    db: Session = Depends(get_db),
):
    """Parse, normalize, validate, and persist a CSV/XLSX Agent 10 upload."""
    filename = file.filename or "upload"
    suffix = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
    if suffix not in {"csv", "xlsx", "pdf"}:
        raise HTTPException(status_code=415, detail="Only CSV, XLSX, and PDF academic data files are supported")

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File is too large. Maximum is 10MB")

    try:
        required_aliases = {"rollno", "attendance", "cgpa", "backlogs"} if document_type == "attendance" else None
        
        if suffix == "csv":
            records = parse_csv(content, required_aliases=required_aliases)
        elif suffix == "xlsx":
            records = parse_xlsx(content)
        elif suffix == "pdf":
            from app.ingestion.agent10_pipeline import parse_pdf
            records = parse_pdf(content, required_aliases=required_aliases)
        else:
            records = []
        if not records:
            raise HTTPException(status_code=422, detail="The uploaded file contains no data rows")
        result = process_records(db, records, source=actor[0], source_type=document_type, file_ref=filename)
        response = result.model_dump()
        response["success"] = result.status != "failed"
        response["processing_status"] = result.status
        response["file_info"] = {
            "name": filename,
            "size_kb": round(len(content) / 1024, 1),
            "type": document_type,
            "rows_detected": result.received,
            "rows_valid": result.accepted,
            "rows_rejected": result.rejected,
        }
        if document_type == "attendance":
            response["status"] = "QUEUED"
        return response
    except HTTPException:
        raise
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        db.rollback()
        logger.exception("Agent 10 upload failed for %s", filename)
        raise HTTPException(status_code=500, detail="Agent 10 ingestion failed before persistence") from exc
