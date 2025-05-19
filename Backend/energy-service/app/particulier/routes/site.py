# from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
# from sqlalchemy.orm import Session
# from pydantic import BaseModel
# from typing import Optional, List
# from app.commun.database.database import SessionLocal
# from ..models import Site, UserSite, Categorie_Site
# from app.entreprise.models import Entreprise
# from app.commun.models import User
# from fastapi.responses import FileResponse
# import tempfile

# # Pydantic model for creating or updating a site
# class NewSite(BaseModel):
#     nom: str
#     adresse: str
#     latitude: float
#     longitude: float
#     certificat_propriete: Optional[bytes] = None
#     certificat_propriete_nom: Optional[str] = None

# # Pydantic model for responding with site details
# class SiteResponse(BaseModel):
#     idSite: int
#     nom: str
#     adresse: str
#     latitude: float
#     longitude: float
#     idCategorieSite: int
#     idUser: int
#     certificat_propriete_nom: Optional[str]
#     statut_approbation: str  # Utilisez le nouveau champ

#     class Config:
#         from_attributes = True  # Permet d'utiliser ORM avec Pydantic

# # Routeur FastAPI
# router = APIRouter()

# # Dependency to get the database session
# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()

# # Route pour récupérer les sites d'un utilisateur
# @router.get("/sites/{user_id}", response_model=List[SiteResponse])
# def get_user_sites(user_id: int, db: Session = Depends(get_db)):
#     user = db.query(User).filter(User.id == user_id).first()
#     if not user:
#         raise HTTPException(status_code=404, detail="User not found")
    
#     # Récupérer les sites de l'utilisateur
#     sites = db.query(Site).filter(Site.idUser == user_id).all()
    
#     # Convertir les résultats en utilisant le modèle Pydantic
#     return [
#         {
#             "idSite": site.idSite,
#             "nom": site.nom,
#             "adresse": site.adresse,
#             "latitude": site.latitude,
#             "longitude": site.longitude,
#             "idCategorieSite": site.idCategorieSite,
#             "idUser": site.idUser,
#             "certificat_propriete_nom": site.certificat_propriete_nom,
#             "statut_approbation": site.statut_approbation,  # Utilisez le nouveau champ
#         }
#         for site in sites
#     ]
# # @router.get("/sites/approved/{user_id}", response_model=List[SiteResponse])
# # def get_user_sites_approved(user_id: int, db: Session = Depends(get_db)):
# #     user = db.query(User).filter(User.id == user_id).first()
# #     if not user:
# #         raise HTTPException(status_code=404, detail="User not found")
    
# #     # Récupérer les sites de l'utilisateur
# #     sites = db.query(Site).filter(Site.idUser == user_id , Site.statut_approbation == "approve").all()
    
# #     # Convertir les résultats en utilisant le modèle Pydantic
# #     return [
# #         {
# #             "idSite": site.idSite,
# #             "nom": site.nom,
# #             "adresse": site.adresse,
# #             "latitude": site.latitude,
# #             "longitude": site.longitude,
# #             "idCategorieSite": site.idCategorieSite,
# #             "idUser": site.idUser,
# #             "certificat_propriete_nom": site.certificat_propriete_nom,
# #             "statut_approbation": site.statut_approbation,  # Utilisez le nouveau champ
# #         }
# #         for site in sites
# #     ]

# # Route pour récupérer les sites où l'utilisateur est propriétaire ou invité
# @router.get("/user-sites/{user_id}")
# def get_user_sites(user_id: int, db: Session = Depends(get_db)):
#     user = db.query(User).filter(User.id == user_id).first()
#     if not user:
#         raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

#     # Get sites owned by the user
#     owned_sites = db.query(Site).filter(Site.idUser == user_id , Site.statut_approbation == "approve").all()

#     # Get sites where the user has accepted an invitation
#     invited_sites = (
#         db.query(Site)
#         .join(UserSite, UserSite.site_id == Site.idSite)
#         .filter(UserSite.user_id == user_id)
#         .all()
#     )

