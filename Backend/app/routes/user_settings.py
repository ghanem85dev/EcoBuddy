from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database.database import SessionLocal
from app.models import User

router = APIRouter()

# Dépendance pour récupérer la session de la base de données
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic model pour les paramètres utilisateur
class UserSettingsUpdate(BaseModel):
    budget_max: float
    email: str
    role: str

   

# Endpoint pour obtenir les paramètres de l'utilisateur
@router.get("/user/{user_id}/settings")
def get_user_settings(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Retourner les paramètres de l'utilisateur directement sans utiliser response_model
    return {
        "budget_max": user.budget_max,
        "email": user.email,
        "role": user.role
    }

# Endpoint pour mettre à jour les paramètres de l'utilisateur (les données sont envoyées dans le body)
@router.put("/user/{user_id}/settings")
def update_user_settings(user_id: int, user_settings: UserSettingsUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Mise à jour des paramètres de l'utilisateur avec les données envoyées dans le body
    user.budget_max = user_settings.budget_max
    user.email = user_settings.email
    user.role = user_settings.role

    db.commit()
    db.refresh(user)

    # Retourner un message avec les nouvelles données mises à jour
    return {
        "message": "User settings updated successfully",
        "updated_user": {
            "budget_max": user.budget_max,
            "email": user.email,
            "role": user.role
        }
    }
