from sqlalchemy import Column, String, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship
from pydantic import BaseModel
from .models import Base

class Invitation(Base):
    __tablename__ = "Invitation"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True, nullable=False)
    site_id = Column(Integer, ForeignKey("Site.idSite"), nullable=False)  # Ensure FK is correct
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="pending")
    token = Column(String, unique=True)

    site = relationship("Site", back_populates="invitations")
    owner = relationship("User", back_populates="invitations")