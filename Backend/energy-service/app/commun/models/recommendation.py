from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class Recommendation(BaseModel):
    id: str
    user_id: int
    title: str
    message: str
    priority: int  # 1-5 (1=highest)
    categorie_recommendation_id = Column(Integer, ForeignKey('Categorie_Recommendation.idCategorieRecommendation'), nullable=False)
    created_at: datetime
    is_read: bool = False
    action_items: List[str] = []
    
    categorie = relationship("Categorie_Recommendation", back_populates="recommendations")