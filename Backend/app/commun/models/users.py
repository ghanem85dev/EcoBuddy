from sqlalchemy import Column, String, Integer, ForeignKey, JSON,Float
from sqlalchemy.orm import relationship
from pydantic import BaseModel
from .models import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    budget_max = Column(Float, nullable=True)
    role = Column(String, nullable=False)
    preferences = relationship("UserPreference", back_populates="user", uselist=False)
    sites = relationship("Site", back_populates="user")

    invitations = relationship("Invitation", back_populates="owner")
    alertes = relationship("Alertes", back_populates="user")