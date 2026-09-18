from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from pydantic import BaseModel, Field
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
    full_name: Optional[str] = Field(None, description="Full name of the student")
    roll_no: Optional[str] = Field(None, description="Roll number")
    section_code: Optional[str] = Field(None, description="Section code")
    attendance_pct: Optional[float] = Field(None, ge=0.0, le=100.0, description="Attendance must be between 0 and 100")
    cgpa: Optional[float] = Field(None, ge=0.0, le=10.0, description="CGPA must be between 0.0 and 10.0")
    backlog_count: Optional[int] = Field(None, ge=0, description="Number of active backlogs")

class StudentDataResponse(BaseModel):
    student_id: str
    roll_no: str
    full_name: str
    section_code: str
    attendance_pct: float
    cgpa: float
    backlog_count: int = 0

class SectionCreate(BaseModel):
    section_code: str

@router.post("/sections", response_model=str)
def create_section(data: SectionCreate, department: str = Depends(get_rbac_department), db: Session = Depends(get_db)):
    """Create a new section dynamically."""
    try:
        import uuid
        section_code = data.section_code.strip()
        
        # 1. Find an active batch
        batch_res = db.execute(text("SELECT batch_id FROM curriculum.batch WHERE status = 'ACTIVE' LIMIT 1")).fetchone()
        if not batch_res:
            raise HTTPException(status_code=404, detail="No active batch found")
            
        sec_id = str(uuid.uuid4())
        
        # 2. Insert into curriculum.section (ignore if code already exists for this batch)
        # Using ON CONFLICT DO NOTHING implies a unique constraint. If none, we just check first.
        existing = db.execute(text("SELECT section_id FROM curriculum.section WHERE code = :code"), {"code": section_code}).fetchone()
        if existing:
            sec_id = existing[0]
        else:
            db.execute(text("""
                INSERT INTO curriculum.section (section_id, batch_id, code, year_of_study, strength, is_active)
                VALUES (:id, :bid, :code, 1, 60, true)
            """), {"id": sec_id, "bid": batch_res[0], "code": section_code})
            
        # 3. Find an existing course offering to mimic (so it appears in v_offering_roster)
        offering_res = None
        if department:
            offering_res = db.execute(text("""
                SELECT co.course_version_id, co.term_id, co.department_id
                FROM academics.course_offering co
                JOIN core.department d ON d.department_id = co.department_id
                WHERE d.code = :dept
                LIMIT 1
            """), {"dept": department}).fetchone()
            
        if not offering_res:
            offering_res = db.execute(text("SELECT course_version_id, term_id, department_id FROM academics.course_offering LIMIT 1")).fetchone()
            
        if offering_res:
            off_id = str(uuid.uuid4())
            db.execute(text("""
                INSERT INTO academics.course_offering 
                (course_offering_id, course_version_id, term_id, section_id, department_id, enrolled_count, delivery_mode, status)
                VALUES (:id, :cv, :term, :sec, :dept, 0, 'OFFLINE', 'ACTIVE')
            """), {
                "id": off_id, 
                "cv": offering_res[0], 
                "term": offering_res[1], 
                "sec": sec_id, 
                "dept": offering_res[2]
            })
            
        db.commit()
        return section_code
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating section: {e}")
        raise HTTPException(status_code=500, detail="Failed to create section")

@router.get("/sections", response_model=List[str])
def get_sections_for_crud(department: str = Depends(get_rbac_department), db: Session = Depends(get_db)):
    """Fetch distinct sections for the RBAC-filtered department."""
    try:
        # Union the actual active sections and the ones in the roster
        query = """
            SELECT DISTINCT section_code FROM academics.v_offering_roster WHERE section_code IS NOT NULL
        """
        params = {}
        if department:
            query += " AND department_code = :dept"
            params["dept"] = department
            
        query += """
            UNION
            SELECT DISTINCT code FROM curriculum.section WHERE is_active = true
        """
        
        result = db.execute(text(query), params).fetchall()
        return sorted([r[0] for r in result if r[0]])
    except Exception as e:
        logger.error(f"Error fetching sections for CRUD: {e}")
        raise HTTPException(status_code=500, detail="Database query failed")


