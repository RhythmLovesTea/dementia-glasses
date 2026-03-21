# backend/app/main.py

from fastapi import FastAPI
from app.api.routes import face

app = FastAPI()

app.include_router(face.router, prefix="/face", tags=["Face"])
