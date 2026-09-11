from abc import ABC, abstractmethod
from typing import List, Tuple
from app.schemas.contracts import AcademicRecord

class ValidationRule(ABC):
    @abstractmethod
    def validate(self, records: List[AcademicRecord]) -> Tuple[bool, List[str]]:
        """Return (is_valid, list_of_errors)."""
        pass

class ValidationEngine:
    def __init__(self, rules: List[ValidationRule]):
        self.rules = rules

    def run_all(self, records: List[AcademicRecord]) -> Tuple[bool, List[str]]:
        all_errors = []
        is_valid = True
        for rule in self.rules:
            valid, errors = rule.validate(records)
            if not valid:
                is_valid = False
                all_errors.extend(errors)
        return is_valid, all_errors
