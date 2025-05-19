from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List,Optional
from pydantic import BaseModel
from app.commun.services.user_service import UserService
from app.commun.database.database import SessionLocal
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/users",
    tags=["users"],
    responses={404: {"description": "Non trouvé"}},
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class UserResponse(BaseModel):
    id: int
    email: str
    nom: Optional[str] = None
    prenom: Optional[str] = None
    telephone: Optional[int] = None  # Changé en int
    adresse: Optional[str] = None
    role: str
    budget_max: Optional[float] = None

@router.get("/", response_model=List[UserResponse])
def get_all_users(db: Session = Depends(get_db)):
    """Endpoint pour récupérer tous les utilisateurs"""
    user_service = UserService(db)
    return user_service.get_all_users()

@router.get("/{user_id}", response_model=UserResponse)
def get_user_by_id(user_id: int, db: Session = Depends(get_db)):
    """Endpoint pour récupérer un utilisateur spécifique par son ID"""
    user_service = UserService(db)
    return user_service.get_user_by_id(user_id)

class UserUpdate(BaseModel):
    nom: Optional[str] = None
    prenom: Optional[str] = None
    telephone: Optional[int] = None
    adresse: Optional[str] = None
    budget_max: Optional[float] = None
@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int, 
    user_update: UserUpdate, 
    db: Session = Depends(get_db)
):
    user_service = UserService(db)
    # Convertir le modèle Pydantic en dictionnaire avec exclude_unset=True
    update_data = user_update.dict(exclude_unset=True)
    return user_service.update_user(user_id, update_data)