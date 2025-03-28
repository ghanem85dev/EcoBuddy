from fastapi import APIRouter, Depends
from app.entreprise.services.secteur_service import get_secteurs,get_secteur_by_id
from app.entreprise.schemas.secteur_schema import SecteurOut
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

@router.get("/secteurs", response_model=List[SecteurOut])
def read_secteurs(db: Session = Depends(get_db)):

    return get_secteurs(db)
@router.get("/secteur/{idSecteur}", response_model=SecteurOut)
def read_secteur_by_id(idSecteur:int,db: Session = Depends(get_db)):

    return get_secteur_by_id(idSecteur,db)