"""
Raw SQL query layer — reads ONLY from the official university views.
No ORM model instantiation needed for analytical queries; we use text() directly.
All queries are READ-ONLY. Never modify any official schema table here.
"""
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import text
import time

# Removed query cache class


# ---------------------------------------------------------------------------
# Assessment — v_course_performance
# ---------------------------------------------------------------------------

def get_course_performance_all(db: Session) -> List[Dict[str, Any]]:
    """Return all rows from assessment.v_course_performance."""
    sql = text("""
        SELECT
            course_version_id,
            course_code,
            course_title,
            term_id,
            course_offering_id,
            section_id,
            department_id,
            students_appeared,
            passed,
            pass_pct,
            avg_total,
            avg_internal,
            avg_external,
            sd_external,
            internal_external_corr
        FROM assessment.v_course_performance
        ORDER BY pass_pct ASC NULLS LAST
    """)
    result = db.execute(sql)
    rows = [dict(row._mapping) for row in result]
    return rows



def filter_course_rows(rows: List[Dict[str, Any]], roster: List[Dict[str, Any]], department: str = None, semester: str = None, programme: str = None, academic_year: str = None) -> List[Dict[str, Any]]:
    if not any([department, semester, programme, academic_year]):
        return rows
        
    course_to_dept = {r["course_code"]: r["department_code"] for r in roster}
    filtered = []
    
    for r in rows:
        # Department filter
        if department:
            dept = str(course_to_dept.get(r.get("course_code"), r.get("department_id") or "Unknown"))
            if dept != department:
                continue
        
        # Semester / Term filter (frontend passes e.g. "T1")
        if semester:
            term = r.get("term_id")
            if term != semester and str(term) != semester:
                continue
                
        # Academic year or programme filtering can be added here based on schema
        
        filtered.append(r)
        
    return filtered


def get_course_performance_summary(db: Session, department: str = None, semester: str = None, programme: str = None, academic_year: str = None) -> Dict[str, Any]:
    """Aggregate KPIs from assessment.v_course_performance using fast in-memory aggregation."""
    rows = get_course_performance_all(db)
    roster = get_course_section_roster(db)
    rows = filter_course_rows(rows, roster, department, semester, programme, academic_year)
    valid_rows = [r for r in rows if (r.get("students_appeared") or 0) > 0]
    
    if not valid_rows:
        return {}
        
    students_evaluated = sum((r.get("students_appeared") or 0) for r in valid_rows)
    total_passed = sum((r.get("passed") or 0) for r in valid_rows)
    
    pass_pcts = [float(r["pass_pct"]) for r in valid_rows if r.get("pass_pct") is not None]
    avg_totals = [float(r["avg_total"]) for r in valid_rows if r.get("avg_total") is not None]
    sd_externals = [float(r["sd_external"]) for r in valid_rows if r.get("sd_external") is not None]
    
    return {
        "total_course_sections": len(rows),
        "students_evaluated": students_evaluated,
        "total_passed": total_passed,
        "avg_pass_pct": round(sum(pass_pcts) / len(pass_pcts), 2) if pass_pcts else 0.0,
        "avg_marks": round(sum(avg_totals) / len(avg_totals), 2) if avg_totals else 0.0,
        "avg_sd_external": round(sum(sd_externals) / len(sd_externals), 2) if sd_externals else 0.0,
        "min_pass_pct": min(pass_pcts) if pass_pcts else 0.0,
        "max_pass_pct": max(pass_pcts) if pass_pcts else 0.0
    }


def get_low_pass_rate_courses(db: Session, threshold: float = 60.0) -> List[Dict[str, Any]]:
    """Courses/sections with pass rate below threshold."""
    sql = text("""
        SELECT
            course_code,
            course_title,
            course_offering_id,
            section_id,
            department_id,
            term_id,
            students_appeared,
            passed,
            pass_pct,
            avg_total,
            avg_internal,
            avg_external,
            sd_external,
            internal_external_corr
        FROM assessment.v_course_performance
        WHERE pass_pct < :threshold
          AND students_appeared > 0
        ORDER BY pass_pct ASC
    """)
    result = db.execute(sql, {"threshold": threshold})
    return [dict(row._mapping) for row in result]


