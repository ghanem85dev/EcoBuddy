from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.commun.database.database import SessionLocal
from app.commun.services.badge_service import BadgeService
from app.commun.schemas.badge import (
    BadgeCreate,
    BadgeUpdate,
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

@router.post("/", response_model=BadgeResponse)
async def create_badge(
    badge_data: BadgeCreate,
    db: Session = Depends(get_db)
):
    """Crée un nouveau badge"""
    service = BadgeService(db)
    try:
        return service.create_badge(badge_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/", response_model=List[BadgeResponse])
async def get_all_badges(
    db: Session = Depends(get_db)
):
    """Récupère tous les badges"""
    service = BadgeService(db)
    return service.get_all_badges()

@router.get("/{badge_id}", response_model=BadgeResponse)
async def get_badge(
    badge_id: int,
    db: Session = Depends(get_db)
):
    """Récupère un badge par son ID"""
    service = BadgeService(db)
    try:
        return service.get_badge(badge_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@router.put("/{badge_id}", response_model=BadgeResponse)
async def update_badge(
    badge_id: int,
    badge_data: BadgeUpdate,
    db: Session = Depends(get_db)
):
    """Met à jour un badge existant"""
    service = BadgeService(db)
    try:
        return service.update_badge(badge_id, badge_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.delete("/{badge_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_badge(
    badge_id: int,
    db: Session = Depends(get_db)
):
    """Supprime un badge"""
    service = BadgeService(db)
    try:
        service.delete_badge(badge_id)
        return None
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )