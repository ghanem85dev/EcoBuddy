from sqlalchemy import Column, Integer, Float, Date, ForeignKey
from sqlalchemy.orm import relationship
from .models import Base

class Consommation(Base):
    __tablename__ = "Consommation"

    idConsommation = Column(Integer, primary_key=True, index=True, autoincrement=True)
    quantite = Column(Float, nullable=False)
    jour = Column(Date, nullable=False)
    idAppareil = Column(Integer, ForeignKey("Appareil.idAppareil"), nullable=False)

    appareil = relationship("Appareil", back_populates="consommations")
