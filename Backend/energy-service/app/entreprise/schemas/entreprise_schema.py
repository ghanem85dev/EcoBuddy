from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from typing import Dict
class SecteurOut(BaseModel):
    idSecteur: int
    nom: str

    class Config:
        orm_mode = True
class UserOut(BaseModel):
    idUser: int
    nom: Optional[str] = None  # Make these Optional to handle NULL values
    prenom: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    

class EntrepriseBase(BaseModel):
    nom: str
    taille: str
    secteur_id: int

class EntrepriseCreate(EntrepriseBase):
    pass

class EntrepriseUpdate(BaseModel):
    nom: Optional[str] = None
    taille: Optional[str] = None
    secteur_id: Optional[int] = None

class EntrepriseOut(BaseModel):
    idEntreprise: int
    nom: str
    taille: str
    secteur_id: int
    statut_approbation: str
    secteur: SecteurOut
    user: Optional[UserOut] = None  # Champ optionnel
    
    class Config:
        orm_mode = True
class SectorStatsOut(BaseModel):
    sector_name: str
    entreprise_count: int

    class Config:
        orm_mode = True
class EntrepriseSizeStats(BaseModel):
    taille: str
    count: int

    class Config:
        orm_mode = True

class PendingEntrepriseStats(BaseModel):
    total: int
    with_certificat: int
    without_certificat: int
    by_size: Dict[str, int]