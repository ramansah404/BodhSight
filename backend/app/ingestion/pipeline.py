from abc import ABC, abstractmethod
from typing import Any, Dict

class IngestionSource(ABC):
    @abstractmethod
    def fetch_data(self) -> Any:
        pass

class IngestionPipeline:
    def __init__(self, source: IngestionSource):
        self.source = source

    def run(self) -> Any:
        return self.source.fetch_data()
