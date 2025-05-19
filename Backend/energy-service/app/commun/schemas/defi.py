from datetime import date, time
from typing import List, Optional,Literal
from enum import Enum
from pydantic import BaseModel

class TypeCondition(str, Enum):
    REDUCTION_POURCENTAGE = "reduction_pourcentage"
    LIMITE_ABSOLUE = "limite_absolue"

class DefiBase(BaseModel):
    titre: str
    points: int
    description: str
    cible: str
    active: bool = True

class DefiCreate(DefiBase):
    mode_recurrence: Optional[str] = None
    date_debut_base: Optional[date] = None
    heure_debut: Optional[str] = None  # Format "HH:MM" ou "HHMM"
    heure_fin: Optional[str] = None
    duree_jours: Optional[int] = None
    type_condition: Literal["REDUCTION_POURCENTAGE", "LIMITE_ABSOLUE"]
    valeur_cible: float
    periode_comparaison: Optional[str] = None
    categories: Optional[List[int]] = None

class DefiUpdate(BaseModel):
    titre: Optional[str] = None
    points: Optional[int] = None
    description: Optional[str] = None
    cible: Optional[str] = None
    active: Optional[bool] = None
    mode_recurrence: Optional[str] = None
    date_debut_base: Optional[date] = None
    heure_debut: Optional[str] = None
    heure_fin: Optional[str] = None
    duree_jours: Optional[int] = None
    type_condition: Optional[TypeCondition] = None
    valeur_cible: Optional[float] = None
    periode_comparaison: Optional[str] = None
    categories: Optional[List[int]] = None

class DefiResponse(BaseModel):
    message: str
    data: dict
    success: bool

class DefiListResponse(BaseModel):
    message: str
    data: List[dict]
    success: bool
    count: int