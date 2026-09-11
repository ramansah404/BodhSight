"""
Agent 10 API Router — all endpoints backed by real Supabase data.

Data flow:
  Database views → deterministic analytics → (optional LLM) → JSON response

Frontend expects these endpoints to match the TypeScript types in
frontend/src/types/agent10.ts. Preserve field names exactly.
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List
import logging

from app.db.session import get_db
import app.agents.agent10 as agent10
from app.schemas.agent10 import (
    DashboardMetrics, AcademicException, InterventionPriority,
    ExecutiveSummary, LLMStatus, TrendSummary, RecommendationItem,
    CoursePerformanceItem, DepartmentPerformanceItem, SectionComparison,
)

router = APIRouter()
logger = logging.getLogger(__name__)


def _safe(fn, db, *args, **kwargs):
    """Wrap a computation; return 500 with useful message on failure."""
    try:
        return fn(db, *args, **kwargs)
    except Exception as e:
        logger.error("Agent10 compute error in %s: %s", fn.__name__, e, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Analytics error: {str(e)}")


# ---------------------------------------------------------------------------
# Dashboard  — matches frontend AcademicDashboardMetrics TypeScript contract
# ---------------------------------------------------------------------------

@router.get("/dashboard", response_model=DashboardMetrics)
def get_dashboard_metrics(db: Session = Depends(get_db)):
    """
    Dashboard KPIs from real Supabase database views.
    All values are deterministically computed from official university schema.
    """
    metrics = _safe(agent10.compute_dashboard_metrics, db)
    return DashboardMetrics(
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


# ---------------------------------------------------------------------------
# Exceptions / Anomalies — matches frontend AcademicException[] contract
# ---------------------------------------------------------------------------

@router.get("/exceptions", response_model=List[AcademicException])
def get_exceptions(db: Session = Depends(get_db)):
    """
    Academic anomalies and exceptions backed by database evidence.
    Sorted by priority score (most critical first).
    """
    anomalies = _safe(agent10.compute_anomalies, db)

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
def get_priorities(db: Session = Depends(get_db)):
    """
    Ranked intervention priority list from deterministic priority scoring.
    """
    priorities = _safe(agent10.compute_priorities, db)

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
# Course performance
# ---------------------------------------------------------------------------

@router.get("/performance/courses")
def get_course_performance(db: Session = Depends(get_db)):
    """Course-level performance from assessment.v_course_performance."""
    return _safe(agent10.compute_course_performance, db)


# ---------------------------------------------------------------------------
# Department performance
# ---------------------------------------------------------------------------

@router.get("/performance/departments")
def get_department_performance(db: Session = Depends(get_db)):
    """Department-level performance aggregation."""
    return _safe(agent10.compute_department_performance, db)


# ---------------------------------------------------------------------------
# Trends
# ---------------------------------------------------------------------------

@router.get("/trends")
def get_trends(db: Session = Depends(get_db)):
    """
    Academic trends. Returns current-term data with honest state notation
    when multi-term historical data is insufficient.
    """
    return _safe(agent10.compute_trends, db)


# ---------------------------------------------------------------------------
# Recommendations
# ---------------------------------------------------------------------------

@router.get("/recommendations")
def get_recommendations(db: Session = Depends(get_db)):
    """Actionable recommendations derived from detected anomalies."""
    return _safe(agent10.compute_recommendations, db)


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
def get_executive_summary(db: Session = Depends(get_db)):
    """
    Executive summary combining dashboard metrics and top anomalies.
    Uses LLM to humanize if configured; otherwise returns structured text.
    """
    metrics = _safe(agent10.compute_dashboard_metrics, db)
    anomalies = _safe(agent10.compute_anomalies, db)
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
