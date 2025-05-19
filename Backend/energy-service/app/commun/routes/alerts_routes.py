from fastapi import APIRouter, Depends
from app.commun.database.database import SessionLocal
from app.commun.services.alert_service import marquer_alertes_comme_vues,get_alertes_par_user,compter_alertes_non_vues
from sqlalchemy.orm import Session
from fastapi import HTTPException

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        
        
@router.get("/alertes/user/{user_id}")
def get_user_alertes(
    user_id: int,
    db: Session = Depends(get_db)
):
    return get_alertes_par_user(db, user_id)
        
@router.post("/alertes/{user_id}/marquer-comme-vues")
def marquer_alertes_vues(
    user_id: int,
    db: Session = Depends(get_db)
):
    return marquer_alertes_comme_vues(db, user_id)


@router.get("/alertes/non-vues/{user_id}")
def count_alertes_non_vues(
    user_id: int,
    db: Session = Depends(get_db)
):
    return compter_alertes_non_vues(db, user_id)