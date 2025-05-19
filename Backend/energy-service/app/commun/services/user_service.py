from sqlalchemy.orm import Session
from app.commun.models import User
from typing import List, Optional, Dict
from fastapi import HTTPException, status
import logging

logger = logging.getLogger(__name__)

class UserService:
    def __init__(self, db: Session):
        self.db = db

    def get_all_users(self) -> List[Dict]:
        try:
            users = self.db.query(User).all()
            if not users:
                logger.info("Aucun utilisateur trouvé dans la base de données")
                return []
            return [self._user_to_dict(user) for user in users]
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des utilisateurs: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erreur serveur lors de la récupération des utilisateurs"
            )

    def get_user_by_id(self, user_id: int) -> Dict:
        try:
            user = self.db.query(User).get(user_id)  # Alternative à .first()
            if not user:
                logger.warning(f"Utilisateur avec ID {user_id} non trouvé")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Utilisateur avec ID {user_id} non trouvé"
                )
            return self._user_to_dict(user)
        except HTTPException:
            raise  # On propage les HTTPException
        except Exception as e:
            logger.error(f"Erreur lors de la récupération de l'utilisateur {user_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erreur serveur lors de la récupération de l'utilisateur"
            )

    def _user_to_dict(self, user: User) -> Dict:
        """Convertit un objet User en dictionnaire"""
        return {
            "id": user.id,
            "email": user.email,
            "nom": user.nom,
            "prenom": user.prenom,
            "telephone": user.telephone,
            "adresse": user.adresse,
            "role": user.role,
            "budget_max": float(user.budget_max) if user.budget_max is not None else None
        }
    def _user_to_dict(self, user: User) -> dict:
        return {
            "id": user.id,
            "email": user.email,
            "nom": user.nom,
            "prenom": user.prenom,
            "telephone": int(user.telephone) if user.telephone is not None else None,  # Conversion en int
            "adresse": user.adresse,
            "role": user.role,
            "budget_max": float(user.budget_max) if user.budget_max is not None else None
        }
        
    def update_user(self, user_id: int, update_data: dict) -> dict:
        try:
            user = self.db.query(User).get(user_id)
            if not user:
                logger.warning(f"Utilisateur avec ID {user_id} non trouvé")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Utilisateur avec ID {user_id} non trouvé"
                )
            
            # Conversion des types si nécessaire
            if 'telephone' in update_data:
                try:
                    update_data['telephone'] = int(update_data['telephone']) if update_data['telephone'] else None
                except (ValueError, TypeError):
                    raise HTTPException(
                        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                        detail="Le téléphone doit être un nombre entier valide"
                    )

            if 'budget_max' in update_data:
                try:
                    update_data['budget_max'] = float(update_data['budget_max']) if update_data['budget_max'] else None
                except (ValueError, TypeError):
                    raise HTTPException(
                        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                        detail="Le budget doit être un nombre valide"
                    )

            # Mise à jour des champs autorisés
            for field in ['nom', 'prenom', 'telephone', 'adresse', 'budget_max']:
                if field in update_data:
                    setattr(user, field, update_data[field])

            self.db.commit()
            self.db.refresh(user)
            return self._user_to_dict(user)
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Erreur lors de la mise à jour de l'utilisateur {user_id}: {str(e)}")
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erreur serveur lors de la mise à jour de l'utilisateur"
            )