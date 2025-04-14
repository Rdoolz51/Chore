from sqlalchemy import Column, Integer, String, DateTime, func, ForeignKey
from sqlalchemy.orm import relationship
from .db import Base

class Chore(Base):
    __tablename__ = "chores"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    points = Column(Integer, default=0)
    assigned_to = Column(String, default="Unassigned")
    created_at = Column(DateTime, default=func.now())
    completed_at = Column(DateTime, nullable=True)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String, nullable=True)
    email = Column(String, unique=True, index=True, nullable=True)
    role = Column(String)  # "parent", "spouse", "child"
    parent_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    parent = relationship("User", remote_side=[id], backref="children", foreign_keys=[parent_id])
