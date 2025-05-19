from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.commun.database.database import SessionLocal
from app.commun.services.defi_service import DefiService
from app.commun.services.defi_checker import DefiCompletionChecker
from app.commun.schemas.defi import (
    DefiCreate,
    DefiUpdate,
    DefiResponse,
    DefiListResponse
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
router = APIRouter(
    prefix="/api/defis",
    tags=["defis"]
)

# In your router
@router.post("/", response_model=DefiResponse)
async def create_defi(defi_data: DefiCreate, db: Session = Depends(get_db)):
    service = DefiCompletionChecker()
    try:
        defi_model = service.create_defi(defi_data, db)  # Pass db here
        defi_dict = {
            "idDefi": defi_model.idDefi,
            "titre": defi_model.titre,
            # Include all other needed fields
        }
        return {
            "message": "Défi créé avec succès",
            "data": defi_dict,
            "success": True
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@router.get(
    "/{defi_id}",
    response_model=DefiResponse
)
async def get_defi(
    defi_id: int,
    db: Session = Depends(get_db)
):
    """Endpoint pour récupérer un défi spécifique"""
    service = DefiService(db)
    defi = service.get_defi(defi_id)
    if not defi:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Défi non trouvé"
        )
    return {
        "message": "Défi récupéré avec succès",
        "data": defi,
        "success": True
    }

@router.get(
    "/",
    response_model=DefiListResponse
)
async def get_all_defis(
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    """Endpoint pour récupérer tous les défis"""
    service = DefiService(db)
    defis = service.get_all_defis(active_only)
    return {
        "message": "Défis récupérés avec succès",
        "data": defis,
        "success": True,
        "count": len(defis)
    }

@router.put(
    "/{defi_id}",
    response_model=DefiResponse
)
async def update_defi(
    defi_id: int,
    defi_data: DefiUpdate,
    db: Session = Depends(get_db)
):
    """Endpoint pour mettre à jour un défi"""
    service = DefiService(db)
    try:
        defi = service.update_defi(defi_id, defi_data)
        if not defi:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Défi non trouvé"
            )
        return {
            "message": "Défi mis à jour avec succès",
            "data": defi,
            "success": True
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.delete(
    "/{defi_id}",
    response_model=dict
)
async def delete_defi(
    defi_id: int,
    db: Session = Depends(get_db)
):
    """Endpoint pour supprimer un défi"""
    service = DefiService(db)
    success = service.delete_defi(defi_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Défi non trouvé"
        )
    return {
        "message": "Défi supprimé avec succès",
        "success": True
    }
@router.get("/user/{user_id}", response_model=DefiListResponse)
async def get_defis_for_user(
    user_id: int, 
    active_only: bool = True, 
    db: Session = Depends(get_db)
):
    """Endpoint pour récupérer les défis concernant un utilisateur spécifique"""
    service = DefiService(db)
    try:
        defis = service.get_defis_for_user(user_id, active_only)
        defis_data = [{
            "idDefi": defi.idDefi,
            "titre": defi.titre,
            "points": defi.points,
            "description": defi.get_condition_description(),
            "cible": defi.cible,
            "active": defi.active,
            "mode_recurrence": defi.mode_recurrence,
            "date_debut_base": defi.date_debut_base,
            "heure_debut": str(defi.heure_debut) if defi.heure_debut else None,
            "heure_fin": str(defi.heure_fin) if defi.heure_fin else None,
            "duree_jours": defi.duree_jours,
            "type_condition": defi.type_condition,
            "valeur_cible": defi.valeur_cible,
            "periode_comparaison": defi.periode_comparaison,
            "categories": [cat.idCategorie for cat in defi.categories_associees]
        } for defi in defis]
        return {
            "message": "Défis récupérés avec succès",
            "data": defis_data,
            "success": True,
            "count": len(defis)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/site/{site_id}", response_model=DefiListResponse)
async def get_defis_for_site(
    site_id: int, 
    active_only: bool = True, 
    db: Session = Depends(get_db)
):
    """Endpoint pour récupérer les défis concernant un site spécifique"""
    service = DefiService(db)
    try:
        defis = service.get_defis_for_site(site_id, active_only)
        # Convertir les objets Défi en dictionnaires
        defis_data = [{
            "idDefi": defi.idDefi,
            "titre": defi.titre,
            "points": defi.points,
            "description": defi.description,
            "cible": defi.cible,
            "active": defi.active,
            "mode_recurrence": defi.mode_recurrence,
            "date_debut_base": defi.date_debut_base,
            "heure_debut": str(defi.heure_debut) if defi.heure_debut else None,
            "heure_fin": str(defi.heure_fin) if defi.heure_fin else None,
            "duree_jours": defi.duree_jours,
            "type_condition": defi.type_condition,
            "valeur_cible": defi.valeur_cible,
            "periode_comparaison": defi.periode_comparaison,
            "categories": [cat.idCategorie for cat in defi.categories_associees]
        } for defi in defis]
        
        return {
            "message": "Défis récupérés avec succès",
            "data": defis_data,
            "success": True,
            "count": len(defis_data)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )