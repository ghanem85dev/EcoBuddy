from datetime import date
from sqlalchemy.orm import Session
from app.commun.models import BadgeHistorique
from app.commun.schemas.badge_historique import BadgeHistoriqueCreate
from sqlalchemy import desc
from sqlalchemy.orm import joinedload

class BadgeService:
    def __init__(self, db: Session):
        self.db = db

    def create_badge_history(self, badge_history_data: BadgeHistoriqueCreate) -> BadgeHistorique:
        """
        Crée un nouvel historique de badge
        """
        try:
            nouveau_historique = BadgeHistorique(
                date=date.today(),
                idUser=badge_history_data.idUser,
                idBadge=badge_history_data.idBadge
            )
            
            self.db.add(nouveau_historique)
            self.db.commit()
            self.db.refresh(nouveau_historique)
            
            return nouveau_historique
            
        except Exception as e:
            self.db.rollback()
            raise ValueError(f"Erreur lors de la création de l'historique: {str(e)}")

    def get_user_badge_history(self, user_id: int) -> list[BadgeHistorique]:
        """
        Récupère l'historique des badges d'un utilisateur
        """
        return self.db.query(BadgeHistorique)\
                     .filter(BadgeHistorique.idUser == user_id)\
                     .order_by(BadgeHistorique.date.desc())\
                     .all()
                     
    

    def get_latest_user_badge(self, user_id: int) -> BadgeHistorique | None:
        """
        Récupère le DERNIER historique de badge avec les données du badge
        """
        return self.db.query(BadgeHistorique)\
                    .options(joinedload(BadgeHistorique.badge))\
                    .filter(BadgeHistorique.idUser == user_id)\
                    .order_by(desc(BadgeHistorique.date), desc(BadgeHistorique.idBadgeHistorique))\
                    .first()