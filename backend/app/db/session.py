from typing import Generator
from app.db.base import SessionLocal


def get_db() -> Generator:
    """FastAPI dependency that yields a DB session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
