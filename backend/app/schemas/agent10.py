"""
Pydantic response schemas for Agent 10 API.
Keeps contracts explicit and FastAPI auto-docs meaningful.
"""
from __future__ import annotations
from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class DashboardMetrics(BaseModel):
    """AcademicDashboardMetrics — matches frontend TypeScript contract exactly."""
    as_of_date: str
    students_evaluated: int
    pass_rate: float
    average_marks: float
    average_gpa: float           # 0.0 if not in views
    failure_rate: float
    significant_deviations: int
    data_trust_score: int
    # Extended (frontend ignores unknown keys)
    total_students: int = 0
    courses_analyzed: int = 0
    active_anomalies: int = 0
    data_source: str = "database"


class CoursePerformanceItem(BaseModel):
    """Matches frontend CoursePerformance TypeScript type."""
    course_code: str
    course_name: str
    department: str
    semester: str
    pass_rate: float
    failure_rate: float
    avg_marks: float
    gpa: Optional[float] = None
    students_appeared: int
    trend: str          # UP / DOWN / STABLE
    priority: str       # CRITICAL / HIGH / MEDIUM / LOW
    avg_internal: Optional[float] = None
    avg_external: Optional[float] = None
    sd_external: Optional[float] = None
    internal_external_corr: Optional[float] = None


class DepartmentPerformanceItem(BaseModel):
    """Matches frontend DepartmentPerformance TypeScript type."""
    department_code: str
    department_name: str
    total_students: int
    faculty_count: Optional[int] = None
    pass_rate: Optional[float] = None
    avg_gpa: Optional[float] = None
    active_exceptions: int = 0
    status: str = "MONITORING"   # OPTIMAL / MONITORING / INTERVENTION_REQUIRED


class AnomalyEvidence(BaseModel):
    """Structured evidence for an anomaly."""
    anomaly_type: str
    severity: str
    course_code: Optional[str] = None
    course_title: Optional[str] = None
    department: Optional[str] = None
    section: Optional[str] = None
    current_value: Optional[float] = None
    baseline_value: Optional[float] = None
    deviation: Optional[float] = None
    affected_students: int = 0
    evidence_sources: List[str] = []
    priority_score: float = 0.0
    detected_date: str = ""
    recommended_action: str = ""


class AcademicException(BaseModel):
    """Matches frontend AcademicException TypeScript type."""
    id: str
    severity: str
    title: str
    course_code: str
    department: str
    current_value: float = 0.0
    baseline_value: float = 0.0
    deviation: float = 0.0
    affected_students: int = 0
    explanation: str = ""
    evidence: List[str] = []
    recommended_action: str = ""
    detected_date: str = ""
    # Extended
    anomaly_type: Optional[str] = None
    priority_score: Optional[float] = None
    course_title: Optional[str] = None
    is_overdue: bool = False


class InterventionPriority(BaseModel):
    """Matches frontend InterventionPriorityItem TypeScript type."""
    rank: int
    course_code: str
    course_name: str
    department: str
    priority: str
    severity_score: float
    pass_rate: float = 0.0
    failure_rate: float = 0.0
    affected_students: int = 0
    recommended_intervention: str = ""
    anomaly_type: Optional[str] = None


class TrendSummary(BaseModel):
    historical_data_available: bool
    insufficient_history_note: Optional[str] = None
    current_term_summary: Optional[Dict[str, Any]] = None
    courses_above_mean: List[Dict[str, Any]] = []
    courses_below_mean: List[Dict[str, Any]] = []
    student_backlog_trend: Optional[Dict[str, Any]] = None


class RecommendationItem(BaseModel):
    anomaly_id: str
    anomaly_type: Optional[str] = None
    severity: str
    priority_score: float
    course_code: Optional[str] = None
    department: Optional[str] = None
    affected_students: int = 0
    recommended_action: str = ""
    evidence_sources: List[str] = []
    generated_at: str = ""


class ExecutiveSummary(BaseModel):
    summary: str
    dashboard_snapshot: Dict[str, Any]
    top_anomalies: List[Dict[str, Any]] = []
    llm_used: bool = False


class LLMStatus(BaseModel):
    llm_available: bool
    fallback_mode: bool
    note: str


class SectionComparison(BaseModel):
    """Section-level comparison for disparity detection."""
    course_code: str
    course_title: str
    department: str
    section: str
    students_appeared: int
    pass_rate: Optional[float] = None
    avg_marks: Optional[float] = None
    avg_internal: Optional[float] = None
    avg_external: Optional[float] = None
    disparity_flag: bool = False
    disparity_vs_peer: Optional[float] = None


class AccreditationMetrics(BaseModel):
    academic_year: Optional[str] = None
    semester: Optional[str] = None
    department: Optional[str] = None
    students_evaluated: int
    pass_percentage: float
    failure_percentage: float
    distinction_percentage: Optional[float] = None
    first_class_percentage: Optional[float] = None
    average_marks: float
    unavailable_metrics: List[str] = []
    data_source: str = "database"


class FacultyPerformanceContext(BaseModel):
    faculty_id: str
    faculty: str
    course_code: str
    course_name: str
    section: Optional[str] = None
    student_count: int
    pass_rate: Optional[float] = None
    average_marks: Optional[float] = None
    attendance_context: Optional[float] = None
    historical_context: Optional[str] = None
    entry_level_context: Optional[str] = None
    context_available: bool = False


class InstitutionalKPI(BaseModel):
    academic_year: Optional[str] = None
    semester: Optional[str] = None
    department: Optional[str] = None
    students_evaluated: int
    institutional_pass_rate: float
    average_marks: float
    high_risk_students: int
    attendance_risk_students: int
    department_summaries: List[Dict[str, Any]] = []
    data_source: str = "database"


class StrategicTrendSeries(BaseModel):
    metric: str
    department: Optional[str] = None
    series: List[Dict[str, Any]]
    historical_data_available: bool
    insufficient_history_note: Optional[str] = None
    data_source: str = "database"