def get_high_stddev_courses(db: Session, threshold: float = 20.0) -> List[Dict[str, Any]]:
    """Courses with high external-mark standard deviation (wide spread = possible assessment issue)."""
    sql = text("""
        SELECT
            course_code,
            course_title,
            course_offering_id,
            section_id,
            department_id,
            students_appeared,
            pass_pct,
            avg_total,
            sd_external,
            internal_external_corr
        FROM assessment.v_course_performance
        WHERE sd_external > :threshold
          AND students_appeared > 0
        ORDER BY sd_external DESC
    """)
    result = db.execute(sql, {"threshold": threshold})
    return [dict(row._mapping) for row in result]


def get_corr_anomaly_courses(db: Session, threshold: float = 0.2) -> List[Dict[str, Any]]:
    """Courses where internal-external correlation is very low — possible lenient internal marking."""
    sql = text("""
        SELECT
            course_code,
            course_title,
            course_offering_id,
            department_id,
            students_appeared,
            pass_pct,
            avg_internal,
            avg_external,
            internal_external_corr
        FROM assessment.v_course_performance
        WHERE internal_external_corr IS NOT NULL
          AND internal_external_corr < :threshold
          AND students_appeared > 0
        ORDER BY internal_external_corr ASC
    """)
    result = db.execute(sql, {"threshold": threshold})
    return [dict(row._mapping) for row in result]


# ---------------------------------------------------------------------------
# Offering roster — academics.v_offering_roster
# ---------------------------------------------------------------------------

def get_offering_roster_summary(db: Session) -> Dict[str, Any]:
    """High-level counts from the offering roster."""
    sql = text("""
        SELECT
            count(DISTINCT student_id) AS total_students_registered,
            count(DISTINCT course_offering_id) AS total_offerings,
            count(DISTINCT department_code) AS total_departments,
            count(DISTINCT programme_code) AS total_programmes,
            count(DISTINCT section_code) AS total_sections,
            count(DISTINCT term_id) AS total_terms
        FROM academics.v_offering_roster
    """)
    result = db.execute(sql)
    row = result.fetchone()
    data = dict(row._mapping) if row else {}
    return data


def get_department_student_counts(db: Session) -> List[Dict[str, Any]]:
    """Student counts per department from the roster."""
    sql = text("""
        SELECT
            department_code,
            count(DISTINCT student_id) AS student_count,
            count(DISTINCT course_offering_id) AS offerings,
            count(DISTINCT section_code) AS sections
        FROM academics.v_offering_roster
        GROUP BY department_code
        ORDER BY student_count DESC
    """)
    result = db.execute(sql)
    return [dict(row._mapping) for row in result]


def get_course_section_roster(db: Session) -> List[Dict[str, Any]]:
    """Courses and their section enrolment sizes."""
    sql = text("""
        SELECT
            course_code,
            course_title,
            department_code,
            section_code,
            term_label,
            count(DISTINCT student_id) AS enrolled_students
        FROM academics.v_offering_roster
        GROUP BY course_code, course_title, department_code, section_code, term_label
        ORDER BY course_code, section_code
    """)
    result = db.execute(sql)
    rows = [dict(row._mapping) for row in result]
    return rows


# ---------------------------------------------------------------------------
# Student profiles — people.v_student_profile
# ---------------------------------------------------------------------------

def get_student_profile_summary(db: Session) -> Dict[str, Any]:
    """Aggregated student KPIs."""
    sql = text("""
        SELECT
            count(*) AS total_students,
            count(*) FILTER (WHERE status = 'ACTIVE') AS active_students,
            round(avg(cgpa)::numeric, 2) AS avg_cgpa,
            count(*) FILTER (WHERE backlog_count > 0) AS students_with_backlogs,
            count(*) FILTER (WHERE backlog_count > 2) AS students_high_backlogs
        FROM people.v_student_profile
    """)
    result = db.execute(sql)
    row = result.fetchone()
    return dict(row._mapping) if row else {}


