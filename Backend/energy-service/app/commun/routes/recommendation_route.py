from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.commun.ai.energy_advisor import EnergyAdvisor
from app.commun.database.database import SessionLocal

router = APIRouter()
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
@router.get("/users/{user_id}/recommendations")
async def get_recommendations(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Endpoint pour les recommandations personnalisées"""
    advisor = EnergyAdvisor(db)
    return await advisor.generate_recommendations(user_id)