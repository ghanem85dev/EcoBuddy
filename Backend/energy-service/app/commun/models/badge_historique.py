from sqlalchemy import Column, String, Integer, ForeignKey, Float, Date
from sqlalchemy.orm import relationship
from app.commun.models.models import Base

class BadgeHistorique(Base):
    __tablename__ = "BadgeHistorique"
    
    idBadgeHistorique = Column(Integer, primary_key=True, index=True, autoincrement=True)
    date = Column(Date, nullable=False)
    
    
    idUser = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("User", back_populates="historiqueBadges")
    
    
    idBadge = Column(Integer, ForeignKey("Badge.idBadge"), nullable=True)
    badge = relationship("Badge", back_populates="historiqueBadges")