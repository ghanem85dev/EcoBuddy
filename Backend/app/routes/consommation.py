from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database.database import SessionLocal
from ..models import Site, Consommation, Appareil, User
from datetime import date
import logging
from datetime import datetime, timedelta

logging.basicConfig(level=logging.INFO)

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/Consommation/site/{site_id}")
def get_Consommations_site(site_id: int, db: Session = Depends(get_db)):
    site = db.query(Site).filter(Site.idSite == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    # Récupérer la consommation des appareils du site
    consommations = (
        db.query(Consommation)
        .join(Appareil, Consommation.idAppareil == Appareil.idAppareil)
        .filter(Appareil.idSite == site_id)
        .all()
    )

    if not consommations:
        return {"appareils": [], "values": []}

    # Récupérer les noms des appareils et les quantités de consommation
    appareils = [conso.appareil.nom for conso in consommations]  # Liste des noms des appareils
    values = [conso.quantite for conso in consommations]  # Liste des quantités consommées

    return {"appareils": appareils, "values": values}
@router.get("/Consommation/user/{user_id}")
def get_Consommations_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    sites = user.sites  # Assurez-vous que User a une relation avec Site
    total_consommation = sum(
        appareil.consommations.quantite 
        for site in sites 
        for appareil in site.appareils
    )
    return {"total_consommation": total_consommation}

@router.get("/Consommation/user/{user_id}/today")
def get_Consommations_user_today(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    today = date.today()
    total_consommation = 0

    for site in user.sites:
        for appareil in site.appareils:
            logging.info(f"Appareil {appareil.idAppareil} consommations: {appareil.consommations}")
            for consommation in appareil.consommations:
                logging.info(f"jour {consommation.jour} today: {today}")
                if str(consommation.jour) == str(today):
                    total_consommation += consommation.quantite
    
    return {"total_consommation_today": total_consommation}
@router.get("/Consommation/appareil/{appareil_id}")
def get_Consommations_appareil(appareil_id: int, db: Session = Depends(get_db)):
    appareil = db.query(Appareil).filter(Appareil.idAppareil == appareil_id).first()
    if not appareil:
        raise HTTPException(status_code=404, detail="Appareil not found")
    
    total_consommation = appareil.consommation.quantite  # Pas besoin de sum()

    return {"total_consommation": total_consommation}

class NewConsommation(BaseModel):
    quantite: float
    jour: date

@router.post("/consommation/{appareil_id}")
def add_consommation(appareil_id: int, newConsommation: NewConsommation, db: Session = Depends(get_db)):
    appareil = db.query(Appareil).filter(Appareil.idAppareil == appareil_id).first()
    if not appareil:
        raise HTTPException(status_code=404, detail="Appareil not found")
    
    new_consommation = Consommation(
        quantite=newConsommation.quantite,
        jour=newConsommation.jour,
        idAppareil=appareil_id
    )
    db.add(new_consommation)
    db.commit()
    return {"message": "Consommation ajoutée avec succès."}


# @router.get("/api/consumption")
# def get_real_time_consumption(db: Session = Depends(get_db)):
#     # Récupérer les consommations des dernières heures (ex: 1 heure)
#     now = datetime.now()
#     start_time = now - timedelta(hours=1)

#     consommations = (
#         db.query(Consommation)
#         .filter(Consommation.jour >= start_time.date())  # Filtrer les consommations récentes
#         .order_by(Consommation.jour.asc())
#         .all()
#     )

#     if not consommations:
#         return {"timestamps": [], "values": []}

#     timestamps = [conso.jour.strftime("%Y-%m-%d %H:%M:%S") for conso in consommations]
#     values = [conso.quantite for conso in consommations]

#     return {"timestamps": timestamps, "values": values}
@router.get("/api/consumption/{id_user}")
def get_real_time_consumption(id_user: int, db: Session = Depends(get_db)):
    now = datetime.now()
    start_time = now - timedelta(hours=1)

    consommations = (
        db.query(Consommation)
        .join(Appareil, Consommation.idAppareil == Appareil.idAppareil)  # Jointure avec Appareil
        .join(Site, Appareil.idSite == Site.idSite)  # Jointure avec Site pour récupérer idUser
        .filter(Consommation.jour >= start_time.date())  
        .filter(Site.idUser == id_user)  # Filtrer les sites appartenant à l'utilisateur
        .order_by(Consommation.jour.asc())
        .all()
    )

    if not consommations:
        return {"appareils": [], "values": []}
    
    appareils = [conso.appareil.nom for conso in consommations]  # Récupérer les noms des appareils
    values = [conso.quantite for conso in consommations]  # Quantités consommées

    return {"appareils": appareils, "values": values}
@router.get("/Comparison/user/{user_id}")
def get_Comparison_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Récupérer les consommations par résidence
    consommations_par_residence = []
    for site in user.sites:
        consommation_site = {
            "nomResidance": site.nom,
            "consommation": sum(consommation.quantite for appareil in site.appareils for consommation in appareil.consommations)
        }
        consommations_par_residence.append(consommation_site)
    
    return consommations_par_residence