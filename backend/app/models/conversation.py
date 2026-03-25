from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from app.db.base import Base


class Memory(Base):
    """A memory/note attached to a person."""
    __tablename__ = "memories"

    id = Column(Integer, primary_key=True, index=True)
    person_id = Column(Integer, ForeignKey("people.id"), nullable=False, index=True)
    type = Column(String(20), default="note")  # note | audio | image | event
    title = Column(String(200), nullable=True)
    content = Column(Text, nullable=True)
    audio_url = Column(String(512), nullable=True)
    image_url = Column(String(512), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "person_id": self.person_id,
            "type": self.type,
            "title": self.title,
            "content": self.content,
            "audio_url": self.audio_url,
            "image_url": self.image_url,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Conversation(Base):
    """A conversation entry (transcript + AI response)."""
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    person_id = Column(Integer, ForeignKey("people.id"), nullable=True, index=True)
    transcript = Column(Text, nullable=True)
    response = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "person_id": self.person_id,
            "transcript": self.transcript,
            "response": self.response,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
