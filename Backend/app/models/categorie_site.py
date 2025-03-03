from sqlalchemy import Column, String, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship
from pydantic import BaseModel
from .models import Base

class Categorie_Site(Base):
    __tablename__ = "Categorie_Site"

    idCategorieSite = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nom = Column(String, nullable=False)
    sites = relationship("Site", back_populates="categorie")