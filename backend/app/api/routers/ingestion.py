from fastapi import APIRouter, Depends, HTTPException, Header, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import text
import logging
import csv
import io
import json

from app.db.session import get_db

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    document_type: str = Form(...),
    x_user_role: str = Header(None),
    x_user_department: str = Header(None),
    x_user_name: str = Header(None),
    db: Session = Depends(get_db)
):
    """
    Handle document uploads for Agent 10 ingestion.
    Simulates asynchronous AI extraction and validation of unstructured data.
    """
    if x_user_role not in ["Chairman", "Principal", "Dean", "HOD", "Faculty"]:
        raise HTTPException(status_code=403, detail="Unauthorized to upload documents.")
        
    try:
        # 1. Simulate reading file (in a real app, save to S3 or process via pandas/PyMuPDF)
        file_content = await file.read()
        file_size_kb = len(file_content) / 1024
        
        # Keep the ingestion audit in application logs. The official schema in
        # this checkout has no agentops.system_logs table.
        meta_dict = {
            "filename": file.filename,
            "size_kb": round(file_size_kb, 1),
            "type": document_type,
            "uploader": x_user_name
        }
        logger.info("Document ingestion queued: %s", json.dumps(meta_dict))

        # 3. Validate CSV rows when present. Operational writes are not
        # exposed by the current schema, so valid files remain queued rather
        # than being reported as committed database updates.
        rows_detected = 0
        rows_valid = 0
        errors = []
        seen_roll_nos = set()
        
        if file.filename.lower().endswith('.csv'):
            try:
                decoded = file_content.decode("utf-8-sig")
                reader = csv.DictReader(io.StringIO(decoded))
                required = {"Roll No", "Attendance", "CGPA", "Backlogs"}
                headers = set(reader.fieldnames or [])
                if not required.issubset(headers):
                    missing = ", ".join(sorted(required - headers))
                    raise HTTPException(status_code=400, detail=f"CSV is missing required columns: {missing}")

                for i, row in enumerate(reader, start=2):
                    rows_detected += 1
                    roll_no = (row.get("Roll No") or "").strip()
                    if not roll_no:
                        errors.append(f"Row {i}: Roll No is empty")
                        continue
                    
                    if roll_no in seen_roll_nos:
                        errors.append(f"Row {i}: Duplicate Roll No '{roll_no}' found in CSV")
                        continue
                    seen_roll_nos.add(roll_no)
                        
                    try:
                        attendance = float(row.get("Attendance") or "")
                        cgpa = float(row.get("CGPA") or "")
                        backlogs = int(float(row.get("Backlogs") or ""))
                        
                        if attendance < 0 or attendance > 100:
                            errors.append(f"Row {i}: Attendance must be between 0 and 100")
                        if cgpa < 0 or cgpa > 10:
                            errors.append(f"Row {i}: CGPA must be between 0 and 10")
                        if backlogs < 0:
                            errors.append(f"Row {i}: Backlogs cannot be negative")
                            
                    except (TypeError, ValueError):
                        errors.append(f"Row {i}: Invalid numeric values")
                        continue
                        
                if errors:
                    # Return a 400 with the exact errors
                    raise HTTPException(status_code=400, detail=f"Validation failed for {len(errors)} rows. Errors: " + " | ".join(errors[:5]) + ("..." if len(errors) > 5 else ""))
                    
                rows_valid = rows_detected
            except UnicodeDecodeError as exc:
                raise HTTPException(status_code=400, detail="CSV must be UTF-8 encoded.") from exc

        response_payload = {
            "success": True,
            "message": f"File '{file.filename}' validated and queued for Agent 10 processing. {rows_valid} valid rows detected." if file.filename.lower().endswith('.csv') else f"File '{file.filename}' successfully ingested into Agent 10 processing queue.",
            "status": "QUEUED",
            "file_info": {
                "name": file.filename,
                "size_kb": round(file_size_kb, 1),
                "type": document_type,
                "rows_detected": rows_detected,
                "rows_valid": rows_valid,
                "rows_rejected": rows_rejected,
            }
        }
        
        # Simulate real-time notification to the uploader
        if x_user_name:
            from app.services.notification import send_whatsapp_otp
            import asyncio
            # Dummy phone number since we don't have the user's phone here, but in a real app we'd fetch it
            # We'll just print it using the OTP service to simulate a real-time alert
            asyncio.create_task(send_whatsapp_otp(
                to_number="+1234567890", 
                otp=f"Agent 10 has successfully ingested your file '{file.filename}'. {rows_valid} rows were processed."
            ))

        return response_payload
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ingestion error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