#     sites_list = [
#         {
#             "idSite": site.idSite,
#             "idCategorieSite": site.idCategorieSite,
#             "idUser": site.idUser,
#             "nom": site.nom,
#             "adresse": site.adresse,
#             "latitude": site.latitude,
#             "longitude": site.longitude,
#             "certificat_propriete_nom": site.certificat_propriete_nom,
#             "statut_approbation": site.statut_approbation,  # Utilisez le nouveau champ
#         } 
#         for site in owned_sites + invited_sites
#     ]

#     return sites_list

# @router.get("/managed-sites/{user_id}")
# def get_user_managed_sites(user_id: int, db: Session = Depends(get_db)):
#     user = db.query(User).filter(User.id == user_id).first()
#     if not user:
#         raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

   
#     # Get sites where the user has accepted an invitation
#     invited_sites = (
#         db.query(Site)
        
#         .filter(Site.idResponsable == user_id)
#         .all()
#     )

#     sites_list = [
#         {
#             "idSite": site.idSite,
#             "idCategorieSite": site.idCategorieSite,
#             "idUser": site.idUser,
#             "nom": site.nom,
#             "adresse": site.adresse,
#             "latitude": site.latitude,
#             "longitude": site.longitude,
#             "certificat_propriete_nom": site.certificat_propriete_nom,
#             "statut_approbation": site.statut_approbation,  # Utilisez le nouveau champ
#         } 
#         for site in invited_sites
#     ]

#     return sites_list

# # Route pour ajouter une nouvelle résidence (non approuvée par défaut)
# @router.post("/sites/{user_id}/{categorie_id}")
# async def add_site(
#     user_id: int,
#     categorie_id: int,
#     nom: str = Form(...),
#     adresse: str = Form(...),
#     latitude: float = Form(...),
#     longitude: float = Form(...),
#     certificat_propriete: UploadFile = File(None),
#     db: Session = Depends(get_db)
# ):
#     try:
#         # Lire le fichier PDF s'il est fourni
#         certificat_propriete_data = None
#         certificat_propriete_nom = None
#         if certificat_propriete:
#             certificat_propriete_data = await certificat_propriete.read()
#             certificat_propriete_nom = certificat_propriete.filename

#         # Créer un nouveau site avec statut_approbation = "en_attente" par défaut
#         new_site = Site(
#             nom=nom,
#             adresse=adresse,
#             latitude=latitude,
#             longitude=longitude,
#             idCategorieSite=categorie_id,
#             idUser=user_id,
#             certificat_propriete=certificat_propriete_data,
#             certificat_propriete_nom=certificat_propriete_nom,
#             statut_approbation="en_attente"  # Statut par défaut
#         )
#         db.add(new_site)
#         db.commit()
#         return {"message": "Site ajouté avec succès. En attente d'approbation par l'administrateur."}
#     except Exception as e:
#         db.rollback()
#         raise HTTPException(status_code=500, detail=str(e))
# @router.post("/sites/{user_id}/{entreprise_id}/{categorie_id}")
# async def add_site(
#     user_id: int,
#     categorie_id: int,
#     entreprise_id: int,
#     nom: str = Form(...),
#     adresse: str = Form(...),
#     latitude: float = Form(...),
#     longitude: float = Form(...),
#     certificat_propriete: UploadFile = File(None),
#     db: Session = Depends(get_db)
# ):
#     try:
#         # Lire le fichier PDF s'il est fourni
#         certificat_propriete_data = None
#         certificat_propriete_nom = None
#         if certificat_propriete:
#             certificat_propriete_data = await certificat_propriete.read()
#             certificat_propriete_nom = certificat_propriete.filename

