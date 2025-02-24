from sqlalchemy import Column, String, Integer, ForeignKey,JSON
from sqlalchemy.orm import relationship
from pydantic import BaseModel
from .models import Base

class UserPreference(Base):
    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    chart_positions = Column(JSON, nullable=False)  # Stockage en format JSON

    user = relationship("User", back_populates="preferences")
    
