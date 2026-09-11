from abc import ABC, abstractmethod
from app.schemas.contracts import InterventionPriority, AcademicAnomaly

class PriorityScorer(ABC):
    @abstractmethod
    def score_anomaly(self, anomaly: AcademicAnomaly) -> InterventionPriority:
        """Scores an anomaly based on severity, magnitude, persistence, and affected students."""
        pass
