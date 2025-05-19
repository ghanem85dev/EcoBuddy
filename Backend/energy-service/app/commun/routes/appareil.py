from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.commun.database.database import SessionLocal
from ..services.appareil_service import AppareilService
from sqlalchemy import or_
from sqlalchemy.orm import joinedload
from typing import List
from typing import Optional
from app.commun.models import User,Appareil
from app.particulier.models import Site,UserSite
router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class NewAppareil(BaseModel):
    nom: str
    marque: str
    modele: str
    puissance: float
class AppareilBase(BaseModel):
    idAppareil: int
    nom: str
    marque: str
    modele: str
    puissance: float
    idCategorieAppareil: int
    idSite: int

    class Config:
        orm_mode = True
class CategorieSchema(BaseModel):
    idCategorieAppareil: int
    nom: str

    class Config:
        from_attributes = True

class SiteSchema(BaseModel):
    idSite: int
    nom: str
    statut_approbation: str

    class Config:
        from_attributes = True
class AppareilWithRelations(AppareilBase):
    categorie: Optional['CategorieSchema'] = None
    site: Optional['SiteSchema'] = None

    class Config:
        from_attributes = True  # Replaces orm_mode in Pydantic v2
@router.get("/appareils/{site_id}")
def get_appareils_site(site_id: int, db: Session = Depends(get_db)):
    return AppareilService(db).get_appareils_by_site(site_id)

import logging

logger = logging.getLogger(__name__)
@router.get("/appareils/user/{user_id}", response_model=List[AppareilWithRelations])
def get_user_appareils(user_id: int, db: Session = Depends(get_db)):
    try:
        logger.info(f"Attempting to fetch appareils for user {user_id}")
        
        # Verify user exists first
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        query = (
            db.query(Appareil)
            .join(Site, Appareil.idSite == Site.idSite)
            .outerjoin(UserSite, UserSite.site_id == Site.idSite)
            .filter(
                or_(
                    Site.idUser == user_id,
                    UserSite.user_id == user_id
                ),
                Site.statut_approbation == 'approve'
            )
            .options(
                joinedload(Appareil.categorie),
                joinedload(Appareil.site)
            )
        )
        
        logger.debug(f"Generated SQL: {str(query)}")
        
        appareils = query.all()
        
        if not appareils:
            return []
            
        result = []
        for appareil in appareils:
            try:
                appareil_dict = {
                    "idAppareil": appareil.idAppareil,
                    "nom": appareil.nom,
                    "marque": appareil.marque,
                    "modele": appareil.modele,
                    "puissance": appareil.puissance,
                    "idCategorieAppareil": appareil.idCategorieAppareil,
                    "idSite": appareil.idSite,
                    "categorie": {
                        "idCategorieAppareil": appareil.categorie.idCategorieAppareil,
                        "nom": appareil.categorie.nom
                    } if appareil.categorie else None,
                    "site": {
                        "idSite": appareil.site.idSite,
                        "nom": appareil.site.nom,
                        "statut_approbation": appareil.site.statut_approbation
                    } if appareil.site else None
                }
                result.append(appareil_dict)
            except Exception as conv_error:
                logger.error(f"Error converting appareil {appareil.idAppareil}: {str(conv_error)}")
                continue
                
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user appareils: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error while fetching appareils")
    
@router.post("/appareils/{site_id}/{categorie_id}")
def add_appareil(
    site_id: int, 
    categorie_id: int, 
    newAppareil: NewAppareil, 
    db: Session = Depends(get_db)
):
    return AppareilService(db).create_appareil(
        site_id=site_id,
        categorie_id=categorie_id,
        nom=newAppareil.nom,
        marque=newAppareil.marque,
        modele=newAppareil.modele,
        puissance=newAppareil.puissance
    )

@router.get("/totalAppareils/{user_id}")
def get_total_appareils_with_invites(user_id: int, db: Session = Depends(get_db)):
    return AppareilService(db).get_total_appareils_with_invites(user_id)