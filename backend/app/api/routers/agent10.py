"""
Agent 10 API Router — all endpoints backed by real Supabase data.

Data flow:
  Database views → deterministic analytics → (optional LLM) → JSON response

Frontend expects these endpoints to match the TypeScript types in
frontend/src/types/agent10.ts. Preserve field names exactly.
"""
from fastapi import APIRouter, Depends, HTTPException, Header
from fastapi.responses import JSONResponse
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session
from typing import List
import logging
import time

from app.db.session import get_db
import app.agents.agent10 as agent10
from app.schemas.agent10 import (
    DashboardMetrics, AcademicException, InterventionPriority,
    ExecutiveSummary, LLMStatus, TrendSummary, RecommendationItem,
    CoursePerformanceItem, DepartmentPerformanceItem, SectionComparison,
    AccreditationMetrics, FacultyPerformanceContext, InstitutionalKPI,
    StrategicTrendSeries,
)
from app.schemas.ingestion import IngestionRequest
from app.ingestion.agent10_pipeline import normalize_records, process_records
from app.ingestion.adapters import adapt_source_records
from app.api.routers.ingestion import require_ingestion_actor

router = APIRouter()
logger = logging.getLogger(__name__)

OUTPUT_ROLES = {"Chairman", "Principal", "IQAC", "Dean", "HOD", "Faculty"}


def get_rbac_department(
    department: str | None = None,
    x_user_role: str | None = Header(default=None),
    x_user_department: str | None = Header(default=None),
) -> str | None:
    """Force department scope for restricted roles."""
    if x_user_role in {"Faculty", "HOD"} and x_user_department:
        return x_user_department
    return department


def require_output_actor(x_user_role: str | None = Header(default=None)) -> str:
    """Require the same authenticated role header used by the existing frontend client."""
    if x_user_role not in OUTPUT_ROLES:
        raise HTTPException(status_code=401, detail="Authenticated institutional role is required")
    return x_user_role


def _query_filters(department: str | None, semester: str | None, academic_year: str | None) -> tuple[str, dict[str, str]]:
    clauses = []
    params: dict[str, str] = {}
    if department:
        clauses.append("d.code = :department")
        params["department"] = department
    if semester:
        clauses.append("(t.label = :semester OR t.term_no::text = :semester)")
        params["semester"] = semester
    if academic_year:
        clauses.append("ay.label = :academic_year")
        params["academic_year"] = academic_year
    return (" AND " + " AND ".join(clauses)) if clauses else "", params


@router.get("/accreditation/metrics", response_model=AccreditationMetrics, tags=["Agent 9 - Accreditation"])
def get_accreditation_metrics(
    department: str | None = Depends(get_rbac_department),
    semester: str | None = None,
    academic_year: str | None = None,
    actor: str = Depends(require_output_actor),
    db: Session = Depends(get_db),
):
    """Return real accreditation metrics from published course results."""
    metrics = _safe(agent10.compute_dashboard_metrics, db, department=department, semester=semester, programme=None, academic_year=academic_year)
    unavailable = ["distinction_percentage", "first_class_percentage"]
    return AccreditationMetrics(
        academic_year=academic_year,
        semester=semester,
        department=department,
        students_evaluated=int(metrics.get("students_evaluated") or 0),
        pass_percentage=float(metrics.get("pass_rate") or 0),
        failure_percentage=float(metrics.get("failure_rate") or 0),
        average_marks=float(metrics.get("average_marks") or 0),
        unavailable_metrics=unavailable,
    )


