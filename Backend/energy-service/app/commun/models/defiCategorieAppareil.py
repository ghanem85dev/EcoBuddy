from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.commun.models.models import Base


class DefiCategorieAppareil(Base):
    __tablename__ = "DefiCategorieAppareil"
    
    idDefi = Column(Integer, ForeignKey('Défi.idDefi'), primary_key=True)
    idCategorie = Column(Integer, ForeignKey('Categorie_Appareil.idCategorieAppareil'), primary_key=True)
    
    
    defi = relationship("Défi", back_populates="categories_associees")
    categorie = relationship("Categorie_Appareil", back_populates="defis")