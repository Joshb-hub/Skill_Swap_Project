from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
import os


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    PROJECT_NAME: str = "SkillSwap"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api"

    # Security
    SECRET_KEY: str = "skillswap-super-secret-development-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # PostgreSQL is the production target; the env var must be provided in deployment.
    # Keep SQLite only as a safe local compatibility fallback when no DATABASE_URL is set.
    DATABASE_URL: str = ""

    # Redis (Rate limit, session tracking, pub/sub)
    REDIS_URL: Optional[str] = "redis://localhost:6379/0"

    # Rate Limiting & Lockout
    LOGIN_RATE_LIMIT_MAX_ATTEMPTS: int = 10
    LOGIN_LOCKOUT_DURATION_MINUTES: int = 15

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    @property
    def cors_origins_list(self) -> List[str]:
        if not self.CORS_ORIGINS:
            return ["*"]
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def effective_database_url(self) -> str:
        return self.DATABASE_URL or "sqlite+aiosqlite:///./skillswap.db"

    # File uploads
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 10
    ALLOWED_EXTENSIONS: List[str] = ["jpg", "jpeg", "png", "gif", "webp", "pdf", "docx", "txt"]

    FRONTEND_URL: str = "http://localhost:3000"


settings = Settings()

# Ensure uploads directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
