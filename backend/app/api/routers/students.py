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
    backlog_count: Optional[int] = None
    reason: Optional[str] = None

class StudentMarksUpdate(BaseModel):
    demo_fa1: Optional[float] = None
    demo_cla1: Optional[float] = None
    demo_fa2: Optional[float] = None
    demo_cla2: Optional[float] = None
    demo_fa3: Optional[float] = None
    demo_cla3: Optional[float] = None
    demo_fa4: Optional[float] = None
    demo_cla4: Optional[float] = None
    demo_cla5: Optional[float] = None
    demo_penalty: Optional[float] = None
    demo_marks_config: Optional[dict] = None
    demo_internal_overall: Optional[float] = None
    demo_external: Optional[float] = None
    demo_external_overall: Optional[float] = None
    demo_total_overall: Optional[float] = None
    demo_attendance_override: Optional[float] = None
    demo_marks_override: Optional[float] = None

class StudentResponse(BaseModel):
    student_id: str
    full_name: str
    roll_no: str
    section_code: str
    email: Optional[str]
    cgpa: float
    attendance_pct: float

@router.get("/", response_model=List[StudentResponse])
def list_students(
    department: str = Depends(get_rbac_department),
    db: Session = Depends(get_db)
):
    """List students, filtered by department for Faculty/HOD."""
    try:
        if department:
            q = """
                SELECT DISTINCT sp.student_id, sp.roll_no, sp.full_name, sp.section_code,
                       NULL as email, COALESCE(sp.cgpa, 0), COALESCE(sp.attendance_pct, 0)
                FROM people.v_student_profile sp
                WHERE sp.section_code IN (
                    SELECT section_code FROM academics.v_offering_roster WHERE department_code = :dept
                )
                ORDER BY sp.full_name LIMIT 200
            """
            rows = db.execute(text(q), {"dept": department}).fetchall()
        else:
            q = """
                SELECT student_id, roll_no, full_name, section_code, NULL,
                       COALESCE(cgpa, 0), COALESCE(attendance_pct, 0)
                FROM people.v_student_profile
                ORDER BY full_name LIMIT 200
            """
            rows = db.execute(text(q)).fetchall()

        return [
            StudentResponse(
                student_id=str(r[0]), roll_no=str(r[1]), full_name=str(r[2]),
                section_code=str(r[3]), email=r[4],
                cgpa=float(r[5] or 0), attendance_pct=float(r[6] or 0)
            ) for r in rows
        ]
    except Exception as e:
        logger.error(f"Error listing students: {e}")
        raise HTTPException(status_code=500, detail="Failed to list students")

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

        update_fields = []
        params = {"sid": student_id}
        if data.full_name is not None:
            update_fields.append("full_name = :fn")
            params["fn"] = data.full_name
        if data.roll_no is not None:
            update_fields.append("roll_no = :roll")
            params["roll"] = data.roll_no
        if data.section_code is not None:
            update_fields.append("section_code = :sc")
            params["sc"] = data.section_code
        if data.attendance_pct is not None:
            update_fields.append("attendance_pct = :ap")
            params["ap"] = data.attendance_pct
        if data.cgpa is not None:
            update_fields.append("cgpa = :cg")
            params["cg"] = data.cgpa
        if data.backlog_count is not None:
            update_fields.append("backlog_count = :bc")
            params["bc"] = data.backlog_count
        if data.reason is not None:
            update_fields.append("reason = :r")
            params["r"] = data.reason
            
        if update_fields:
            query = f"UPDATE people.student SET {', '.join(update_fields)} WHERE student_id = :sid"
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
        
        # Cascade delete academic records referencing student_id
        db.execute(text("DELETE FROM academics.student_course_enrollment WHERE student_id = :sid"), {"sid": student_id})
        db.execute(text("DELETE FROM core.student_learning_evidence WHERE student_id = :sid"), {"sid": student_id})
        
        db.execute(text("DELETE FROM people.student WHERE student_id = :sid"), {"sid": student_id})
        
        if p_res:
            db.execute(text("DELETE FROM core.user_account WHERE person_id = :pid"), {"pid": p_res[0]})
            db.execute(text("DELETE FROM people.person WHERE person_id = :pid"), {"pid": p_res[0]})

        db.commit()
        return {"success": True, "message": "Student deleted"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting student: {e}")
        raise HTTPException(status_code=500, detail="Database delete failed")

@router.get("/{student_id}/marks")
def get_student_marks(
    student_id: str,
    department: str = Depends(get_rbac_department),
    db: Session = Depends(get_db)
):
    """Get a student's granular marks and limits."""
    try:
        # Auth check
        if department:
            check_q = "SELECT c.department_code FROM people.v_student_profile p JOIN academics.v_offering_roster c ON c.section_code = p.section_code WHERE p.student_id = :sid"
            res = db.execute(text(check_q), {"sid": student_id}).fetchone()
            if not res or res[0] != department:
                raise HTTPException(status_code=403, detail="Unauthorized")

        q = "SELECT demo_fa1, demo_cla1, demo_fa2, demo_cla2, demo_fa3, demo_cla3, demo_fa4, demo_cla4, demo_cla5, demo_penalty, demo_external, demo_marks_config, demo_internal_overall, demo_external_overall, demo_total_overall, demo_attendance_override, demo_marks_override FROM people.student WHERE student_id = :sid"
        row = db.execute(text(q), {"sid": student_id}).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Student not found")

        return {
            "demo_fa1": row[0], "demo_cla1": row[1], "demo_fa2": row[2], "demo_cla2": row[3],
            "demo_fa3": row[4], "demo_cla3": row[5], "demo_fa4": row[6], "demo_cla4": row[7],
            "demo_cla5": row[8], "demo_penalty": row[9], "demo_external": row[10],
            "demo_marks_config": row[11] or {}, "demo_internal_overall": row[12],
            "demo_external_overall": row[13], "demo_total_overall": row[14],
            "demo_attendance_override": row[15], "demo_marks_override": row[16]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching marks: {e}")
        raise HTTPException(status_code=500, detail="Database fetch failed")

@router.put("/{student_id}/marks")
def update_student_marks(
    student_id: str,
    data: StudentMarksUpdate,
    department: str = Depends(get_rbac_department),
    db: Session = Depends(get_db)
):
    """Update a student's granular marks (FA-1, CLA-1, etc.)."""
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
                raise HTTPException(status_code=403, detail="Unauthorized to modify this student's marks")

        import json
        
        # 1. Fetch current marks and config
        current_q = "SELECT demo_fa1, demo_cla1, demo_fa2, demo_cla2, demo_fa3, demo_cla3, demo_fa4, demo_cla4, demo_cla5, demo_penalty, demo_external, demo_marks_config FROM people.student WHERE student_id = :sid"
        curr = db.execute(text(current_q), {"sid": student_id}).fetchone()
        if not curr:
            raise HTTPException(status_code=404, detail="Student not found")
            
        current_state = {
            "demo_fa1": curr[0] or 0.0, "demo_cla1": curr[1] or 0.0,
            "demo_fa2": curr[2] or 0.0, "demo_cla2": curr[3] or 0.0,
            "demo_fa3": curr[4] or 0.0, "demo_cla3": curr[5] or 0.0,
            "demo_fa4": curr[6] or 0.0, "demo_cla4": curr[7] or 0.0,
            "demo_cla5": curr[8] or 0.0, "demo_penalty": curr[9] or 0.0,
            "demo_external": curr[10] or 0.0
        }
        
        updates = data.model_dump(exclude_unset=True)
        
        # Update current state with incoming data for calculation
        for k in current_state.keys():
            if k in updates and updates[k] is not None:
                current_state[k] = updates[k]
                
        # Calculate Internal Overall (Sum of FAs and CLAs minus Penalty)
        internal_sum = (
            current_state["demo_fa1"] + current_state["demo_cla1"] +
            current_state["demo_fa2"] + current_state["demo_cla2"] +
            current_state["demo_fa3"] + current_state["demo_cla3"] +
            current_state["demo_fa4"] + current_state["demo_cla4"] +
            current_state["demo_cla5"]
        ) - current_state["demo_penalty"]
        
        updates["demo_internal_overall"] = max(0.0, float(internal_sum))
        
        # Calculate Total Overall (Internal + External)
        external = current_state["demo_external"]
        updates["demo_total_overall"] = updates["demo_internal_overall"] + external
        updates["demo_external_overall"] = external

        update_fields = []
        params = {"sid": student_id}
        
        for field, value in updates.items():
            if value is not None:
                if field == "demo_marks_config":
                    update_fields.append(f"{field} = :{field}::jsonb")
                    params[field] = json.dumps(value)
                else:
                    update_fields.append(f"{field} = :{field}")
                    params[field] = value

        if update_fields:
            query = f"UPDATE people.student SET {', '.join(update_fields)} WHERE student_id = :sid"
            db.execute(text(query), params)
            db.commit()

        return {"success": True, "message": "Marks updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating marks: {e}")
        raise HTTPException(status_code=500, detail="Database marks update failed")
