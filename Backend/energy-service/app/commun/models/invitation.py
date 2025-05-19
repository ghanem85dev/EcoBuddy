from sqlalchemy import Column, String, DateTime,Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship
from pydantic import BaseModel
from sqlalchemy.sql import func
from .models import Base

class Invitation(Base):
    __tablename__ = "Invitation"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True, nullable=False)
    site_id = Column(Integer, ForeignKey("Site.idSite"), nullable=False)  # Ensure FK is correct
    # owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="pending")
    token = Column(String, unique=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    site = relationship("Site", back_populates="invitations")
    #owner = relationship("User", back_populates="invitations")