from fastapi import APIRouter, Depends
from app.particulier.services.categorie_site_service import get_categories_sites
from app.particulier.schemas.categorie_site_schema import CategorieSiteOut
from typing import List
from app.commun.database.database import SessionLocal
from sqlalchemy.orm import Session
router = APIRouter()
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/categories/sites", response_model=List[CategorieSiteOut])
def read_categories_sites(db: Session = Depends(get_db)):

    return get_categories_sites(db)