from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class EvidenceReference(BaseModel):
    source_record_id: str
    source_type: str
    description: str

class AcademicScope(BaseModel):
    level: str  # e.g., "university", "department", "program", "course", "section", "student"
    target_id: str
    time_period: str

class AcademicMetric(BaseModel):
    name: str
    value: float
    baseline: Optional[float]
    deviation: Optional[float]
    unit: str

class AcademicRecord(BaseModel):
    student_id: str
    course_id: str
    semester: str
    marks: float
    grade: str

class AcademicResult(BaseModel):
    scope: AcademicScope
    metrics: List[AcademicMetric]

class AcademicContext(BaseModel):
    regulation_version: str
    curriculum_id: str
    course_category: str

class AcademicTrend(BaseModel):
    metric_name: str
    historical_values: Dict[str, float]
    trend_direction: str  # "improving", "declining", "stable"

class AcademicAnomaly(BaseModel):
    scope: AcademicScope
    metric: AcademicMetric
    confidence: float
    description: str

class AcademicInsight(BaseModel):
    summary: str
    evidence: List[EvidenceReference]
    anomalies: List[AcademicAnomaly]

class InterventionPriority(BaseModel):
    target_id: str
    priority_score: float
    severity: str
    reason: str

class AcademicRecommendation(BaseModel):
    priority: InterventionPriority
    suggested_action: str
    expected_impact: str

class AcademicAlert(BaseModel):
    alert_id: str
    timestamp: datetime
    insight: AcademicInsight
    requires_human_review: bool

class FacultyPerformanceContext(BaseModel):
    faculty_id: str
    course_id: str
    course_difficulty_index: float
    section_entry_level_ability: float
    historical_baseline: float
    contextual_performance_score: float

class AgentInput(BaseModel):
    correlation_id: str
    requested_scope: AcademicScope

class AgentOutput(BaseModel):
    correlation_id: str
    insights: List[AcademicInsight]
    recommendations: List[AcademicRecommendation]
    alerts: List[AcademicAlert]
