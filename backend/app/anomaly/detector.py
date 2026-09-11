from abc import ABC, abstractmethod
from typing import List
from app.schemas.contracts import AcademicAnomaly, AcademicMetric

class AnomalyDetector(ABC):
    @abstractmethod
    def detect_statistical_deviations(self, metrics: List[AcademicMetric]) -> List[AcademicAnomaly]:
        """Identifies metrics that deviate statistically from baseline."""
        pass
