from abc import ABC, abstractmethod
from typing import List
from app.schemas.contracts import AcademicRecommendation, InterventionPriority, AcademicInsight

class RecommendationEngine(ABC):
    @abstractmethod
    def generate_recommendations(self, insight: AcademicInsight, priority: InterventionPriority) -> List[AcademicRecommendation]:
        """Provides actionable recommendations based on an insight."""
        pass