@router.get("/students/{section_code}", response_model=List[StudentDataResponse])
def get_students_by_section(section_code: str, department: str = Depends(get_rbac_department), db: Session = Depends(get_db)):
    """Fetch students for a given section."""
    try:
        # Enforce RBAC securely by verifying the section belongs to their department
        if department:
            verify_q = "SELECT 1 FROM academics.v_offering_roster WHERE section_code = :section AND department_code = :dept"
            is_valid = db.execute(text(verify_q), {"section": section_code, "dept": department}).fetchone()
            if not is_valid:
                raise HTTPException(status_code=403, detail="Unauthorized to view this section")

        query = """
            SELECT student_id, roll_no, full_name, section_code, attendance_pct, cgpa, backlog_count
            FROM people.v_student_profile 
            WHERE section_code = :section
        """
        params = {"section": section_code}
        
        if department:
            query += " AND department_code = :dept"
            params["dept"] = department
        
        query += " ORDER BY roll_no ASC"
            
        result = db.execute(text(query), params).fetchall()
        return [
            StudentDataResponse(
                student_id=str(r[0]),
                roll_no=str(r[1]),
                full_name=str(r[2]),
                section_code=str(r[3]),
                attendance_pct=float(r[4] or 0.0),
                cgpa=float(r[5] or 0.0),
                backlog_count=int(r[6] or 0)
            ) for r in result
        ]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching students: {e}")
        raise HTTPException(status_code=500, detail="Database query failed")

@router.put("/students/{student_id}")
def update_student_data(student_id: str, data: StudentDataUpdate, department: str = Depends(get_rbac_department), db: Session = Depends(get_db)):
    """Update student attendance, marks, details via override columns."""
    try:
        # Check RBAC first
        if department:
            # Secure check: ensure student's section belongs to the department's course
            check_q = """
                SELECT 1 
                FROM people.v_student_profile p
                JOIN academics.v_offering_roster c ON c.section_code = p.section_code
                WHERE p.student_id = :sid AND c.department_code = :dept
            """
            res = db.execute(text(check_q), {"sid": student_id, "dept": department}).fetchone()
            if not res:
                raise HTTPException(status_code=403, detail="Unauthorized to modify this student")

        fields = []
        params = {"sid": student_id}
        
        if data.attendance_pct is not None:
            fields.append("demo_attendance_override = :att")
            params["att"] = data.attendance_pct
            
        if data.cgpa is not None:
            fields.append("demo_marks_override = :cgpa")
            params["cgpa"] = data.cgpa
            
        if data.backlog_count is not None:
            fields.append("backlog_count = :bc")
            params["bc"] = data.backlog_count
            
        if data.roll_no is not None:
            fields.append("roll_no = :roll")
            params["roll"] = data.roll_no

        if data.section_code is not None:
            section_row = db.execute(text("""
                SELECT section_id FROM academics.course_offering 
                WHERE section_id IN (
                    SELECT id FROM academics.v_offering_roster WHERE section_code = :code
                ) LIMIT 1
            """), {"code": data.section_code}).fetchone()
            
            if section_row:
                fields.append("current_section_id = :sec")
                params["sec"] = section_row[0]
            
        if fields:
            q = f"UPDATE people.student SET {', '.join(fields)} WHERE student_id = :sid"
            db.execute(text(q), params)
            
        if data.full_name is not None:
            parts = data.full_name.split(" ", 1)
            fname = parts[0]
            lname = parts[1] if len(parts) > 1 else ""
            db.execute(text("""
                UPDATE people.person 
                SET first_name = :fname, last_name = :lname 
                WHERE person_id = (SELECT person_id FROM people.student WHERE student_id = :sid)
            """), {"sid": student_id, "fname": fname, "lname": lname})
            
        db.commit()
        return {"success": True, "message": "Updated student data successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating student {student_id}: {e}")
        raise HTTPException(status_code=500, detail="Database update failed")