def get_students_with_backlogs(db: Session, min_backlogs: int = 1) -> List[Dict[str, Any]]:
    """Students with at least min_backlogs active backlogs."""
    sql = text("""
        SELECT
            student_id,
            roll_no,
            full_name,
            department_code,
            programme_code,
            batch_label,
            cgpa,
            backlog_count,
            status
        FROM people.v_student_profile
        WHERE backlog_count >= :min_backlogs
        ORDER BY backlog_count DESC
        LIMIT 50
    """)
    result = db.execute(sql, {"min_backlogs": min_backlogs})
    return [dict(row._mapping) for row in result]


# ---------------------------------------------------------------------------
# Open flags — agentops.v_open_flags
# ---------------------------------------------------------------------------

def get_open_flags(db: Session) -> List[Dict[str, Any]]:
    """All open/in-progress risk flags."""
    sql = text("""
        SELECT
            risk_flag_id::text AS risk_flag_id,
            agent_code,
            agent_no,
            flag_type,
            severity,
            subject_type,
            student_id::text AS student_id,
            faculty_id::text AS faculty_id,
            course_offering_id::text AS course_offering_id,
            deviation_summary,
            suggested_first_action,
            raised_at,
            respond_by,
            status,
            age_hours,
            is_overdue
        FROM agentops.v_open_flags
        ORDER BY
            CASE severity
                WHEN 'CRITICAL' THEN 1
                WHEN 'HIGH' THEN 2
                WHEN 'MODERATE' THEN 3
                ELSE 4
            END,
            raised_at DESC
    """)
    result = db.execute(sql)
    return [dict(row._mapping) for row in result]


def get_open_flags_count(db: Session) -> int:
    """Count of open risk flags."""
    sql = text("SELECT count(*) FROM agentops.v_open_flags")
    return db.execute(sql).scalar() or 0


def get_critical_high_flags(db: Session) -> List[Dict[str, Any]]:
    """Only CRITICAL and HIGH severity flags."""
    sql = text("""
        SELECT
            risk_flag_id::text,
            agent_code,
            flag_type,
            severity,
            subject_type,
            student_id::text,
            course_offering_id::text,
            deviation_summary,
            suggested_first_action,
            raised_at,
            status,
            age_hours,
            is_overdue
        FROM agentops.v_open_flags
        WHERE severity IN ('CRITICAL', 'HIGH')
        ORDER BY raised_at DESC
    """)
    result = db.execute(sql)
    return [dict(row._mapping) for row in result]


# ---------------------------------------------------------------------------
# Department performance  (joins offering roster + course performance)
# ---------------------------------------------------------------------------

def get_department_performance(db: Session, department: str = None, semester: str = None, programme: str = None, academic_year: str = None) -> List[Dict[str, Any]]:
    """Per-department performance aggregated from course performance in memory."""
    rows = get_course_performance_all(db)
    roster = get_course_section_roster(db)
    rows = filter_course_rows(rows, roster, department, semester, programme, academic_year)
    
    # Map course_code to department_code from the roster view
    course_to_dept_code = {r["course_code"]: r["department_code"] for r in roster}
    
    depts: Dict[str, Dict[str, Any]] = {}
    for r in rows:
        # Use the mapped department_code instead of the UUID department_id
        course_code = r.get("course_code")
        dept = str(course_to_dept_code.get(course_code, r.get("department_id") or "Unknown"))
        
        if dept not in depts:
            depts[dept] = {
                "department_code": dept,
                "total_students": 0,
                "total_offerings": 0,
                "pass_pcts": [],
                "avg_totals": [],
                "low_pass_offerings": 0
            }
        
        depts[dept]["total_students"] += (r.get("students_appeared") or 0)
        depts[dept]["total_offerings"] += 1
        
        pp = r.get("pass_pct")
        if pp is not None:
            depts[dept]["pass_pcts"].append(float(pp))
            if float(pp) < 60:
                depts[dept]["low_pass_offerings"] += 1
                
        avt = r.get("avg_total")
        if avt is not None:
            depts[dept]["avg_totals"].append(float(avt))
            
    results = []
    for dept_code, data in depts.items():
        pp_list = data["pass_pcts"]
        avt_list = data["avg_totals"]
        
        results.append({
            "department_code": data["department_code"],
            "total_students": data["total_students"],
            "total_offerings": data["total_offerings"],
            "avg_pass_rate": round(sum(pp_list) / len(pp_list), 2) if pp_list else 0.0,
            "avg_marks": round(sum(avt_list) / len(avt_list), 2) if avt_list else 0.0,
            "low_pass_offerings": data["low_pass_offerings"]
        })
        
    results.sort(key=lambda x: x["avg_pass_rate"])
    return results


