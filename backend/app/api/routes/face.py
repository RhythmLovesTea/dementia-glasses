"""
face.py — /api/face
  POST /register   – upload a face photo, encode it, create Person row
  POST /recognize  – upload a frame, return matched person_id or null
  GET  /photo/{filename} – serve stored face images
"""
import os
import uuid
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.face_service import register_face_encoding, recognize_face_encoding
from app.services.memory_service import get_person_by_face_index, create_person, update_person_face_index
from app.utils.image_utils import save_upload, build_photo_url
from app.config import FACES_DIR

router = APIRouter()


@router.post("/register")
async def register_face(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Save the uploaded image, encode the face, and return face_index.
    The frontend follows this with POST /api/memory/people to attach metadata.
    """
    # Use a unique filename to avoid collisions
    ext = os.path.splitext(file.filename or "face.jpg")[1] or ".jpg"
    unique_name = f"{uuid.uuid4().hex}{ext}"
    image_path = save_upload(file, unique_name)

    face_index = register_face_encoding(image_path)
    if face_index is None:
        raise HTTPException(status_code=422, detail="No face detected in the uploaded image.")

    photo_url = build_photo_url(unique_name)
    return {"face_index": face_index, "photo_url": photo_url}


@router.post("/recognize")
async def recognize_face(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Encode the uploaded frame and find the closest registered face.
    Returns the DB person_id (not face_index) so the frontend can fetch
    /api/memory/people/{person_id}.
    """
    ext = os.path.splitext(file.filename or "frame.jpg")[1] or ".jpg"
    unique_name = f"tmp_{uuid.uuid4().hex}{ext}"
    image_path = save_upload(file, unique_name)

    try:
        face_index = recognize_face_encoding(image_path)
    finally:
        # Clean up the temporary frame
        try:
            os.unlink(image_path)
        except OSError:
            pass

    if face_index is None:
        return {"match_id": None}

    person = get_person_by_face_index(db, face_index)
    if person is None:
        return {"match_id": None}

    return {"match_id": person.id}


@router.get("/photo/{filename}")
async def get_photo(filename: str):
    """Serve a stored face image."""
    path = str(FACES_DIR / filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Photo not found.")
    return FileResponse(path, media_type="image/jpeg")
