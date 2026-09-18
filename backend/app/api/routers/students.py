from fastapi import APIRouter, Depends, HTTPException, Header, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from pydantic import BaseModel, Field
import logging
import uuid
from datetime import datetime
import csv
import codecs

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

class StudentWithMarksResponse(BaseModel):
    student_id: str
    full_name: str
    roll_no: str
    section_code: str
    demo_fa1: float
    demo_cla1: float
    demo_fa2: float
    demo_cla2: float
    demo_fa3: float
    demo_cla3: float
    demo_fa4: float
    demo_cla4: float
    demo_cla5: float
    demo_penalty: float
    demo_external: float
    demo_internal_overall: float
    demo_external_overall: float
    demo_total_overall: float
    demo_marks_config: dict


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

@router.get("/with-marks", response_model=List[StudentWithMarksResponse])
def list_students_with_marks(
    section: Optional[str] = None,
    department: str = Depends(get_rbac_department),
    db: Session = Depends(get_db)
):
    """List all students for the department, including their detailed marks, to prevent N+1 frontend queries."""
    try:
        # Base query joining student profile with the actual student table for marks
        select_clause = """
            SELECT sp.student_id, sp.full_name, sp.roll_no, sp.section_code,
                   COALESCE(s.demo_fa1, 0) as demo_fa1, COALESCE(s.demo_cla1, 0) as demo_cla1,
                   COALESCE(s.demo_fa2, 0) as demo_fa2, COALESCE(s.demo_cla2, 0) as demo_cla2,
                   COALESCE(s.demo_fa3, 0) as demo_fa3, COALESCE(s.demo_cla3, 0) as demo_cla3,
                   COALESCE(s.demo_fa4, 0) as demo_fa4, COALESCE(s.demo_cla4, 0) as demo_cla4,
                   COALESCE(s.demo_cla5, 0) as demo_cla5, COALESCE(s.demo_penalty, 0) as demo_penalty,
                   COALESCE(s.demo_external, 0) as demo_external, 
                   COALESCE(s.demo_internal_overall, 0) as demo_internal_overall,
                   COALESCE(s.demo_external_overall, 0) as demo_external_overall,
                   COALESCE(s.demo_total_overall, 0) as demo_total_overall,
                   s.demo_marks_config
            FROM people.v_student_profile sp
            JOIN people.student s ON sp.student_id = s.student_id
        """

        params = {}
        where_clauses = []
        
        if department:
            where_clauses.append("sp.section_code IN (SELECT section_code FROM academics.v_offering_roster WHERE department_code = :dept)")
            params["dept"] = department
            
        if section:
            where_clauses.append("sp.section_code = :section")
            params["section"] = section
            
        where_sql = ("WHERE " + " AND ".join(where_clauses)) if where_clauses else ""
        
        q = f"""
            {select_clause}
            {where_sql}
            ORDER BY sp.full_name LIMIT 300
        """
        rows = db.execute(text(q), params).fetchall()

        return [
            StudentWithMarksResponse(
                student_id=str(r.student_id),
                full_name=str(r.full_name),
                roll_no=str(r.roll_no),
                section_code=str(r.section_code),
                demo_fa1=float(r.demo_fa1),
                demo_cla1=float(r.demo_cla1),
                demo_fa2=float(r.demo_fa2),
                demo_cla2=float(r.demo_cla2),
                demo_fa3=float(r.demo_fa3),
                demo_cla3=float(r.demo_cla3),
                demo_fa4=float(r.demo_fa4),
                demo_cla4=float(r.demo_cla4),
                demo_cla5=float(r.demo_cla5),
                demo_penalty=float(r.demo_penalty),
                demo_external=float(r.demo_external),
                demo_internal_overall=float(r.demo_internal_overall),
                demo_external_overall=float(r.demo_external_overall),
                demo_total_overall=float(r.demo_total_overall),
                demo_marks_config=r.demo_marks_config or {}
            ) for r in rows
        ]
    except Exception as e:
        logger.error(f"Error fetching students with marks: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch students with marks")

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