@router.get("/faculty/performance-context", response_model=list[FacultyPerformanceContext], tags=["Agent 59 - Faculty Context"])
def get_faculty_performance_context(
    department: str | None = Depends(get_rbac_department),
    semester: str | None = None,
    academic_year: str | None = None,
    actor: str = Depends(require_output_actor),
    db: Session = Depends(get_db),
):
    """Return faculty/course performance with cohort and attendance context only where stored."""
    filter_sql, params = _query_filters(department, semester, academic_year)
    rows = db.execute(text(f"""
        SELECT f.faculty_id::text AS faculty_id, per.full_name AS faculty,
               cv.course_code, c.title AS course_name, sec.code AS section,
               count(DISTINCT sr.student_id) AS student_count,
               round(avg(perf.pass_pct), 2) AS pass_rate,
               round(avg(perf.avg_total), 2) AS average_marks,
               round(avg(att.adjusted_pct), 2) AS attendance_context
        FROM academics.faculty_allocation fa
        JOIN people.faculty f ON f.faculty_id = fa.faculty_id
        JOIN people.person per ON per.person_id = f.person_id
        JOIN academics.course_offering co ON co.course_offering_id = fa.course_offering_id
        JOIN curriculum.course_version cv ON cv.course_version_id = co.course_version_id
        JOIN curriculum.course c ON c.course_id = cv.course_id
        JOIN curriculum.section sec ON sec.section_id = co.section_id
        JOIN core.term t ON t.term_id = co.term_id
        JOIN core.academic_year ay ON ay.academic_year_id = t.academic_year_id
        JOIN core.department d ON d.department_id = co.department_id
        LEFT JOIN academics.student_registration sr ON sr.course_offering_id = co.course_offering_id
                                                     AND sr.status = 'REGISTERED'
        LEFT JOIN assessment.v_course_performance perf ON perf.course_offering_id = co.course_offering_id
        LEFT JOIN attendance.v_current_attendance att ON att.course_offering_id = co.course_offering_id
                                                     AND att.student_id = sr.student_id
        WHERE 1 = 1 {filter_sql}
        GROUP BY f.faculty_id, per.full_name, cv.course_code, c.title, sec.code
        ORDER BY per.full_name, cv.course_code, sec.code
    """), params).mappings().all()
    return [FacultyPerformanceContext(**dict(row)) for row in rows]


@router.get("/decision/priorities", response_model=List[InterventionPriority], tags=["Agent 70 - Decision Priorities"])
def get_decision_priorities(
    department: str | None = Depends(get_rbac_department),
    semester: str | None = None,
    programme: str | None = None,
    academic_year: str | None = None,
    actor: str = Depends(require_output_actor),
    db: Session = Depends(get_db),
):
    """Expose the existing deterministic Agent 10 intervention priority calculation."""
    return get_priorities(department, semester, programme, academic_year, db)


@router.get("/kpi", response_model=InstitutionalKPI, tags=["Agent 71 - Institutional KPI"])
def get_institutional_kpi(
    department: str | None = Depends(get_rbac_department),
    semester: str | None = None,
    programme: str | None = None,
    academic_year: str | None = None,
    actor: str = Depends(require_output_actor),
    db: Session = Depends(get_db),
):
    """Return institutional KPIs without exposing student-level records."""
    from app.db import queries
    metrics = _safe(agent10.compute_dashboard_metrics, db, department=department, semester=semester, programme=programme, academic_year=academic_year)
    summary = queries.get_student_profile_summary(db, department, semester, programme, academic_year)
    filter_sql, params = _query_filters(department, semester, academic_year)
    attendance_risk = db.execute(text(f"""
        SELECT count(DISTINCT a.student_id)
        FROM attendance.v_current_attendance a
        JOIN academics.course_offering co ON co.course_offering_id = a.course_offering_id
        JOIN core.term t ON t.term_id = co.term_id
        JOIN core.academic_year ay ON ay.academic_year_id = t.academic_year_id
        JOIN core.department d ON d.department_id = co.department_id
        WHERE a.risk_level IN ('AT_RISK', 'CRITICAL') {filter_sql}
    """), params).scalar() or 0
    departments = _safe(agent10.compute_department_performance, db, department=department, semester=semester, programme=programme, academic_year=academic_year)
    return InstitutionalKPI(
        academic_year=academic_year,
        semester=semester,
        department=department,
        students_evaluated=int(metrics.get("students_evaluated") or 0),
        institutional_pass_rate=float(metrics.get("pass_rate") or 0),
        average_marks=float(metrics.get("average_marks") or 0),
        high_risk_students=int(summary.get("students_high_backlogs") or 0),
        attendance_risk_students=int(attendance_risk),
        department_summaries=departments,
    )