# ---------------------------------------------------------------------------
# Section comparison
# ---------------------------------------------------------------------------

def get_section_comparison(db: Session) -> List[Dict[str, Any]]:
    """Course performance broken down by section."""
    sql = text("""
        SELECT
            p.course_code,
            p.course_title,
            r.section_code,
            r.department_code,
            p.students_appeared,
            p.pass_pct,
            p.avg_total,
            p.avg_internal,
            p.avg_external,
            p.sd_external,
            p.internal_external_corr
        FROM assessment.v_course_performance p
        JOIN academics.v_offering_roster r
            ON r.course_offering_id = p.course_offering_id
        GROUP BY
            p.course_code, p.course_title, r.section_code, r.department_code,
            p.students_appeared, p.pass_pct, p.avg_total, p.avg_internal,
            p.avg_external, p.sd_external, p.internal_external_corr
        ORDER BY p.course_code, r.section_code
    """)
    result = db.execute(sql)
    return [dict(row._mapping) for row in result]


def get_section_disparity(db: Session, disparity_threshold: float = 20.0) -> List[Dict[str, Any]]:
    """
    Find courses where sections have significantly different pass rates.
    disparity_threshold: minimum point difference to flag (default 20pp).
    """
    sql = text("""
        WITH section_perf AS (
            SELECT
                p.course_code,
                p.course_title,
                r.section_code,
                r.department_code,
                p.students_appeared,
                p.pass_pct,
                p.avg_total,
                p.internal_external_corr,
                p.course_offering_id
            FROM assessment.v_course_performance p
            JOIN academics.v_offering_roster r
                ON r.course_offering_id = p.course_offering_id
            WHERE p.students_appeared > 0
            GROUP BY p.course_code, p.course_title, r.section_code, r.department_code,
                     p.students_appeared, p.pass_pct, p.avg_total, p.internal_external_corr,
                     p.course_offering_id
        ),
        course_stats AS (
            SELECT
                course_code,
                count(*) AS section_count,
                max(pass_pct) AS max_pass,
                min(pass_pct) AS min_pass,
                max(pass_pct) - min(pass_pct) AS pass_range,
                avg(pass_pct) AS mean_pass
            FROM section_perf
            WHERE pass_pct IS NOT NULL
            GROUP BY course_code
            HAVING count(*) > 1
               AND max(pass_pct) - min(pass_pct) >= :threshold
        )
        SELECT
            sp.course_code,
            sp.course_title,
            sp.section_code,
            sp.department_code,
            sp.students_appeared,
            sp.pass_pct,
            sp.avg_total,
            sp.internal_external_corr,
            cs.section_count,
            cs.max_pass,
            cs.min_pass,
            cs.pass_range,
            cs.mean_pass
        FROM section_perf sp
        JOIN course_stats cs ON cs.course_code = sp.course_code
        ORDER BY cs.pass_range DESC, sp.course_code, sp.section_code
    """)
    result = db.execute(sql, {"threshold": disparity_threshold})
    return [dict(row._mapping) for row in result]


def get_term_context(db: Session) -> Dict[str, Any]:
    """Return current term context info."""
    sql = text("""
        SELECT t.term_id::text, t.label AS term_label, t.status,
               ay.label AS academic_year, ay.start_date, ay.end_date
        FROM core.term t
        JOIN core.academic_year ay ON ay.academic_year_id = t.academic_year_id
        WHERE t.status = 'ACTIVE'
        LIMIT 1
    """)
    result = db.execute(sql)
    row = result.fetchone()
    return dict(row._mapping) if row else {}


