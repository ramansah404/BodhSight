from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ValidationError(BaseModel):
    code: str
    message: str
    row_no: Optional[int] = None
    field_name: Optional[str] = None
    severity: str = "ERROR"


class ExtractionField(BaseModel):
    field_id: str
    field_name: str
    raw_value: Optional[str] = None
    normalised_value: Optional[str] = None
    confidence: float = 1.0
    page_no: Optional[int] = None
    verification_status: str = "AUTO"
    corrected_value: Optional[str] = None


class UploadFileResult(BaseModel):
    file_id: str
    filename: str
    document_id: str
    extraction_job_id: str
    status: str
    content_hash: str
    errors: List[ValidationError] = Field(default_factory=list)


class UploadResponse(BaseModel):
    upload_id: str
    status: str
    files: List[UploadFileResult]


class UploadStatusResponse(BaseModel):
    upload_id: str
    status: str
    files: List[UploadFileResult]
    errors: List[ValidationError] = Field(default_factory=list)


class ExtractionResponse(BaseModel):
    upload_id: str
    extraction_job_id: str
    status: str
    fields: List[ExtractionField]
    errors: List[ValidationError] = Field(default_factory=list)


class FieldPatchRequest(BaseModel):
    value: Optional[str] = None


class ValidationPreviewResponse(BaseModel):
    upload_id: str
    valid: bool
    errors: List[ValidationError] = Field(default_factory=list)
    row_count: int = 0


class CommitRequest(BaseModel):
    justification: str = "Internal marks ingestion"


class CommitResponse(BaseModel):
    upload_id: str
    status: str
    committed_count: int
    audit_count: int
    errors: List[ValidationError] = Field(default_factory=list)
