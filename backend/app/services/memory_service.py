"""
memory_service.py
CRUD operations for Person and Memory records via SQLAlchemy.
"""
from sqlalchemy.orm import Session

from app.models.person import Person
from app.models.conversation import Memory


# ── People ────────────────────────────────────────────────────────────────────

def get_all_people(db: Session) -> list[Person]:
    return db.query(Person).order_by(Person.name).all()


def get_person_by_id(db: Session, person_id: int) -> Person | None:
    return db.query(Person).filter(Person.id == person_id).first()


def get_person_by_face_index(db: Session, face_index: int) -> Person | None:
    return db.query(Person).filter(Person.face_index == face_index).first()


def create_person(
    db: Session,
    name: str,
    relationship: str | None = None,
    notes: str | None = None,
    photo_path: str | None = None,
    face_index: int | None = None,
) -> Person:
    person = Person(
        name=name,
        relationship=relationship,
        notes=notes,
        photo_path=photo_path,
        face_index=face_index,
    )
    db.add(person)
    db.commit()
    db.refresh(person)
    return person


def update_person_face_index(db: Session, person_id: int, face_index: int) -> Person | None:
    person = get_person_by_id(db, person_id)
    if person:
        person.face_index = face_index
        db.commit()
        db.refresh(person)
    return person


# ── Memories ──────────────────────────────────────────────────────────────────

def get_memories_for_person(db: Session, person_id: int) -> list[Memory]:
    return (
        db.query(Memory)
        .filter(Memory.person_id == person_id)
        .order_by(Memory.created_at.desc())
        .all()
    )


def delete_person(db: Session, person_id: int) -> bool:
    """Delete a person and all their associated memories."""
    # Delete memories first (SQLite doesn't enforce FK constraints by default)
    db.query(Memory).filter(Memory.person_id == person_id).delete()
    person = get_person_by_id(db, person_id)
    if person:
        db.delete(person)
        db.commit()
        return True
    return False


def delete_memory(db: Session, memory_id: int, person_id: int | None = None) -> bool:
    """Delete a single memory.  Optionally verify it belongs to *person_id*."""
    q = db.query(Memory).filter(Memory.id == memory_id)
    if person_id is not None:
        q = q.filter(Memory.person_id == person_id)
    memory = q.first()
    if memory is None:
        return False
    db.delete(memory)
    db.commit()
    return True


def add_memory(
    db: Session,
    person_id: int,
    type: str = "note",
    title: str | None = None,
    content: str | None = None,
    audio_url: str | None = None,
    image_url: str | None = None,
) -> Memory:
    memory = Memory(
        person_id=person_id,
        type=type,
        title=title,
        content=content,
        audio_url=audio_url,
        image_url=image_url,
    )
    db.add(memory)
    db.commit()
    db.refresh(memory)
    return memory
