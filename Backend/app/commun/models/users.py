from sqlalchemy import Column, String, Integer, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.commun.models.models import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    budget_max = Column(Float, nullable=True)
    role = Column(String, nullable=False)
    
    # Relations
    preferences = relationship("UserPreference", back_populates="user", uselist=False)
    
    # Sites où l'user est propriétaire
    owned_sites = relationship(
        "Site", 
        back_populates="owner",
        foreign_keys="[Site.idUser]"
    )
    
    # Sites où l'user est responsable
    managed_sites = relationship(
        "Site", 
        back_populates="responsable",
        foreign_keys="[Site.idResponsable]"
    )
    
    invitations = relationship("Invitation", back_populates="owner")
    alertes = relationship("Alertes", back_populates="user")