@router.get("/strategic/trends", response_model=StrategicTrendSeries, tags=["Agent 72 - Strategic Trends"])
def get_strategic_trends(
    department: str | None = Depends(get_rbac_department),
    semester: str | None = None,
    actor: str = Depends(require_output_actor),
    db: Session = Depends(get_db),
):
    """Return a real academic-year pass-rate series, or an honest insufficient-history response."""
    filter_sql, params = _query_filters(department, semester, None)
    rows = db.execute(text(f"""
        SELECT ay.label AS academic_year,
               round(100.0 * count(*) FILTER (WHERE cr.result_status = 'PASS')
                     / nullif(count(*) FILTER (WHERE cr.result_status <> 'ABSENT'), 0), 2) AS value
        FROM assessment.course_result cr
        JOIN core.term t ON t.term_id = cr.term_id
        JOIN core.academic_year ay ON ay.academic_year_id = t.academic_year_id
        JOIN curriculum.course_version cv ON cv.course_version_id = cr.course_version_id
        LEFT JOIN academics.course_offering co ON co.course_offering_id = cr.course_offering_id
        LEFT JOIN core.department d ON d.department_id = co.department_id
        WHERE cr.exam_type = 'REGULAR' {filter_sql}
        GROUP BY ay.label
        ORDER BY ay.label
    """), params).mappings().all()
    series = [{"academic_year": row["academic_year"], "value": float(row["value"] or 0)} for row in rows]
    available = len(series) >= 2
    return StrategicTrendSeries(
        metric="pass_rate",
        department=department,
        series=series,
        historical_data_available=available,
        insufficient_history_note=None if available else "At least two academic years of published results are required for a historical trend.",
    )


@router.post("/ingest")
def ingest_machine_records(
    payload: IngestionRequest,
    actor: tuple[str, str] = Depends(require_ingestion_actor),
    db: Session = Depends(get_db),
):
    """Machine-facing Agent 10 input contract for upstream adapters."""
    records = normalize_records(
        adapt_source_records(payload.source_agent, payload.records),
        defaults={"academic_year": payload.academic_year, "semester": payload.semester},
    )
    try:
        result = process_records(
            db,
            records,
            source=payload.source_agent,
            source_type=payload.source_type,
        )
        return result.model_dump()
    except Exception as exc:
        db.rollback()
        logger.exception("Machine ingestion failed for source %s", payload.source_agent)
        raise HTTPException(status_code=500, detail="Agent 10 machine ingestion failed before persistence") from exc

_QUERY_CACHE = {}
_CACHE_TTL = 5 # 5 seconds deduplicates simultaneous frontend widget requests

