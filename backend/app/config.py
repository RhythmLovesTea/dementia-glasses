import os
from pathlib import Path

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent.parent  # repo root

DATA_DIR = BASE_DIR / "data"
FACES_DIR = DATA_DIR / "faces"
EMBEDDINGS_DIR = DATA_DIR / "embeddings"
DB_DIR = DATA_DIR / "db"

# Ensure directories exist
for d in [FACES_DIR, EMBEDDINGS_DIR, DB_DIR]:
    d.mkdir(parents=True, exist_ok=True)

ENCODINGS_FILE = str(EMBEDDINGS_DIR / "encodings.npy")
PEOPLE_FILE = str(EMBEDDINGS_DIR / "people.json")

# ── Database ──────────────────────────────────────────────────────────────────
DATABASE_URL = f"sqlite:///{DB_DIR / 'dementia.db'}"

# ── AI Keys ───────────────────────────────────────────────────────────────────
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# ── CORS ──────────────────────────────────────────────────────────────────────
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:4173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
]
