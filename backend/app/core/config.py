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
    DATA_SOURCE: str = "demo"  # 'database' or 'demo'
    SUPABASE_URL: str | None = None
    SUPABASE_ANON_KEY: str | None = None
    SUPABASE_SERVICE_ROLE_KEY: str | None = None
    
    # AI/LLM Configuration
    LLM_PROVIDER: str = "openai"   # "openai" | "gemini"
    LLM_MODEL: str = "gpt-4o-mini"
    LLM_API_KEY: str | None = None        # Alias for OPENAI key
    OPENAI_API_KEY: str | None = None     # Standard OpenAI env var name
    GEMINI_API_KEY: str | None = None     # Google Gemini
    LLM_MAX_TOKENS: int = 512

    
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    model_config = SettingsConfigDict(env_file=[".env", "../.env"], env_file_encoding="utf-8", extra="ignore")

settings = Settings()
