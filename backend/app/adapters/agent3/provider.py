from abc import ABC, abstractmethod
from typing import List, Dict, Any

class FacultyAllocationProvider(ABC):
    @abstractmethod
    def get_faculty_allocation(self, academic_period: str) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    def get_course_allocation(self, course_id: str, academic_period: str) -> List[Dict[str, Any]]:
        pass
