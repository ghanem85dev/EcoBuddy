from sqlalchemy import Column, String, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship
from pydantic import BaseModel
from .models import Base

class Site(Base):
    __tablename__ = "Site"  # Ensure table name is consistent

    idSite = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nom = Column(String, nullable=False)
    adresse = Column(String, nullable=False)
    idCategorieSite = Column(Integer, ForeignKey("Categorie_Site.idCategorieSite"), nullable=False)
    idUser = Column(Integer, ForeignKey("users.id"), nullable=False)

    categorie = relationship("Categorie_Site", back_populates="sites")
    user = relationship("User", back_populates="sites")
    appareils = relationship("Appareil", back_populates="site")
    invitations = relationship("Invitation", back_populates="site")
    users = relationship("UserSite", back_populates="site")