from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..schemas.recompense import Recompense, RecompenseCreate, RecompenseWithDetails, PointsSummary,PointsSummarySite
from ..services.recompense_service import RecompenseService
from app.commun.database.database import SessionLocal

router = APIRouter(
    prefix="/recompenses",
    tags=["recompenses"],
    responses={404: {"description": "Not found"}},
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
# @router.post("/", response_model=Recompense)
# def create_recompense(recompense: RecompenseCreate, db: Session = Depends(get_db)):
#     service = RecompenseService(db)
#     try:
#         return service.create_recompense(recompense.idSite, recompense.idDefi)
#     except ValueError as e:
#         raise HTTPException(status_code=400, detail=str(e))

@router.get("/{idRecompense}", response_model=RecompenseWithDetails)
def read_Récompense(idRecompense: int, db: Session = Depends(get_db)):
    service = RecompenseService(db)
    Recompense = service.get_recompense(idRecompense)
    if not Recompense:
        raise HTTPException(status_code=404, detail="Récompense non trouvée")
    return Recompense

@router.get("/site/{idSite}", response_model=List[RecompenseWithDetails])
def read_Récompenses_by_site(idSite: int, db: Session = Depends(get_db)):
    service = RecompenseService(db)
    return service.get_recompenses_by_site(idSite)

@router.get("/user/{idUser}", response_model=List[RecompenseWithDetails])
def read_Récompenses_by_user(idUser: int, db: Session = Depends(get_db)):
    service = RecompenseService(db)
    return service.get_recompenses_by_user(idUser)

@router.get("/user/{idUser}/points", response_model=PointsSummary)
def get_user_points_summary(idUser: int, db: Session = Depends(get_db)):
    service = RecompenseService(db)
    return service.get_total_points_user(idUser)

@router.get("/site/{idSite}/points", response_model=PointsSummarySite)
def get_site_points_summary(idSite: int, db: Session = Depends(get_db)):
    service = RecompenseService(db)
    return service.get_total_points_site(idSite)

@router.get("/", response_model=List[RecompenseWithDetails])
def read_all_Récompenses(db: Session = Depends(get_db)):
    service = RecompenseService(db)
    return service.get_recompenses_with_details()