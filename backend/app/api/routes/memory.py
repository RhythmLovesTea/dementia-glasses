"""
memory.py — /api/memory
  GET    /people                        – list all people
  POST   /people                        – create a person (with face_index)
  GET    /people/{person_id}            – get single person
  DELETE /people/{person_id}            – delete a person and all their data
  PUT    /people/{person_id}            – update a person's details
  GET    /{person_id}                   – list memories for person
  POST   /{person_id}                   – add a memory for person
  DELETE /{person_id}/memories/{mem_id} – delete a single memory
  GET    /{person_id}/summary           – AI summary of memories
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services import memory_service
from app.services.summarizer import summarise_memories

router = APIRouter()


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class CreatePersonRequest(BaseModel):
    name: str
    relationship: str | None = None
    notes: str | None = None
    photo_url: str | None = None
    face_index: int | None = None


class CreateMemoryRequest(BaseModel):
    type: str = "note"
    title: str | None = None
    content: str | None = None
    audio_url: str | None = None
    image_url: str | None = None


# ── People endpoints ──────────────────────────────────────────────────────────

@router.get("/people")
def list_people(db: Session = Depends(get_db)):
    people = memory_service.get_all_people(db)
    return [p.to_dict() for p in people]


@router.post("/people", status_code=201)
def create_person(body: CreatePersonRequest, db: Session = Depends(get_db)):
    person = memory_service.create_person(
        db,
        name=body.name,
        relationship=body.relationship,
        notes=body.notes,
        photo_path=body.photo_url,
        face_index=body.face_index,
    )
    return person.to_dict()


@router.get("/people/{person_id}")
def get_person(person_id: int, db: Session = Depends(get_db)):
    person = memory_service.get_person_by_id(db, person_id)
    if not person:
        raise HTTPException(status_code=404, detail="Person not found.")
    return person.to_dict()


@router.put("/people/{person_id}")
def update_person(person_id: int, body: CreatePersonRequest, db: Session = Depends(get_db)):
    person = memory_service.get_person_by_id(db, person_id)
    if not person:
        raise HTTPException(status_code=404, detail="Person not found.")
    if body.name:
        person.name = body.name
    if body.relationship is not None:
        person.relationship = body.relationship
    if body.notes is not None:
        person.notes = body.notes
    if body.photo_url is not None:
        person.photo_path = body.photo_url
    db.commit()
    db.refresh(person)
    return person.to_dict()


@router.delete("/people/{person_id}", status_code=204)
def delete_person(person_id: int, db: Session = Depends(get_db)):
    person = memory_service.get_person_by_id(db, person_id)
    if not person:
        raise HTTPException(status_code=404, detail="Person not found.")
    memory_service.delete_person(db, person_id)
    return None


# ── Memory endpoints ──────────────────────────────────────────────────────────

@router.get("/{person_id}")
def get_memories(person_id: int, db: Session = Depends(get_db)):
    person = memory_service.get_person_by_id(db, person_id)
    if not person:
        raise HTTPException(status_code=404, detail="Person not found.")
    memories = memory_service.get_memories_for_person(db, person_id)
    return [m.to_dict() for m in memories]


@router.post("/{person_id}", status_code=201)
def add_memory(person_id: int, body: CreateMemoryRequest, db: Session = Depends(get_db)):
    person = memory_service.get_person_by_id(db, person_id)
    if not person:
        raise HTTPException(status_code=404, detail="Person not found.")
    memory = memory_service.add_memory(
        db,
        person_id=person_id,
        type=body.type,
        title=body.title,
        content=body.content,
        audio_url=body.audio_url,
        image_url=body.image_url,
    )
    return memory.to_dict()


@router.delete("/{person_id}/memories/{memory_id}", status_code=204)
def delete_memory(person_id: int, memory_id: int, db: Session = Depends(get_db)):
    deleted = memory_service.delete_memory(db, memory_id, person_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Memory not found.")
    return None


@router.get("/{person_id}/summary")
def get_memory_summary(person_id: int, db: Session = Depends(get_db)):
    person = memory_service.get_person_by_id(db, person_id)
    if not person:
        raise HTTPException(status_code=404, detail="Person not found.")
    memories = memory_service.get_memories_for_person(db, person_id)
    summary = summarise_memories(person.name, [m.to_dict() for m in memories])
    return {"summary": summary}
