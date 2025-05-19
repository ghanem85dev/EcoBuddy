from sqlalchemy.orm import Session
from app.entreprise.models.entreprise import Entreprise
from app.entreprise.models.secteur import Secteur
from app.particulier.models.site import Site
from app.particulier.models.UserSite import UserSite
from fastapi import Form, UploadFile, File,HTTPException
from typing import Optional
from app.commun.models import User 
from sqlalchemy import func
from typing import List, Dict, Union


def get_entreprises_by_size(db: Session) -> List[Dict[str, int]]:
    """
    Récupère le nombre d'entreprises groupées par taille
    Retourne: [{"taille": "petite", "count": x}, ...]
    """
    return db.query(
        Entreprise.taille,
        func.count(Entreprise.idEntreprise).label("count")
    ).group_by(
        Entreprise.taille
    ).order_by(
        func.count(Entreprise.idEntreprise).desc()
    ).all()
def get_entreprises_by_user(db: Session, user_id: int):
    return db.query(Entreprise).join(Site).join(Secteur).filter(Site.idUser == user_id).all()

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
    results = db.query(
        Entreprise,
        Secteur.nom.label('secteur_nom'),
        User
    ).join(
        Secteur, Entreprise.secteur_id == Secteur.idSecteur
    ).outerjoin(
        Site, Entreprise.idEntreprise == Site.idEntreprise
    ).outerjoin(
        User, Site.idUser == User.id
    ).distinct(
        Entreprise.idEntreprise
    ).all()
    
    return results

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

def count_entreprises_by_user(db: Session, user_id: int) -> int:
    """
    Compte le nombre total d'entreprises associées à un utilisateur (via les sites)
    """
    return db.query(Entreprise)\
             .join(Site, Site.idEntreprise == Entreprise.idEntreprise)\
             .filter(Site.idUser == user_id)\
             .filter(Entreprise.statut_approbation == "approve")\
             .count()

def get_entreprises_by_sector(db: Session) -> List[Dict[str, Union[str, int]]]:
    """
    Service: Récupère le nombre d'entreprises par secteur
    Retourne: Liste de dictionnaires {'sector_name': str, 'entreprise_count': int}
    """
    return db.query(
        Secteur.nom.label("sector_name"),
        func.count(Entreprise.idEntreprise).label("entreprise_count")
    ).outerjoin(
        Entreprise, Entreprise.secteur_id == Secteur.idSecteur
    ).group_by(
        Secteur.nom
    ).order_by(
        Secteur.nom
    ).all()


def get_pending_entreprises_stats(db: Session) -> Dict[str, int]:
    """
    Retourne les statistiques des entreprises en attente
    Format: {
        "total": int,
        "with_certificat": int,
        "without_certificat": int,
        "by_size": {"petite": int, "moyenne": int, "grande": int}
    }
    """
    # Requête de base pour les entreprises en attente
    query = db.query(Entreprise).filter(
        Entreprise.statut_approbation == "en_attente"
    )

    # Statistiques globales
    total = query.count()

    # Entreprises avec/sans certificat
    with_certificat = query.filter(
        Entreprise.certificat_propriete.isnot(None)
    ).count()
    
    without_certificat = total - with_certificat

    # Répartition par taille
    size_stats = {
        "petite": query.filter(Entreprise.taille == "petite").count(),
        "moyenne": query.filter(Entreprise.taille == "moyenne").count(),
        "grande": query.filter(Entreprise.taille == "grande").count()
    }

    return {
        "total": total,
        "with_certificat": with_certificat,
        "without_certificat": without_certificat,
        "by_size": size_stats
    }
    
def get_entreprises_stats(db: Session) -> Dict[str, int]:
    """
    Retourne les statistiques globales des entreprises
    Format: {
        "total": int,
        "en_attente": int,
        "approuvees": int,
        "rejetees": int
    }
    """
    # Compte total des entreprises
    total = db.query(Entreprise).count()

    # Compte par statut d'approbation
    stats = db.query(
        Entreprise.statut_approbation,
        func.count(Entreprise.idEntreprise).label("count")
    ).group_by(
        Entreprise.statut_approbation
    ).all()

    # Initialisation des compteurs
    en_attente = 0
    approuvees = 0
    rejetees = 0

    # Remplissage des compteurs selon les résultats
    for statut, count in stats:
        if statut == "en_attente":
            en_attente = count
        elif statut == "approve":
            approuvees = count
        elif statut == "non_approve":
            rejetees = count

    return {
        "total": total,
        "en_attente": en_attente,
        "approuvees": approuvees,
        "rejetees": rejetees
    }