from __future__ import annotations

import csv
import io
import math
import os
import re
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

import pandas as pd


class FileParseError(ValueError):
    pass


@dataclass
class ParsedTable:
    headers: List[str]
    rows: List[Dict[str, Any]]
    source_type: str
    page_count: Optional[int] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls", ".pdf"}
MIME_BY_EXTENSION = {
    ".csv": {"text/csv", "application/csv", "application/vnd.ms-excel", "text/plain"},
    ".xlsx": {"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/zip"},
    ".xls": {"application/vnd.ms-excel", "application/octet-stream"},
    ".pdf": {"application/pdf", "application/octet-stream"},
}


def _extension(filename: str) -> str:
    return os.path.splitext(filename or "")[1].lower()


def _content_is_valid(extension: str, content: bytes) -> bool:
    if extension == ".pdf":
        return content.startswith(b"%PDF-")
    if extension == ".xlsx":
        return content.startswith(b"PK\x03\x04")
    if extension == ".xls":
        return content.startswith(bytes.fromhex("D0CF11E0A1B11AE1"))
    return bool(content.strip())


def validate_upload(filename: str, content_type: Optional[str], content: bytes, max_bytes: int = 10 * 1024 * 1024) -> str:
    extension = _extension(filename)
    if extension not in ALLOWED_EXTENSIONS:
        raise FileParseError("Unsupported file extension. Use CSV, XLSX, XLS, or PDF.")
    if len(content) == 0:
        raise FileParseError("The file is empty.")
    if len(content) > max_bytes:
        raise FileParseError("The file exceeds the 10 MB limit.")
    if content_type and content_type.lower() not in MIME_BY_EXTENSION[extension]:
        raise FileParseError("The declared MIME type does not match the file extension.")
    if not _content_is_valid(extension, content):
        raise FileParseError("The file content does not match its declared format.")
    return extension


def _text(value: Any) -> str:
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return ""
    return str(value).strip()


def _safe_header(value: Any, index: int) -> str:
    header = re.sub(r"[^a-z0-9]+", "_", _text(value).lower()).strip("_")
    return header or f"column_{index + 1}"


def _read_spreadsheet(extension: str, content: bytes) -> ParsedTable:
    try:
        frame = pd.read_excel(io.BytesIO(content), sheet_name=0, dtype=object, engine=None)
    except Exception as exc:
        raise FileParseError("The spreadsheet could not be parsed.") from exc
    if frame.empty and len(frame.columns) == 0:
        raise FileParseError("The spreadsheet has no header or data rows.")
    headers = [_safe_header(value, index) for index, value in enumerate(frame.columns)]
    rows = [{headers[index]: _text(value) for index, value in enumerate(row)} for row in frame.itertuples(index=False, name=None)]
    rows = [row for row in rows if any(value != "" for value in row.values())]
    if not rows:
        raise FileParseError("The spreadsheet has no data rows.")
    return ParsedTable(headers=headers, rows=rows, source_type=extension[1:].upper())


def _read_csv(content: bytes) -> ParsedTable:
    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise FileParseError("CSV must be UTF-8 encoded.") from exc
    try:
        records = list(csv.reader(io.StringIO(text)))
    except csv.Error as exc:
        raise FileParseError("The CSV is malformed.") from exc
    if not records:
        raise FileParseError("The CSV has no rows.")
    headers = [_safe_header(value, index) for index, value in enumerate(records[0])]
    rows = [{headers[index]: _text(value) for index, value in enumerate(row)} for row in records[1:]]
    rows = [row for row in rows if any(value != "" for value in row.values())]
    if not rows:
        raise FileParseError("The CSV has no data rows.")
    return ParsedTable(headers=headers, rows=rows, source_type="CSV")


def _read_pdf(content: bytes) -> ParsedTable:
    try:
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(content))
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
    except Exception as exc:
        raise FileParseError("The PDF could not be parsed.") from exc
    if not text.strip():
        raise FileParseError("The PDF contains no extractable text and requires review.")
    rows = []
    for line in text.splitlines():
        values = [part.strip() for part in re.split(r"\s{2,}|\t", line) if part.strip()]
        if len(values) >= 2:
            rows.append({f"column_{index + 1}": value for index, value in enumerate(values)})
    if not rows:
        raise FileParseError("The PDF contains no tabular text and requires review.")
    headers = sorted({key for row in rows for key in row}, key=lambda key: int(key.split("_")[-1]))
    return ParsedTable(headers=headers, rows=rows, source_type="PDF", page_count=len(reader.pages), metadata={"needs_review": True})


def parse_file(filename: str, content_type: Optional[str], content: bytes) -> ParsedTable:
    extension = validate_upload(filename, content_type, content)
    if extension == ".csv":
        return _read_csv(content)
    if extension in {".xlsx", ".xls"}:
        return _read_spreadsheet(extension, content)
    return _read_pdf(content)
