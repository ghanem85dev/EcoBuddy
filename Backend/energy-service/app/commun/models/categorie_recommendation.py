from sqlalchemy.orm import relationship
from pydantic import BaseModel
from .models import Base

class Categorie_Recommendation(Base):
    __tablename__ = "Categorie_Recommendation"

    idCategorieRecommendation = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nom = Column(String, nullable=False)
    description = Column(String, nullable=False)
    recommendations = relationship("Recommendation", back_populates="categorie")