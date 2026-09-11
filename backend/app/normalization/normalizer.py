from abc import ABC, abstractmethod
from typing import Any, List
from app.schemas.contracts import AcademicRecord

class AcademicNormalizer(ABC):
    @abstractmethod
    def normalize(self, raw_data: Any) -> List[AcademicRecord]:
        """Convert external representations into canonical internal academic representation."""
        pass
