"""Agent 10 package."""
from app.agents.agent10.analytics import (
    compute_dashboard_metrics,
    compute_course_performance,
    compute_department_performance,
    compute_trends,
    compute_anomalies,
    compute_priorities,
    compute_recommendations,
    get_evidence_for_course,
)
from app.agents.agent10.llm import (
    humanize_anomaly,
    generate_executive_summary,
    llm_status,
)

__all__ = [
    "compute_dashboard_metrics",
    "compute_course_performance",
    "compute_department_performance",
    "compute_trends",
    "compute_anomalies",
    "compute_priorities",
    "compute_recommendations",
    "get_evidence_for_course",
    "humanize_anomaly",
    "generate_executive_summary",
    "llm_status",
]
