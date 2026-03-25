"""
user.py — placeholder for a future User/Caregiver model.

At present DementiaGlasses is a single-user device.  If you want to add
multi-user support (e.g. multiple caregivers each with their own login),
uncomment the model below and add the corresponding Alembic migration.
"""

# from datetime import datetime
# from sqlalchemy import Column, Integer, String, Boolean, DateTime
# from app.db.base import Base
#
#
# class User(Base):
#     """A caregiver account with login credentials."""
#     __tablename__ = "users"
#
#     id         = Column(Integer, primary_key=True, index=True)
#     email      = Column(String(255), unique=True, nullable=False, index=True)
#     name       = Column(String(120), nullable=False)
#     hashed_pw  = Column(String(256), nullable=False)
#     is_active  = Column(Boolean, default=True)
#     created_at = Column(DateTime, default=datetime.utcnow)
#
#     def to_dict(self):
#         return {
#             "id": self.id,
#             "email": self.email,
#             "name": self.name,
#             "is_active": self.is_active,
#             "created_at": self.created_at.isoformat() if self.created_at else None,
#         }
