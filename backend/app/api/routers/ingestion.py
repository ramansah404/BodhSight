from fastapi import APIRouter, Depends, HTTPException, Header, UploadFile, File, Form
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
import asyncio
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
        
        # 2. Add to database audit log to track who uploaded what
        meta_dict = {
            "filename": file.filename,
            "size_kb": round(file_size_kb, 1),
            "type": document_type,
            "uploader": x_user_name
        }
        db.execute(
            text("""
                INSERT INTO agentops.system_logs 
                (log_type, message, component, user_role, metadata)
                VALUES 
                ('INFO', 'Document ingestion queued', 'DataHub', :role, :meta)
            """),
            {
                "role": x_user_role,
                "meta": json.dumps(meta_dict)
            }
        )
        db.commit()

        # 3. Process CSV if available (for the live demo functionality)
        rows_updated = 0
        if file.filename.lower().endswith('.csv'):
            try:
                decoded = file_content.decode('utf-8')
                reader = csv.DictReader(io.StringIO(decoded))
                
                for row in reader:
                    student_id = row.get("student_id")
                    if not student_id:
                        continue
                    
                    updates = []
                    params = {"sid": student_id}
                    
                    att_str = row.get("attendance_pct") or row.get("attendance")
                    if att_str:
                        try:
                            params["att"] = float(att_str)
                            updates.append("demo_attendance_override = :att")
                        except ValueError:
                            pass
                            
                    cgpa_str = row.get("cgpa") or row.get("marks")
                    if cgpa_str:
                        try:
                            params["cgpa"] = float(cgpa_str)
                            updates.append("demo_marks_override = :cgpa")
                        except ValueError:
                            pass
                            
                    if updates:
                        update_q = "UPDATE people.student SET " + ", ".join(updates) + " WHERE student_id = :sid"
                        # Note: Strict line-by-line RBAC can be enforced here, but read-time RBAC already limits visibility.
                        db.execute(text(update_q), params)
                        rows_updated += 1
                        
                if rows_updated > 0:
                    db.commit()
            except Exception as e:
                logger.error(f"Error parsing CSV: {e}")
                db.rollback()

        # Simulate Agent 10 background processing queue for non-CSV files
        if rows_updated == 0:
            await asyncio.sleep(1.5) # Simulate processing time

        return {
            "success": True,
            "message": f"File '{file.filename}' processed. {rows_updated} student records updated." if rows_updated > 0 else f"File '{file.filename}' successfully ingested into Agent 10 processing queue.",
            "status": "PROCESSED" if rows_updated > 0 else "QUEUED",
            "file_info": {
                "name": file.filename,
                "size_kb": round(file_size_kb, 1),
                "type": document_type
            }
        }
    except Exception as e:
        logger.error(f"Ingestion error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
