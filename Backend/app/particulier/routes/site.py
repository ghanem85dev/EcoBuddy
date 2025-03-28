from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from app.commun.database.database import SessionLocal
from ..models import Site, UserSite, Categorie_Site
from app.entreprise.models import Entreprise
from app.commun.models import User
from fastapi.responses import FileResponse
import tempfile

# Pydantic model for creating or updating a site
class NewSite(BaseModel):
    nom: str
    adresse: str
    latitude: float
    longitude: float
    certificat_propriete: Optional[bytes] = None
    certificat_propriete_nom: Optional[str] = None

# Pydantic model for responding with site details
class SiteResponse(BaseModel):
    idSite: int
    nom: str
    adresse: str
    latitude: float
    longitude: float
    idCategorieSite: int
    idUser: int
    certificat_propriete_nom: Optional[str]
    statut_approbation: str  # Utilisez le nouveau champ

    class Config:
        from_attributes = True  # Permet d'utiliser ORM avec Pydantic

# Routeur FastAPI
router = APIRouter()

# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Route pour récupérer les sites d'un utilisateur
@router.get("/sites/{user_id}", response_model=List[SiteResponse])
def get_user_sites(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Récupérer les sites de l'utilisateur
    sites = db.query(Site).filter(Site.idUser == user_id).all()
    
    # Convertir les résultats en utilisant le modèle Pydantic
    return [
        {
            "idSite": site.idSite,
            "nom": site.nom,
            "adresse": site.adresse,
            "latitude": site.latitude,
            "longitude": site.longitude,
            "idCategorieSite": site.idCategorieSite,
            "idUser": site.idUser,
            "certificat_propriete_nom": site.certificat_propriete_nom,
            "statut_approbation": site.statut_approbation,  # Utilisez le nouveau champ
        }
        for site in sites
    ]
@router.get("/sites/approved/{user_id}", response_model=List[SiteResponse])
def get_user_sites(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Récupérer les sites de l'utilisateur
    sites = db.query(Site).filter(Site.idUser == user_id , Site.statut_approbation == "approve").all()
    
    # Convertir les résultats en utilisant le modèle Pydantic
    return [
        {
            "idSite": site.idSite,
            "nom": site.nom,
            "adresse": site.adresse,
            "latitude": site.latitude,
            "longitude": site.longitude,
            "idCategorieSite": site.idCategorieSite,
            "idUser": site.idUser,
            "certificat_propriete_nom": site.certificat_propriete_nom,
            "statut_approbation": site.statut_approbation,  # Utilisez le nouveau champ
        }
        for site in sites
    ]

# Route pour récupérer les sites où l'utilisateur est propriétaire ou invité
@router.get("/user-sites/{user_id}")
def get_user_sites(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

    # Get sites owned by the user
    owned_sites = db.query(Site).filter(Site.idUser == user_id , Site.statut_approbation == "approve").all()

    # Get sites where the user has accepted an invitation
    invited_sites = (
        db.query(Site)
        .join(UserSite, UserSite.site_id == Site.idSite)
        .filter(UserSite.user_id == user_id)
        .all()
    )

    sites_list = [
        {
            "idSite": site.idSite,
            "idCategorieSite": site.idCategorieSite,
            "idUser": site.idUser,
            "nom": site.nom,
            "adresse": site.adresse,
            "latitude": site.latitude,
            "longitude": site.longitude,
            "certificat_propriete_nom": site.certificat_propriete_nom,
            "statut_approbation": site.statut_approbation,  # Utilisez le nouveau champ
        } 
        for site in owned_sites + invited_sites
    ]

    return sites_list

@router.get("/managed-sites/{user_id}")
def get_user_managed_sites(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

   
    # Get sites where the user has accepted an invitation
    invited_sites = (
        db.query(Site)
        
        .filter(Site.idResponsable == user_id)
        .all()
    )

    sites_list = [
        {
            "idSite": site.idSite,
            "idCategorieSite": site.idCategorieSite,
            "idUser": site.idUser,
            "nom": site.nom,
            "adresse": site.adresse,
            "latitude": site.latitude,
            "longitude": site.longitude,
            "certificat_propriete_nom": site.certificat_propriete_nom,
            "statut_approbation": site.statut_approbation,  # Utilisez le nouveau champ
        } 
        for site in invited_sites
    ]

    return sites_list

# Route pour ajouter une nouvelle résidence (non approuvée par défaut)
@router.post("/sites/{user_id}/{categorie_id}")
async def add_site(
    user_id: int,
    categorie_id: int,
    nom: str = Form(...),
    adresse: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    certificat_propriete: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    try:
        # Lire le fichier PDF s'il est fourni
        certificat_propriete_data = None
        certificat_propriete_nom = None
        if certificat_propriete:
            certificat_propriete_data = await certificat_propriete.read()
            certificat_propriete_nom = certificat_propriete.filename

        # Créer un nouveau site avec statut_approbation = "en_attente" par défaut
        new_site = Site(
            nom=nom,
            adresse=adresse,
            latitude=latitude,
            longitude=longitude,
            idCategorieSite=categorie_id,
            idUser=user_id,
            certificat_propriete=certificat_propriete_data,
            certificat_propriete_nom=certificat_propriete_nom,
            statut_approbation="en_attente"  # Statut par défaut
        )
        db.add(new_site)
        db.commit()
        return {"message": "Site ajouté avec succès. En attente d'approbation par l'administrateur."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
@router.post("/sites/{user_id}/{entreprise_id}/{categorie_id}")
async def add_site(
    user_id: int,
    categorie_id: int,
    entreprise_id: int,
    nom: str = Form(...),
    adresse: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    certificat_propriete: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    try:
        # Lire le fichier PDF s'il est fourni
        certificat_propriete_data = None
        certificat_propriete_nom = None
        if certificat_propriete:
            certificat_propriete_data = await certificat_propriete.read()
            certificat_propriete_nom = certificat_propriete.filename

        # Créer un nouveau site avec statut_approbation = "en_attente" par défaut
        new_site = Site(
            nom=nom,
            adresse=adresse,
            latitude=latitude,
            longitude=longitude,
            idCategorieSite=categorie_id,
            idUser=user_id,
            idEntreprise=entreprise_id,
            certificat_propriete=certificat_propriete_data,
            certificat_propriete_nom=certificat_propriete_nom,
            statut_approbation="en_attente"  # Statut par défaut
        )
        db.add(new_site)
        db.commit()
        return {"message": "Site ajouté avec succès. En attente d'approbation par l'administrateur."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# Route pour approuver ou rejeter une résidence
@router.put("/sites/approve/{site_id}")
def approve_or_reject_site(
    site_id: int,
    statut: str = Query(..., description="Statut d'approbation : 'approve', 'non_approve' ou 'en_attente'"),
    db: Session = Depends(get_db)
):
    db_site = db.query(Site).filter(Site.idSite == site_id).first()
    if not db_site:
        raise HTTPException(status_code=404, detail="Site not found")

    # Mettre à jour le statut d'approbation
    if statut not in ["approve", "non_approve", "en_attente"]:
        raise HTTPException(status_code=400, detail="Statut invalide. Doit être 'approve', 'non_approve' ou 'en_attente'")

    db_site.statut_approbation = statut
    db.commit()
    return {"message": f"Statut du site mis à jour : {statut}"}

# Route pour récupérer les résidences en attente d'approbation
@router.get("/sites/en-attente")
def get_pending_sites(db: Session = Depends(get_db)):
    pending_sites = db.query(Site).filter(Site.statut_approbation == "en_attente").all()
    return pending_sites

# Route pour mettre à jour une résidence
@router.put("/sites/{site_id}/{categorie_id}")
async def update_site(
    site_id: int,
    categorie_id: int,
    nom: str = Form(...),
    adresse: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    certificat_propriete: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    db_site = db.query(Site).filter(Site.idSite == site_id).first()
    if not db_site:
        raise HTTPException(status_code=404, detail="Site not found")

    # Mettre à jour les détails du site
    db_site.nom = nom
    db_site.adresse = adresse
    db_site.idCategorieSite = categorie_id
    db_site.latitude = latitude
    db_site.longitude = longitude

    # Mettre à jour le fichier PDF s'il est fourni
    if certificat_propriete:
        db_site.certificat_propriete = await certificat_propriete.read()
        db_site.certificat_propriete_nom = certificat_propriete.filename

    db.commit()
    return {"message": "Site modifié avec succès."}

# Route pour supprimer une résidence
@router.delete("/sites/{site_id}")
def delete_site(site_id: int, db: Session = Depends(get_db)):
    db_site = db.query(Site).filter(Site.idSite == site_id).first()
    if not db_site:
        raise HTTPException(status_code=404, detail="Site not found")
    db.delete(db_site)
    db.commit()
    return {"message": "Site supprimé avec succès."}

# Route pour récupérer la position (latitude et longitude) d'une résidence
@router.get("/site/position/{site_id}")
def position_site(site_id: int, db: Session = Depends(get_db)):
    db_site = db.query(Site).filter(Site.idSite == site_id).first()
    if not db_site:
        raise HTTPException(status_code=404, detail="Site not found")
    site_position = {
        "latitude": db_site.latitude,
        "longitude": db_site.longitude
    }
    return site_position

# Route pour récupérer le certificat de propriété d'une résidence
@router.get("/site/certificat/{site_id}")
def get_certificat_propriete(site_id: int, db: Session = Depends(get_db)):
    db_site = db.query(Site).filter(Site.idSite == site_id).first()
    if not db_site:
        raise HTTPException(status_code=404, detail="Site not found")
    
    if not db_site.certificat_propriete:
        raise HTTPException(status_code=404, detail="Certificat de propriété non trouvé")

    # Créer un fichier temporaire pour le PDF
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
        tmp_file.write(db_site.certificat_propriete)
        tmp_file_path = tmp_file.name

    # Renvoyer le fichier PDF en tant que réponse
    return FileResponse(tmp_file_path, filename=db_site.certificat_propriete_nom or "certificat_propriete.pdf")

@router.get("/sites")
def get_all_sites(db: Session = Depends(get_db)):
    # Récupérer tous les sites avec les informations de l'entreprise si elle existe
    sites = db.query(Site).all()
    
    # Préparer la réponse
    response = []
    for site in sites:
        site_data = {
            "idSite": site.idSite,
            "nom": site.nom,
            "adresse": site.adresse,
            "latitude": site.latitude,
            "longitude": site.longitude,
            "idCategorieSite": site.idCategorieSite,
            "idUser": site.idUser,
            "certificat_propriete_nom": site.certificat_propriete_nom,
            "statut_approbation": site.statut_approbation,
            "entreprise": None
        }
        
        # Si le site est associé à une entreprise, ajouter ses informations
        if site.idEntreprise is not None:
            entreprise = db.query(Entreprise).filter(Entreprise.idEntreprise == site.idEntreprise).first()
            if entreprise:
                site_data["entreprise"] = {
                    "idEntreprise": entreprise.idEntreprise,
                    "nom": entreprise.nom,
                    "statut_approbation": entreprise.statut_approbation
                }
        
        response.append(site_data)
    
    return response
@router.post("/sites/entreprise/{entreprise_id}/{user_id}/{categorie_id}", response_model=SiteResponse)
async def add_site_entreprise(
    entreprise_id: int,
    user_id: int,
    categorie_id: int,
    nom: str = Form(...),
    adresse: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    certificat_propriete: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    try:
        # Vérifications
        if not db.query(Entreprise).filter(Entreprise.idEntreprise == entreprise_id).first():
            raise HTTPException(status_code=404, detail="Entreprise non trouvée")
        
        if not db.query(User).filter(User.id == user_id).first():
            raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
        
        if not db.query(Categorie_Site).filter(Categorie_Site.idCategorieSite == categorie_id).first():
            raise HTTPException(status_code=404, detail="Catégorie de site non trouvée")

        # Gestion du fichier
        certificat_data = None
        certificat_nom = None
        if certificat_propriete:
            certificat_data = await certificat_propriete.read()
            certificat_nom = certificat_propriete.filename

        # Création du site
        new_site = Site(
            nom=nom,
            adresse=adresse,
            latitude=latitude,
            longitude=longitude,
            idCategorieSite=categorie_id,
            idUser=user_id,
            idEntreprise=entreprise_id,
            certificat_propriete=certificat_data,
            certificat_propriete_nom=certificat_nom,
            statut_approbation="en_attente"
        )
        
        db.add(new_site)
        db.commit()
        db.refresh(new_site)
        
        return new_site
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    


@router.get("/sites/entreprise/{entreprise_id}", response_model=List[SiteResponse])
def get_sites_by_entreprise(entreprise_id: int, db: Session = Depends(get_db)):
    # Vérifier si l'entreprise existe
    db_entreprise = db.query(Entreprise).filter(Entreprise.idEntreprise == entreprise_id).first()
    if not db_entreprise:
        raise HTTPException(status_code=404, detail="Entreprise non trouvée")
    
    # Récupérer les sites de l'entreprise
    sites = db.query(Site).filter(Site.idEntreprise == entreprise_id).all()
    
    # Convertir les résultats en utilisant le modèle Pydantic
    return [
        {
            "idSite": site.idSite,
            "nom": site.nom,
            "adresse": site.adresse,
            "latitude": site.latitude,
            "longitude": site.longitude,
            "idCategorieSite": site.idCategorieSite,
            "idUser": site.idUser,
            "certificat_propriete_nom": site.certificat_propriete_nom,
            "statut_approbation": site.statut_approbation,
        }
        for site in sites
    ]