from fastapi import APIRouter
from app.db.base import engine

router = APIRouter()


@router.get("/health")
def health_check():
    return {"status": "ok", "db": str(engine.url)}
