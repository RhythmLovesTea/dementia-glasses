import os
import shutil
from pathlib import Path
from app.config import FACES_DIR


def save_upload(upload_file, dest_name: str) -> str:
    """
    Save an uploaded file to the faces data directory.
    Returns the absolute path string.
    """
    dest = FACES_DIR / dest_name
    with open(dest, "wb") as f:
        shutil.copyfileobj(upload_file.file, f)
    return str(dest)


def build_photo_url(filename: str) -> str:
    """Return the URL path that the backend serves for a stored face image."""
    return f"/api/face/photo/{filename}"
