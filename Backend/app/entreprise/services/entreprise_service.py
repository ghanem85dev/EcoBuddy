from sqlalchemy.orm import Session
from app.entreprise.models.entreprise import Entreprise
from app.particulier.models.site import Site
from app.particulier.models.UserSite import UserSite
from fastapi import Form, UploadFile, File,HTTPException
from typing import Optional

def get_entreprises_by_user(db: Session, user_id: int):
    return db.query(Entreprise).join(Site).filter(Site.idUser == user_id).all()

async def add_entreprise(db: Session, 
                   nom_Entreprise: str = Form(...),
                   taille_Entreprise: str = Form(...),
                   certificat_propriete_Entreprise: UploadFile = File(None),
                   secteur_id_Entreprise: int = Form(...)):
    certificat_propriete_data = None
    certificat_propriete_nom = None
    if certificat_propriete_Entreprise:
        certificat_propriete_data = await certificat_propriete_Entreprise.read()
        certificat_propriete_nom = certificat_propriete_Entreprise.filename
    
    new_entreprise = Entreprise(
        nom=nom_Entreprise, 
        taille=taille_Entreprise, 
        certificat_propriete=certificat_propriete_data,
        certificat_propriete_nom=certificat_propriete_nom,
        statut_approbation="en_attente",
        secteur_id=secteur_id_Entreprise
    )
    db.add(new_entreprise)
    db.commit()
    db.refresh(new_entreprise)
    return new_entreprise

def get_entreprises(db: Session):
    return db.query(Entreprise).all()

def get_entreprises_by_secteur(db: Session, secteur_id: int):
    return db.query(Entreprise).filter(Entreprise.secteur_id == secteur_id).all()

async def modifier_entreprise(db: Session, 
                       entreprise_id: int,
                       nom_Entreprise: Optional[str] = Form(None),
                       taille_Entreprise: Optional[str] = Form(None),
                       certificat_propriete_Entreprise: Optional[UploadFile] = File(None),
                       secteur_id_Entreprise: Optional[int] = Form(None)):
    entreprise = db.query(Entreprise).filter(Entreprise.idEntreprise == entreprise_id).first()
    if not entreprise:
        return None
    
    if nom_Entreprise is not None:
        entreprise.nom = nom_Entreprise
    if taille_Entreprise is not None:
        entreprise.taille = taille_Entreprise
    if secteur_id_Entreprise is not None:
        entreprise.secteur_id = secteur_id_Entreprise
    
    if certificat_propriete_Entreprise:
        certificat_propriete_data = await certificat_propriete_Entreprise.read()
        entreprise.certificat_propriete = certificat_propriete_data
        entreprise.certificat_propriete_nom = certificat_propriete_Entreprise.filename
    
    db.commit()
    db.refresh(entreprise)
    return entreprise

def archiver_entreprise(db: Session, entreprise_id: int):
    entreprise = db.query(Entreprise).filter(Entreprise.id == entreprise_id).first()
    if not entreprise:
        return None
    
    entreprise.est_archive = True
    db.commit()
    db.refresh(entreprise)
    return entreprise

def delete_entreprise(db: Session, entreprise_id: int):
    # Récupérer l'entreprise
    db_entreprise = db.query(Entreprise).filter(Entreprise.idEntreprise == entreprise_id).first()
    if not db_entreprise:
        raise HTTPException(
            status_code=404,
            detail="Entreprise non trouvée"
        )
    
    # Supprimer d'abord tous les sites associés à cette entreprise
    sites = db.query(Site).filter(Site.idEntreprise == entreprise_id).all()
    for site in sites:
        # Supprimer d'abord les UserSite associés à ce site
        db.query(UserSite).filter(UserSite.site_id == site.idSite).delete()
        # Puis supprimer le site lui-même
        db.delete(site)
    
    # Enfin supprimer l'entreprise
    db.delete(db_entreprise)
    db.commit()
    
    return {"message": "Entreprise et ses sites associés supprimés avec succès"}

def approve_or_reject_entreprise(
    db: Session, 
    entreprise_id: int, 
    statut: str
):
    db_entreprise = db.query(Entreprise).filter(Entreprise.idEntreprise == entreprise_id).first()
    if not db_entreprise:
        raise HTTPException(status_code=404, detail="Entreprise non trouvée")

    if statut not in ["approve", "non_approve", "en_attente"]:
        raise HTTPException(
            status_code=400, 
            detail="Statut invalide. Doit être 'approve', 'non_approve' ou 'en_attente'"
        )
    if statut == "non_approve" :
        db_site=db.query(Site).filter(Site.idEntreprise == entreprise_id).first()
        db_site.statut_approbation = "non_approve"
        db.commit()
    db_entreprise.statut_approbation = statut
    db.commit()
    return db_entreprise

def get_pending_entreprises(db: Session):
    return db.query(Entreprise).filter(Entreprise.statut_approbation == "en_attente").all()