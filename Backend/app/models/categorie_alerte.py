from sqlalchemy import Column, String, Integer
from sqlalchemy.orm import relationship
from .models import Base

class Categorie_Alerte(Base):
    __tablename__ = "Categorie_Alerte"

    idCategorieAlerte = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nom = Column(String, nullable=False)

    alertes = relationship("Alertes", back_populates="categorie")