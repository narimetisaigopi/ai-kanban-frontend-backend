from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str  # No default - must be provided via DATABASE_URL env var

    @field_validator("database_url", mode="after")
    @classmethod
    def convert_to_asyncpg(cls, v: str) -> str:
        if v.startswith("postgresql://"):
            return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    demo_email: str = "demo@kanban.app"
    demo_password: str = "demo1234"

    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24

    openrouter_api_key: str = ""
    openrouter_model: str = "nex-agi/nex-n2-pro:free"
    openrouter_url: str = "https://openrouter.ai/api/v1/chat/completions"

    cors_origins: str = "http://localhost:3000"
    cors_origin_regex: str = r"^https://([a-z0-9-]+\.)?vercel\.app$|^http://localhost(:\d+)?$"

    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        if not isinstance(value, str):
            return value
        if value.startswith("postgres://"):
            value = value.replace("postgres://", "postgresql://", 1)
        if value.startswith("postgresql://") and "+asyncpg" not in value:
            value = value.replace("postgresql://", "postgresql+asyncpg://", 1)
        return value


settings = Settings()
