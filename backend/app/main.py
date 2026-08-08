from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logging import setup_logging
from app.middleware.telemetry import TelemetryMiddleware
from app.api.v1.router import api_router

# Setup structured JSON logging
setup_logging()

from sqlalchemy import text
from app.core.database import async_engine, Base
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Run database initialization on startup
    async with async_engine.begin() as conn:
        # 1. Ensure the pgvector extension exists
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        # 2. Automatically create all tables (so alembic isn't strictly required for first deploy)
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    description="""
    DealLens — AI Investment Research & Due-Diligence System API.
    Provides document ingestion, pgvector hybrid search, strict citation provenance verification,
    and explicit state-machine workflow orchestration for investment due diligence.
    """,
    lifespan=lifespan,
)

# Set CORS origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Set Telemetry & Observability Middleware
app.add_middleware(TelemetryMiddleware)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENV
    }
