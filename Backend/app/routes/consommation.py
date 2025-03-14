from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database.database import SessionLocal
from ..models import Site, Consommation, Appareil, User
from datetime import date
import logging
from datetime import datetime, timedelta
from sqlalchemy import extract
from sqlalchemy.orm import joinedload

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
    try:
        now = datetime.now()
        start_time = now - timedelta(hours=1)  # Consommation de la dernière heure

        consommations = (
            db.query(Consommation)
            .join(Appareil, Consommation.idAppareil == Appareil.idAppareil)  # Jointure avec Appareil
            .join(Site, Appareil.idSite == Site.idSite)  # Jointure avec Site pour récupérer idUser
            
            .filter(Site.idUser == id_user)  # Filtrer les sites appartenant à l'utilisateur
            .options(joinedload(Consommation.appareil))  # Charger la relation avec Appareil
            .order_by(Consommation.jour.asc())
            .all()
        )

        if not consommations:
            return {"appareils": [], "values": []}  # 🔹 Retourne une liste vide si pas de données

        # Extraire les noms des appareils et leurs valeurs de consommation
        appareils = [conso.appareil.nom for conso in consommations if conso.appareil]
        values = [conso.quantite for conso in consommations]

        return {"appareils": appareils, "values": values}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur serveur : {str(e)}")

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

@router.get("/Comparison/category/{user_id}")
def get_Comparison_category(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Récupérer les consommations par catégorie d'appareil
    consommations_par_categorie = []
    for site in user.sites:
        for appareil in site.appareils:
            # Assurez-vous que 'appareil.categorie' est bien défini comme une relation
            categorie = appareil.categorie  # Si un appareil a une seule catégorie
            if categorie:
                consommation_categorie = {
                    "siteNom": site.nom,
                    "categorie": categorie.nom,  # Nom de la catégorie
                    "consommation": sum(consommation.quantite for consommation in appareil.consommations)
                }
                consommations_par_categorie.append(consommation_categorie)
    
    return consommations_par_categorie


@router.get("/Comparison/monthly/{user_id}")
def get_monthly_comparison(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get the current month
    current_month = datetime.now().month

    consommations_par_residence = []
    for site in user.sites:
        # Calculate total consumption for the current month
        total_consumption = sum(
            consommation.quantite 
            for appareil in site.appareils 
            for consommation in appareil.consommations
            if consommation.jour.month == current_month
        )
        
        consommation_site = {
            "nomResidance": site.nom,
            "consommation_mensuelle": total_consumption
        }
        consommations_par_residence.append(consommation_site)
    
    return consommations_par_residence

@router.get("/Comparison/annual/{user_id}")
def get_annual_comparison(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get the current year
    current_year = datetime.now().year

    consommations_par_residence = []
    for site in user.sites:
        # Calculate total consumption for the current year
        total_consumption = sum(
            consommation.quantite 
            for appareil in site.appareils 
            for consommation in appareil.consommations
            if consommation.jour.year == current_year
        )
        
        consommation_site = {
            "nomResidance": site.nom,
            "consommation_annuelle": total_consumption
        }
        consommations_par_residence.append(consommation_site)
    
    return consommations_par_residence

@router.get("/Comparison/average_per_device/{user_id}/{site_id}")
def get_average_consumption_per_device(user_id: int, site_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    site = db.query(Site).filter(Site.idSite == site_id, Site.idUser == user.id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    current_month = datetime.now().month

    average_consumption_per_device = []
    
    for appareil in site.appareils:
        logging.info(f"jour {appareil} ")
        consumptions = [
            consommation.quantite 
            for consommation in appareil.consommations
            if consommation.jour.month == current_month
        ]
        if consumptions:
            avg_consumption = sum(consumptions) / len(consumptions)
            average_consumption_per_device.append({
                "appareil": appareil.nom,
                "average_consumption": avg_consumption
            })
    
    if not average_consumption_per_device:
        raise HTTPException(status_code=404, detail="No consumption data found for devices")

    return average_consumption_per_device

@router.get("/Comparison/range/{user_id}/{site_id}")
def get_comparison_range(user_id: int, site_id: int, start_date: date, end_date: date, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    site = db.query(Site).filter(Site.idSite == site_id, Site.idUser == user.id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    
    total_consumption_range = sum(
        consommation.quantite
        for appareil in site.appareils
        for consommation in appareil.consommations
        if start_date <= consommation.jour <= end_date
    )
    
    return {
        "site": site.nom,
        "consommation_pour_periode": total_consumption_range
    }



@router.get("/Comparison/total/{user_id}")
def get_total_consumption_for_user(user_id: int, start_date: date, end_date: date, db: Session = Depends(get_db)):
    # Vérifier si l'utilisateur existe
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Récupérer tous les sites de l'utilisateur
    sites = db.query(Site).filter(Site.idUser == user.id).all()
    if not sites:
        raise HTTPException(status_code=404, detail="No sites found for this user")
    
    # Calculer la consommation totale pour tous les sites
    total_consumption = sum(
        consommation.quantite
        for site in sites
        for appareil in site.appareils
        for consommation in appareil.consommations
        if start_date <= consommation.jour <= end_date
    )

    return {
        "user": user.email,
        "consommation_pour_periode": total_consumption
    }
