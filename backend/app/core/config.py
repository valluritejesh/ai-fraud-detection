from pathlib import Path
from typing import List
from pydantic import ConfigDict
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    model_config = ConfigDict(extra="ignore", env_file=".env")

    PROJECT_NAME: str = "AI Fraud Detection Agent Platform"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Environment & Deployment
    ENVIRONMENT: str = "development"  # "development", "staging", "production"
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # Storage
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    MAX_UPLOAD_SIZE_MB: int = 25
    ALLOWED_EXTENSIONS: List[str] = [".pdf", ".jpg", ".jpeg", ".png", ".json", ".txt"]
    STORAGE_PROVIDER: str = "local"  # "local", "azure_blob"
    AZURE_STORAGE_ACCOUNT: str = ""
    AZURE_STORAGE_CONNECTION_STRING: str = ""
    AZURE_STORAGE_CONTAINER: str = "evidence-files"

    # Database (SQLite locally, Azure PostgreSQL / Azure SQL in production)
    DATABASE_URL: str = "sqlite+aiosqlite:///./fraud_detection.db"
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20

    # Security & CORS
    SECRET_KEY: str = "secret-key-change-in-production-fraud-guard-2026"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    ALGORITHM: str = "HS256"
    AUTH_ENABLED: bool = False
    DEV_AUTH_BYPASS: bool = True
    ENTRA_TENANT_ID: str = ""
    ENTRA_CLIENT_ID: str = ""
    ENTRA_AUDIENCE: str = ""
    ENTRA_ISSUER: str = ""
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:8000",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8000",
    ]

    @property
    def cors_origins_list(self) -> List[str]:
        if isinstance(self.CORS_ORIGINS, str):
            return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]
        return self.CORS_ORIGINS

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

    # LLM Service Configuration (Gemini, OpenRouter, or Local Mock)
    LLM_PROVIDER: str = "mock"  # "gemini", "openrouter", "mock"
    LLM_MODEL: str = "gemini-2.5-flash"
    LLM_API_KEY: str = ""
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    GEMINI_BASE_URL: str = "https://generativelanguage.googleapis.com/v1beta"

settings = Settings()
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
