from datetime import date
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..models.recompense import Récompense
from ..models.defi import Défi
from app.particulier.models.site import Site
from ..models import User
from sqlalchemy.orm import joinedload

class RecompenseService:
    def __init__(self, db: Session):
        self.db = db

    # def create_recompense(self, idSite: int, idDefi: Optional[int] = None) -> Récompense:
    #     """Crée une nouvelle récompense"""
    #     try:
    #         nouvelle_recompense = Récompense(
    #             date=date.today(),
    #             idSite=idSite,
    #             idDefi=idDefi
    #         )
            
    #         self.db.add(nouvelle_recompense)
    #         self.db.commit()
    #         self.db.refresh(nouvelle_recompense)
    #         return nouvelle_recompense
            
    #     except Exception as e:
    #         self.db.rollback()
    #         raise ValueError(f"Erreur lors de la création de la récompense: {str(e)}")

    from sqlalchemy.orm import joinedload

    def get_recompense(self, idRecompense: int) -> Optional[Dict]:
        """Récupère une récompense par son ID avec toutes les relations nécessaires"""
        reward = (self.db.query(Récompense)
                .options(
                    joinedload(Récompense.defi),
                    joinedload(Récompense.site).joinedload(Site.owner)
                )
                .filter(Récompense.idRécompense == idRecompense)
                .first())
        
        if not reward:
            return None
        
        return {
            "idRecompense": reward.idRécompense,
            "date": reward.date,
            "defi": {
                "idDefi": reward.defi.idDefi if reward.defi else None,
                "titre": reward.defi.titre if reward.defi else None,
                "points": reward.defi.points if reward.defi else None
            },
            "site": {
                "idSite": reward.site.idSite,
                "nom": reward.site.nom,
                "user": {
                    "idUser": reward.site.owner.id,
                    "nom": reward.site.owner.nom or None,
                    "prenom": reward.site.owner.prenom or None
                }
            }
        }

    def get_recompenses_by_site(self, idSite: int) -> List[Dict]:
        """Récupère toutes les récompenses d'un site avec les relations nécessaires"""
        rewards = (self.db.query(Récompense)
                .options(
                    joinedload(Récompense.defi),
                    joinedload(Récompense.site).joinedload(Site.owner)
                )
                .filter(Récompense.idSite == idSite)
                .order_by(Récompense.date.desc())
                .all())
        
        result = []
        for reward in rewards:
            reward_data = {
                "idRecompense": reward.idRécompense,
                "date": reward.date,
                "defi": {
                    "idDefi": reward.defi.idDefi if reward.defi else None,
                    "titre": reward.defi.titre if reward.defi else None,
                    "points": reward.defi.points if reward.defi else None
                },
                "site": {
                    "idSite": reward.site.idSite,
                    "nom": reward.site.nom,
                    "user": {
                        "idUser": reward.site.owner.id,
                        "nom": reward.site.owner.nom or None,
                        "prenom": reward.site.owner.prenom or None
                    }
                }
            }
            result.append(reward_data)
        
        return result

    def get_recompenses_by_user(self, idUser: int) -> List[Dict]:
        """Récupère toutes les récompenses des sites d'un utilisateur avec les relations nécessaires"""
        rewards = (self.db.query(Récompense)
                .join(Site, Site.idSite == Récompense.idSite)
                .options(
                    joinedload(Récompense.defi),
                    joinedload(Récompense.site).joinedload(Site.owner)
                )
                .filter(Site.idUser == idUser)
                .order_by(Récompense.date.desc())
                .all())
        
        result = []
        for reward in rewards:
            reward_data = {
                "idRecompense": reward.idRécompense,
                "date": reward.date,
                "defi": {
                    "idDefi": reward.defi.idDefi if reward.defi else None,
                    "titre": reward.defi.titre if reward.defi else None,
                    "points": reward.defi.points if reward.defi else None
                },
                "site": {
                    "idSite": reward.site.idSite,
                    "nom": reward.site.nom,
                    "user": {
                        "idUser": reward.site.owner.id,
                        "nom": reward.site.owner.nom or None,
                        "prenom": reward.site.owner.prenom or None
                    }
                }
            }
            result.append(reward_data)
        
        return result

    def get_total_points_user(self, idUser: int) -> int:
        """
        Calcule la somme des points des défis récompensés pour tous les sites d'un utilisateur
        Retourne un dictionnaire avec le total et les détails par site
        """
        result = (self.db.query(
                    Site.idSite,
                    Site.nom.label('nom_site'),
                    func.sum(Défi.points).label('total_points'))
                .join(Récompense, Récompense.idSite == Site.idSite)
                .join(Défi, Défi.idDefi == Récompense.idDefi)
                .filter(Site.idUser == idUser)
                .group_by(Site.idSite, Site.nom)
                .all())
        
        total = sum(row.total_points for row in result if row.total_points is not None)
        
        return {
            "total": total or 0,
            "details": [{
                "idSite": row.idSite,
                "nom_site": row.nom_site,
                "points": row.total_points or 0
            } for row in result]
        }

    def get_total_points_site(self, idSite: int) -> Dict:
        """
        Calcule la somme des points des défis récompensés pour un site spécifique
        Retourne le total et les détails des défis
        """
        results = (self.db.query(
                    Défi.idDefi,
                    Défi.titre,
                    Défi.points,
                    Récompense.date)
                .join(Récompense, Récompense.idDefi == Défi.idDefi)
                .filter(Récompense.idSite == idSite)
                .all())
        
        total = sum(result.points for result in results)
        
        return {
            "total": total or 0,
            "details": [{
                "idDefi": result.idDefi,
                "titre_defi": result.titre,
                "points": result.points,
                "date": result.date
            } for result in results]
        }

    def get_recompenses_with_details(self) -> List[Dict]:
        """
        Retourne toutes les récompenses avec les détails du défi et du site
        Format: {
            idRécompense, date,
            defi: {idDefi, titre, points},
            site: {idSite, nom, user: {idUser, nom, prenom}}
        }
        """
        recompenses = (self.db.query(Récompense)
                      .join(Défi, Défi.idDefi == Récompense.idDefi, isouter=True)
                      .join(Site, Site.idSite == Récompense.idSite)
                      .join(User, User.id == Site.idUser)
                      .all())
        
        return [{
            "idRécompense": r.idRécompense,
            "idRecompense": r.idRécompense,
            "date": r.date,
            "idSite": r.site.idSite,
            "defi": {
                "idDefi": r.defi.idDefi if r.defi else None,
                "titre": r.defi.titre if r.defi else None,
                "points": r.defi.points if r.defi else None
            } if r.defi else None,
            "site": {
                "idSite": r.site.idSite,
                "nom": r.site.nom,
                "user": {
                    "idUser": r.site.owner.id,
                    "nom": r.site.owner.nom or None,
                    "prenom": r.site.owner.prenom
                }
            }
        } for r in recompenses]