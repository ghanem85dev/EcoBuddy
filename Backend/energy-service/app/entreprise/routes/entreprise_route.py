from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.commun.database.database import SessionLocal
from app.entreprise.models.entreprise import Entreprise
from app.entreprise.schemas.entreprise_schema import EntrepriseCreate, PendingEntrepriseStats, EntrepriseUpdate, EntrepriseOut,SecteurOut,UserOut,SectorStatsOut,EntrepriseSizeStats
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
    count_entreprises_by_user,
    get_entreprises_by_sector,
    get_entreprises_by_size,
    get_pending_entreprises_stats,
    get_entreprises_stats
)
from typing import Dict
import tempfile
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy import case, func

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
@router.get("/stats/approbation", response_model=Dict[str, int])
def get_entreprises_approbation_stats(db: Session = Depends(get_db)):
    """
    Endpoint pour obtenir les statistiques d'approbation des entreprises
    Retourne: {
        "total": nombre total d'entreprises,
        "en_attente": entreprises en attente d'approbation,
        "approuvees": entreprises approuvées,
        "rejetees": entreprises rejetées
    }
    """
    try:
        return get_entreprises_stats(db)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la récupération des statistiques: {str(e)}"
        )
@router.get("/stats/taille", response_model=List[EntrepriseSizeStats])
def get_entreprises_size_stats(db: Session = Depends(get_db)):
    """
    Endpoint pour obtenir la répartition des entreprises par taille
    Retourne les statistiques sous forme de tableau pour affichage en charte
    """
    try:
        return get_entreprises_by_size(db)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la récupération des statistiques: {str(e)}"
        )
@router.get("/by-sector", response_model=List[SectorStatsOut])
def get_sector_stats(db: Session = Depends(get_db)):
    """
    Endpoint: Retourne les statistiques par secteur
    """
    try:
        raw_results = get_entreprises_by_sector(db)
        return [{
            "sector_name": r.sector_name,
            "entreprise_count": r.entreprise_count or 0
        } for r in raw_results]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur serveur: {str(e)}"
        )
@router.get("/", response_model=List[EntrepriseOut])
def read_entreprises(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    raw_results = get_entreprises(db)
    
    if not raw_results:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucune entreprise trouvée"
        )
    
    entreprises = []
    for entreprise, secteur_nom, user in raw_results:
        secteur_out = SecteurOut(
            idSecteur=entreprise.secteur_id,
            nom=secteur_nom
        )
        
        # Gestion du cas où user est None
        user_out = None
        if user:
            user_out = UserOut(
                idUser=user.id,
                nom=user.nom,
                prenom=user.prenom,
                email=user.email,
                role=user.role
            )
        
        entreprise_out = EntrepriseOut(
            idEntreprise=entreprise.idEntreprise,
            nom=entreprise.nom,
            taille=entreprise.taille,
            secteur_id=entreprise.secteur_id,
            statut_approbation=entreprise.statut_approbation,
            secteur=secteur_out,
            user=user_out  # Peut être None
        )
        
        entreprises.append(entreprise_out)
    
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

class CountResponse(BaseModel):
    total: int

@router.get("/totalEntreprises/{user_id}", response_model=CountResponse)
def get_total_entreprises_by_user(
    user_id: int,
    db: Session = Depends(get_db)
):
    count = count_entreprises_by_user(db, user_id=user_id)
    return {"total": count}

@router.get("/stats/pending", response_model=PendingEntrepriseStats)
def get_pending_entreprises_stats(db: Session = Depends(get_db)):
    """
    Endpoint pour obtenir les statistiques des entreprises en attente
    """
    try:
        # Utilisez directement la fonction du service au lieu de vous appeler récursivement
        stats = db.query(
            func.count(Entreprise.idEntreprise).label("total"),
            func.count(case((Entreprise.certificat_propriete.isnot(None), 1))).label("with_certificat"),
            func.count(case((Entreprise.certificat_propriete.is_(None), 1))).label("without_certificat")
        ).filter(
            Entreprise.statut_approbation == "en_attente"
        ).first()

        # Comptage par taille
        size_counts = db.query(
            Entreprise.taille,
            func.count(Entreprise.idEntreprise).label("count")
        ).filter(
            Entreprise.statut_approbation == "en_attente"
        ).group_by(
            Entreprise.taille
        ).all()

        return {
            "total": stats.total or 0,
            "with_certificat": stats.with_certificat or 0,
            "without_certificat": stats.without_certificat or 0,
            "by_size": {size.taille: size.count for size in size_counts}
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la récupération: {str(e)}"
        )