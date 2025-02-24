from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
import json

from app.database.database import SessionLocal
from ..models import UserPreference

router = APIRouter()

# Fonction pour obtenir une session de base de données
# Elle gère l'ouverture et la fermeture automatique de la connexion

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        
# Modèle de données pour les préférences utilisateur
# Définit la structure des données attendues dans les requêtes

class UserPreferenceSchema(BaseModel):
    user_id: int
    chart_positions: List[str]

# Route pour récupérer les préférences d'un utilisateur spécifique
# Retourne la liste des positions de graphiques enregistrées

@router.get("/preferences/{user_id}")
def get_user_preferences(user_id: int, db: Session = Depends(get_db)):
    preference = db.query(UserPreference).filter(UserPreference.user_id == user_id).first()
    if not preference:
        return {"user_id": user_id, "chart_positions": []}
    return {"user_id": preference.user_id, "chart_positions": json.loads(preference.chart_positions)}

# Route pour enregistrer ou mettre à jour les préférences utilisateur
# Si les préférences existent déjà, elles sont mises à jour, sinon elles sont créées

@router.put("/preferences")
def save_user_preferences(preference: UserPreferenceSchema, db: Session = Depends(get_db)):
    existing_preference = db.query(UserPreference).filter(UserPreference.user_id == preference.user_id).first()
    
    if existing_preference:
        # Met à jour les préférences existantes
        existing_preference.chart_positions = json.dumps(preference.chart_positions)
    else:
        # Crée une nouvelle entrée de préférences utilisateur
        new_preference = UserPreference(user_id=preference.user_id, chart_positions=json.dumps(preference.chart_positions))
        db.add(new_preference)

    try:
        db.commit()  # Enregistre les changements dans la base de données
    except Exception as e:
        db.rollback()  # Annule les changements en cas d'erreur
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    

