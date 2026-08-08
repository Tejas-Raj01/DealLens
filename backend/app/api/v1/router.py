from fastapi import APIRouter
from app.api.v1.endpoints import documents, questions, workflows

api_router = APIRouter()
api_router.include_router(documents.router)
api_router.include_router(questions.router)
api_router.include_router(workflows.router)
