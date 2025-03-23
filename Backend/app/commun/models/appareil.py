from sqlalchemy import Column, String, Integer, ForeignKey, JSON , Float
from sqlalchemy.orm import relationship
from pydantic import BaseModel
from .models import Base

class Appareil(Base):
    __tablename__ = "Appareil"

    idAppareil = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nom = Column(String, nullable=False)
    marque = Column(String, nullable=False)
    modele = Column(String, nullable=False)
    puissance = Column(Float, nullable=False)
    idCategorieAppareil = Column(Integer, ForeignKey("Categorie_Appareil.idCategorieAppareil"), nullable=False)
    idSite = Column(Integer, ForeignKey("Site.idSite"), nullable=False) 

    categorie = relationship("Categorie_Appareil", back_populates="appareils")
    consommations = relationship("Consommation", back_populates="appareil")
    site = relationship("Site", back_populates="appareils")