@router.post("/bulk-upload-marks")
def bulk_upload_marks(
    file: UploadFile = File(...),
    department: str = Depends(get_rbac_department),
    db: Session = Depends(get_db)
):
    """Parse CSV and bulk update student marks based on roll_no."""
    try:
        content = file.file.read()
        text_content = content.decode("utf-8-sig")  # sig to handle BOM from Excel
        reader = csv.DictReader(text_content.splitlines())
        
        # Mapping from CSV columns to DB columns
        col_mapping = {
            "roll_no": "roll_no",
            "fa1": "demo_fa1",
            "cla1": "demo_cla1",
            "fa2": "demo_fa2",
            "cla2": "demo_cla2",
            "fa3": "demo_fa3",
            "cla3": "demo_cla3",
            "fa4": "demo_fa4",
            "cla4": "demo_cla4",
            "cla5": "demo_cla5",
            "external": "demo_external",
            "penalty": "demo_penalty"
        }
        
        updated_count = 0
        not_found_count = 0
        unauthorized_count = 0

        # Pre-fetch all students in this department's sections
        valid_students_q = """
            SELECT sp.roll_no, sp.student_id 
            FROM people.v_student_profile sp
            JOIN academics.v_offering_roster c ON c.section_code = sp.section_code
        """
        valid_params = {}
        if department:
            valid_students_q += " WHERE c.department_code = :dept"
            valid_params["dept"] = department
            
        valid_students_rows = db.execute(text(valid_students_q), valid_params).fetchall()
        valid_roll_nos = {str(row[0]).strip().lower(): str(row[1]) for row in valid_students_rows if row[0]}
        
        for row in reader:
            # Look for roll_no key (case insensitive keys)
            row_keys_lower = {str(k).strip().lower(): v for k, v in row.items() if k}
            
            roll_no_val = str(row_keys_lower.get("roll_no", "")).strip().lower()
            if not roll_no_val:
                continue
                
            if roll_no_val not in valid_roll_nos:
                unauthorized_count += 1
                continue
                
            student_id = valid_roll_nos[roll_no_val]
            
            # Fetch current state to correctly calculate overall
            current_q = "SELECT demo_fa1, demo_cla1, demo_fa2, demo_cla2, demo_fa3, demo_cla3, demo_fa4, demo_cla4, demo_cla5, demo_penalty, demo_external FROM people.student WHERE student_id = :sid"
            curr = db.execute(text(current_q), {"sid": student_id}).fetchone()
            if not curr:
                not_found_count += 1
                continue
                
            current_state = {
                "demo_fa1": curr[0] or 0.0, "demo_cla1": curr[1] or 0.0,
                "demo_fa2": curr[2] or 0.0, "demo_cla2": curr[3] or 0.0,
                "demo_fa3": curr[4] or 0.0, "demo_cla3": curr[5] or 0.0,
                "demo_fa4": curr[6] or 0.0, "demo_cla4": curr[7] or 0.0,
                "demo_cla5": curr[8] or 0.0, "demo_penalty": curr[9] or 0.0,
                "demo_external": curr[10] or 0.0
            }
            
            updates = {}
            for csv_col, db_col in col_mapping.items():
                if csv_col == "roll_no":
                    continue
                val_str = row_keys_lower.get(csv_col)
                if val_str is not None and str(val_str).strip() != "":
                    try:
                        val_float = float(str(val_str).strip())
                        updates[db_col] = val_float
                        current_state[db_col] = val_float
                    except ValueError:
                        pass # Ignore non-numeric values
                        
            if not updates:
                continue
                
            # Calculate overalls
            internal_sum = (
                current_state["demo_fa1"] + current_state["demo_cla1"] +
                current_state["demo_fa2"] + current_state["demo_cla2"] +
                current_state["demo_fa3"] + current_state["demo_cla3"] +
                current_state["demo_fa4"] + current_state["demo_cla4"] +
                current_state["demo_cla5"]
            ) - current_state["demo_penalty"]
            
            updates["demo_internal_overall"] = max(0.0, float(internal_sum))
            
            external = current_state["demo_external"]
            updates["demo_total_overall"] = updates["demo_internal_overall"] + external
            updates["demo_external_overall"] = external
            
            update_fields = []
            params = {"sid": student_id}
            
            for field, value in updates.items():
                update_fields.append(f"{field} = :{field}")
                params[field] = value
                
            query = f"UPDATE people.student SET {', '.join(update_fields)} WHERE student_id = :sid"
            db.execute(text(query), params)
            updated_count += 1
            
        db.commit()
        return {
            "success": True, 
            "message": f"Successfully updated {updated_count} students. (Skipped/Unauthorized: {unauthorized_count}, Not Found: {not_found_count})"
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Error in bulk upload: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{student_id}/attendance")
def get_student_attendance(
    student_id: str,
    db: Session = Depends(get_db)
):
    """Return subject-wise and day-wise attendance for a student portal."""
    try:
        # Subject-wise
        subj_q = """
            SELECT c.title AS subject,
                   count(*) FILTER (WHERE al.status = 'PRESENT') AS present,
                   count(*) AS total,
                   round(100.0 * count(*) FILTER (WHERE al.status = 'PRESENT')
                         / nullif(count(*), 0), 1) AS pct
            FROM attendance.attendance_log al
            JOIN academics.course_offering co ON co.course_offering_id = al.course_offering_id
            JOIN curriculum.course_version cv ON cv.course_version_id = co.course_version_id
            JOIN curriculum.course c ON c.course_id = cv.course_id
            WHERE al.student_id = :sid
            GROUP BY c.title
            ORDER BY c.title
        """
        subj_rows = db.execute(text(subj_q), {"sid": student_id}).fetchall()

        # Day-wise (last 60 days)
        daily_q = """
            SELECT DATE(al.class_date) AS date,
                   CASE WHEN bool_or(al.status = 'PRESENT') THEN 'P'
                        WHEN bool_or(al.status = 'ON_DUTY') THEN 'OD'
                        ELSE 'A' END AS status
            FROM attendance.attendance_log al
            WHERE al.student_id = :sid
              AND al.class_date >= CURRENT_DATE - INTERVAL '60 days'
            GROUP BY DATE(al.class_date)
            ORDER BY date
        """
        daily_rows = db.execute(text(daily_q), {"sid": student_id}).fetchall()

        subjects = [{"subject": r[0], "present": r[1], "total": r[2], "pct": float(r[3] or 0)} for r in subj_rows]
        daily = [{"date": str(r[0]), "status": r[1]} for r in daily_rows]
        overall_pct = round(sum(s["pct"] for s in subjects) / len(subjects), 1) if subjects else 0.0

        return {"attendance_pct": overall_pct, "subjects": subjects, "daily": daily}
    except Exception as e:
        logger.error(f"Error fetching attendance: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch attendance")


@router.get("/portal/me")
def get_student_portal(
    x_user_id: str = Header(default=None),
    x_user_role: str = Header(default=None),
    db: Session = Depends(get_db)
):
    """Return personalised student/parent portal data using the auth token identifier."""
    try:
        identifier = x_user_id or ""
        # Look up student by email or roll_no
        lookup_q = """
            SELECT sp.student_id, sp.full_name, sp.roll_no, sp.section_code,
                   sp.cgpa, sp.attendance_pct, sp.batch_label, sp.programme_code,
                   sp.department_code, sp.backlog_count,
                   sp.demo_fa1, sp.demo_cla1, sp.demo_fa2, sp.demo_cla2,
                   sp.demo_fa3, sp.demo_cla3, sp.demo_fa4, sp.demo_cla4,
                   sp.demo_cla5, sp.demo_external, sp.demo_internal_overall,
                   sp.demo_total_overall
            FROM people.v_student_profile sp
            WHERE sp.email = :id OR sp.roll_no = :id
            LIMIT 1
        """
        row = db.execute(text(lookup_q), {"id": identifier}).fetchone()
        if not row:
            # Fallback: return first student profile for demo purposes
            row = db.execute(text("""
                SELECT sp.student_id, sp.full_name, sp.roll_no, sp.section_code,
                       sp.cgpa, sp.attendance_pct, sp.batch_label, sp.programme_code,
                       sp.department_code, sp.backlog_count,
                       sp.demo_fa1, sp.demo_cla1, sp.demo_fa2, sp.demo_cla2,
                       sp.demo_fa3, sp.demo_cla3, sp.demo_fa4, sp.demo_cla4,
                       sp.demo_cla5, sp.demo_external, sp.demo_internal_overall,
                       sp.demo_total_overall
                FROM people.v_student_profile sp
                ORDER BY sp.full_name LIMIT 1
            """)).fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Student profile not found")

        keys = ["student_id","full_name","roll_no","section_code","cgpa","attendance_pct",
                "batch_label","programme_code","department_code","backlog_count",
                "demo_fa1","demo_cla1","demo_fa2","demo_cla2","demo_fa3","demo_cla3",
                "demo_fa4","demo_cla4","demo_cla5","demo_external",
                "demo_internal_overall","demo_total_overall"]
        data = dict(zip(keys, row))

        # Subject-wise marks from real results (supplemented with demo_* if empty)
        result_q = """
            SELECT c.title AS subject, cv.course_code,
                   cr.internal_marks, cr.external_marks, cr.total_marks, cr.grade, cr.result_status
            FROM assessment.course_result cr
            JOIN curriculum.course_version cv ON cv.course_version_id = cr.course_version_id
            JOIN curriculum.course c ON c.course_id = cv.course_id
            WHERE cr.student_id = :sid
            ORDER BY c.title LIMIT 20
        """
        results = db.execute(text(result_q), {"sid": str(data["student_id"])}).fetchall()
        data["subjects"] = [
            {"subject": r[0], "code": r[1], "internal": float(r[2] or 0),
             "external": float(r[3] or 0), "total": float(r[4] or 0),
             "grade": r[5] or "—", "status": r[6] or "—"}
            for r in results
        ]
        data["student_id"] = str(data["student_id"])
        return data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in student portal: {e}")
        raise HTTPException(status_code=500, detail="Failed to load student portal")
