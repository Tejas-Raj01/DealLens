from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "DealLens AI Investment Research & Due-Diligence System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENV: str = "development"
    DEBUG: bool = True

    # Database Settings
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "deallens"
    POSTGRES_PASSWORD: str = "deallens_secret_123"
    POSTGRES_DB: str = "deallens_db"
    POSTGRES_PORT: int = 5432
    
    # Optional direct URL override (e.g. from Render)
    DATABASE_URL_OVERRIDE: Optional[str] = None

    @property
    def DATABASE_URL(self) -> str:
        # If Render sets DATABASE_URL in env, Pydantic needs it mapped or we can just read from os.environ
        import os
        env_db_url = os.getenv("DATABASE_URL")
        if env_db_url:
            if env_db_url.startswith("postgres://"):
                env_db_url = env_db_url.replace("postgres://", "postgresql+asyncpg://", 1)
            elif env_db_url.startswith("postgresql://"):
                env_db_url = env_db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
            return env_db_url
            
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    @property
    def SYNC_DATABASE_URL(self) -> str:
        import os
        env_db_url = os.getenv("DATABASE_URL")
        if env_db_url:
            if env_db_url.startswith("postgres://"):
                env_db_url = env_db_url.replace("postgres://", "postgresql+psycopg2://", 1)
            elif env_db_url.startswith("postgresql://"):
                env_db_url = env_db_url.replace("postgresql://", "postgresql+psycopg2://", 1)
            elif env_db_url.startswith("postgresql+asyncpg://"):
                env_db_url = env_db_url.replace("postgresql+asyncpg://", "postgresql+psycopg2://", 1)
            return env_db_url
            
        return f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # Redis Settings
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    
    @property
    def REDIS_URL(self) -> str:
        import os
        env_redis = os.getenv("REDIS_URL")
        if env_redis:
            # Render internal redis URLs might be redis://red-...:6379
            return env_redis
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/0"

    # Object Storage (MinIO / S3)
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET_NAME: str = "deallens-documents"
    MINIO_SECURE: bool = False

    # AI / Embedding Settings
    OPENAI_API_KEY: Optional[str] = None
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    EMBEDDING_DIMENSION: int = 1536
    LLM_MODEL: str = "gpt-4o-mini"

    # Vector & Retrieval Defaults
    TOP_K_RETRIEVAL: int = 5
    CHUNK_SIZE: int = 500
    CHUNK_OVERLAP: int = 50

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
