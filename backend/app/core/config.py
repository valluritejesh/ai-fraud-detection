from pathlib import Path
from typing import List
from pydantic import ConfigDict
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    model_config = ConfigDict(extra="ignore", env_file=".env")

    PROJECT_NAME: str = "AI Fraud Detection Agent Platform"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Storage
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    MAX_UPLOAD_SIZE_MB: int = 25
    ALLOWED_EXTENSIONS: List[str] = [".pdf", ".jpg", ".jpeg", ".png", ".json", ".txt"]

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./fraud_detection.db"

    # Security
    SECRET_KEY: str = "secret-key-change-in-production-fraud-guard-2026"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    ALGORITHM: str = "HS256"

    # Risk Scoring Thresholds
    RISK_THRESHOLD_LOW: float = 30.0
    RISK_THRESHOLD_MEDIUM: float = 60.0
    RISK_THRESHOLD_HIGH: float = 80.0

    # Azure AI Configuration (Optional / Local Fallback Enabled by Default)
    AZURE_OPENAI_ENDPOINT: str = ""
    AZURE_OPENAI_API_KEY: str = ""
    AZURE_OPENAI_DEPLOYMENT: str = "gpt-4o"
    AZURE_DOC_INTEL_ENDPOINT: str = ""
    AZURE_DOC_INTEL_KEY: str = ""
    AZURE_STORAGE_CONNECTION_STRING: str = ""
    AZURE_STORAGE_CONTAINER: str = "evidence-files"

    # LLM Service Configuration (Gemini, OpenRouter, or Local Mock)
    LLM_PROVIDER: str = "mock"  # "gemini", "openrouter", "mock"
    LLM_MODEL: str = "gemini-2.5-flash"
    LLM_API_KEY: str = ""
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    GEMINI_BASE_URL: str = "https://generativelanguage.googleapis.com/v1beta"

settings = Settings()
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