#         # Créer un nouveau site avec statut_approbation = "en_attente" par défaut
#         new_site = Site(
#             nom=nom,
#             adresse=adresse,
#             latitude=latitude,
#             longitude=longitude,
#             idCategorieSite=categorie_id,
#             idUser=user_id,
#             idEntreprise=entreprise_id,
#             certificat_propriete=certificat_propriete_data,
#             certificat_propriete_nom=certificat_propriete_nom,
#             statut_approbation="en_attente"  # Statut par défaut
#         )
#         db.add(new_site)
#         db.commit()
#         return {"message": "Site ajouté avec succès. En attente d'approbation par l'administrateur."}
#     except Exception as e:
#         db.rollback()
#         raise HTTPException(status_code=500, detail=str(e))

# # Route pour approuver ou rejeter une résidence
# @router.put("/sites/approve/{site_id}")
# def approve_or_reject_site(
#     site_id: int,
#     statut: str = Query(..., description="Statut d'approbation : 'approve', 'non_approve' ou 'en_attente'"),
#     db: Session = Depends(get_db)
# ):
#     db_site = db.query(Site).filter(Site.idSite == site_id).first()
#     if not db_site:
#         raise HTTPException(status_code=404, detail="Site not found")

#     # Mettre à jour le statut d'approbation
#     if statut not in ["approve", "non_approve", "en_attente"]:
#         raise HTTPException(status_code=400, detail="Statut invalide. Doit être 'approve', 'non_approve' ou 'en_attente'")

#     db_site.statut_approbation = statut
#     db.commit()
#     return {"message": f"Statut du site mis à jour : {statut}"}

# # Route pour récupérer les résidences en attente d'approbation
# @router.get("/sites/en-attente")
# def get_pending_sites(db: Session = Depends(get_db)):
#     pending_sites = db.query(Site).filter(Site.statut_approbation == "en_attente").all()
#     return pending_sites

# # Route pour mettre à jour une résidence
# @router.put("/sites/{site_id}/{categorie_id}")
# async def update_site(
#     site_id: int,
#     categorie_id: int,
#     nom: str = Form(...),
#     adresse: str = Form(...),
#     latitude: float = Form(...),
#     longitude: float = Form(...),
#     certificat_propriete: UploadFile = File(None),
#     db: Session = Depends(get_db)
# ):
#     db_site = db.query(Site).filter(Site.idSite == site_id).first()
#     if not db_site:
#         raise HTTPException(status_code=404, detail="Site not found")

#     # Mettre à jour les détails du site
#     db_site.nom = nom
#     db_site.adresse = adresse
#     db_site.idCategorieSite = categorie_id
#     db_site.latitude = latitude
#     db_site.longitude = longitude

#     # Mettre à jour le fichier PDF s'il est fourni
#     if certificat_propriete:
#         db_site.certificat_propriete = await certificat_propriete.read()
#         db_site.certificat_propriete_nom = certificat_propriete.filename

#     db.commit()
#     return {"message": "Site modifié avec succès."}

# # Route pour supprimer une résidence
# @router.delete("/sites/{site_id}")
# def delete_site(site_id: int, db: Session = Depends(get_db)):
#     db_site = db.query(Site).filter(Site.idSite == site_id).first()
#     if not db_site:
#         raise HTTPException(status_code=404, detail="Site not found")
#     db.delete(db_site)
#     db.commit()
#     return {"message": "Site supprimé avec succès."}

# # Route pour récupérer la position (latitude et longitude) d'une résidence
# @router.get("/site/position/{site_id}")
# def position_site(site_id: int, db: Session = Depends(get_db)):
#     db_site = db.query(Site).filter(Site.idSite == site_id).first()
#     if not db_site:
#         raise HTTPException(status_code=404, detail="Site not found")
#     site_position = {
#         "latitude": db_site.latitude,
#         "longitude": db_site.longitude
#     }
#     return site_position

# # Route pour récupérer le certificat de propriété d'une résidence
# @router.get("/site/certificat/{site_id}")
# def get_certificat_propriete(site_id: int, db: Session = Depends(get_db)):
#     db_site = db.query(Site).filter(Site.idSite == site_id).first()
#     if not db_site:
#         raise HTTPException(status_code=404, detail="Site not found")
    
#     if not db_site.certificat_propriete:
#         raise HTTPException(status_code=404, detail="Certificat de propriété non trouvé")

#     # Créer un fichier temporaire pour le PDF
#     with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
#         tmp_file.write(db_site.certificat_propriete)
#         tmp_file_path = tmp_file.name

#     # Renvoyer le fichier PDF en tant que réponse
#     return FileResponse(tmp_file_path, filename=db_site.certificat_propriete_nom or "certificat_propriete.pdf")

# @router.get("/sites")
# def get_all_sites(db: Session = Depends(get_db)):
#     # Récupérer tous les sites avec les informations de l'entreprise si elle existe
#     sites = db.query(Site).all()
    
#     # Préparer la réponse
#     response = []
#     for site in sites:
#         site_data = {
#             "idSite": site.idSite,
#             "nom": site.nom,
#             "adresse": site.adresse,
#             "latitude": site.latitude,
#             "longitude": site.longitude,
#             "idCategorieSite": site.idCategorieSite,
#             "idUser": site.idUser,
#             "certificat_propriete_nom": site.certificat_propriete_nom,
#             "statut_approbation": site.statut_approbation,
#             "entreprise": None
#         }
        
#         # Si le site est associé à une entreprise, ajouter ses informations
#         if site.idEntreprise is not None:
#             entreprise = db.query(Entreprise).filter(Entreprise.idEntreprise == site.idEntreprise).first()
#             if entreprise:
#                 site_data["entreprise"] = {
#                     "idEntreprise": entreprise.idEntreprise,
#                     "nom": entreprise.nom,
#                     "statut_approbation": entreprise.statut_approbation
#                 }
        
#         response.append(site_data)
    
#     return response
# @router.post("/sites/entreprise/{entreprise_id}/{user_id}/{categorie_id}", response_model=SiteResponse)
# async def add_site_entreprise(
#     entreprise_id: int,
#     user_id: int,
#     categorie_id: int,
#     nom: str = Form(...),
#     adresse: str = Form(...),
#     latitude: float = Form(...),
#     longitude: float = Form(...),
#     certificat_propriete: UploadFile = File(None),
#     db: Session = Depends(get_db)
# ):
#     try:
#         # Vérifications
#         if not db.query(Entreprise).filter(Entreprise.idEntreprise == entreprise_id).first():
#             raise HTTPException(status_code=404, detail="Entreprise non trouvée")
        
#         if not db.query(User).filter(User.id == user_id).first():
#             raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
        
#         if not db.query(Categorie_Site).filter(Categorie_Site.idCategorieSite == categorie_id).first():
#             raise HTTPException(status_code=404, detail="Catégorie de site non trouvée")

#         # Gestion du fichier
#         certificat_data = None
#         certificat_nom = None
#         if certificat_propriete:
#             certificat_data = await certificat_propriete.read()
#             certificat_nom = certificat_propriete.filename

#         # Création du site
#         new_site = Site(
#             nom=nom,
#             adresse=adresse,
#             latitude=latitude,
#             longitude=longitude,
#             idCategorieSite=categorie_id,
#             idUser=user_id,
#             idEntreprise=entreprise_id,
#             certificat_propriete=certificat_data,
#             certificat_propriete_nom=certificat_nom,
#             statut_approbation="en_attente"
#         )
        
#         db.add(new_site)
#         db.commit()
#         db.refresh(new_site)
        
#         return new_site
        
#     except Exception as e:
#         db.rollback()
#         raise HTTPException(status_code=500, detail=str(e))
    


# @router.get("/sites/entreprise/{entreprise_id}", response_model=List[SiteResponse])
# def get_sites_by_entreprise(entreprise_id: int, db: Session = Depends(get_db)):
#     # Vérifier si l'entreprise existe
#     db_entreprise = db.query(Entreprise).filter(Entreprise.idEntreprise == entreprise_id).first()
#     if not db_entreprise:
#         raise HTTPException(status_code=404, detail="Entreprise non trouvée")
    
#     # Récupérer les sites de l'entreprise
#     sites = db.query(Site).filter(Site.idEntreprise == entreprise_id).all()
    
#     # Convertir les résultats en utilisant le modèle Pydantic
#     return [
#         {
#             "idSite": site.idSite,
#             "nom": site.nom,
#             "adresse": site.adresse,
#             "latitude": site.latitude,
#             "longitude": site.longitude,
#             "idCategorieSite": site.idCategorieSite,
#             "idUser": site.idUser,
#             "certificat_propriete_nom": site.certificat_propriete_nom,
#             "statut_approbation": site.statut_approbation,
#         }
#         for site in sites
#     ]
    
# @router.get("/totalSites/{user_id}")
# def get_user_approved_sites_count(user_id: int, db: Session = Depends(get_db)):
#     # Vérifier si l'utilisateur existe
#     user = db.query(User).filter(User.id == user_id).first()
#     if not user:
#         raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

#     # Compter les sites approuvés dont l'utilisateur est propriétaire
#     owned_sites_count = db.query(Site).filter(
#         Site.idUser == user_id,
#         Site.statut_approbation == "approve"
#     ).count()

#     # Compter les sites approuvés où l'utilisateur est invité
#     invited_sites_count = db.query(UserSite).join(Site).filter(
#         UserSite.user_id == user_id,
#         Site.statut_approbation == "approve"
#     ).count()

#     return {"total":owned_sites_count + invited_sites_count}



from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from fastapi.responses import FileResponse
from app.commun.database.database import SessionLocal
from ..services.site_service import SiteService

# Pydantic models
class NewSite(BaseModel):
    nom: str
    adresse: str
    latitude: float
    longitude: float
    certificat_propriete: Optional[bytes] = None
    certificat_propriete_nom: Optional[str] = None

class EntrepriseResponse(BaseModel):
    idEntreprise: int
    nom: str

class CategorieResponse(BaseModel):
    idCategorie: int
    nom: str

class SiteResponse(BaseModel):
    idSite: int
    nom: str
    adresse: str
    latitude: float
    longitude: float
    idCategorieSite: int
    idUser: int
    certificat_propriete_nom: Optional[str] = None
    statut_approbation: str
    entreprise: Optional[EntrepriseResponse] = None
    categorie: Optional[CategorieResponse] = None

    class Config:
        from_attributes = True

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/sites/{user_id}", response_model=List[SiteResponse])
def get_user_sites(user_id: int, db: Session = Depends(get_db)):
    return SiteService(db).get_user_sites(user_id)
@router.get("/own-approved-sites/{user_id}", response_model=List[SiteResponse])
def get_user_sites(user_id: int, db: Session = Depends(get_db)):
    return SiteService(db).get_user_own_approved_sites(user_id)

@router.get("/user-sites/{user_id}")
def get_user_associated_sites(user_id: int, db: Session = Depends(get_db)):
    return SiteService(db).get_user_associated_sites(user_id)

@router.get("/managed-sites/{user_id}")
def get_user_managed_sites(user_id: int, db: Session = Depends(get_db)):
    return SiteService(db).get_user_managed_sites(user_id)

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
    return await SiteService(db).add_site(
        user_id, categorie_id, nom, adresse, latitude, longitude, certificat_propriete
    )

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
    return await SiteService(db).add_entreprise_site(
        entreprise_id, user_id, categorie_id, nom, adresse, latitude, longitude, certificat_propriete
    )

@router.put("/sites/approve/{site_id}")
def approve_or_reject_site(
    site_id: int,
    statut: str = Query(..., description="Statut d'approbation : 'approve', 'non_approve' ou 'en_attente'"),
    db: Session = Depends(get_db)
):
    return SiteService(db).approve_or_reject_site(site_id, statut)

@router.get("/sites/en-attente")
def get_pending_sites(db: Session = Depends(get_db)):
    return SiteService(db).get_pending_sites()

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
    return await SiteService(db).update_site(
        site_id, categorie_id, nom, adresse, latitude, longitude, certificat_propriete
    )

@router.delete("/sites/{site_id}")
def delete_site(site_id: int, db: Session = Depends(get_db)):
    return SiteService(db).delete_site(site_id)

