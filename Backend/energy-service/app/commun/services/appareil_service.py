from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.particulier.models import Site, UserSite
from app.commun.models import Appareil
from app.commun.models import User
from app.particulier.services.site_service import SiteService
from typing import List
from sqlalchemy import or_
from sqlalchemy.orm import joinedload
class AppareilService:
    def __init__(self, db: Session):
        self.db = db
        self.site_service = SiteService(db)

    def get_appareils_by_site(self, site_id: int):
        site = self.site_service._get_site_by_id(site_id)
        if not site:
            raise HTTPException(status_code=404, detail="Site not found")
        return site.appareils

    def get_appareils_by_user(self, user_id: int, only_approved: bool = True):
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
    
        base_query = self.db.query(Appareil).join(Site, Appareil.idSite == Site.idSite)
    
        if only_approved:
            base_query = base_query.filter(Site.statut_approbation == 'approve')
    
        appareils = (
            base_query
            .outerjoin(UserSite, UserSite.site_id == Site.idSite)
            .filter(
                or_(
                    Site.idUser == user_id,
                    UserSite.user_id == user_id
                )
            )
            .options(joinedload(Appareil.site))  # Chargement des infos du site
            .all()
        )
    
        return appareils

    def get_user_appareil_ids(self, user_id: int) -> List[int]:
        """Get all device IDs belonging to a user (both owned and invited sites)"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get device IDs from owned sites
        owned_appareil_ids = [
            appareil.idAppareil 
            for site in user.owned_sites 
            for appareil in site.appareils
        ]
        
        # Get device IDs from invited sites
        invited_appareil_ids = [
            appareil.idAppareil
            for site in user.invited_sites
            for appareil in site.appareils
        ]
        
        return owned_appareil_ids + invited_appareil_ids

    def create_appareil(self, site_id: int, categorie_id: int, nom: str, marque: str, modele: str, puissance: float):
        if not self.site_service._get_site_by_id(site_id):
            raise HTTPException(status_code=404, detail="Site not found")
        
        new_appareil = Appareil(
            nom=nom,
            marque=marque,
            modele=modele,
            puissance=puissance,
            idCategorieAppareil=categorie_id,
            idSite=site_id
        )
        self.db.add(new_appareil)
        self.db.commit()
        return {"message": "Appareil ajouté avec succès."}

    def get_total_appareils_with_invites(self, user_id: int):
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Appareils des sites possédés
        owned_appareils = self.db.query(Appareil)\
                               .join(Site, Appareil.idSite == Site.idSite)\
                               .filter(Site.idUser == user_id)\
                               .count()
        
        # Appareils des sites où l'utilisateur est invité
        invited_appareils = self.db.query(Appareil)\
                                 .join(Site, Appareil.idSite == Site.idSite)\
                                 .join(UserSite, UserSite.site_id == Site.idSite)\
                                 .filter(UserSite.user_id == user_id)\
                                 .count()
        
        return {
            "user_id": user_id,
            "total": owned_appareils + invited_appareils,
            "owned_sites_appareils": owned_appareils,
            "invited_sites_appareils": invited_appareils
        }