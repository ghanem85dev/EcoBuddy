from sqlalchemy import Column, String, Integer, ForeignKey, Float, LargeBinary
from sqlalchemy.orm import relationship
from app.commun.models.models import Base

class Site(Base):
    __tablename__ = "Site"

    idSite = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nom = Column(String, nullable=False)
    adresse = Column(String, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)  # Correction: longitude au lieu de longtitude
    idCategorieSite = Column(Integer, ForeignKey("Categorie_Site.idCategorieSite"), nullable=False)
    idUser = Column(Integer, ForeignKey("users.id"), nullable=False)  # Propriétaire
    idEntreprise = Column(Integer, ForeignKey("Entreprise.idEntreprise"), nullable=True)
    idResponsable = Column(Integer, ForeignKey("users.id"), nullable=True)  # Responsable
    certificat_propriete = Column(LargeBinary, nullable=True)
    certificat_propriete_nom = Column(String, nullable=True)
    statut_approbation = Column(String, default="en_attente")

    # Relations
    categorie = relationship("Categorie_Site", back_populates="sites")
    owner = relationship(
        "User", 
        back_populates="owned_sites",
        foreign_keys=[idUser]
    )
    appareils = relationship("Appareil", back_populates="site")
    invitations = relationship("Invitation", back_populates="site")
    users = relationship("UserSite", back_populates="site")
    entreprise = relationship("Entreprise", back_populates="sites")
    responsable = relationship(
        "User", 
        back_populates="managed_sites",
        foreign_keys=[idResponsable]
    )