from sqlalchemy import Column, String, Integer, ForeignKey, JSON, Float, LargeBinary, Boolean
from sqlalchemy.orm import relationship
from pydantic import BaseModel
from app.commun.models.models import Base

class Entreprise(Base):
    __tablename__ = "Entreprise"

    idEntreprise = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nom = Column(String, nullable=False)
    taille = Column(String, nullable=False)
    certificat_propriete = Column(LargeBinary, nullable=True)
    certificat_propriete_nom = Column(String, nullable=True)
    statut_approbation = Column(String, default="en_attente")  # Nouveau champ avec 3 valeurs possibles
    est_archive = Column(Boolean , default=False)
    secteur_id = Column(Integer, ForeignKey('Secteur.idSecteur'), nullable=False)
    secteur = relationship("Secteur", back_populates="entreprises")  
    sites = relationship("Site", back_populates="entreprise")
