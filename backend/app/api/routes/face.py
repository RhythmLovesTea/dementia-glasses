# backend/app/api/routes/face.py

from fastapi import APIRouter, UploadFile, File
import shutil

from app.services.face_service import register_face, recognize_face

router = APIRouter()

@router.post("/register")
async def register(file: UploadFile = File(...)):
    path = f"data/faces/{file.filename}"

    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    idx = register_face(path)

    return {"person_id": idx}


@router.post("/recognize")
async def recognize(file: UploadFile = File(...)):
    path = f"data/faces/{file.filename}"

    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    idx = recognize_face(path)

    return {"match_id": idx}
