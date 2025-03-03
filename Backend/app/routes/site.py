from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database.database import SessionLocal
from ..models import Site
from app.models import User,UserSite
router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        

@router.get("/sites/{user_id}")
def get_user_sites(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        # Retourner une erreur 404 si l'utilisateur n'existe pas
        raise HTTPException(status_code=404, detail="User not found")
    
    # Si l'utilisateur existe, on retourne ses sites
    return user.sites
@router.get("/user-sites/{user_id}")
def get_user_sites(user_id: int, db: Session = Depends(get_db)):
    # Vérifier si l'utilisateur existe
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

    # Récupérer les sites dont l'utilisateur est propriétaire
    owned_sites = db.query(Site).filter(Site.idUser == user_id).all()

    # Récupérer les sites où l'utilisateur a accepté une invitation
    invited_sites = (
        db.query(Site)
        .join(UserSite, UserSite.site_id == Site.idSite)
        .filter(UserSite.user_id == user_id)
        .all()
    )

    # Fusionner les résultats avec les bonnes clés
    sites_list = [
        {
            "idSite": site.idSite,
            "idCategorieSite": site.idCategorieSite,
            "idUser": site.idUser,
            "nom": site.nom,
            "adresse": site.adresse
        } 
        for site in owned_sites + invited_sites
    ]

    return sites_list

class NewSite(BaseModel):
    nom: str
    adresse: str


@router.post("/sites/{user_id}/{categorie_id}")
def add_site(user_id: int,categorie_id: int,newSite: NewSite, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.id == user_id).first()
    new_site = Site(
        nom=newSite.nom,
        adresse=newSite.adresse,
        idCategorieSite=categorie_id,
        idUser=user_id
    )
    db.add(new_site)
    db.commit()
    return {"message": "Site ajouté avec succès."}


@router.put("/sites/{site_id}/{categorie_id}")
def update_site(site_id: int,categorie_id: int,newSite: NewSite, db: Session = Depends(get_db)):
    db_site = db.query(Site).filter(Site.idSite == site_id).first()
    if not db_site:
        raise HTTPException(status_code=404, detail="Site not found")
    db_site.nom = newSite.nom
    db_site.adresse = newSite.adresse
    db_site.idCategorieSite = categorie_id
    db.commit()
    return {"message": "Site modifié avec succès."}

@router.delete("/sites/{site_id}")
def update_site(site_id: int, db: Session = Depends(get_db)):
    db_site = db.query(Site).filter(Site.idSite == site_id).first()
    if not db_site:
        raise HTTPException(status_code=404, detail="Site not found")
    db.delete(db_site)
    db.commit()
    return {"message": "Site supprimé avec succès."}
