from pydantic import BaseModel
from typing import Optional
from datetime import datetime

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

class EntrepriseOut(EntrepriseBase):
    idEntreprise: int
    statut_approbation: str
    certificat_propriete_nom: str

    class Config:
        orm_mode = True