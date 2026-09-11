from abc import ABC, abstractmethod
from app.schemas.contracts import (
    AcademicInsight, 
    FacultyPerformanceContext, 
    AcademicAlert,
    AcademicTrend,
    AgentOutput
)

# Agent 9 - Accreditation Academic Agent
class AccreditationReportingContract(ABC):
    @abstractmethod
    def provide_accreditation_metrics(self) -> dict:
        """Provide structured, traceable metrics suitable for official accreditation reporting."""
        pass

# Agent 59 - Faculty Performance Agent
class FacultyPerformanceIntegrationContract(ABC):
    @abstractmethod
    def provide_faculty_contextual_performance(self, faculty_id: str) -> FacultyPerformanceContext:
        """Provide context-aware performance metrics rather than simple raw ranking."""
        pass

# Agent 70 - Academic Decision Support Agent
class AcademicDecisionSupportContract(ABC):
    @abstractmethod
    def provide_decision_insights(self) -> AgentOutput:
        """Provide machine-readable metrics, deviations, baseline, and evidence."""
        pass

# Agent 71 - University Key Performance Indicator Agent
class UniversityKPIContract(ABC):
    @abstractmethod
    def provide_academic_kpis(self) -> list[dict]:
        """Provide validated academic indicators in a standardized form."""
        pass

# Agent 72 - Strategic Planning Agent
class StrategicPlanningContract(ABC):
    @abstractmethod
    def provide_strategic_trends(self) -> list[AcademicTrend]:
        """Provide historical academic trends and performance indicators for strategic analysis."""
        pass
