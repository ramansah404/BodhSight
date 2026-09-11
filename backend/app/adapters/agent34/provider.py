from abc import ABC, abstractmethod
from typing import Dict, Any

class ResultAnalysisProvider(ABC):
    @abstractmethod
    def get_course_result_analysis(self, course_id: str, semester: str) -> Dict[str, Any]:
        pass

    @abstractmethod
    def get_comparative_analysis(self, course_ids: list[str], semester: str) -> Dict[str, Any]:
        pass
