from abc import ABC, abstractmethod
from typing import List
from app.schemas.contracts import AcademicAnomaly, AcademicInsight, EvidenceReference

class PerformanceAttributionEngine(ABC):
    @abstractmethod
    def attribute_deviation(self, anomaly: AcademicAnomaly, available_evidence: List[EvidenceReference]) -> AcademicInsight:
        """Determines if a performance drop is broad, course-specific, or section-specific based on evidence."""
        pass
