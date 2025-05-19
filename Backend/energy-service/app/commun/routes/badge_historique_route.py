from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List,Optional
from app.commun.database.database import SessionLocal
from app.commun.services.badge_historique_service import BadgeService
from app.commun.schemas.badge_historique import (
    BadgeHistoriqueWithBadgeResponse,
    BadgeHistoriqueCreate,
    BadgeHistoriqueResponse,
    BadgeResponse
)

router = APIRouter(
    prefix="/api/badges",
    tags=["badges"]
)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
@router.post("/history", response_model=BadgeHistoriqueResponse)
async def create_badge_history(
    badge_history_data: BadgeHistoriqueCreate,
    db: Session = Depends(get_db)
):
    """
    Crée un nouvel historique de badge
    """
    service = BadgeService(db)
    try:
        return service.create_badge_history(badge_history_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/user/{user_id}/history", response_model=List[BadgeHistoriqueResponse])
async def get_user_badge_history(
    user_id: int,
    db: Session = Depends(get_db)
):
    """
    Récupère l'historique des badges d'un utilisateur
    """
    service = BadgeService(db)
    history = service.get_user_badge_history(user_id)
    
    if not history:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucun historique trouvé pour cet utilisateur"
        )
    
    return history

@router.get("/user/{user_id}/latest", response_model=BadgeHistoriqueWithBadgeResponse)
async def get_latest_user_badge(
    user_id: int,
    db: Session = Depends(get_db)
):
    """
    Récupère le DERNIER badge obtenu par l'utilisateur avec ses détails
    """
    service = BadgeService(db)
    latest_badge = service.get_latest_user_badge(user_id)
    
    if not latest_badge or not latest_badge.badge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucun badge trouvé pour cet utilisateur"
        )
    
    return latest_badge