from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.commun.database.database import SessionLocal
from ..models import Site, UserSite
from app.commun.models import User
from typing import List
from fastapi.responses import FileResponse
import tempfile

router = APIRouter()

# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Pydantic model for creating or updating a site
class NewSite(BaseModel):
    nom: str
    adresse: str
    latitude: float
    longtitude: float
    certificat_propriete: Optional[bytes] = None  # Binary data for the PDF file
    certificat_propriete_nom: Optional[str] = None  # File name of the PDF


class SiteResponse(BaseModel):
    idSite: int
    nom: str
    adresse: str
    latitude: float
    longtitude: float
    idCategorieSite: int
    idUser: int
    certificat_propriete_nom: Optional[str]

    class Config:
        from_attributes = True  # Permet d'utiliser ORM avec Pydantic

@router.get("/sites/{user_id}", response_model=List[SiteResponse])
def get_user_sites(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Récupérer les sites de l'utilisateur
    sites = db.query(Site).filter(Site.idUser == user_id).all()
    
    # Convertir les résultats en utilisant le modèle Pydantic
    return sites

# Route to get sites where the user is either the owner or has accepted an invitation
@router.get("/user-sites/{user_id}")
def get_user_sites(user_id: int, db: Session = Depends(get_db)):
    # Check if the user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

    # Get sites owned by the user
    owned_sites = db.query(Site).filter(Site.idUser == user_id).all()

    # Get sites where the user has accepted an invitation
    invited_sites = (
        db.query(Site)
        .join(UserSite, UserSite.site_id == Site.idSite)
        .filter(UserSite.user_id == user_id)
        .all()
    )

    # Merge the results with the correct keys
    sites_list = [
        {
            "idSite": site.idSite,
            "idCategorieSite": site.idCategorieSite,
            "idUser": site.idUser,
            "nom": site.nom,
            "adresse": site.adresse,
            "latitude": site.latitude,
            "longtitude": site.longtitude,
            "certificat_propriete_nom": site.certificat_propriete_nom,
        } 
        for site in owned_sites + invited_sites
    ]

    return sites_list


# Route to add a new site with an optional PDF file
@router.post("/sites/{user_id}/{categorie_id}")
async def add_site(
    user_id: int,
    categorie_id: int,
    nom: str = Form(...),
    adresse: str = Form(...),
    latitude: float = Form(...),
    longtitude: float = Form(...),
    certificat_propriete: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    try:
        # Lire le fichier PDF s'il est fourni
        certificat_propriete_data = None
        certificat_propriete_nom = None
        if certificat_propriete:
            certificat_propriete_data = await certificat_propriete.read()  # Lire les données binaires
            certificat_propriete_nom = certificat_propriete.filename

        # Créer un nouveau site
        new_site = Site(
            nom=nom,
            adresse=adresse,
            latitude=latitude,
            longtitude=longtitude,
            idCategorieSite=categorie_id,
            idUser=user_id,
            certificat_propriete=certificat_propriete_data,  # Stocker les données binaires
            certificat_propriete_nom=certificat_propriete_nom  # Stocker le nom du fichier
        )
        db.add(new_site)
        db.commit()
        return {"message": "Site ajouté avec succès."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# Route to update a site with an optional PDF file
@router.put("/sites/{site_id}/{categorie_id}")
async def update_site(
    site_id: int,
    categorie_id: int,
    nom: str = Form(...),
    adresse: str = Form(...),
    latitude: float = Form(...),
    longtitude: float = Form(...),
    certificat_propriete: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    # Check if the site exists
    db_site = db.query(Site).filter(Site.idSite == site_id).first()
    if not db_site:
        raise HTTPException(status_code=404, detail="Site not found")

    # Update the site details
    db_site.nom = nom
    db_site.adresse = adresse
    db_site.idCategorieSite = categorie_id
    db_site.latitude = latitude
    db_site.longtitude = longtitude

    # Update the PDF file if provided
    if certificat_propriete:
        db_site.certificat_propriete = await certificat_propriete.read()
        db_site.certificat_propriete_nom = certificat_propriete.filename

    db.commit()
    return {"message": "Site modifié avec succès."}


# Route to delete a site
@router.delete("/sites/{site_id}")
def delete_site(site_id: int, db: Session = Depends(get_db)):
    db_site = db.query(Site).filter(Site.idSite == site_id).first()
    if not db_site:
        raise HTTPException(status_code=404, detail="Site not found")
    db.delete(db_site)
    db.commit()
    return {"message": "Site supprimé avec succès."}


# Route to get the position (latitude and longitude) of a site
@router.get("/site/position/{site_id}")
def position_site(site_id: int, db: Session = Depends(get_db)):
    db_site = db.query(Site).filter(Site.idSite == site_id).first()
    if not db_site:
        raise HTTPException(status_code=404, detail="Site not found")
    site_position = {
        "latitude": db_site.latitude,
        "longtitude": db_site.longtitude
    }
    return site_position


# Route to get the PDF certificate of a site
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