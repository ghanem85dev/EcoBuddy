from fastapi import APIRouter, Depends
from app.admin.services.users_services import get_users_count_by_role
from typing import List
from pydantic import BaseModel
from app.commun.database.database import SessionLocal
from sqlalchemy.orm import Session

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class RoleCount(BaseModel):
    role: str
    count: int

router = APIRouter()

@router.get("/users/count-by-role", response_model=List[dict])
async def get_users_count_by_role_endpoint(db: Session = Depends(get_db)):
    """
    Retourne le nombre d'utilisateurs par rôle.
    Utilisé pour les statistiques et graphiques.
    """
    return get_users_count_by_role(db)