from sqlalchemy import Column, String, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship
from pydantic import BaseModel
from .models import Base

class UserSite(Base):
    __tablename__ = "user_sites"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    site_id = Column(Integer, ForeignKey("Site.idSite"))
    role = Column(String, default="viewer")  # owner, editor, viewer

    site = relationship("Site", back_populates="users")