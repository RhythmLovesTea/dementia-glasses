# backend/app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import CORS_ORIGINS
from app.db.base import create_tables
from app.api.routes import face, memory, conversation, health

app = FastAPI(
    title="DementiaGlasses API",
    description="Backend for the DementiaGlasses assistive AI device.",
    version="1.0.0",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Startup ───────────────────────────────────────────────────────────────────
@app.on_event("startup")
def on_startup():
    create_tables()

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(face.router,         prefix="/api/face",         tags=["Face"])
app.include_router(memory.router,       prefix="/api/memory",       tags=["Memory"])
app.include_router(conversation.router, prefix="/api/conversation",  tags=["Conversation"])
app.include_router(health.router,       prefix="/api",              tags=["Health"])
