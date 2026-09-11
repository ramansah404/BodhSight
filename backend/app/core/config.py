from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
from pydantic import AnyHttpUrl

class Settings(BaseSettings):
    APP_NAME: str = "BodhSight - Agent 10"
    APP_ENV: str = "development"
    API_V1_STR: str = "/api/v1"
    
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    
    DATABASE_URL: str | None = None
    
    # AI/LLM Configuration Placeholders
    LLM_PROVIDER: str = "openai"
    LLM_MODEL: str = "gpt-4-turbo"
    LLM_API_KEY: str | None = None
    
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
