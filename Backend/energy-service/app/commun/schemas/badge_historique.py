from pydantic import BaseModel
from datetime import date
from typing import Optional

class BadgeHistoriqueBase(BaseModel):
    idUser: int
    idBadge: int | None

class BadgeHistoriqueCreate(BadgeHistoriqueBase):
    pass

class BadgeHistoriqueResponse(BadgeHistoriqueBase):
    idBadgeHistorique: int
    date: date
    
    class Config:
        from_attributes = True


class BadgeHistoriqueWithBadgeResponse(BaseModel):
    idBadgeHistorique: int
    date: date
    idUser: int
    idBadge: Optional[int]
    badge: Optional['BadgeResponse']  # Référence circulaire
    
    class Config:
        from_attributes = True

class BadgeBase(BaseModel):
    titre: str
    minPoints: int
    description: str

class BadgeResponse(BadgeBase):
    idBadge: int
    
    class Config:
        from_attributes = True

# Résolution de la référence circulaire
BadgeHistoriqueWithBadgeResponse.update_forward_refs()