from datetime import date
from typing import Optional, List
from pydantic import BaseModel

class DefiInfo(BaseModel):
    idDefi: Optional[int] = None
    titre: Optional[str] = None
    points: Optional[int] = None

class UserInfo(BaseModel):
    idUser: int
    nom: Optional[str] = None  # Make these Optional to handle NULL values
    prenom: Optional[str] = None

class SiteInfo(BaseModel):
    idSite: int
    nom: str
    user: UserInfo

class RecompenseBase(BaseModel):
    date: date
    idSite: int
    idDefi: Optional[int] = None

class RecompenseCreate(RecompenseBase):
    pass

class Recompense(RecompenseBase):
    idRecompense: int

    class Config:
        orm_mode = True
        allow_population_by_field_name = True
        fields = {
            'idRecompense': 'idRécompense'  # Permet le mapping entre les noms différents
        }

class RecompenseWithDetails(BaseModel):
    idRecompense: int
    date: date
    defi: Optional[DefiInfo] = None
    site: SiteInfo
    
    class Config:
        orm_mode = True
        allow_population_by_field_name = True
        fields = {
            'idRecompense': {'alias': 'idRécompense'}
        }
class PointsDetail(BaseModel):
    idSite: Optional[int] = None
    nom_site: Optional[str] = None
    idDefi: Optional[int] = None
    titre_defi: Optional[str] = None
    points: int
    date: Optional[date] = None

class PointsSummary(BaseModel):
    total: int
    details: List[PointsDetail]
    
class PointsDetailSite(BaseModel):
    idDefi: Optional[int] = None
    titre_defi: Optional[str] = None
    points: int
    date: date  # Changed from Optional[date] to just date
    class Config:
        json_encoders = {
            date: lambda v: v.isoformat()  # Ensure proper JSON serialization
        }

class PointsSummarySite(BaseModel):
    total: int
    details: List[PointsDetailSite]
