from sqlalchemy import Column, String, Integer, ForeignKey, Float, Date, Boolean,Time
from sqlalchemy import Enum as SQLAEnum
from sqlalchemy.orm import relationship
from app.commun.models.models import Base
from enum import Enum as PythonEnum

class Badge(Base):
    __tablename__ = "Badge"
    
    idBadge = Column(Integer, primary_key=True, index=True, autoincrement=True)
    titre = Column(String)
    minPoints = Column(Integer)
    description = Column(String)
    
    historiqueBadges = relationship("BadgeHistorique", back_populates="badge")