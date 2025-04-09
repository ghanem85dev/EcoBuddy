from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.commun.database.database import SessionLocal
from app.entreprise.models.entreprise import Entreprise
from app.entreprise.schemas.entreprise_schema import EntrepriseCreate, EntrepriseUpdate, EntrepriseOut
from app.entreprise.services.entreprise_service import (
    add_entreprise,
    get_entreprises,
    get_entreprises_by_secteur,
    modifier_entreprise,
    archiver_entreprise,
    get_entreprises_by_user,
    delete_entreprise,
    approve_or_reject_entreprise,
    get_pending_entreprises,
)
import tempfile
from fastapi.responses import FileResponse

router = APIRouter(
    prefix="/entreprises",
    tags=["entreprises"],
    responses={404: {"description": "Not found"}},
)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=EntrepriseOut, status_code=status.HTTP_201_CREATED)
async def create_entreprise(
    nom: str = Form(...),
    taille: str = Form(...),
    secteur_id: int = Form(...),
    certificat_propriete: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    try:
        return await add_entreprise(
            db=db,
            nom_Entreprise=nom,
            taille_Entreprise=taille,
            secteur_id_Entreprise=secteur_id,
            certificat_propriete_Entreprise=certificat_propriete
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/", response_model=List[EntrepriseOut])
def read_entreprises(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    entreprises = get_entreprises(db)
    if not entreprises:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucune entreprise trouvée"
        )
    return entreprises

@router.get("/by-secteur/{secteur_id}", response_model=List[EntrepriseOut])
def read_entreprises_by_secteur(
    secteur_id: int,
    db: Session = Depends(get_db)
):
    entreprises = get_entreprises_by_secteur(db, secteur_id=secteur_id)
    if not entreprises:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Aucune entreprise trouvée pour le secteur {secteur_id}"
        )
    return entreprises

@router.put("/{entreprise_id}", response_model=EntrepriseOut)
async def update_entreprise(
    entreprise_id: int,
    nom: Optional[str] = Form(None),
    taille: Optional[str] = Form(None),
    secteur_id: Optional[int] = Form(None),
    certificat_propriete: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    updated_entreprise = await modifier_entreprise(
        db=db,
        entreprise_id=entreprise_id,
        nom_Entreprise=nom,
        taille_Entreprise=taille,
        secteur_id_Entreprise=secteur_id,
        certificat_propriete_Entreprise=certificat_propriete
    )
    if updated_entreprise is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entreprise non trouvée"
        )
    return updated_entreprise

@router.patch("/archive/{entreprise_id}", response_model=EntrepriseOut)
def archive_entreprise(
    entreprise_id: int,
    db: Session = Depends(get_db)
):
    entreprise = archiver_entreprise(db, entreprise_id=entreprise_id)
    if entreprise is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entreprise non trouvée"
        )
    return entreprise

@router.get("/{entreprise_id}", response_model=EntrepriseOut)
def read_entreprise(
    entreprise_id: int,
    db: Session = Depends(get_db)
):
    entreprise = db.query(Entreprise).filter(Entreprise.id == entreprise_id).first()
    if entreprise is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entreprise non trouvée"
        )
    return entreprise

@router.get("/user/{user_id}", response_model=List[EntrepriseOut])
def read_entreprises_by_user(
    user_id: int,
    db: Session = Depends(get_db)
):
    entreprises = get_entreprises_by_user(db, user_id=user_id)
    if not entreprises:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Aucune entreprise trouvée pour l'utilisateur {user_id}"
        )
    return entreprises

@router.get("/certificat/{entreprise_id}")
def get_certificat_propriete_entreprise(entreprise_id: int, db: Session = Depends(get_db)):
    db_entreprise = db.query(Entreprise).filter(Entreprise.idEntreprise == entreprise_id).first()
    if not db_entreprise:
        raise HTTPException(status_code=404, detail="Entreprise not found")
    
    if not db_entreprise.certificat_propriete:
        raise HTTPException(status_code=404, detail="Certificat de propriété non trouvé")

    # Créer un fichier temporaire pour le PDF
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
        tmp_file.write(db_entreprise.certificat_propriete)
        tmp_file_path = tmp_file.name

    # Renvoyer le fichier PDF en tant que réponse
    return FileResponse(
        tmp_file_path, 
        filename=db_entreprise.certificat_propriete_nom or f"certificat_propriete_{db_entreprise.nom}.pdf"
    )
    
@router.delete("/{entreprise_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_entreprise_route(
    entreprise_id: int,
    db: Session = Depends(get_db)
):
    delete_entreprise(db=db, entreprise_id=entreprise_id)
    return None

@router.put("/approve/{entreprise_id}", response_model=EntrepriseOut)
def approve_or_reject_entreprise_route(
    entreprise_id: int,
    statut: str = Query(..., description="Statut d'approbation : 'approve', 'non_approve' ou 'en_attente'"),
    db: Session = Depends(get_db)
):
    return approve_or_reject_entreprise(db, entreprise_id, statut)

@router.get("/en-attente", response_model=List[EntrepriseOut])
def get_pending_entreprises_route(db: Session = Depends(get_db)):
    pending_entreprises = get_pending_entreprises(db)
    if not pending_entreprises:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucune entreprise en attente d'approbation"
        )
    return pending_entreprises