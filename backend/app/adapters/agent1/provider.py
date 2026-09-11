from abc import ABC, abstractmethod
from typing import Dict, Any

class CurriculumProvider(ABC):
    @abstractmethod
    def get_program_context(self, program_id: str) -> Dict[str, Any]:
        pass

    @abstractmethod
    def get_course_context(self, course_id: str, regulation_version: str) -> Dict[str, Any]:
        pass
