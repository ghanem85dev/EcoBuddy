from sqlalchemy import Column, String, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship
from pydantic import BaseModel
from .models import Base

class Categorie_Appareil(Base):
    __tablename__ = "Categorie_Appareil"

    idCategorieAppareil = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nom = Column(String, nullable=False)
    description = Column(String, nullable=False)
    appareils = relationship("Appareil", back_populates="categorie")