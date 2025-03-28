from sqlalchemy import Column, String, Integer
from sqlalchemy.orm import relationship
from app.commun.models.models import Base

class Secteur(Base):
    __tablename__ = "Secteur"

    idSecteur = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nom = Column(String, nullable=False)

    entreprises = relationship("Entreprise", back_populates="secteur")