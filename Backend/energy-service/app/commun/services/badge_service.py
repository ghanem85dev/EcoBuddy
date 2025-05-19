from sqlalchemy.orm import Session
from app.commun.models.badge import Badge
from app.commun.schemas.badge import BadgeCreate, BadgeUpdate

class BadgeService:
    def __init__(self, db: Session):
        self.db = db

    def create_badge(self, badge_data: BadgeCreate) -> Badge:
        """Crée un nouveau badge"""
        try:
            badge = Badge(
                titre=badge_data.titre,
                minPoints=badge_data.minPoints,
                description=badge_data.description
            )
            self.db.add(badge)
            self.db.commit()
            self.db.refresh(badge)
            return badge
        except Exception as e:
            self.db.rollback()
            raise ValueError(f"Erreur lors de la création du badge: {str(e)}")

    def get_badge(self, badge_id: int) -> Badge:
        """Récupère un badge par son ID"""
        badge = self.db.query(Badge).filter(Badge.idBadge == badge_id).first()
        if not badge:
            raise ValueError("Badge non trouvé")
        return badge

    def get_all_badges(self) -> list[Badge]:
        """Récupère tous les badges"""
        return self.db.query(Badge).order_by(Badge.minPoints.asc()).all()

    def update_badge(self, badge_id: int, badge_data: BadgeUpdate) -> Badge:
        """Met à jour un badge existant"""
        badge = self.get_badge(badge_id)
        try:
            for key, value in badge_data.dict(exclude_unset=True).items():
                setattr(badge, key, value)
            self.db.commit()
            self.db.refresh(badge)
            return badge
        except Exception as e:
            self.db.rollback()
            raise ValueError(f"Erreur lors de la mise à jour: {str(e)}")

    def delete_badge(self, badge_id: int) -> bool:
        """Supprime un badge"""
        badge = self.get_badge(badge_id)
        try:
            self.db.delete(badge)
            self.db.commit()
            return True
        except Exception as e:
            self.db.rollback()
            raise ValueError(f"Erreur lors de la suppression: {str(e)}")