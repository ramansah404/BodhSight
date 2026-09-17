from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from pydantic import BaseModel, Field
import logging
import uuid
from datetime import datetime

from app.db.session import get_db
from app.api.routers.crud_data import get_rbac_department

router = APIRouter()
logger = logging.getLogger(__name__)

class StudentCreate(BaseModel):
    full_name: str
    roll_no: str
    section_code: str
    email: Optional[str] = None
    cgpa: Optional[float] = 0.0
    attendance_pct: Optional[float] = 0.0

class StudentUpdate(BaseModel):
    full_name: Optional[str] = None
    roll_no: Optional[str] = None
    section_code: Optional[str] = None
    email: Optional[str] = None
    cgpa: Optional[float] = None
    attendance_pct: Optional[float] = None

class StudentResponse(BaseModel):
    student_id: str
    full_name: str
    roll_no: str
    section_code: str
    email: Optional[str]
    cgpa: float
    attendance_pct: float

@router.post("/", response_model=StudentResponse)
def create_student(
    data: StudentCreate, 
    department: str = Depends(get_rbac_department), 
    db: Session = Depends(get_db)
):
    """Create a new student with RBAC validation."""
    try:
        if department:
            verify_q = "SELECT 1 FROM academics.v_offering_roster WHERE section_code = :section AND department_code = :dept"
            is_valid = db.execute(text(verify_q), {"section": data.section_code, "dept": department}).fetchone()
            if not is_valid:
                raise HTTPException(status_code=403, detail="Unauthorized to add student to this section")
        
        person_id = str(uuid.uuid4())
        student_id = str(uuid.uuid4())

        # First name / last name split
        parts = data.full_name.split(" ", 1)
        first_name = parts[0]
        last_name = parts[1] if len(parts) > 1 else ""

        # Insert Person
        db.execute(text("""
            INSERT INTO people.person (person_id, first_name, last_name, email, primary_role)
            VALUES (:pid, :fname, :lname, :email, 'Student')
            ON CONFLICT (person_id) DO NOTHING
        """), {"pid": person_id, "fname": first_name, "lname": last_name, "email": data.email})

        # To attach section, we need section_id
        # In a real app we query section_id. Here we assume we can find it via course_offering
        section_row = db.execute(text("""
            SELECT section_id FROM academics.course_offering 
            WHERE section_id IN (
                SELECT id FROM academics.v_offering_roster WHERE section_code = :code
            ) LIMIT 1
        """), {"code": data.section_code}).fetchone()
        
        section_id = section_row[0] if section_row else None

        db.execute(text("""
            INSERT INTO people.student 
            (student_id, person_id, roll_no, current_section_id, demo_marks_override, demo_attendance_override, status)
            VALUES (:sid, :pid, :roll, :sec, :cgpa, :att, 'Active')
        """), {
            "sid": student_id,
            "pid": person_id,
            "roll": data.roll_no,
            "sec": section_id,
            "cgpa": data.cgpa,
            "att": data.attendance_pct
        })
        db.commit()

        return StudentResponse(
            student_id=student_id,
            full_name=data.full_name,
            roll_no=data.roll_no,
            section_code=data.section_code,
            email=data.email,
            cgpa=data.cgpa or 0.0,
            attendance_pct=data.attendance_pct or 0.0
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating student: {e}")
        raise HTTPException(status_code=500, detail="Database insert failed")

@router.put("/{student_id}", response_model=StudentResponse)
def update_student(
    student_id: str, 
    data: StudentUpdate, 
    department: str = Depends(get_rbac_department), 
    db: Session = Depends(get_db)
):
    """Update a student record."""
    try:
        if department:
            check_q = """
                SELECT c.department_code 
                FROM people.v_student_profile p
                JOIN academics.v_offering_roster c ON c.section_code = p.section_code
                WHERE p.student_id = :sid
            """
            res = db.execute(text(check_q), {"sid": student_id}).fetchone()
            if not res or res[0] != department:
                raise HTTPException(status_code=403, detail="Unauthorized to modify this student")

        updates = []
        params = {"sid": student_id}
        
        if data.roll_no is not None:
            updates.append("roll_no = :roll")
            params["roll"] = data.roll_no
        if data.cgpa is not None:
            updates.append("demo_marks_override = :cgpa")
            params["cgpa"] = data.cgpa
        if data.attendance_pct is not None:
            updates.append("demo_attendance_override = :att")
            params["att"] = data.attendance_pct
            
        if updates:
            query = f"UPDATE people.student SET {', '.join(updates)} WHERE student_id = :sid"
            db.execute(text(query), params)
            
        # Update name if provided
        if data.full_name is not None:
            parts = data.full_name.split(" ", 1)
            params["fname"] = parts[0]
            params["lname"] = parts[1] if len(parts) > 1 else ""
            db.execute(text("""
                UPDATE people.person 
                SET first_name = :fname, last_name = :lname 
                WHERE person_id = (SELECT person_id FROM people.student WHERE student_id = :sid)
            """), params)
            
        db.commit()

        # Fetch updated record to return
        student_data = db.execute(text("""
            SELECT student_id, roll_no, full_name, section_code, attendance_pct, cgpa 
            FROM people.v_student_profile WHERE student_id = :sid
        """), {"sid": student_id}).fetchone()

        return StudentResponse(
            student_id=str(student_data[0]),
            roll_no=str(student_data[1]),
            full_name=str(student_data[2]),
            section_code=str(student_data[3]),
            email="",
            attendance_pct=float(student_data[4] or 0),
            cgpa=float(student_data[5] or 0)
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating student: {e}")
        raise HTTPException(status_code=500, detail="Database update failed")


@router.delete("/{student_id}")
def delete_student(
    student_id: str, 
    department: str = Depends(get_rbac_department), 
    db: Session = Depends(get_db)
):
    """Delete a student record."""
    try:
        if department:
            check_q = """
                SELECT c.department_code 
                FROM people.v_student_profile p
                JOIN academics.v_offering_roster c ON c.section_code = p.section_code
                WHERE p.student_id = :sid
            """
            res = db.execute(text(check_q), {"sid": student_id}).fetchone()
            if not res or res[0] != department:
                raise HTTPException(status_code=403, detail="Unauthorized to delete this student")

        # Get person_id to delete from person table
        p_res = db.execute(text("SELECT person_id FROM people.student WHERE student_id = :sid"), {"sid": student_id}).fetchone()
        
        db.execute(text("DELETE FROM people.student WHERE student_id = :sid"), {"sid": student_id})
        
        if p_res:
            db.execute(text("DELETE FROM people.person WHERE person_id = :pid"), {"pid": p_res[0]})

        db.commit()
        return {"success": True, "message": "Student deleted"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting student: {e}")
        raise HTTPException(status_code=500, detail="Database delete failed")
