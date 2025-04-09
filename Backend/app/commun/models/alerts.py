from sqlalchemy import Column, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from .models import Base

class Alertes(Base):
    __tablename__ = "Alertes"

    idAlerte = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    categorie_alert_id = Column(Integer, ForeignKey('Categorie_Alerte.idCategorieAlerte'), nullable=False)
    date_alerte = Column(DateTime, default=datetime.now)

    user = relationship("User", back_populates="alertes")
    categorie = relationship("Categorie_Alerte", back_populates="alertes")  