def get_condonation_forecast(db: Session, department: str = None, semester: str = None, programme: str = None, academic_year: str = None) -> Dict[str, Any]:
    """
    Returns the number of students in the 65-75% condonation zone,
    and dynamically resolves expected fee collection by querying finance tables.
    """
    params = {}
    
    sql = text("""
        WITH condonation_fee AS (
            SELECT coalesce(max(fsl.amount), 0) AS fee_amount
            FROM finance.fee_structure_line fsl
            JOIN finance.fee_head fh ON fsl.fee_head_id = fh.fee_head_id
            WHERE fh.name ILIKE '%condonation%'
        ),
        zone_students AS (
            SELECT
                s.student_id,
                s.term_id,
                s.band,
                s.projected_end_pct
            FROM attendance.attendance_summary s
            WHERE s.band IN ('B65_70', 'B70_75')
        ),
        payment_status AS (
            SELECT student_id, term_id, fee_paid
            FROM attendance.condonation
        )
        SELECT 
            count(z.student_id) AS total_at_risk,
            count(z.student_id) - count(p.student_id) AS requiring_condonation,
            (count(z.student_id) - count(p.student_id)) * (SELECT fee_amount FROM condonation_fee) AS expected_revenue,
            avg(z.projected_end_pct) AS avg_projected_attendance
        FROM zone_students z
        LEFT JOIN payment_status p ON z.student_id = p.student_id AND z.term_id = p.term_id
    """)
    result = db.execute(sql, params)
    row = result.fetchone()
    
    data = {
        "at_risk_students": row[0] or 0,
        "requiring_condonation": row[1] or 0,
        "expected_revenue": float(row[2] or 0),
        "academic_impact": float(row[3] or 0)
    }
    return data


def get_student_drilldown(
    db: Session, 
    context: str, 
    course_code: str = None,
    department: str = None, 
    semester: str = None, 
    programme: str = None, 
    academic_year: str = None
) -> List[Dict[str, Any]]:
    """
    Returns student details for a drill-down context:
    contexts: 'evaluated', 'condonation', 'problems'
    """
    select_clause = """
        SELECT 
            p.student_id,
            p.roll_no,
            p.full_name,
            p.status,
            p.programme_code,
            p.department_code,
            p.batch_label,
            p.section_code,
            p.cgpa,
            p.backlog_count,
            p.attendance_pct,
            p.fee_outstanding,
    """
    
    params = {}
    from_clause = " FROM people.v_student_profile p "
    where_clause = " WHERE p.status = 'ACTIVE' "
    
    if department:
        where_clause += " AND p.department_code = :department "
        params["department"] = department
    if programme:
        where_clause += " AND p.programme_code = :programme "
        params["programme"] = programme
        
    if context == "condonation":
        select_clause += " a.band AS reason "
        from_clause += " JOIN attendance.attendance_summary a ON p.student_id = a.student_id "
        where_clause += " AND a.band IN ('B65_70', 'B70_75') "
    elif context == "problems":
        select_clause += " f.category AS reason "
        from_clause += " JOIN core.student_flag f ON p.student_id = f.student_id "
        where_clause += " AND f.status = 'OPEN' "
    elif context == "at_risk":
        select_clause += " 'Backlogs' AS reason "
        where_clause += " AND p.backlog_count > 0 "
    elif context == "high_risk":
        select_clause += " 'High Backlogs' AS reason "
        where_clause += " AND p.backlog_count >= 3 "
    elif context == "course" and course_code:
        select_clause += " 'Course Risk' AS reason "
        where_clause += " AND p.student_id IN (SELECT student_id FROM academics.v_offering_roster WHERE course_code = :course_code) "
        params["course_code"] = course_code
    else:
        select_clause += " 'Evaluated' AS reason "

    sql_text = select_clause + from_clause + where_clause + " ORDER BY p.roll_no ASC LIMIT 500"
    
    result = db.execute(text(sql_text), params)
    return [dict(row._mapping) for row in result]
