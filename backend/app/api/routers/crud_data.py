from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from pydantic import BaseModel
import logging

from app.db.session import get_db

router = APIRouter()
logger = logging.getLogger(__name__)

def get_rbac_department(
    department: str = None, 
    x_user_role: str = Header(None), 
    x_user_department: str = Header(None)
) -> str | None:
    if x_user_role in ["Faculty", "HOD"] and x_user_department:
        return x_user_department
    return department

class StudentDataUpdate(BaseModel):
    attendance_pct: Optional[float] = None
    cgpa: Optional[float] = None

class StudentDataResponse(BaseModel):
    student_id: str
    roll_no: str
    full_name: str
    section_code: str
    attendance_pct: float
    cgpa: float

@router.get("/sections", response_model=List[str])
def get_sections_for_crud(department: str = Depends(get_rbac_department), db: Session = Depends(get_db)):
    """Fetch distinct sections for the RBAC-filtered department."""
    try:
        query = "SELECT DISTINCT section FROM analytics.v_course_performance WHERE 1=1 AND section IS NOT NULL"
        params = {}
        if department:
            query += " AND department = :dept"
            params["dept"] = department
        
        result = db.execute(text(query), params).fetchall()
        return [r[0] for r in result if r[0]]
    except Exception as e:
        logger.error(f"Error fetching sections for CRUD: {e}")
        raise HTTPException(status_code=500, detail="Database query failed")

@router.get("/students/{section_code}", response_model=List[StudentDataResponse])
def get_students_by_section(section_code: str, department: str = Depends(get_rbac_department), db: Session = Depends(get_db)):
    """Fetch students for a given section."""
    try:
        # Enforce RBAC securely by verifying the section belongs to their department
        if department:
            verify_q = "SELECT 1 FROM analytics.v_course_performance WHERE section = :section AND department = :dept"
            is_valid = db.execute(text(verify_q), {"section": section_code, "dept": department}).fetchone()
            if not is_valid:
                raise HTTPException(status_code=403, detail="Unauthorized to view this section")

        query = """
            SELECT student_id, roll_no, full_name, section_code, attendance_pct, cgpa 
            FROM people.v_student_profile 
            WHERE section_code = :section
        """
        params = {"section": section_code}
        
        query += " ORDER BY roll_no ASC"
            
        result = db.execute(text(query), params).fetchall()
        return [
            StudentDataResponse(
                student_id=str(r[0]),
                roll_no=str(r[1]),
                full_name=str(r[2]),
                section_code=str(r[3]),
                attendance_pct=float(r[4] or 0.0),
                cgpa=float(r[5] or 0.0)
            ) for r in result
        ]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching students: {e}")
        raise HTTPException(status_code=500, detail="Database query failed")

@router.put("/students/{student_id}")
def update_student_data(student_id: str, data: StudentDataUpdate, department: str = Depends(get_rbac_department), db: Session = Depends(get_db)):
    """Update student attendance or marks via override columns."""
    try:
        # Check RBAC first
        if department:
            # Secure check: ensure student's section belongs to the department's course
            check_q = """
                SELECT 1 
                FROM people.v_student_profile p
                JOIN analytics.v_course_performance c ON c.section = p.section_code
                WHERE p.student_id = :sid AND c.department = :dept
            """
            res = db.execute(text(check_q), {"sid": student_id, "dept": department}).fetchone()
            if not res:
                raise HTTPException(status_code=403, detail="Unauthorized to modify this student")

        # Update the base table people.student
        update_q = "UPDATE people.student SET "
        updates = []
        params = {"sid": student_id}
        
        if data.attendance_pct is not None:
            updates.append("demo_attendance_override = :att")
            params["att"] = data.attendance_pct
        if data.cgpa is not None:
            updates.append("demo_marks_override = :cgpa")
            params["cgpa"] = data.cgpa
            
        if not updates:
            return {"status": "no_change"}
            
        update_q += ", ".join(updates) + " WHERE student_id = :sid"
        db.execute(text(update_q), params)
        db.commit()
        return {"status": "success"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating student {student_id}: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Database update failed")
