from sqlalchemy import Column, String, Integer, ForeignKey, Float, Date
from sqlalchemy.orm import relationship
from app.commun.models.models import Base

class Récompense(Base):
    __tablename__ = "Récompense"
    
    idRécompense = Column(Integer, primary_key=True, index=True, autoincrement=True)
    date = Column(Date, nullable=False)
    
    
    idSite = Column(Integer, ForeignKey("Site.idSite"), nullable=False)
    site = relationship("Site", back_populates="recompenses")
    
    
    idDefi = Column(Integer, ForeignKey("Défi.idDefi"), nullable=True)
    defi = relationship("Défi", back_populates="recompenses")