from abc import ABC, abstractmethod
from typing import List, Dict
from app.schemas.contracts import AcademicTrend, AcademicMetric

class TrendDetector(ABC):
    @abstractmethod
    def detect_sudden_drops(self, historical_metrics: List[AcademicMetric]) -> List[AcademicTrend]:
        pass

    @abstractmethod
    def detect_persistent_underperformance(self, historical_metrics: List[AcademicMetric]) -> List[AcademicTrend]:
        pass
