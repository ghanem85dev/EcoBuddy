from sqlalchemy import func
from sqlalchemy.orm import Session
from app.commun.models.users import User

        
def get_users_count_by_role(db: Session):

    try:
        # Query pour compter les utilisateurs groupés par rôle
        result = db.query(
            User.role,
            func.count(User.id).label('count')
        ).group_by(User.role).all()
        
        # Convertir le résultat en format adapté pour le frontend
        return [{"role": role, "count": count} for role, count in result]
    finally:
        db.close()