@router.get("/site/position/{site_id}")
def position_site(site_id: int, db: Session = Depends(get_db)):
    return SiteService(db).get_site_position(site_id)

@router.get("/site/certificat/{site_id}")
def get_certificat_propriete(site_id: int, db: Session = Depends(get_db)):
    tmp_file_path, filename = SiteService(db).get_certificat_propriete(site_id)
    return FileResponse(tmp_file_path, filename=filename)

@router.get("/sites")
def get_all_sites(db: Session = Depends(get_db)):
    return SiteService(db).get_all_sites()

@router.get("/sites/entreprise/{entreprise_id}", response_model=List[SiteResponse])
def get_sites_by_entreprise(entreprise_id: int, db: Session = Depends(get_db)):
    return SiteService(db).get_sites_by_entreprise(entreprise_id)

@router.get("/totalSites/{user_id}")
def get_user_approved_sites_count(user_id: int, db: Session = Depends(get_db)):
    return SiteService(db).get_user_approved_sites_count(user_id)

@router.put("/sites/entreprise/{site_id}/{entreprise_id}/{user_id}/{categorie_id}")
async def update_entreprise_site(
    site_id: int,
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
    return await SiteService(db).update_entreprise_site(
        site_id=site_id,
        entreprise_id=entreprise_id,
        user_id=user_id,
        categorie_id=categorie_id,
        nom=nom,
        adresse=adresse,
        latitude=latitude,
        longitude=longitude,
        certificat_propriete=certificat_propriete
    )
class SiteCategoryStats(BaseModel):
    categorie: str
    count: int

    class Config:
        from_attributes = True
@router.get("/stats/categories", response_model=List[SiteCategoryStats])
def get_sites_category_stats(db: Session = Depends(get_db)):
    """
    Endpoint pour obtenir la répartition des sites par catégorie
    Retourne les statistiques pour affichage en charte
    """
    try:
        return SiteService(db).get_sites_by_category()
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la récupération des statistiques: {str(e)}"
        )
        
class PendingSitesStats(BaseModel):
    sites_en_attente: int
    residences_en_attente: int
@router.get("/stats/pending", response_model=PendingSitesStats)
def get_pending_sites_stats(db: Session = Depends(get_db)):
    """
    Endpoint pour obtenir les statistiques des sites en attente
    Séparés entre résidences (catégorie 1) et autres sites
    """
    try:
        return SiteService(db).get_pending_sites_count()
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la récupération des statistiques: {str(e)}"
        )

@router.get("/stats/pending/residences")
def get_pending_residences_count(db: Session = Depends(get_db)):
    """Retourne uniquement le nombre de résidences en attente"""
    try:
        count = SiteService(db).get_pending_residences_count()
        return {"total": count}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la récupération: {str(e)}"
        )

@router.get("/stats/pending/sites")
def get_pending_other_sites_count(db: Session = Depends(get_db)):
    """Retourne uniquement le nombre d'autres sites en attente"""
    try:
        count = SiteService(db).get_pending_other_sites_count()
        return {"total": count}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la récupération: {str(e)}"
        )
class ResidenceStatsResponse(BaseModel):
    total: int
    en_attente: int
    approuvees: int
    rejetees: int

class LocalStatsResponse(BaseModel):
    total: int
    en_attente: int
    approuvees: int
    rejetees: int
@router.get("/stats/residences", response_model=ResidenceStatsResponse)
def get_residences_stats(db: Session = Depends(get_db)):
    """
    Endpoint pour obtenir les statistiques des résidences uniquement (catégorie 1)
    """
    try:
        return SiteService(db).get_residences_stats()
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la récupération des statistiques: {str(e)}"
        )

@router.get("/stats/locaux", response_model=LocalStatsResponse)
def get_locaux_stats(db: Session = Depends(get_db)):
    """
    Endpoint pour obtenir les statistiques des locaux uniquement (autres catégories)
    """
    try:
        return SiteService(db).get_locaux_stats()
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la récupération des statistiques: {str(e)}"
        )