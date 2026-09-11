from abc import ABC, abstractmethod
from typing import List, Dict, Any
from app.schemas.contracts import AcademicRecord, AcademicMetric

class DeterministicAnalyticsEngine(ABC):
    @abstractmethod
    def calculate_pass_percentage(self, records: List[AcademicRecord]) -> AcademicMetric:
        pass

    @abstractmethod
    def calculate_grade_distribution(self, records: List[AcademicRecord]) -> List[AcademicMetric]:
        pass

    @abstractmethod
    def calculate_average_marks(self, records: List[AcademicRecord]) -> AcademicMetric:
        pass
