from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database.database import SessionLocal
from ..models import Site
from ..models import Appareil
from ..models import User
router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        
@router.get("/appareils/{site_id}")
def get_appareils_site(site_id: int, db: Session = Depends(get_db)):
    site = db.query(Site).filter(Site.idSite == site_id).first()
    if not site:
        # Retourner une erreur 404 si l'utilisateur n'existe pas
        raise HTTPException(status_code=404, detail="Site not found")
    
    # Si l'utilisateur existe, on retourne ses sites
    return site.appareils
@router.get("/appareils/user/{user_id}")
def get_appareils_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Initialize an empty list to store appareils from all sites of the user
    appareils = []
    
    # Iterate over the sites of the user and gather their appareils
    for site in user.sites:
        appareils.extend(site.appareils)  # Assuming 'site.appareils' is the correct relation
    
    return appareils

class NewAppareil(BaseModel):
    nom: str
    marque: str
    modele: str
    puissance: float


@router.post("/appareils/{site_id}/{categorie_id}")
def add_site(site_id: int,categorie_id: int,newAppareil: NewAppareil, db: Session = Depends(get_db)):
    db_site = db.query(Site).filter(Site.idSite == site_id).first()
    new_appareil = Appareil(
        nom=newAppareil.nom,
        marque=newAppareil.marque,
        modele=newAppareil.modele,
        puissance=newAppareil.puissance,
        idCategorieAppareil=categorie_id,
        idSite=site_id
    )
    db.add(new_appareil)
    db.commit()
    return {"message": "Appareil ajouté avec succès."}

