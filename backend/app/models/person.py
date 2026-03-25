from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from app.db.base import Base


class Person(Base):
    __tablename__ = "people"

    id = Column(Integer, primary_key=True, index=True)
    # face_index is the position in the numpy encodings array
    face_index = Column(Integer, unique=True, nullable=True)
    name = Column(String(120), nullable=False)
    relationship = Column(String(120), nullable=True)
    notes = Column(Text, nullable=True)
    photo_path = Column(String(512), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "person_id": self.id,
            "face_index": self.face_index,
            "name": self.name,
            "relationship": self.relationship,
            "notes": self.notes,
            "photo_path": self.photo_path,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
