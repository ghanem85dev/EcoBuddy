from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import logging
from pydantic import BaseModel
from app.commun.database.database import SessionLocal
from app.particulier.models import Site,UserSite
from app.entreprise.models import Entreprise
from ..models import User, Appareil
from ..repositories.consommation_repository import ConsommationRepository
from datetime import date
import logging
from datetime import datetime, timedelta
from sqlalchemy import extract
from sqlalchemy.orm import joinedload
from fastapi import Query
from ..models_mongo import Consommation
from collections import defaultdict
from sqlalchemy import func
from typing import Tuple,List, Dict, Optional, Union
from sqlalchemy import or_
logger = logging.getLogger(__name__)

logging.basicConfig(level=logging.INFO)

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

consommation_repo = ConsommationRepository()


class ConsommationResponse(BaseModel):
    categorie: str
    consommation: float

class HistoricalDataResponse(BaseModel):
    date: str
    consumption: float

@router.get("/consommation/historique-entreprise/{entreprise_id}/{user_id}", response_model=List[HistoricalDataResponse])
async def get_entreprise_historical_consumption(
    entreprise_id: int,
    user_id: int,
    start_date: date = Query(..., description="Date de début (YYYY-MM-DD)"),
    end_date: date = Query(..., description="Date de fin (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    consommation_repo: ConsommationRepository = Depends(ConsommationRepository)
):
    """
    Récupère les données historiques de consommation depuis MongoDB
    Retourne une liste d'objets {date: str, consumption: float}
    """
    try:
        logging.info(f"Processing request for entreprise_id={entreprise_id}, user_id={user_id}")
        
        # 1. Déterminer la granularité de la période
        period_type = get_period_type(start_date, end_date)
        logging.info(f"Period type determined: {period_type}")

        # 2. Récupérer les appareils concernés depuis PostgreSQL
        query = db.query(Site).filter(Site.idUser == user_id)
        
        if entreprise_id != 0:
            query = query.filter(Site.idEntreprise == entreprise_id)
        
        sites = query.options(joinedload(Site.appareils)).all()
        
        if not sites:
            logging.info("No sites found for the given criteria")
            return []

        # 3. Récupérer les IDs des appareils
        appareil_ids = [appareil.idAppareil for site in sites for appareil in site.appareils]
        
        if not appareil_ids:
            logging.info("No devices found for the sites")
            return []

        # 4. Récupérer les consommations depuis MongoDB
        consommations = await consommation_repo.get_consommations_by_date_range_and_appareils(
            start_date=start_date,
            end_date=end_date,
            appareil_ids=appareil_ids
        )
        
        logging.info(f"Found {len(consommations)} consumption records")

        # 5. Agrégation des données par période
        period_data = defaultdict(float)
        
        for conso in consommations:
            # Déterminer la clé de période
            if period_type == "day":
                period_key = conso.jour.strftime("%Y-%m-%d")
            elif period_type == "week":
                week_num = conso.jour.isocalendar()[1]
                period_key = f"Semaine {week_num}, {conso.jour.year}"
            elif period_type == "month":
                period_key = conso.jour.strftime("%Y-%m")
            elif period_type == "quarter":
                quarter = (conso.jour.month - 1) // 3 + 1
                period_key = f"T{quarter} {conso.jour.year}"
            else:  # year
                period_key = str(conso.jour.year)
            
            period_data[period_key] += conso.quantite

        # 6. Formater et trier les résultats
        formatted_results = [
            HistoricalDataResponse(
                date=date_key, 
                consumption=round(total, 2)
            )
            for date_key, total in sorted(period_data.items())
        ]

        logging.info(f"Returning {len(formatted_results)} aggregated periods")
        return formatted_results

    except Exception as e:
        logging.error(f"Error in get_entreprise_historical_consumption: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Erreur serveur: {str(e)}"
        )

##
@router.get("/consommation/historique-site/{site_id}/{user_id}", response_model=List[HistoricalDataResponse])
async def get_site_historical_consumption(
    site_id: int,
    user_id: int,
    start_date: date = Query(..., description="Date de début (YYYY-MM-DD)"),
    end_date: date = Query(..., description="Date de fin (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    consommation_repo: ConsommationRepository = Depends(ConsommationRepository)
):
    """
    Récupère les données historiques de consommation pour un site spécifique depuis MongoDB
    """
    try:
        # 1. Vérifier que l'utilisateur a accès à ce site
        site = db.query(Site).filter(
            Site.idSite == site_id,
            Site.idUser == user_id
        ).options(joinedload(Site.appareils)).first()
        
        if not site:
            raise HTTPException(status_code=404, detail="Site non trouvé ou accès non autorisé")

        if not site.appareils:
            return []

        # 2. Récupérer les IDs des appareils du site
        appareil_ids = [appareil.idAppareil for appareil in site.appareils]

        # 3. Déterminer la granularité en fonction de la période
        period_type = get_period_type(start_date, end_date)

        # 4. Récupérer les consommations depuis MongoDB
        consommations = await consommation_repo.get_consommations_by_date_range_and_appareils(
            start_date=start_date,
            end_date=end_date,
            appareil_ids=appareil_ids
        )

        # 5. Agrégation des données par période
        period_data = defaultdict(float)
        
        for conso in consommations:
            # Déterminer la clé de période
            if period_type == "day":
                period_key = conso.jour.strftime("%Y-%m-%d")
            elif period_type == "week":
                week_num = conso.jour.isocalendar()[1]
                period_key = f"Semaine {week_num}, {conso.jour.year}"
            elif period_type == "month":
                period_key = conso.jour.strftime("%Y-%m")
            elif period_type == "quarter":
                quarter = (conso.jour.month - 1) // 3 + 1
                period_key = f"T{quarter} {conso.jour.year}"
            else:  # year
                period_key = str(conso.jour.year)
            
            period_data[period_key] += conso.quantite

        # 6. Formater et trier les résultats
        formatted_results = [
            HistoricalDataResponse(
                date=date_key, 
                consumption=round(total, 2)
            )
            for date_key, total in sorted(period_data.items())
        ]

        return formatted_results

    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error fetching historical data: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Erreur lors de la récupération des données historiques"
        )


def get_period_type(start_date: date, end_date: date) -> str:
    """Détermine la granularité appropriée en fonction de la période"""
    delta = end_date - start_date
    
    if delta.days <= 7:  # Moins d'une semaine -> quotidien
        return "day"
    elif delta.days <= 31:  # Moins d'un mois -> hebdomadaire
        return "week"
    elif delta.days <= 365:  # Moins d'un an -> mensuel
        return "month"
    elif delta.days <= 730:  # Moins de 2 ans -> trimestriel
        return "quarter"
    else:  # Plus de 2 ans -> annuel
        return "year"

##
@router.get("/consommation/historique-managed-site/{site_id}/{user_id}", response_model=List[HistoricalDataResponse])
async def get_site_historical_consumption(
    site_id: int,
    user_id: int,
    start_date: date = Query(..., description="Date de début (YYYY-MM-DD)"),
    end_date: date = Query(..., description="Date de fin (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    consommation_repo: ConsommationRepository = Depends(ConsommationRepository)
):
    """
    Récupère les données historiques de consommation depuis MongoDB:
    - Pour un site spécifique si site_id > 0
    - Pour tous les sites gérés par l'utilisateur si site_id = 0
    """
    try:
        # 1. Déterminer la granularité de la période
        period_type = get_period_type(start_date, end_date)
        
        # 2. Récupérer les appareils concernés depuis PostgreSQL
        if site_id == 0:
            # Tous les sites gérés par l'utilisateur
            sites = db.query(Site)\
                .filter(Site.idResponsable == user_id)\
                .options(joinedload(Site.appareils))\
                .all()
            
            if not sites:
                return []
                
            appareil_ids = [appareil.idAppareil 
                          for site in sites 
                          for appareil in site.appareils]
        else:
            # Site spécifique (vérifier les permissions)
            site = db.query(Site)\
                .filter(
                    Site.idSite == site_id,
                    Site.idResponsable == user_id
                )\
                .options(joinedload(Site.appareils))\
                .first()
                
            if not site:
                raise HTTPException(
                    status_code=404,
                    detail="Site non trouvé ou accès non autorisé"
                )
                
            appareil_ids = [appareil.idAppareil for appareil in site.appareils]
        
        if not appareil_ids:
            return []

        # 3. Récupérer les consommations depuis MongoDB
        consommations = await consommation_repo.get_consommations_by_date_range_and_appareils(
            start_date=start_date,
            end_date=end_date,
            appareil_ids=appareil_ids
        )

        # 4. Agrégation des données par période
        period_data = defaultdict(float)
        
        for conso in consommations:
            # Déterminer la clé de période
            if period_type == "day":
                period_key = conso.jour.strftime("%Y-%m-%d")
            elif period_type == "week":
                week_num = conso.jour.isocalendar()[1]
                period_key = f"Semaine {week_num}, {conso.jour.year}"
            elif period_type == "month":
                period_key = conso.jour.strftime("%Y-%m")
            elif period_type == "quarter":
                quarter = (conso.jour.month - 1) // 3 + 1
                period_key = f"T{quarter} {conso.jour.year}"
            else:  # year
                period_key = str(conso.jour.year)
            
            period_data[period_key] += conso.quantite

        # 5. Formater et trier les résultats
        formatted_results = [
            HistoricalDataResponse(
                date=date_key, 
                consumption=round(total, 2)
            )
            for date_key, total in sorted(period_data.items())
        ]

        return formatted_results

    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error fetching historical data: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Erreur lors de la récupération des données historiques"
        )


def get_period_type(start_date: date, end_date: date) -> str:
    """Détermine la granularité appropriée en fonction de la période"""
    delta = end_date - start_date
    
    if delta.days <= 7:  # Moins d'une semaine -> quotidien
        return "day"
    elif delta.days <= 31:  # Moins d'un mois -> hebdomadaire
        return "week"
    elif delta.days <= 365:  # Moins d'un an -> mensuel
        return "month"
    elif delta.days <= 730:  # Moins de 2 ans -> trimestriel
        return "quarter"
    else:  # Plus de 2 ans -> annuel
        return "year"

@router.get("/consommation/historique-managed-site/{site_id}/{user_id}", response_model=List[HistoricalDataResponse])
async def get_site_historical_consumption(
    site_id: int,
    user_id: int,
    start_date: date = Query(..., description="Date de début (YYYY-MM-DD)"),
    end_date: date = Query(..., description="Date de fin (YYYY-MM-DD)"),
    period_type: str = Query("day", description="Type de période (day, week, month, quarter, year)"),
    aggregate: bool = Query(False, description="Agréger les données de tous les sites"),
    db: Session = Depends(get_db),
    consommation_repo: ConsommationRepository = Depends(ConsommationRepository)
):
    try:
        # 1. Récupérer les sites et appareils concernés depuis PostgreSQL
        query = db.query(Site).filter(Site.idResponsable == user_id)
        if site_id != 0:
            query = query.filter(Site.idSite == site_id)
        
        sites = query.options(joinedload(Site.appareils)).all()
        
        if not sites:
            logging.warning(f"Aucun site trouvé pour user_id={user_id}, site_id={site_id}")
            return []
        
        # 2. Récupérer les IDs des appareils
        appareil_ids = [appareil.idAppareil for site in sites for appareil in site.appareils]
        
        if not appareil_ids:
            logging.warning(f"Aucun appareil trouvé pour les sites concernés")
            return []
        
        # 3. Récupérer les consommations depuis MongoDB
        consommations = await consommation_repo.get_consommations_by_date_range_and_appareils(
            start_date=start_date,
            end_date=end_date,
            appareil_ids=appareil_ids
        )
        
        if not consommations:
            logging.warning(f"Aucune consommation trouvée pour la période demandée")
            return []
        
        # 4. Agrégation des données selon la période demandée
        period_data = {}
        
        for conso in consommations:
            # Déterminer la période appropriée
            if period_type == "day":
                period_key = conso.jour.strftime("%Y-%m-%d")
            elif period_type == "week":
                week_num = conso.jour.isocalendar()[1]
                period_key = f"Semaine {week_num}, {conso.jour.year}"
            elif period_type == "month":
                period_key = conso.jour.strftime("%Y-%m")
            elif period_type == "quarter":
                quarter = (conso.jour.month - 1) // 3 + 1
                period_key = f"T{quarter} {conso.jour.year}"
            else:  # year
                period_key = str(conso.jour.year)
            
            # Ajouter à l'agrégation
            if period_key in period_data:
                period_data[period_key] += conso.quantite
            else:
                period_data[period_key] = conso.quantite
        
        # 5. Formater les résultats
        formatted_results = [
            HistoricalDataResponse(date=date_key, consumption=float(total))
            for date_key, total in period_data.items()
        ]
        
        # Trier par date
        formatted_results.sort(key=lambda x: x.date)
        
        logging.info(f"Nombre de périodes retournées: {len(formatted_results)}")
        return formatted_results

    except Exception as e:
        logging.error(f"Erreur: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Erreur serveur: {str(e)}"
        )

##
@router.get("/consommation/categorie-responsable/{site_id}/{user_id}")
async def get_Consommation_categorie(
    site_id: int, 
    user_id: int,
    start_date: date = Query(..., description="Date de début au format YYYY-MM-DD"),
    end_date: date = Query(..., description="Date de fin au format YYYY-MM-DD"),
    db: Session = Depends(get_db),
    consommation_repo: ConsommationRepository = Depends(ConsommationRepository)
):
    try:
        # Cas où site_id = 0 (tous les sites dont l'utilisateur est responsable)
        if site_id == 0:
            # Récupérer tous les appareils des sites où l'utilisateur est responsable
            appareils = db.query(Appareil)\
                .join(Site, Site.idSite == Appareil.idSite)\
                .filter(Site.idResponsable == user_id)\
                .options(
                    joinedload(Appareil.categorie),
                    joinedload(Appareil.site)
                )\
                .all()
            
            if not appareils:
                return []

            # Récupérer les IDs des appareils
            appareil_ids = [appareil.idAppareil for appareil in appareils]
            
            # Récupérer les consommations depuis MongoDB
            consommations = await consommation_repo.get_consommations_by_date_range_and_appareils(
                start_date=start_date,
                end_date=end_date,
                appareil_ids=appareil_ids
            )

            # Créer un mapping appareil -> catégorie
            appareil_to_categorie = {
                appareil.idAppareil: appareil.categorie.nom 
                for appareil in appareils 
                if appareil.categorie
            }

            # Calculer la consommation totale par catégorie
            consommations_par_categorie = {}
            for conso in consommations:
                if conso.idAppareil in appareil_to_categorie:
                    categorie = appareil_to_categorie[conso.idAppareil]
                    consommations_par_categorie[categorie] = consommations_par_categorie.get(categorie, 0) + conso.quantite

            return [{"categorie": cat, "consommation": conso} for cat, conso in consommations_par_categorie.items()]
        
        # Cas d'un site spécifique
        # Vérifier que l'utilisateur est bien responsable de ce site
        site = db.query(Site)\
            .filter(Site.idSite == site_id, Site.idResponsable == user_id)\
            .options(
                joinedload(Site.appareils).joinedload(Appareil.categorie)
            )\
            .first()

        if not site:
            raise HTTPException(status_code=404, detail="Site not found or you're not the responsible")

        if not site.appareils:
            return []

        # Récupérer les IDs des appareils du site
        appareil_ids = [appareil.idAppareil for appareil in site.appareils]
        
        # Récupérer les consommations depuis MongoDB
        consommations = await consommation_repo.get_consommations_by_date_range_and_appareils(
            start_date=start_date,
            end_date=end_date,
            appareil_ids=appareil_ids
        )

        # Calculer la consommation par catégorie
        consommations_par_categorie = {}
        for appareil in site.appareils:
            if not appareil.categorie:
                continue
                
            categorie = appareil.categorie.nom
            total = sum(
                conso.quantite 
                for conso in consommations 
                if conso.idAppareil == appareil.idAppareil
            )
            
            if total > 0:  # Ne pas inclure les catégories sans consommation
                if categorie in consommations_par_categorie:
                    consommations_par_categorie[categorie] += total
                else:
                    consommations_par_categorie[categorie] = total

        return [{"categorie": cat, "consommation": conso} for cat, conso in consommations_par_categorie.items()]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur interne: {str(e)}")
##
@router.get("/Consommation/categorie-entreprise/{site_id}/{entreprise_id}/{user_id}")
async def get_Consommation_categorie(
    site_id: int,
    entreprise_id: int, 
    user_id: int,
    start_date: date, 
    end_date: date,
    split_period: bool = False,  # Nouveau paramètre
    db: Session = Depends(get_db),
    consommation_repo: ConsommationRepository = Depends(ConsommationRepository)
):
    # Fonction pour déterminer le type de période
    def get_period_type(start_date: date, end_date: date) -> str:
        delta = (end_date - start_date).days
        if delta > 365: return "yearly"
        if delta > 90: return "quarterly"
        if delta > 30: return "monthly"
        if delta > 7: return "weekly"
        return "daily"

    # Fonction pour diviser la période en sous-périodes
    def split_date_range(start_date: date, end_date: date, period_type: str):
        periods = []
        current_start = start_date
        
        while current_start < end_date:
            if period_type == "yearly":
                current_end = date(current_start.year + 1, 1, 1)
            elif period_type == "quarterly":
                quarter_end_month = ((current_start.month - 1) // 3 + 1) * 3 + 1
                if quarter_end_month > 12:
                    current_end = date(current_start.year + 1, 1, 1)
                else:
                    current_end = date(current_start.year, quarter_end_month, 1)
            elif period_type == "monthly":
                if current_start.month == 12:
                    current_end = date(current_start.year + 1, 1, 1)
                else:
                    current_end = date(current_start.year, current_start.month + 1, 1)
            elif period_type == "weekly":
                current_end = current_start + timedelta(days=7)
            else:  # daily
                current_end = current_start + timedelta(days=1)
            
            # Ajuster la fin si elle dépasse la date de fin globale
            if current_end > end_date:
                current_end = end_date
            
            periods.append((current_start, current_end))
            current_start = current_end
        
        return periods

    # Cas où site_id = 0 (tous les sites)
    if site_id == 0:
        # Préparer la requête pour récupérer les appareils selon le contexte
        query = db.query(Appareil).join(Site)
        
        if entreprise_id == 0:
            # Cas tous les sites de l'utilisateur
            query = query.filter(Site.idUser == user_id)
        else:
            # Cas tous les sites de l'entreprise
            query = query.filter(Site.idEntreprise == entreprise_id)
        
        # Charger les catégories en eager loading
        appareils = query.options(joinedload(Appareil.categorie)).all()
        
        if not appareils:
            return {"total": [], "periods": []} if split_period else []

        # Récupérer les IDs des appareils
        appareil_ids = [appareil.idAppareil for appareil in appareils]
        
        # Récupérer les consommations depuis MongoDB
        try:
            consommations = await consommation_repo.get_consommations_by_date_range_and_appareils(
                start_date=start_date,
                end_date=end_date,
                appareil_ids=appareil_ids
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erreur MongoDB: {str(e)}")

        # Agrégation par catégorie
        consommations_par_categorie = {}
        appareil_to_categorie = {
            appareil.idAppareil: appareil.categorie.nom 
            for appareil in appareils 
            if appareil.categorie
        }

        for conso in consommations:
            if conso.idAppareil in appareil_to_categorie:
                categorie = appareil_to_categorie[conso.idAppareil]
                consommations_par_categorie[categorie] = consommations_par_categorie.get(categorie, 0) + conso.quantite

        if not split_period:
            return [{"categorie": cat, "consommation": conso} for cat, conso in consommations_par_categorie.items()]
        
        # Si on doit diviser par période
        period_type = get_period_type(start_date, end_date)
        periods = split_date_range(start_date, end_date, period_type)
        
        period_results = []
        for period_start, period_end in periods:
            # Filtrer les consommations pour cette période
            period_conso = [c for c in consommations if period_start <= c.jour < period_end]
            
            # Agrégation pour cette période
            period_agg = {}
            for conso in period_conso:
                if conso.idAppareil in appareil_to_categorie:
                    categorie = appareil_to_categorie[conso.idAppareil]
                    period_agg[categorie] = period_agg.get(categorie, 0) + conso.quantite
            
            period_results.append({
                "start_date": period_start,
                "end_date": period_end,
                "data": [{"categorie": cat, "consommation": conso} for cat, conso in period_agg.items()]
            })
        
        return {
            "total": [{"categorie": cat, "consommation": conso} for cat, conso in consommations_par_categorie.items()],
            "periods": period_results
        }

    # Cas d'un site spécifique
    site = db.query(Site).filter(
        Site.idSite == site_id,
        (Site.idUser == user_id) | (Site.idEntreprise == entreprise_id)
    ).options(
        joinedload(Site.appareils).joinedload(Appareil.categorie)
    ).first()

    if not site:
        raise HTTPException(status_code=404, detail="Site not found or not authorized")

    if not site.appareils:
        return {"total": [], "periods": []} if split_period else []

    # Récupérer les IDs des appareils du site
    appareil_ids = [appareil.idAppareil for appareil in site.appareils]
    
    # Récupérer les consommations depuis MongoDB
    try:
        consommations = await consommation_repo.get_consommations_by_date_range_and_appareils(
            start_date=start_date,
            end_date=end_date,
            appareil_ids=appareil_ids
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur MongoDB: {str(e)}")

    # Agrégation par catégorie
    consommations_par_categorie = {}
    for appareil in site.appareils:
        if not appareil.categorie:
            continue
            
        categorie = appareil.categorie.nom
        # Filtrer et sommer les consommations pour cet appareil
        total = sum(
            conso.quantite 
            for conso in consommations 
            if conso.idAppareil == appareil.idAppareil
        )
        
        if categorie in consommations_par_categorie:
            consommations_par_categorie[categorie] += total
        else:
            consommations_par_categorie[categorie] = total

    if not split_period:
        return [{"categorie": cat, "consommation": conso} for cat, conso in consommations_par_categorie.items()]
    
    # Si on doit diviser par période
    period_type = get_period_type(start_date, end_date)
    periods = split_date_range(start_date, end_date, period_type)
    
    period_results = []
    for period_start, period_end in periods:
        # Filtrer les consommations pour cette période
        period_conso = [c for c in consommations if period_start <= c.jour < period_end]
        
        # Agrégation pour cette période
        period_agg = {}
        for appareil in site.appareils:
            if not appareil.categorie:
                continue
                
            categorie = appareil.categorie.nom
            # Filtrer et sommer les consommations pour cet appareil dans cette période
            total = sum(
                conso.quantite 
                for conso in period_conso 
                if conso.idAppareil == appareil.idAppareil
            )
            
            if total > 0:
                if categorie in period_agg:
                    period_agg[categorie] += total
                else:
                    period_agg[categorie] = total
        
        period_results.append({
            "start_date": period_start,
            "end_date": period_end,
            "data": [{"categorie": cat, "consommation": conso} for cat, conso in period_agg.items()]
        })
    
    return {
        "total": [{"categorie": cat, "consommation": conso} for cat, conso in consommations_par_categorie.items()],
        "periods": period_results
    }
##
@router.get("/consommation/categorie-responsable/{site_id}/{user_id}")
async def get_Consommation_categorie(
    site_id: int, 
    user_id: int,
    start_date: date = Query(..., description="Date de début au format YYYY-MM-DD"),
    end_date: date = Query(..., description="Date de fin au format YYYY-MM-DD"),
    db: Session = Depends(get_db),
    consommation_repo: ConsommationRepository = Depends(ConsommationRepository)
):
    try:
        # Cas où site_id = 0 (tous les sites dont l'utilisateur est responsable)
        if site_id == 0:
            # Récupérer tous les appareils des sites où l'utilisateur est responsable
            appareils = db.query(Appareil)\
                .join(Site, Site.idSite == Appareil.idSite)\
                .filter(Site.idResponsable == user_id)\
                .options(
                    joinedload(Appareil.categorie),
                    joinedload(Appareil.site)
                )\
                .all()
            
            if not appareils:
                return []

            # Récupérer les IDs des appareils
            appareil_ids = [appareil.idAppareil for appareil in appareils]
            
            # Récupérer les consommations depuis MongoDB
            consommations = await consommation_repo.get_consommations_by_date_range_and_appareils(
                start_date=start_date,
                end_date=end_date,
                appareil_ids=appareil_ids
            )

            # Créer un mapping appareil -> catégorie
            appareil_to_categorie = {
                appareil.idAppareil: appareil.categorie.nom 
                for appareil in appareils 
                if appareil.categorie
            }

            # Calculer la consommation totale par catégorie
            consommations_par_categorie = {}
            for conso in consommations:
                if conso.idAppareil in appareil_to_categorie:
                    categorie = appareil_to_categorie[conso.idAppareil]
                    consommations_par_categorie[categorie] = consommations_par_categorie.get(categorie, 0) + conso.quantite

            return [{"categorie": cat, "consommation": conso} for cat, conso in consommations_par_categorie.items()]
        
        # Cas d'un site spécifique
        # Vérifier que l'utilisateur est bien responsable de ce site
        site = db.query(Site)\
            .filter(Site.idSite == site_id, Site.idResponsable == user_id)\
            .options(
                joinedload(Site.appareils).joinedload(Appareil.categorie)
            )\
            .first()

        if not site:
            raise HTTPException(status_code=404, detail="Site not found or you're not the responsible")

        if not site.appareils:
            return []

        # Récupérer les IDs des appareils du site
        appareil_ids = [appareil.idAppareil for appareil in site.appareils]
        
        # Récupérer les consommations depuis MongoDB
        consommations = await consommation_repo.get_consommations_by_date_range_and_appareils(
            start_date=start_date,
            end_date=end_date,
            appareil_ids=appareil_ids
        )

        # Calculer la consommation par catégorie
        consommations_par_categorie = {}
        for appareil in site.appareils:
            if not appareil.categorie:
                continue
                
            categorie = appareil.categorie.nom
            total = sum(
                conso.quantite 
                for conso in consommations 
                if conso.idAppareil == appareil.idAppareil
            )
            
            if total > 0:  # Ne pas inclure les catégories sans consommation
                if categorie in consommations_par_categorie:
                    consommations_par_categorie[categorie] += total
                else:
                    consommations_par_categorie[categorie] = total

        return [{"categorie": cat, "consommation": conso} for cat, conso in consommations_par_categorie.items()]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur interne: {str(e)}")
@router.get("/Comparison/average_per_device/{user_id}/{site_id}")
async def get_average_consumption_per_device(
    user_id: int, 
    site_id: int, 
    db: Session = Depends(get_db),
    consommation_repo: ConsommationRepository = Depends(ConsommationRepository)
):
    # Vérifier si l'utilisateur existe
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Vérifier si le site existe et appartient à l'utilisateur
    site = db.query(Site).filter(Site.idSite == site_id, Site.idUser == user.id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    # Récupérer le mois courant
    current_month = datetime.now().month
    current_year = datetime.now().year
    
    # Déterminer la plage de dates pour le mois courant
    start_date = date(current_year, current_month, 1)
    if current_month == 12:
        end_date = date(current_year + 1, 1, 1) - timedelta(days=1)
    else:
        end_date = date(current_year, current_month + 1, 1) - timedelta(days=1)

    # Récupérer les IDs des appareils du site
    appareils = db.query(Appareil).filter(Appareil.idSite == site.idSite).all()
    if not appareils:
        raise HTTPException(status_code=404, detail="No devices found for this site")
    
    appareil_ids = [appareil.idAppareil for appareil in appareils]
    
    # Récupérer les consommations depuis MongoDB
    try:
        consommations = await consommation_repo.get_consommations_by_date_range_and_appareils(
            start_date=start_date,
            end_date=end_date,
            appareil_ids=appareil_ids
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur MongoDB: {str(e)}")

    # Créer un dictionnaire pour regrouper les consommations par appareil
    consommation_par_appareil = {appareil.idAppareil: [] for appareil in appareils}
    
    for conso in consommations:
        consommation_par_appareil[conso.idAppareil].append(conso.quantite)
    
    # Calculer la moyenne pour chaque appareil
    average_consumption_per_device = []
    for appareil in appareils:
        if consommation_par_appareil[appareil.idAppareil]:
            avg_consumption = sum(consommation_par_appareil[appareil.idAppareil]) / len(consommation_par_appareil[appareil.idAppareil])
            average_consumption_per_device.append({
                "appareil": appareil.nom,
                "average_consumption": avg_consumption
            })
    
    if not average_consumption_per_device:
        raise HTTPException(status_code=404, detail="No consumption data found for devices")

    return average_consumption_per_device

def split_period(start_date: date, end_date: date) -> str:
    delta = (end_date - start_date).days
    if delta > 365:
        return "yearly"
    elif delta > 90:
        return "quarterly"
    elif delta > 30:
        return "monthly"
    elif delta > 7:
        return "weekly"
    else:
        return "daily"
##
@router.get("/Comparison/range/{user_id}/{site_id}/{appareil_id}")
async def get_comparison_range(
    user_id: int,
    site_id: int,
    appareil_id: int,
    start_date: date,
    end_date: date,
    db: Session = Depends(get_db)
):
    if start_date > end_date:
        raise HTTPException(status_code=400, detail="End date must be after start date")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if site_id != 0 :
        site = db.query(Site).filter(Site.idSite == site_id, Site.idUser == user.id).first()
        if not site:
            raise HTTPException(status_code=404, detail="Site not found")
        appareil = db.query(Appareil).filter(Appareil.idAppareil == appareil_id, Appareil.idSite == site.idSite).first()
    else :
        appareil = db.query(Appareil).filter(Appareil.idAppareil == appareil_id).first()
   
        
    if not appareil:
        raise HTTPException(status_code=404, detail="Appareil not found")

    period_type = split_period(start_date, end_date)

    consumption_data = defaultdict(lambda: {'consumption': 0})
    
    appareil_consommations = await consommation_repo.get_consommations_by_appareil(appareil.idAppareil)
           

    for consommation in appareil_consommations:
        jour = consommation.jour
        if not (start_date <= jour <= end_date):
            continue

        if period_type == "yearly":
            label = str(jour.year)
        elif period_type == "quarterly":
            quarter = (jour.month - 1) // 3 + 1
            label = f"T{quarter} {jour.year}"
        elif period_type == "monthly":
            label = f"{jour.month:02d}/{jour.year}"
        elif period_type == "weekly":
            week = jour.isocalendar()[1]
            year = jour.isocalendar()[0]
            label = f"Semaine {week}, {year}"
        else:  # daily
            label = jour.strftime("%Y-%m-%d")

        consumption_data[label]['consumption'] += consommation.quantite

    return dict(consumption_data)

##
@router.get("/Comparison/total/{user_id}")
async def get_total_consumption_for_user(
    user_id: int,
    start_date: date,
    end_date: date,
    db: Session = Depends(get_db),
    consommation_repo: ConsommationRepository = Depends(ConsommationRepository)
):
    # Vérifier si l'utilisateur existe
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Récupérer tous les sites de l'utilisateur
    sites = sites = (db.query(Site).options(joinedload(Site.appareils)).filter(Site.statut_approbation == 'approve',
                                                                               or_(
                                                                                   Site.idUser == user_id,
                                                                                   Site.idSite.in_(
                                                                                       db.query(UserSite.site_id)
                                                                                       .filter(UserSite.user_id == user_id)
                                                                                       .subquery()
                                                                                       )
                                                                                   )
                                                                               )
                     .all()
                    )
    if not sites:
        raise HTTPException(status_code=404, detail="No sites found for this user")

    # Récupérer tous les appareils associés à ces sites
    site_ids = [site.idSite for site in sites]
    appareils = db.query(Appareil).filter(Appareil.idSite.in_(site_ids)).all()
    if not appareils:
        return {"user": user.email, "consommation_pour_periode": 0}

    appareil_ids = [appareil.idAppareil for appareil in appareils]

    # Obtenir les consommations depuis MongoDB
    try:
        consommations = await consommation_repo.get_consommations_by_date_range_and_appareils(
            start_date=start_date,
            end_date=end_date,
            appareil_ids=appareil_ids
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur MongoDB: {str(e)}")

    # Calculer la consommation totale
    total_consumption = sum(conso.quantite for conso in consommations)

    return {
        "user": user.email,
        "consommation_pour_periode": total_consumption
    }

##
@router.get("/Comparison/site/category/{user_id}")
async def get_Comparison_category(
    user_id: int, 
    start_date: date = Query(..., description="Date de début au format YYYY-MM-DD"),
    end_date: date = Query(..., description="Date de fin au format YYYY-MM-DD"),
    db: Session = Depends(get_db),
    consommation_repo: ConsommationRepository = Depends(ConsommationRepository)
):
    try:
        # Vérifier que l'utilisateur existe
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
        appareils = (db.query(Appareil).join(Site, Appareil.idSite == Site.idSite)
                     .outerjoin(UserSite, UserSite.site_id == Site.idSite)
                     .filter(
                         Site.statut_approbation == 'approve',  or_(
                             Site.idUser == user_id,  # Soit le user est propriétaire
                             UserSite.user_id == user_id  # Soit il est invité
                             )
                         )
                     .distinct()  # Évite les doublons
                     .all()
                     )
        
        
        if not appareils:
            return []
        
        # Récupérer les consommations
        appareil_ids = [appareil.idAppareil for appareil in appareils]
        consommations = await consommation_repo.get_consommations_by_date_range_and_appareils(
            start_date, 
            end_date, 
            appareil_ids
        )
        
        if consommations is None:
            raise HTTPException(status_code=500, detail="Erreur lors de la récupération des consommations")
        
        # Grouper les consommations
        result = []
        for appareil in appareils:
            if not appareil.categorie:
                continue
                
            appareil_consommations = [
                conso for conso in consommations 
                if conso.idAppareil == appareil.idAppareil
            ]
            
            total_consommation = sum(conso.quantite for conso in appareil_consommations)
            
            result.append({
                "siteNom": appareil.site.nom,
                "categorie": appareil.categorie.nom,
                "consommation": total_consommation
            })
        
        return result

    except HTTPException:
        raise
    except Exception as e:
        print(f"Erreur inattendue: {str(e)}")
        raise HTTPException(status_code=500, detail="Erreur interne du serveur")

@router.get("/Consommation/site/{site_id}")
async def get_Consommations_site(
    site_id: int, 
    start: str = Query(..., description="Start date in YYYY-MM format"),
    end: str = Query(..., description="End date in YYYY-MM format"),
    db: Session = Depends(get_db),
    consommation_repo: ConsommationRepository = Depends(ConsommationRepository)
):
    try:
        # Vérifier que le site existe dans PostgreSQL
        site = db.query(Site).filter(Site.idSite == site_id).first()
        if not site:
            raise HTTPException(status_code=404, detail="Site not found")

        # Convertir les paramètres en dates
        start_date = datetime.strptime(start + "-01", "%Y-%m-%d")
        end_date = datetime.strptime(end + "-01", "%Y-%m-%d")
        
        # Ajuster end_date pour la fin du mois
        if end_date.month == 12:
            end_date = end_date.replace(year=end_date.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            end_date = end_date.replace(month=end_date.month + 1, day=1) - timedelta(days=1)

        # Récupérer tous les appareils du site depuis PostgreSQL
        appareils = db.query(Appareil).filter(Appareil.idSite == site_id).all()
        if not appareils:
            return {"labels": [], "values": []}

        # Générer les mois entre les dates
        months = []
        current_date = start_date.replace(day=1)
        while current_date <= end_date:
            month_key = current_date.strftime("%b")
            months.append({
                "key": month_key,
                "full": current_date.strftime("%b %Y"),
                "start": current_date.replace(day=1),
                "end": (current_date.replace(month=current_date.month + 1, day=1) 
                       if current_date.month < 12 
                       else current_date.replace(year=current_date.year + 1, month=1, day=1)) - timedelta(days=1)
            })
            if current_date.month == 12:
                current_date = current_date.replace(year=current_date.year + 1, month=1, day=1)
            else:
                current_date = current_date.replace(month=current_date.month + 1, day=1)

        # Agrégation des données
        monthly_data = {month["key"]: 0.0 for month in months}
        
        for appareil in appareils:
            try:
                consommations = await consommation_repo.get_consommations_with_date_range(
                    appareil.idAppareil,
                    start_date,
                    end_date
                )
                
                for conso in consommations:
                    # Accès aux champs via la notation dictionnaire
                    jour = conso["jour"]  # Utilisation de la notation dictionnaire
                    quantite = conso["quantite"]
                    
                    month_key = jour.strftime("%b")
                    if month_key in monthly_data:
                        monthly_data[month_key] += float(quantite)
            except Exception as e:
                logger.error(f"Error processing device {appareil.idAppareil}: {str(e)}")
                continue

        # Préparation de la réponse
        labels = [month["full"] for month in months]
        values = [monthly_data[month["key"]] for month in months]

        return {"labels": labels, "values": values}

    except ValueError as e:
        logger.error(f"Value error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")
    
    
@router.get("/Consommation/site/{site_id}/weekly")
async def get_weekly_consumption(
    site_id: int,
    month: str = Query(..., description="Month in YYYY-MM format"),
    db: Session = Depends(get_db),
    consommation_repo: ConsommationRepository = Depends(ConsommationRepository)
):
    try:
        # Vérifier que le site existe
        site = db.query(Site).filter(Site.idSite == site_id).first()
        if not site:
            raise HTTPException(status_code=404, detail="Site not found")

        # Convertir le mois en date
        month_date = datetime.strptime(month + "-01", "%Y-%m-%d")
        
        # Déterminer le premier et dernier jour du mois
        first_day = month_date.replace(day=1)
        if month_date.month == 12:
            last_day = month_date.replace(year=month_date.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            last_day = month_date.replace(month=month_date.month + 1, day=1) - timedelta(days=1)

        # Diviser le mois en semaines
        weeks = []
        current_date = first_day
        week_num = 1
        
        while current_date <= last_day:
            week_start = current_date
            week_end = current_date + timedelta(days=6)
            if week_end > last_day:
                week_end = last_day
            
            weeks.append({
                "week_number": week_num,
                "start_date": week_start.strftime("%b %d"),
                "end_date": week_end.strftime("%b %d"),
                "consumption": 0.0
            })
            
            current_date = week_end + timedelta(days=1)
            week_num += 1

        # Récupérer tous les appareils du site
        appareils = db.query(Appareil).filter(Appareil.idSite == site_id).all()
        if not appareils:
            return weeks  # Retourner les semaines avec consommation à 0

        # Calculer la consommation par semaine
        for appareil in appareils:
            try:
                consommations = await consommation_repo.get_consommations_with_date_range(
                    appareil.idAppareil,
                    first_day,
                    last_day
                )
                
                for conso in consommations:
                    jour = conso["jour"]
                    quantite = float(conso["quantite"])
                    
                    # Trouver la semaine correspondante
                    for week in weeks:
                        week_start = datetime.strptime(week["start_date"], "%b %d").replace(year=month_date.year)
                        week_end = datetime.strptime(week["end_date"], "%b %d").replace(year=month_date.year)
                        
                        if week_start <= jour <= week_end:
                            week["consumption"] += quantite
                            break
            except Exception as e:
                logger.error(f"Error processing device {appareil.idAppareil}: {str(e)}")
                continue

        return weeks

    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")
    
class NewConsommation(BaseModel):
    quantite: float
    jour: date
@router.post("/consommation/{appareil_id}")
async def add_consommation(
    appareil_id: int, 
    newConsommation: NewConsommation, 
    db: Session = Depends(get_db),
    consommation_repo: ConsommationRepository = Depends(ConsommationRepository)
):
    # Vérifier que l'appareil existe dans PostgreSQL
    appareil = db.query(Appareil).filter(Appareil.idAppareil == appareil_id).first()
    if not appareil:
        raise HTTPException(status_code=404, detail="Appareil not found")
    
    # Créer l'objet Consommation pour MongoDB (sans _id, il sera généré automatiquement)
    consommation_data = {
        "quantite": newConsommation.quantite,
        "jour": newConsommation.jour,
        "idAppareil": appareil_id
    }
    
    # Stocker dans MongoDB
    inserted_id = await consommation_repo.create_consommation(consommation_data)
    
    return {
        "message": "Consommation ajoutée avec succès dans MongoDB.",
        "inserted_id": inserted_id
    }
    
@router.get("/api/consumption/{id_user}")
async def get_monthly_consumption(
    id_user: int, 
    start: str = Query(..., description="Start date in YYYY-MM format"),
    end: str = Query(..., description="End date in YYYY-MM format"),
    db: Session = Depends(get_db)
):
    try:
        # Convertir les paramètres en dates
        start_date = datetime.strptime(start + "-01", "%Y-%m-%d")
        end_date = datetime.strptime(end + "-01", "%Y-%m-%d")
        
        # Ajuster end_date pour la fin du mois
        if end_date.month == 12:
            end_date = end_date.replace(year=end_date.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            end_date = end_date.replace(month=end_date.month + 1, day=1) - timedelta(days=1)

        # Récupérer les appareils de l'utilisateur
        appareils = (
            db.query(Appareil)
            .join(Site, Appareil.idSite == Site.idSite)
            .filter(Site.idUser == id_user)
            .all()
        )

        if not appareils:
            return {"labels": [], "values": []}

        # Générer les mois entre les dates
        months = []
        current_date = start_date.replace(day=1)
        while current_date <= end_date:
            month_key = current_date.strftime("%b")
            months.append({
                "key": month_key,
                "full": current_date.strftime("%b %Y"),
                "start": current_date.replace(day=1),
                "end": (current_date.replace(month=current_date.month + 1, day=1) 
                       if current_date.month < 12 
                       else current_date.replace(year=current_date.year + 1, month=1, day=1)) - timedelta(days=1)
            })
            if current_date.month == 12:
                current_date = current_date.replace(year=current_date.year + 1, month=1, day=1)
            else:
                current_date = current_date.replace(month=current_date.month + 1, day=1)

        # Agrégation des données
        monthly_data = {month["key"]: 0.0 for month in months}
        
        for appareil in appareils:
            try:
                consommations = await consommation_repo.get_consommations_with_date_range(
                    appareil.idAppareil,
                    start_date,
                    end_date
                )
                
                for conso in consommations:
                    # Accès aux champs via la notation dictionnaire
                    jour = conso["jour"]  # Utilisation de la notation dictionnaire
                    quantite = conso["quantite"]
                    
                    month_key = jour.strftime("%b")
                    if month_key in monthly_data:
                        monthly_data[month_key] += float(quantite)
            except Exception as e:
                logger.error(f"Error processing device {appareil.idAppareil}: {str(e)}")
                continue

        # Préparation de la réponse
        labels = [month["full"] for month in months]
        values = [monthly_data[month["key"]] for month in months]

        return {"labels": labels, "values": values}

    except ValueError as e:
        logger.error(f"Value error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")
    
def get_period_type(start_date: date, end_date: date) -> str:
    """Détermine la granularité temporelle en fonction de la période"""
    delta = (end_date - start_date).days
    if delta <= 7:  # ≤ 1 semaine
        return "day"
    elif delta <= 30:  # ≤ 1 mois
        return "week"
    elif delta <= 90:  # ≤ 3 mois
        return "month"
    elif delta <= 365:  # ≤ 1 an
        return "quarter"
    else:  # > 1 an
        return "year"
from calendar import monthrange

@router.get("/chatbot/consumption/{user_id}/current-month")
async def get_current_month_consumption(
    user_id: int,
    db: Session = Depends(get_db),
    consommation_repo: ConsommationRepository = Depends(ConsommationRepository)
):
    try:
        # Vérifier l'existence de l'utilisateur
        print(f"Recherche de l'utilisateur {user_id}")  # Debug
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Récupérer les sites de l'utilisateur
        user_sites = db.query(Site).filter(Site.idUser == user.id).all()
        if not user_sites:
            return {"consumption": 0.0, "message": "No sites found for this user"}

        # Récupérer les IDs des sites
        site_ids = [site.idSite for site in user_sites]

        # Récupérer les appareils des sites
        appareils = db.query(Appareil).filter(Appareil.idSite.in_(site_ids)).all()
        if not appareils:
            return {"consumption": 0.0, "message": "No devices found for user's sites"}

        # Calculer la plage de dates exacte pour le mois courant
        today = datetime.now().date()
        first_day_of_month = date(today.year, today.month, 1)
        
        # Dernier jour du mois en tenant compte des années bissextiles
        _, last_day = monthrange(today.year, today.month)
        last_day_of_month = date(today.year, today.month, last_day)

        # Si nous sommes dans le mois courant, la date de fin est aujourd'hui
        end_date = min(today, last_day_of_month)
        print(f"Sites trouvés: {[site.idSite for site in user_sites]}")  # Debug
        print(f"Appareils trouvés: {[appareil.idAppareil for appareil in appareils]}")  # Debug
        print(f"Plage de dates: {first_day_of_month} à {end_date}")  # Debug
        # Récupérer la consommation totale
        consumption = await consommation_repo.get_total_consumption_by_appareil_ids(
            appareil_ids=[appareil.idAppareil for appareil in appareils],
            start_date=first_day_of_month,
            end_date=end_date
        )

        return {
            "user_id": user_id,
            "consumption": round(consumption, 2),
            "period_start": first_day_of_month.isoformat(),
            "period_end": end_date.isoformat(),
            "days_elapsed": (end_date - first_day_of_month).days + 1,
            "device_count": len(appareils)
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error calculating consumption: {str(e)}"
        )
        
@router.get("/consumption/most-least-consuming/devices/{user_id}")
async def get_most_least_consuming_devices(
    user_id: int,
    start_date: date = Query(..., description="Date de début (YYYY-MM-DD)"),
    end_date: date = Query(..., description="Date de fin (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    consommation_repo: ConsommationRepository = Depends(ConsommationRepository)
):
    # Récupérer les appareils de l'utilisateur
    appareils = (
        db.query(Appareil)
        .join(Site, Appareil.idSite == Site.idSite)
        .filter(Site.idUser == user_id)
        .all()
    )
    
    if not appareils:
        raise HTTPException(status_code=404, detail="No devices found for this user")
    
    # Obtenir les extrêmes
    result = await consommation_repo.get_most_least_consuming_devices(
        appareil_ids=[a.idAppareil for a in appareils],
        start_date=start_date,
        end_date=end_date
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="No consumption data found")
    
    # Enrichir avec les noms des appareils
    device_map = {a.idAppareil: a.nom for a in appareils}
    
    return {
        "most_consuming": {
            "device_id": result["most_consuming"]["device_id"],
            "device_name": device_map.get(result["most_consuming"]["device_id"], "Inconnu"),
            "consumption": result["most_consuming"]["consumption"]
        },
        "least_consuming": {
            "device_id": result["least_consuming"]["device_id"],
            "device_name": device_map.get(result["least_consuming"]["device_id"], "Inconnu"),
            "consumption": result["least_consuming"]["consumption"]
        },
        "period": {
            "start": start_date.isoformat(),
            "end": end_date.isoformat()
        }
    }

@router.get("/consumption/most-least-consuming/sites/{user_id}")
async def get_most_least_consuming_sites(
    user_id: int,
    start_date: date = Query(..., description="Date de début (YYYY-MM-DD)"),
    end_date: date = Query(..., description="Date de fin (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    consommation_repo: ConsommationRepository = Depends(ConsommationRepository)
):
    # Récupérer les sites et appareils de l'utilisateur
    sites = (
        db.query(Site)
        .options(joinedload(Site.appareils))
        .filter(Site.idUser == user_id)
        .all()
    )
    
    if not sites:
        raise HTTPException(status_code=404, detail="No sites found for this user")
    
    # Préparer le mapping site -> appareils
    site_appareil_mapping = {
        site.idSite: [a.idAppareil for a in site.appareils] 
        for site in sites
        if site.appareils
    }
    
    if not site_appareil_mapping:
        raise HTTPException(status_code=404, detail="No devices found in any site")
    
    # Obtenir les extrêmes
    result = await consommation_repo.get_most_least_consuming_sites(
        site_appareil_mapping=site_appareil_mapping,
        start_date=start_date,
        end_date=end_date
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="No consumption data found")
    
    # Enrichir avec les noms des sites
    site_map = {s.idSite: s.nom for s in sites}
    
    return {
        "most_consuming": {
            "site_id": result["most_consuming"]["site_id"],
            "site_name": site_map.get(result["most_consuming"]["site_id"], "Inconnu"),
            "consumption": result["most_consuming"]["consumption"]
        },
        "least_consuming": {
            "site_id": result["least_consuming"]["site_id"],
            "site_name": site_map.get(result["least_consuming"]["site_id"], "Inconnu"),
            "consumption": result["least_consuming"]["consumption"]
        },
        "period": {
            "start": start_date.isoformat(),
            "end": end_date.isoformat()
        }
    }


@router.get("/api/consumption/{user_id}/current")
async def get_current_consumption_with_target(
    user_id: int,
    db: Session = Depends(get_db),
    consommation_repo: ConsommationRepository = Depends(ConsommationRepository)
):
    """
    Récupère la consommation actuelle du mois et la compare avec la cible maximale
    calculée à partir du budget_max de l'utilisateur (budget_max / 0.2516)
    
    Retourne:
    {
        "current_consumption": float,
        "max_consumption": float,
        "percentage": float,
        "variation": float,
        "message": str,
        "period": {
            "start": str,
            "end": str
        }
    }
    """
    try:
        # 1. Récupérer l'utilisateur et son budget_max
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Calculer la consommation maximale à partir du budget_max
        # Conversion: 1 kWh ≈ 0.2516 € (valeur ajustable)
        if user.budget_max is None:
            raise HTTPException(
                status_code=400, 
                detail="User has no budget_max defined"
            )
        
        max_consumption = user.budget_max / 0.2516  # Conversion en kWh
        
        # 2. Calculer la consommation actuelle du mois
        today = datetime.now().date()
        first_day_of_month = date(today.year, today.month, 1)
        last_day_of_month = date(today.year, today.month, 
                               monthrange(today.year, today.month)[1])
        end_date = min(today, last_day_of_month)
        
        # Récupérer les appareils de l'utilisateur
        sites = db.query(Site).filter(Site.idUser == user_id).all()
        if not sites:
            return {
                "current_consumption": 0,
                "max_consumption": round(max_consumption, 2),
                "percentage": 0,
                "variation": 0,
                "message": "No sites found for this user",
                "period": {
                    "start": first_day_of_month.isoformat(),
                    "end": end_date.isoformat()
                }
            }
        
        appareil_ids = [
            appareil.idAppareil 
            for site in sites 
            for appareil in site.appareils
        ]
        
        if not appareil_ids:
            return {
                "current_consumption": 0,
                "max_consumption": round(max_consumption, 2),
                "percentage": 0,
                "variation": 0,
                "message": "No devices found for this user",
                "period": {
                    "start": first_day_of_month.isoformat(),
                    "end": end_date.isoformat()
                }
            }
        
        # Récupérer la consommation totale du mois
        current_consumption = await consommation_repo.get_total_consumption_by_appareil_ids(
            appareil_ids=appareil_ids,
            start_date=first_day_of_month,
            end_date=end_date
        )
        
        # 3. Calculer les indicateurs
        percentage = (current_consumption / max_consumption) * 100
        
        # Calculer la variation par rapport au mois dernier (exemple simplifié)
        # En production, il faudrait récupérer les données du mois précédent
        variation = 10  # Valeur simulée - à remplacer par un calcul réel
        
        # 4. Générer un message contextuel
        if percentage >= 90:
            message = f"Attention! Vous avez consommé {percentage:.1f}% de votre budget énergétique."
        elif percentage >= 75:
            message = f"Vous avez consommé {percentage:.1f}% de votre budget. Surveillez votre consommation."
        else:
            message = f"Vous avez consommé {percentage:.1f}% de votre budget. Bonne gestion!"
        
        return {
            "current_consumption": round(current_consumption, 2),
            "max_consumption": round(max_consumption, 2),
            "percentage": round(percentage, 2),
            "variation": variation,
            "message": message,
            "period": {
                "start": first_day_of_month.isoformat(),
                "end": end_date.isoformat()
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error calculating consumption: {str(e)}"
        )
        
        
class TopSiteConsumption(BaseModel):
    site_id: int
    site_name: str
    consumption: float
    percentage: float

@router.get("/dashboard/top-sites/{user_id}", response_model=List[TopSiteConsumption])
async def get_top_consuming_sites(
    user_id: int,
    month: int = Query(..., ge=1, le=12, description="Mois (1-12)"),
    year: int = Query(..., description="Année"),
    db: Session = Depends(get_db),
    consommation_repo: ConsommationRepository = Depends(ConsommationRepository)
):
    """
    Récupère les 3 sites les plus consommateurs pour un mois donné
    """
    try:
        # Calculer les dates de début et fin du mois
        start_date = date(year, month, 1)
        end_date = date(year, month + 1, 1) - timedelta(days=1) if month < 12 else date(year + 1, 1, 1) - timedelta(days=1)

        # Récupérer tous les sites de l'utilisateur avec leurs appareils
        sites = (db.query(Site).options(joinedload(Site.appareils)).filter(
            Site.statut_approbation == 'approve',
            or_(
                Site.idUser == user_id,
                Site.idSite.in_(
                    db.query(UserSite.site_id)
                    .filter(UserSite.user_id == user_id)
                    .subquery()
                )
            )
        ).all())
        if not sites:
            return []

        # Calculer la consommation pour chaque site
        site_consumptions = []
        
        for site in sites:
            if not site.appareils:
                continue
                
            appareil_ids = [appareil.idAppareil for appareil in site.appareils]
            
            # Récupérer la consommation totale du site pour le mois
            consumption = await consommation_repo.get_total_consumption_by_appareil_ids(
                appareil_ids=appareil_ids,
                start_date=start_date,
                end_date=end_date
            )
            
            if consumption > 0:
                site_consumptions.append({
                    "site_id": site.idSite,
                    "site_name": site.nom,
                    "consumption": consumption
                })

        # Si aucune consommation trouvée
        if not site_consumptions:
            return []

        # Trier par consommation décroissante et prendre les 3 premiers
        site_consumptions.sort(key=lambda x: x["consumption"], reverse=True)
        top_3_sites = site_consumptions[:3]

        # Calculer le total de consommation pour les 3 sites
        total_top_consumption = sum(site["consumption"] for site in top_3_sites)

        # Calculer les pourcentages par rapport au total des 3 sites
        results = []
        for site in top_3_sites:
            percentage = (site["consumption"] / total_top_consumption) * 100 if total_top_consumption > 0 else 0
            results.append(TopSiteConsumption(
                site_id=site["site_id"],
                site_name=site["site_name"],
                consumption=round(site["consumption"], 2),
                percentage=round(percentage, 1)
            ))

        return results

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la récupération des données: {str(e)}"
        )
  
class ExtremeConsumingSites(BaseModel):
    most_consuming: dict
    least_consuming: dict
          
@router.get("/dashboard/extreme-consuming-sites/{user_id}", response_model=ExtremeConsumingSites)
async def get_extreme_consuming_sites(
    user_id: int,
    month: int = Query(..., ge=1, le=12, description="Mois (1-12)"),
    year: int = Query(..., description="Année"),
    db: Session = Depends(get_db),
    consommation_repo: ConsommationRepository = Depends(ConsommationRepository)
):
    """
    Récupère les sites les plus et moins consommateurs pour un utilisateur donné ce mois-ci
    Retourne un objet avec:
    - most_consuming: {site_id, site_name, consumption}
    - least_consuming: {site_id, site_name, consumption}
    """
    try:
        # Calculer les dates de début et fin du mois
        start_date = date(year, month, 1)
        end_date = date(year, month + 1, 1) - timedelta(days=1) if month < 12 else date(year + 1, 1, 1) - timedelta(days=1)

        # Récupérer tous les sites de l'utilisateur avec leurs appareils
        sites = (db.query(Site).options(joinedload(Site.appareils)).filter(Site.statut_approbation == 'approve',
                                                                           or_(
                                                                               Site.idUser == user_id,
                                                                               Site.idSite.in_(
                                                                                   db.query(UserSite.site_id)
                                                                                   .filter(UserSite.user_id == user_id)
                                                                                   .subquery()))).all())
        if not sites:
            raise HTTPException(status_code=404, detail="No sites found for this user")

        # Calculer la consommation pour chaque site
        site_consumptions = []
        
        for site in sites:
            if not site.appareils:
                continue
                
            appareil_ids = [appareil.idAppareil for appareil in site.appareils]
            
            # Récupérer la consommation totale du site pour le mois
            consumption = await consommation_repo.get_total_consumption_by_appareil_ids(
                appareil_ids=appareil_ids,
                start_date=start_date,
                end_date=end_date
            )
            
            site_consumptions.append({
                "site_id": site.idSite,
                "site_name": site.nom,
                "consumption": consumption
            })

        if not site_consumptions:
            raise HTTPException(status_code=404, detail="No consumption data found")

        # Trier par consommation
        site_consumptions.sort(key=lambda x: x["consumption"])
        
        return ExtremeConsumingSites(
            most_consuming={
                "site_id": site_consumptions[-1]["site_id"],
                "site_name": site_consumptions[-1]["site_name"],
                "consumption": round(site_consumptions[-1]["consumption"], 2)
            },
            least_consuming={
                "site_id": site_consumptions[0]["site_id"],
                "site_name": site_consumptions[0]["site_name"],
                "consumption": round(site_consumptions[0]["consumption"], 2)
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting extreme consuming sites: {str(e)}"
        )


    
class ExtremeConsumingDevices(BaseModel):
    most_consuming: dict
    least_consuming: dict

@router.get("/dashboard/extreme-consuming-devices/{user_id}", response_model=ExtremeConsumingDevices)
async def get_extreme_consuming_devices(
    user_id: int,
    month: int = Query(..., ge=1, le=12, description="Mois (1-12)"),
    year: int = Query(..., description="Année"),
    db: Session = Depends(get_db),
    consommation_repo: ConsommationRepository = Depends(ConsommationRepository)
):
    """
    Récupère les appareils les plus et moins consommateurs pour un utilisateur donné ce mois-ci
    Retourne un objet avec:
    - most_consuming: {appareil_id, appareil_name, consumption}
    - least_consuming: {appareil_id, appareil_name, consumption}
    """
    try:
        # Calculer les dates de début et fin du mois
        start_date = date(year, month, 1)
        end_date = date(year, month + 1, 1) - timedelta(days=1) if month < 12 else date(year + 1, 1, 1) - timedelta(days=1)

        # Récupérer tous les appareils de l'utilisateur
        appareils = (db.query(Appareil).join(Site, Appareil.idSite == Site.idSite)
                     .outerjoin(UserSite, UserSite.site_id == Site.idSite)
                     .filter(
                         Site.statut_approbation == 'approve',  or_(
                             Site.idUser == user_id,  # Soit le user est propriétaire
                             UserSite.user_id == user_id  # Soit il est invité
                             )
                         )
                     .distinct()  # Évite les doublons
                     .all()
                     )
        
        if not appareils:
            raise HTTPException(status_code=404, detail="No devices found for this user")

        # Calculer la consommation pour chaque appareil
        device_consumptions = []
        
        for appareil in appareils:
            # Récupérer la consommation de l'appareil pour le mois
            consumption = await consommation_repo.get_total_consumption_by_appareil_ids(
                appareil_ids=[appareil.idAppareil],
                start_date=start_date,
                end_date=end_date
            )
            
            device_consumptions.append({
                "appareil_id": appareil.idAppareil,
                "appareil_name": appareil.nom,
                "consumption": consumption
            })

        if not device_consumptions:
            raise HTTPException(status_code=404, detail="No consumption data found")

        # Trier par consommation
        device_consumptions.sort(key=lambda x: x["consumption"])
        
        return ExtremeConsumingDevices(
            most_consuming={
                "appareil_id": device_consumptions[-1]["appareil_id"],
                "appareil_name": device_consumptions[-1]["appareil_name"],
                "consumption": round(device_consumptions[-1]["consumption"], 2)
            },
            least_consuming={
                "appareil_id": device_consumptions[0]["appareil_id"],
                "appareil_name": device_consumptions[0]["appareil_name"],
                "consumption": round(device_consumptions[0]["consumption"], 2)
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting extreme consuming devices: {str(e)}"
        ) 
        
class ExtremeConsumingCompanies(BaseModel):
    most_consuming: dict
    least_consuming: dict

@router.get("/dashboard/extreme-consuming-companies/{user_id}", response_model=ExtremeConsumingCompanies)
async def get_extreme_consuming_companies_for_user(
    user_id: int,
    month: int = Query(..., ge=1, le=12, description="Mois (1-12)"),
    year: int = Query(..., description="Année"),
    db: Session = Depends(get_db),
    consommation_repo: ConsommationRepository = Depends(ConsommationRepository)
):
    """
    Récupère les entreprises les plus et moins consommatrices pour un utilisateur donné ce mois-ci
    (basé sur les sites qui lui appartiennent)
    Retourne un objet avec:
    - most_consuming: {company_id, company_name, consumption}
    - least_consuming: {company_id, company_name, consumption}
    """
    try:
        # Calculer les dates de début et fin du mois
        start_date = date(year, month, 1)
        end_date = date(year, month + 1, 1) - timedelta(days=1) if month < 12 else date(year + 1, 1, 1) - timedelta(days=1)

        # Récupérer toutes les entreprises associées aux sites de l'utilisateur
        companies = (db.query(Entreprise)
                    .join(Site, Site.idEntreprise == Entreprise.idEntreprise)
                    .options(joinedload(Entreprise.sites).joinedload(Site.appareils))
                    .filter(Site.idUser == user_id)
                    .distinct()
                    .all())

        if not companies:
            raise HTTPException(status_code=404, detail="No companies found for this user")

        # Calculer la consommation pour chaque entreprise
        company_consumptions = []
        
        for company in companies:
            # Filtrer seulement les sites qui appartiennent à l'utilisateur
            user_sites = [site for site in company.sites if site.idUser == user_id]
            
            if not user_sites:
                continue
                
            # Récupérer tous les IDs d'appareils des sites de l'utilisateur
            appareil_ids = []
            for site in user_sites:
                if site.appareils:
                    appareil_ids.extend([appareil.idAppareil for appareil in site.appareils])
            
            if not appareil_ids:
                continue
                
            # Récupérer la consommation totale de l'entreprise pour le mois
            consumption = await consommation_repo.get_total_consumption_by_appareil_ids(
                appareil_ids=appareil_ids,
                start_date=start_date,
                end_date=end_date
            )
            
            company_consumptions.append({
                "company_id": company.idEntreprise,
                "company_name": company.nom,
                "consumption": consumption
            })

        if not company_consumptions:
            raise HTTPException(status_code=404, detail="No consumption data found for user's companies")

        # Trier par consommation
        company_consumptions.sort(key=lambda x: x["consumption"])
        
        return ExtremeConsumingCompanies(
            most_consuming={
                "company_id": company_consumptions[-1]["company_id"],
                "company_name": company_consumptions[-1]["company_name"],
                "consumption": round(company_consumptions[-1]["consumption"], 2)
            },
            least_consuming={
                "company_id": company_consumptions[0]["company_id"],
                "company_name": company_consumptions[0]["company_name"],
                "consumption": round(company_consumptions[0]["consumption"], 2)
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting extreme consuming companies for user: {str(e)}"
        )
        
        


class AppareilConsommationDetail(BaseModel):
    appareil_id: int
    appareil_nom: str
    marque: str
    modele: str
    puissance: float
    consommation_totale: float
    consommation_moyenne_journaliere: float

@router.get("/consommation/site/{site_id}/details", response_model=List[AppareilConsommationDetail])
async def get_site_consumption_details(
    site_id: int,
    month: int = Query(..., ge=1, le=12, description="Mois (1-12)"),
    year: int = Query(..., description="Année"),
    db: Session = Depends(get_db),
    consommation_repo: ConsommationRepository = Depends(ConsommationRepository)
):
    """
    Récupère la consommation détaillée par appareil pour un site spécifique pendant un mois donné.
    
    Retourne pour chaque appareil:
    - ID et nom de l'appareil
    - Marque et modèle
    - Puissance
    - Consommation totale du mois
    - Consommation moyenne journalière
    """
    try:
        # 1. Vérifier que le site existe et récupérer ses appareils
        site = db.query(Site)\
            .filter(Site.idSite == site_id)\
            .options(joinedload(Site.appareils))\
            .first()
            
        if not site:
            raise HTTPException(status_code=404, detail="Site non trouvé")
            
        if not site.appareils:
            return []

        # 2. Déterminer la période (tout le mois)
        start_date = date(year, month, 1)
        if month == 12:
            end_date = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            end_date = date(year, month + 1, 1) - timedelta(days=1)

        # 3. Pour chaque appareil, calculer sa consommation
        results = []
        for appareil in site.appareils:
            # Récupérer toutes les consommations de l'appareil pour le mois
            consommations = await consommation_repo.get_consommations_by_date_range_and_appareils(
                start_date=start_date,
                end_date=end_date,
                appareil_ids=[appareil.idAppareil]
            )
            
            # Calculer les métriques
            total_consommation = sum(conso.quantite for conso in consommations)
            jours_avec_consommation = len({conso.jour for conso in consommations})
            
            moyenne_journaliere = (total_consommation / jours_avec_consommation) if jours_avec_consommation > 0 else 0
            
            results.append(AppareilConsommationDetail(
                appareil_id=appareil.idAppareil,
                appareil_nom=appareil.nom,
                marque=appareil.marque,
                modele=appareil.modele,
                puissance=appareil.puissance,
                consommation_totale=round(total_consommation, 2),
                consommation_moyenne_journaliere=round(moyenne_journaliere, 2)
            ))

        # Trier par consommation totale décroissante
        results.sort(key=lambda x: x.consommation_totale, reverse=True)
        
        return results

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la récupération des données: {str(e)}"
        )
        
class PeriodData(BaseModel):
    start_date: str
    end_date: str
    data: List[ConsommationResponse]

class ConsommationEntrepriseResponse(BaseModel):
    total: List[ConsommationResponse]
    periods: List[PeriodData]
    period_type: str

def determine_period_type(start_date: date, end_date: date) -> str:
    """Détermine la granularité appropriée en fonction de la période"""
    delta = (end_date - start_date).days
    if delta > 365:  # > 1 an -> annuel
        return "yearly"
    elif delta > 90:  # > 3 mois -> trimestriel
        return "quarterly"
    elif delta > 30:  # > 1 mois -> mensuel
        return "monthly"
    elif delta > 7:   # > 1 semaine -> hebdomadaire
        return "weekly"
    else:             # ≤ 1 semaine -> quotidien
        return "daily"

def split_date_range(start_date: date, end_date: date, period_type: str) -> List[Tuple[date, date]]:
    """Divise la période en sous-périodes selon le type déterminé"""
    periods = []
    current = start_date
    
    while current < end_date:
        if period_type == "yearly":
            next_date = date(current.year + 1, 1, 1)
        elif period_type == "quarterly":
            quarter = (current.month - 1) // 3 + 1
            if quarter == 4:
                next_date = date(current.year + 1, 1, 1)
            else:
                next_date = date(current.year, 3 * quarter + 1, 1)
        elif period_type == "monthly":
            if current.month == 12:
                next_date = date(current.year + 1, 1, 1)
            else:
                next_date = date(current.year, current.month + 1, 1)
        elif period_type == "weekly":
            next_date = current + timedelta(days=7)
        else:  # daily
            next_date = current + timedelta(days=1)
        
        # Ajuster la fin si elle dépasse la date de fin globale
        period_end = min(next_date - timedelta(days=1), end_date)
        periods.append((current, period_end))
        current = next_date
    
    return periods
class EntrepriseConsommation(BaseModel):
    entreprise_id: int
    entreprise_nom: str
    consommation_totale: float
    nombre_sites: int
    nombre_appareils: int

class EntrepriseConsommationResponse(BaseModel):
    entreprises: List[EntrepriseConsommation]
    periode_debut: str
    periode_fin: str
    consommation_totale: float
@router.get("/consommation/entreprise/{user_id}", response_model=EntrepriseConsommationResponse)
async def get_consommation_entreprises_utilisateur(
    user_id: int,
    start_date: date = Query(..., description="Date de début (YYYY-MM-DD)"),
    end_date: date = Query(..., description="Date de fin (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    consommation_repo: ConsommationRepository = Depends(ConsommationRepository)
):
    """
    Récupère la consommation pour chaque entreprise associée à l'utilisateur
    Retourne pour chaque entreprise:
    - ID et nom de l'entreprise
    - Consommation totale
    - Nombre de sites
    - Nombre d'appareils
    """
    try:
        # 1. Récupérer toutes les entreprises de l'utilisateur
        entreprises = db.query(Entreprise).join(Site).filter(Site.idUser == user_id).all()
        
        if not entreprises:
            return {
                "entreprises": [],
                "periode_debut": start_date.isoformat(),
                "periode_fin": end_date.isoformat(),
                "consommation_totale": 0.0
            }

        # 2. Pour chaque entreprise, récupérer ses sites approuvés et appareils
        entreprises_data = []
        all_appareil_ids = []

        for entreprise in entreprises:
            # Récupérer les sites approuvés de l'entreprise pour cet utilisateur
            sites = (db.query(Site)
                    .options(joinedload(Site.appareils))
                    .filter(
                        Site.idUser == user_id,
                        Site.idEntreprise == entreprise.idEntreprise,
                        Site.statut_approbation == 'approve'
                    )
                    .all())
            
            # Compter les sites et appareils
            site_ids = set()
            appareil_ids = set()
            
            for site in sites:
                site_ids.add(site.idSite)
                for appareil in site.appareils:
                    appareil_ids.add(appareil.idAppareil)
            
            # Ajouter à la liste des appareils pour MongoDB
            all_appareil_ids.extend(appareil_ids)
            
            entreprises_data.append({
                "entreprise_id": entreprise.idEntreprise,
                "entreprise_nom": entreprise.nom,
                "site_ids": site_ids,
                "appareil_ids": appareil_ids
            })

        # 3. Récupérer les consommations si des appareils existent
        consommation_par_appareil = defaultdict(float)
        if all_appareil_ids:
            consommations = await consommation_repo.get_consommations_by_date_range_and_appareils(
                start_date=start_date,
                end_date=end_date,
                appareil_ids=all_appareil_ids
            )
            
            for conso in consommations:
                consommation_par_appareil[conso.idAppareil] += conso.quantite

        # 4. Construire la réponse finale
        entreprises_result = []
        consommation_totale = 0.0
        
        for data in entreprises_data:
            # Calculer la consommation totale de l'entreprise
            consommation_entreprise = sum(
                consommation_par_appareil[appareil_id]
                for appareil_id in data["appareil_ids"]
            )
            
            entreprises_result.append(EntrepriseConsommation(
                entreprise_id=data["entreprise_id"],
                entreprise_nom=data["entreprise_nom"],
                consommation_totale=round(consommation_entreprise, 2),
                nombre_sites=len(data["site_ids"]),
                nombre_appareils=len(data["appareil_ids"])
            ))
            
            consommation_totale += consommation_entreprise

        # Trier par consommation décroissante
        entreprises_result.sort(key=lambda x: x.consommation_totale, reverse=True)

        return EntrepriseConsommationResponse(
            entreprises=entreprises_result,
            periode_debut=start_date.isoformat(),
            periode_fin=end_date.isoformat(),
            consommation_totale=round(consommation_totale, 2)
        )

    except Exception as e:
        logging.error(f"Error in get_consommation_entreprises_utilisateur: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la récupération des données: {str(e)}"
        )
        
        
class TopEntrepriseConsumption(BaseModel):
    entreprise_id: int
    entreprise_name: str
    consumption: float
    percentage: float

@router.get("/dashboard/top-entreprises/{user_id}", response_model=List[TopEntrepriseConsumption])
async def get_top_consuming_entreprises(
    user_id: int,
    month: int = Query(..., ge=1, le=12, description="Mois (1-12)"),
    year: int = Query(..., description="Année"),
    limit: int = Query(5, description="Nombre d'entreprises à retourner"),
    db: Session = Depends(get_db),
    consommation_repo: ConsommationRepository = Depends(ConsommationRepository)
):
    """
    Récupère les entreprises les plus consommatrices pour un utilisateur donné
    """
    try:
        # Calculer les dates de début et fin du mois
        start_date = date(year, month, 1)
        end_date = date(year, month + 1, 1) - timedelta(days=1) if month < 12 else date(year + 1, 1, 1) - timedelta(days=1)

        # Récupérer toutes les entreprises de l'utilisateur avec leurs sites et appareils
        entreprises = (db.query(Entreprise)
                      .join(Site, Site.idEntreprise == Entreprise.idEntreprise)
                      .options(joinedload(Entreprise.sites).joinedload(Site.appareils))
                      .filter(Site.idUser == user_id)
                      .distinct()
                      .all())
        
        if not entreprises:
            return []

        # Calculer la consommation pour chaque entreprise
        entreprise_consumptions = []
        
        for entreprise in entreprises:
            # Récupérer tous les appareils des sites de l'entreprise
            appareil_ids = []
            for site in entreprise.sites:
                if site.idUser == user_id and site.appareils:  # Ne considérer que les sites de l'utilisateur
                    appareil_ids.extend([appareil.idAppareil for appareil in site.appareils])
            
            if not appareil_ids:
                continue
                
            # Récupérer la consommation totale de l'entreprise pour le mois
            consumption = await consommation_repo.get_total_consumption_by_appareil_ids(
                appareil_ids=appareil_ids,
                start_date=start_date,
                end_date=end_date
            )
            
            if consumption > 0:
                entreprise_consumptions.append({
                    "entreprise_id": entreprise.idEntreprise,
                    "entreprise_name": entreprise.nom,
                    "consumption": consumption
                })

        # Si aucune consommation trouvée
        if not entreprise_consumptions:
            return []

        # Trier par consommation décroissante et prendre les 'limit' premiers
        entreprise_consumptions.sort(key=lambda x: x["consumption"], reverse=True)
        top_entreprises = entreprise_consumptions[:limit]

        # Calculer le total de consommation pour les entreprises sélectionnées
        total_consumption = sum(ent["consumption"] for ent in top_entreprises)

        # Calculer les pourcentages par rapport au total
        results = []
        for entreprise in top_entreprises:
            percentage = (entreprise["consumption"] / total_consumption) * 100 if total_consumption > 0 else 0
            results.append(TopEntrepriseConsumption(
                entreprise_id=entreprise["entreprise_id"],
                entreprise_name=entreprise["entreprise_name"],
                consumption=round(entreprise["consumption"], 2),
                percentage=round(percentage, 1)
            ))

        return results

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la récupération des données: {str(e)}"
        )

@router.get("/consommation/entreprise/{entreprise_id}/details", response_model=List[AppareilConsommationDetail])
async def get_entreprise_consumption_details(
    entreprise_id: int,
    month: int = Query(..., ge=1, le=12, description="Mois (1-12)"),
    year: int = Query(..., description="Année"),
    db: Session = Depends(get_db),
    consommation_repo: ConsommationRepository = Depends(ConsommationRepository)
):
    """
    Récupère la consommation détaillée par appareil pour une entreprise spécifique pendant un mois donné.
    
    Retourne pour chaque appareil:
    - ID et nom de l'appareil
    - Marque et modèle
    - Puissance
    - Consommation totale du mois
    - Consommation moyenne journalière
    """
    try:
        # 1. Vérifier que l'entreprise existe et récupérer ses appareils
        entreprise = db.query(Entreprise)\
            .filter(Entreprise.idEntreprise == entreprise_id)\
            .options(joinedload(Entreprise.sites).joinedload(Site.appareils))\
            .first()
            
        if not entreprise:
            raise HTTPException(status_code=404, detail="Entreprise non trouvée")
            
        # Récupérer tous les appareils de l'entreprise
        appareils = []
        for site in entreprise.sites:
            appareils.extend(site.appareils)
            
        if not appareils:
            return []

        # 2. Déterminer la période (tout le mois)
        start_date = date(year, month, 1)
        if month == 12:
            end_date = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            end_date = date(year, month + 1, 1) - timedelta(days=1)

        # 3. Pour chaque appareil, calculer sa consommation
        results = []
        for appareil in appareils:
            # Récupérer toutes les consommations de l'appareil pour le mois
            consommations = await consommation_repo.get_consommations_by_date_range_and_appareils(
                start_date=start_date,
                end_date=end_date,
                appareil_ids=[appareil.idAppareil]
            )
            
            # Calculer les métriques
            total_consommation = sum(conso.quantite for conso in consommations)
            jours_avec_consommation = len({conso.jour for conso in consommations})
            
            moyenne_journaliere = (total_consommation / jours_avec_consommation) if jours_avec_consommation > 0 else 0
            
            results.append(AppareilConsommationDetail(
                appareil_id=appareil.idAppareil,
                appareil_nom=appareil.nom,
                marque=appareil.marque,
                modele=appareil.modele,
                puissance=appareil.puissance,
                consommation_totale=round(total_consommation, 2),
                consommation_moyenne_journaliere=round(moyenne_journaliere, 2)
            ))

        # Trier par consommation totale décroissante
        results.sort(key=lambda x: x.consommation_totale, reverse=True)
        
        return results

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la récupération des données: {str(e)}"
        )

@router.get("/consommation/entreprise/{entreprise_id}/sites", response_model=List[TopSiteConsumption])
async def get_entreprise_sites_consumption(
    entreprise_id: int,
    month: int = Query(..., ge=1, le=12, description="Mois (1-12)"),
    year: int = Query(..., description="Année"),
    db: Session = Depends(get_db),
    consommation_repo: ConsommationRepository = Depends(ConsommationRepository)
):
    """
    Récupère la consommation des sites d'une entreprise pour un mois donné
    """
    try:
        # Calculer les dates de début et fin du mois
        start_date = date(year, month, 1)
        end_date = date(year, month + 1, 1) - timedelta(days=1) if month < 12 else date(year + 1, 1, 1) - timedelta(days=1)

        # Récupérer les sites de l'entreprise avec leurs appareils
        sites = (db.query(Site)
                .filter(Site.idEntreprise == entreprise_id)
                .options(joinedload(Site.appareils))
                .all())
        
        if not sites:
            return []

        # Calculer la consommation pour chaque site
        site_consumptions = []
        
        for site in sites:
            if not site.appareils:
                continue
                
            appareil_ids = [appareil.idAppareil for appareil in site.appareils]
            
            # Récupérer la consommation totale du site pour le mois
            consumption = await consommation_repo.get_total_consumption_by_appareil_ids(
                appareil_ids=appareil_ids,
                start_date=start_date,
                end_date=end_date
            )
            
            if consumption > 0:
                site_consumptions.append({
                    "site_id": site.idSite,
                    "site_name": site.nom,
                    "consumption": consumption
                })

        # Si aucune consommation trouvée
        if not site_consumptions:
            return []

        # Calculer le total de consommation pour tous les sites
        total_consumption = sum(site["consumption"] for site in site_consumptions)

        # Calculer les pourcentages par rapport au total
        results = []
        for site in site_consumptions:
            percentage = (site["consumption"] / total_consumption) * 100 if total_consumption > 0 else 0
            results.append(TopSiteConsumption(
                site_id=site["site_id"],
                site_name=site["site_name"],
                consumption=round(site["consumption"], 2),
                percentage=round(percentage, 1)
            ))

        # Trier par consommation décroissante
        results.sort(key=lambda x: x.consumption, reverse=True)
        
        return results

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la récupération des données: {str(e)}"
        )