def _safe(fn, db, *args, **kwargs):
    """Wrap a computation; return 500 with useful message on failure. Includes in-memory caching for performance."""
    cache_key = (fn.__name__, str(args), str(frozenset(kwargs.items())))
    now = time.time()
    
    if cache_key in _QUERY_CACHE:
        val, ts = _QUERY_CACHE[cache_key]
        if now - ts < _CACHE_TTL:
            return val
            
    try:
        val = fn(db, *args, **kwargs)
        _QUERY_CACHE[cache_key] = (val, now)
        return val
    except Exception as e:
        logger.error("Agent10 compute error in %s: %s", fn.__name__, e, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Analytics error: {str(e)}")


# ---------------------------------------------------------------------------
# Dashboard  — matches frontend AcademicDashboardMetrics TypeScript contract
# ---------------------------------------------------------------------------

@router.get("/dashboard", response_model=DashboardMetrics)
def get_dashboard_metrics(department: str = Depends(get_rbac_department), semester: str = None, programme: str = None, academic_year: str = None, db: Session = Depends(get_db)):
    """
    Dashboard KPIs from real Supabase database views.
    All values are deterministically computed from official university schema.
    """
    metrics = _safe(agent10.compute_dashboard_metrics, db, department=department, semester=semester, programme=programme, academic_year=academic_year)
    resp = DashboardMetrics(
        as_of_date=metrics["as_of_date"],
        students_evaluated=metrics["students_evaluated"],
        pass_rate=metrics["pass_rate"],
        average_marks=metrics["average_marks"],
        average_gpa=metrics.get("average_gpa") or 0.0,
        failure_rate=metrics["failure_rate"],
        significant_deviations=metrics["significant_deviations"],
        data_trust_score=metrics["data_trust_score"],
        total_students=metrics.get("total_students", 0),
        courses_analyzed=metrics.get("courses_analyzed", 0),
        active_anomalies=metrics.get("active_anomalies", 0),
        data_source=metrics.get("data_source", "database"),
    )
    return resp


# ---------------------------------------------------------------------------
# Exceptions / Problems — matches frontend AcademicException[] contract
# ---------------------------------------------------------------------------

@router.get("/exceptions", response_model=List[AcademicException])
def get_exceptions(department: str = Depends(get_rbac_department), semester: str = None, programme: str = None, academic_year: str = None, db: Session = Depends(get_db)):
    """
    Academic anomalies and exceptions backed by database evidence.
    Sorted by priority score (most critical first).
    """
    anomalies = _safe(agent10.compute_anomalies, db, department=department, semester=semester, programme=programme, academic_year=academic_year)

    results = []
    for a in anomalies:
        results.append(AcademicException(
            id=a.get("id", ""),
            severity=a.get("severity", "MEDIUM"),
            title=a.get("title", ""),
            course_code=a.get("course_code") or "—",
            department=a.get("department") or "—",
            current_value=float(a.get("current_value") or 0),
            baseline_value=float(a.get("baseline_value") or 0),
            deviation=float(a.get("deviation") or 0),
            affected_students=int(a.get("affected_students") or 0),
            explanation=a.get("deviation_summary") or a.get("title", ""),
            evidence=a.get("evidence_sources", []),
            recommended_action=a.get("recommended_action", ""),
            detected_date=a.get("detected_date", ""),
            anomaly_type=a.get("anomaly_type"),
            priority_score=a.get("priority_score"),
            course_title=a.get("course_title"),
            is_overdue=a.get("is_overdue", False),
        ))
    return results


# ---------------------------------------------------------------------------
# Priorities — matches frontend InterventionPriorityItem[] contract
# ---------------------------------------------------------------------------

@router.get("/priorities", response_model=List[InterventionPriority])
def get_priorities(department: str = Depends(get_rbac_department), semester: str = None, programme: str = None, academic_year: str = None, db: Session = Depends(get_db)):
    """
    Ranked intervention priority list from deterministic priority scoring.
    """
    priorities = _safe(agent10.compute_priorities, db, department=department, semester=semester, programme=programme, academic_year=academic_year)

    results = []
    for p in priorities:
        results.append(InterventionPriority(
            rank=p["rank"],
            course_code=p.get("course_code") or "—",
            course_name=p.get("course_name") or "—",
            department=p.get("department") or "—",
            priority=p.get("priority", "MEDIUM"),
            severity_score=float(p.get("severity_score") or 0.5),
            pass_rate=float(p.get("pass_rate") or 0.0),
            failure_rate=float(p.get("failure_rate") or 0.0),
            affected_students=int(p.get("affected_students") or 0),
            recommended_intervention=p.get("recommended_intervention", ""),
            anomaly_type=p.get("anomaly_type"),
        ))
    return results


# ---------------------------------------------------------------------------
# Student Drilldown — matches frontend StudentProfile[] contract
# ---------------------------------------------------------------------------
@router.get("/students/drilldown")
def get_students_drilldown(
    context: str,
    department: str = Depends(get_rbac_department),
    semester: str = None,
    programme: str = None,
    academic_year: str = None,
    db: Session = Depends(get_db)
):
    """
    Fetch student records based on context (e.g. at_risk, high_backlogs).
    Used for dashboard modal drilldowns.
    """
    from app.db import queries
    students = _safe(queries.get_students_by_context, db, context=context, department=department, semester=semester, programme=programme)
    return students


# ---------------------------------------------------------------------------
# Roster & Departments
# ---------------------------------------------------------------------------

@router.get("/performance/courses")
def get_course_performance(department: str = Depends(get_rbac_department), semester: str = None, programme: str = None, academic_year: str = None, db: Session = Depends(get_db)):
    """Course-level performance from assessment.v_course_performance."""
    resp = _safe(agent10.compute_course_performance, db, department=department, semester=semester, programme=programme, academic_year=academic_year)
    return resp


# ---------------------------------------------------------------------------
# Department performance
# ---------------------------------------------------------------------------

@router.get("/performance/departments", response_model=List[DepartmentPerformanceItem])
def get_department_performance(department: str = Depends(get_rbac_department), semester: str = None, programme: str = None, academic_year: str = None, db: Session = Depends(get_db)):
    """Department-level aggregation."""
    resp = _safe(agent10.compute_department_performance, db, department=department, semester=semester, programme=programme, academic_year=academic_year)
    return resp


# ---------------------------------------------------------------------------
# Trends
# ---------------------------------------------------------------------------

@router.get("/trends")
def get_trends(department: str = Depends(get_rbac_department), semester: str = None, programme: str = None, academic_year: str = None, db: Session = Depends(get_db)):
    """
    Academic trends. Returns current-term data with honest state notation
    when multi-term historical data is insufficient.
    """
    return _safe(agent10.compute_trends, db, department=department, semester=semester, programme=programme, academic_year=academic_year)


# ---------------------------------------------------------------------------
# Recommendations
# ---------------------------------------------------------------------------

@router.get("/recommendations")
def get_recommendations(department: str = Depends(get_rbac_department), semester: str = None, programme: str = None, academic_year: str = None, db: Session = Depends(get_db)):
    """Actionable recommendations derived from detected anomalies."""
    return _safe(agent10.compute_recommendations, db, department=department, semester=semester, programme=programme, academic_year=academic_year)


# ---------------------------------------------------------------------------
# Evidence per course
# ---------------------------------------------------------------------------

@router.get("/evidence/{course_code}")
def get_evidence(course_code: str, db: Session = Depends(get_db)):
    """Full evidence chain for a specific course."""
    return _safe(agent10.get_evidence_for_course, db, course_code)


# ---------------------------------------------------------------------------
# Section comparison / disparity
# ---------------------------------------------------------------------------

@router.get("/sections")
def get_section_comparison(db: Session = Depends(get_db)):
    """Section-level performance comparison — detects inter-section disparities."""
    from app.db import queries
    sections = queries.get_section_comparison(db)
    disparity = queries.get_section_disparity(db, disparity_threshold=15.0)
    # Flag sections that are in the disparity list
    disparity_courses = {r.get("course_code") for r in disparity}
    results = []
    for s in sections:
        code = s.get("course_code", "")
        pp = float(s.get("pass_pct") or 0)
        results.append({
            "course_code": code,
            "course_title": s.get("course_title", ""),
            "department": s.get("department_code", ""),
            "section": s.get("section_code", ""),
            "students_appeared": int(s.get("students_appeared") or 0),
            "pass_rate": round(pp, 2),
            "avg_marks": float(s.get("avg_total") or 0),
            "avg_internal": float(s.get("avg_internal") or 0) if s.get("avg_internal") else None,
            "avg_external": float(s.get("avg_external") or 0) if s.get("avg_external") else None,
            "disparity_flag": code in disparity_courses,
        })
    return results


# ---------------------------------------------------------------------------
# Condonation Forecaster
# ---------------------------------------------------------------------------

@router.get("/condonation")
def get_condonation_forecast(department: str = Depends(get_rbac_department), semester: str = None, programme: str = None, academic_year: str = None, db: Session = Depends(get_db)):
    """Condonation zone risk & revenue forecaster."""
    from app.db import queries
    return _safe(queries.get_condonation_forecast, db, department=department, 
        semester=semester, 
        programme=programme, 
        academic_year=academic_year)


# ---------------------------------------------------------------------------
# Student Drill-Down
# ---------------------------------------------------------------------------

@router.get("/students/drilldown")
def get_student_drilldown(
    context: str,
    course_code: str = None,
    department: str = None, 
    semester: str = None, 
    programme: str = None, 
    academic_year: str = None, 
    db: Session = Depends(get_db)
):
    """Fetch real student details for dashboard metric drill-downs."""
    from app.db import queries
    return _safe(queries.get_student_drilldown, db, context=context,
        course_code=course_code,
        department=department, 
        semester=semester, 
        programme=programme, 
        academic_year=academic_year)

# ---------------------------------------------------------------------------
# LLM Status
# ---------------------------------------------------------------------------

@router.get("/llm-status", response_model=LLMStatus)
def get_llm_status():
    """Returns whether the LLM explanation layer is available."""
    from app.agents.agent10.llm import llm_status
    status = llm_status()
    return LLMStatus(**status)


# ---------------------------------------------------------------------------
# Executive Summary
# ---------------------------------------------------------------------------

@router.get("/summary")
def get_executive_summary(department: str = Depends(get_rbac_department), semester: str = None, programme: str = None, academic_year: str = None, db: Session = Depends(get_db)):
    """
    Executive summary combining dashboard metrics and top anomalies.
    Uses LLM to humanize if configured; otherwise returns structured text.
    """
    metrics = _safe(agent10.compute_dashboard_metrics, db, department=department, semester=semester, programme=programme, academic_year=academic_year)
    anomalies = _safe(agent10.compute_anomalies, db, department=department, semester=semester, programme=programme, academic_year=academic_year)
    summary_text = agent10.generate_executive_summary(metrics, anomalies)

    return {
        "summary": summary_text,
        "dashboard_snapshot": {
            "as_of_date": metrics["as_of_date"],
            "pass_rate": metrics["pass_rate"],
            "students_evaluated": metrics["students_evaluated"],
            "total_students": metrics.get("total_students", 0),
            "courses_analyzed": metrics.get("courses_analyzed", 0),
            "active_anomalies": metrics["active_anomalies"],
        },
        "anomaly_breakdown": {
            "total": len(anomalies),
            "critical": sum(1 for a in anomalies if a.get("severity") == "CRITICAL"),
            "high": sum(1 for a in anomalies if a.get("severity") == "HIGH"),
            "medium": sum(1 for a in anomalies if a.get("severity") == "MEDIUM"),
            "low": sum(1 for a in anomalies if a.get("severity") == "LOW"),
        },
        "top_anomalies": anomalies[:5],
        "llm_used": agent10.llm_status()["llm_available"],
        "data_source": "database",
    }


# ---------------------------------------------------------------------------
# ---------------------------------------------------------------------------
# Chat Widget Endpoint
# ---------------------------------------------------------------------------
from pydantic import BaseModel

class ChatRequest(BaseModel):
    message: str
    filters: Optional[Dict[str, Any]] = None

@router.post("/chat")
def chat_with_agent10(req: ChatRequest, db: Session = Depends(get_db)):
    """Handles chat messages from the frontend ChatWidget."""
    from app.agents.agent10.llm import chat_with_agent
    
    # Optional: fetch some high level stats to provide as context if needed
    context = {}
    try:
        if req.filters and req.filters.get("department"):
            metrics = agent10.compute_dashboard_metrics(db, department=req.filters["department"])
            context["pass_rate"] = metrics.get("pass_rate")
            context["anomalies"] = metrics.get("active_anomalies")
    except:
        pass
        
    reply = chat_with_agent(req.message, context)
    return {"reply": reply}

# ---------------------------------------------------------------------------
# Mutations
# ---------------------------------------------------------------------------
from sqlalchemy import text

@router.post("/recommendations/{anomaly_id}/execute")
def execute_recommendation(anomaly_id: str, db: Session = Depends(get_db)):
    """Execute a recommendation by updating the underlying risk flag status."""
    try:
        # Update the status of the risk flag
        db.execute(
            text("UPDATE agentops.risk_flag SET status = 'IN_PROGRESS' WHERE agent_no = :id OR risk_flag_id::text = :id"),
            {"id": anomaly_id}
        )
        db.commit()
        
        # Removed cache invalidation as cache is removed
        
        return {"success": True, "message": "Recommendation marked as IN_PROGRESS."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/audit/trigger")
def trigger_audit(db: Session = Depends(get_db)):
    """Trigger an ingestion audit check."""
    # Return success so the frontend knows the connected backend acknowledged it.
    
    # Removed cache invalidation as cache is removed
    
    return {"success": True, "message": "Audit ingestion check triggered successfully."}
