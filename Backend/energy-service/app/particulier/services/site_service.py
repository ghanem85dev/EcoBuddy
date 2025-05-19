from sqlalchemy.orm import Session,joinedload
from fastapi import HTTPException, UploadFile
from ..models import Site, UserSite, Categorie_Site
from app.entreprise.models import Entreprise
from app.commun.models import User
from typing import List, Dict, Union
import tempfile
from sqlalchemy import func

class SiteService:
    def __init__(self, db: Session):
        self.db = db

    from sqlalchemy.orm import joinedload

    from sqlalchemy.orm import joinedload

    def get_user_sites(self, user_id: int):
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Charger explicitement les relations entreprise et secteur
        sites = self.db.query(Site).options(
            joinedload(Site.entreprise).joinedload(Entreprise.secteur)
        ).filter(Site.idUser == user_id).all()
        
        formatted_sites = []
        for site in sites:
            site_data = {
                "idSite": site.idSite,
                "nom": site.nom,
                "adresse": site.adresse,
                "latitude": site.latitude,
                "longitude": site.longitude,
                "idCategorieSite": site.idCategorieSite,
                "idUser": site.idUser,
                "statut_approbation": site.statut_approbation,
                "certificat_propriete_nom": site.certificat_propriete_nom,
                "entreprise": None,
                "categorie": None
            }
            
            # Vérifier si le site a une entreprise associée
            if hasattr(site, 'entreprise') and site.entreprise is not None:
                site_data["entreprise"] = {
                    "nom": site.entreprise.nom,
                    "idEntreprise": site.entreprise.idEntreprise
                }
                
                # Vérifier si l'entreprise a un secteur associé
                if hasattr(site, 'categorie') and site.categorie is not None:
                    site_data["categorie"] = {
                        "nom": site.categorie.nom,
                        "idCategorie": site.categorie.idCategorieSite
                    }
            
            formatted_sites.append(site_data)
        
        return formatted_sites
    def get_user_own_approved_sites(self, user_id: int):
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        sites = self.db.query(Site).filter(Site.idUser == user_id, Site.statut_approbation == "approve").all()
        return self._format_sites_response(sites)

    def get_user_associated_sites(self, user_id: int):
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

        owned_sites = self.db.query(Site).filter(
            Site.idUser == user_id, 
            Site.statut_approbation == "approve"
        ).all()

        invited_sites = (
            self.db.query(Site)
            .join(UserSite, UserSite.site_id == Site.idSite)
            .filter(UserSite.user_id == user_id)
            .all()
        )

        return self._format_sites_response(owned_sites + invited_sites)

    def get_user_managed_sites(self, user_id: int):
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

        invited_sites = self.db.query(Site).filter(Site.idResponsable == user_id).all()
        return self._format_sites_response(invited_sites)

    async def add_site(self, user_id: int, categorie_id: int, nom: str, adresse: str, 
                      latitude: float, longitude: float, certificat_propriete: UploadFile = None):
        try:
            certificat_propriete_data, certificat_propriete_nom = None, None
            if certificat_propriete:
                certificat_propriete_data = await certificat_propriete.read()
                certificat_propriete_nom = certificat_propriete.filename

            new_site = Site(
                nom=nom,
                adresse=adresse,
                latitude=latitude,
                longitude=longitude,
                idCategorieSite=categorie_id,
                idUser=user_id,
                certificat_propriete=certificat_propriete_data,
                certificat_propriete_nom=certificat_propriete_nom,
                statut_approbation="en_attente"
            )
            self.db.add(new_site)
            self.db.commit()
            return {"message": "Site ajouté avec succès. En attente d'approbation par l'administrateur."}
        except Exception as e:
            self.db.rollback()
            raise HTTPException(status_code=500, detail=str(e))

    async def add_entreprise_site(self, entreprise_id: int, user_id: int, categorie_id: int, 
                                nom: str, adresse: str, latitude: float, longitude: float, 
                                certificat_propriete: UploadFile = None):
        try:
            # Récupérer les entités complètes
            entreprise = self.db.query(Entreprise).filter(Entreprise.idEntreprise == entreprise_id).first()
            if not entreprise:
                raise HTTPException(status_code=404, detail="Entreprise non trouvée")
            
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
            
            categorie = self.db.query(Categorie_Site).filter(Categorie_Site.idCategorieSite == categorie_id).first()
            if not categorie:
                raise HTTPException(status_code=404, detail="Catégorie de site non trouvée")

            # Gérer le fichier de certificat
            certificat_data, certificat_nom = None, None
            if certificat_propriete:
                certificat_data = await certificat_propriete.read()
                certificat_nom = certificat_propriete.filename

            # Créer le nouveau site
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
            
            self.db.add(new_site)
            self.db.commit()
            self.db.refresh(new_site)
            
            # Construire la réponse conforme au modèle SiteResponse
            return {
                "idSite": new_site.idSite,
                "nom": new_site.nom,
                "adresse": new_site.adresse,
                "latitude": new_site.latitude,
                "longitude": new_site.longitude,
                "idCategorieSite": new_site.idCategorieSite,
                "idUser": new_site.idUser,
                "certificat_propriete_nom": new_site.certificat_propriete_nom,
                "statut_approbation": new_site.statut_approbation,
                "entreprise": {
                    "idEntreprise": entreprise.idEntreprise,
                    "nom": entreprise.nom
                } if entreprise else None,
                "categorie": {
                    "idCategorie": categorie.idCategorieSite,  # Notez que j'utilise idCategorieSite
                    "nom": categorie.nom
                } if categorie else None
            }
            
        except Exception as e:
            self.db.rollback()
            raise HTTPException(status_code=500, detail=str(e))
    
    def approve_or_reject_site(self, site_id: int, statut: str):
        db_site = self.db.query(Site).filter(Site.idSite == site_id).first()
        if not db_site:
            raise HTTPException(status_code=404, detail="Site not found")

        if statut not in ["approve", "non_approve", "en_attente"]:
            raise HTTPException(status_code=400, detail="Statut invalide. Doit être 'approve', 'non_approve' ou 'en_attente'")

        db_site.statut_approbation = statut
        self.db.commit()
        return {"message": f"Statut du site mis à jour : {statut}"}

    def get_pending_sites(self):
        return self.db.query(Site).filter(Site.statut_approbation == "en_attente").all()

    async def update_site(self, site_id: int, categorie_id: int, nom: str, adresse: str, 
                         latitude: float, longitude: float, certificat_propriete: UploadFile = None):
        db_site = self.db.query(Site).filter(Site.idSite == site_id).first()
        if not db_site:
            raise HTTPException(status_code=404, detail="Site not found")

        db_site.nom = nom
        db_site.adresse = adresse
        db_site.idCategorieSite = categorie_id
        db_site.latitude = latitude
        db_site.longitude = longitude

        if certificat_propriete:
            db_site.certificat_propriete = await certificat_propriete.read()
            db_site.certificat_propriete_nom = certificat_propriete.filename

        self.db.commit()
        return {"message": "Site modifié avec succès."}

    def delete_site(self, site_id: int):
        db_site = self.db.query(Site).filter(Site.idSite == site_id).first()
        if not db_site:
            raise HTTPException(status_code=404, detail="Site not found")
        self.db.delete(db_site)
        self.db.commit()
        return {"message": "Site supprimé avec succès."}

    def get_site_position(self, site_id: int):
        db_site = self.db.query(Site).filter(Site.idSite == site_id).first()
        if not db_site:
            raise HTTPException(status_code=404, detail="Site not found")
        return {
            "latitude": db_site.latitude,
            "longitude": db_site.longitude
        }

    def get_certificat_propriete(self, site_id: int):
        db_site = self.db.query(Site).filter(Site.idSite == site_id).first()
        if not db_site:
            raise HTTPException(status_code=404, detail="Site not found")
        
        if not db_site.certificat_propriete:
            raise HTTPException(status_code=404, detail="Certificat de propriété non trouvé")

        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
            tmp_file.write(db_site.certificat_propriete)
            tmp_file_path = tmp_file.name

        return tmp_file_path, db_site.certificat_propriete_nom or "certificat_propriete.pdf"

    def get_all_sites(self):
        sites = self.db.query(Site).all()
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
                "email" :site.owner.email,
                "nom" : site.owner.nom,
                "prenom" : site.owner.prenom,
                "role": site.owner.role,
                "telephone" : site.owner.telephone,
                "certificat_propriete_nom": site.certificat_propriete_nom,
                "statut_approbation": site.statut_approbation,
                "entreprise": None
            }
            
            if site.idEntreprise is not None:
                entreprise = self.db.query(Entreprise).filter(Entreprise.idEntreprise == site.idEntreprise).first()
                if entreprise:
                    site_data["entreprise"] = {
                        "idEntreprise": entreprise.idEntreprise,
                        "nom": entreprise.nom,
                        "statut_approbation": entreprise.statut_approbation
                    }
            
            response.append(site_data)
        
        return response

    def get_sites_by_entreprise(self, entreprise_id: int):
        db_entreprise = self.db.query(Entreprise).filter(Entreprise.idEntreprise == entreprise_id).first()
        if not db_entreprise:
            raise HTTPException(status_code=404, detail="Entreprise non trouvée")
        
        sites = self.db.query(Site).filter(Site.idEntreprise == entreprise_id).all()
        return self._format_sites_response(sites)

    def get_user_approved_sites_count(self, user_id: int):
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

        owned_sites_count = self.db.query(Site).filter(
            Site.idUser == user_id,
            Site.statut_approbation == "approve"
        ).count()

        invited_sites_count = self.db.query(UserSite).join(Site).filter(
            UserSite.user_id == user_id,
            Site.statut_approbation == "approve"
        ).count()

        return {"total": owned_sites_count + invited_sites_count}

    def _format_sites_response(self, sites):
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
    def _get_site_by_id(self, site_id: int):
        """Helper method to get a site by ID"""
        return self.db.query(Site).filter(Site.idSite == site_id).first()
    def get_user_sites_with_appareils(self, user_id: int):
        """Get user sites with their appareils"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
    
        sites = self.db.query(Site).filter(Site.idUser == user_id).options(
            joinedload(Site.appareils)
        ).all()
    
        return [
            {
                "idSite": site.idSite,
                "nom": site.nom,
                "appareils": [
                    {
                        "idAppareil": app.idAppareil,
                        "nom": app.nom,
                        "marque": app.marque,
                        "modele": app.modele,
                        "puissance": app.puissance
                    }
                    for app in site.appareils
               ]
            }
            for site in sites
        ]
        
    def get_invited_sites_with_appareils(self, user_id: int):
        """Get invited sites with their appareils"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
    
        sites = (
            self.db.query(Site)
            .join(UserSite, UserSite.site_id == Site.idSite)
            .filter(UserSite.user_id == user_id)
            .options(joinedload(Site.appareils))
            .all()
        )
    
        return [
            {
                "idSite": site.idSite,
                "nom": site.nom,
                "appareils": [
                    {
                        "idAppareil": app.idAppareil,
                        "nom": app.nom,
                        "marque": app.marque,
                        "modele": app.modele,
                        "puissance": app.puissance
                    } 
                    for app in site.appareils
                ]
            }
            for site in sites
        ]
    async def update_entreprise_site(
        self,
        site_id: int,
        entreprise_id: int,
        user_id: int,
        categorie_id: int,
        nom: str,
        adresse: str,
        latitude: float,
        longitude: float,
        certificat_propriete: UploadFile = None
    ):
        """
        Met à jour un site existant pour une entreprise
        """
        try:
            # Vérifier que le site existe
            db_site = self._get_site_by_id(site_id)
            if not db_site:
                raise HTTPException(status_code=404, detail="Site non trouvé")
                
            # Vérifier que l'entreprise existe
            if not self.db.query(Entreprise).filter(Entreprise.idEntreprise == entreprise_id).first():
                raise HTTPException(status_code=404, detail="Entreprise non trouvée")
            
            # Vérifier que l'utilisateur existe
            if not self.db.query(User).filter(User.id == user_id).first():
                raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
            
            # Vérifier que la catégorie existe
            if not self.db.query(Categorie_Site).filter(Categorie_Site.idCategorieSite == categorie_id).first():
                raise HTTPException(status_code=404, detail="Catégorie de site non trouvée")

            # Mettre à jour les champs de base
            db_site.nom = nom
            db_site.adresse = adresse
            db_site.latitude = latitude
            db_site.longitude = longitude
            db_site.idCategorieSite = categorie_id
            db_site.idUser = user_id
            db_site.idEntreprise = entreprise_id

            # Mettre à jour le certificat si fourni
            if certificat_propriete:
                db_site.certificat_propriete = await certificat_propriete.read()
                db_site.certificat_propriete_nom = certificat_propriete.filename

            self.db.commit()
            self.db.refresh(db_site)
            
            return {
                "message": "Site d'entreprise mis à jour avec succès",
                "site_id": db_site.idSite
            }
            
        except Exception as e:
            self.db.rollback()
            raise HTTPException(status_code=500, detail=str(e)) 
    
      
      
    def get_sites_by_category(self) -> List[Dict[str, Union[str, int]]]:
        """
        Récupère le nombre de sites groupés par catégorie
        Retourne: [{"categorie": "nom_categorie", "count": x}, ...]
        """
        return self.db.query(
            Categorie_Site.nom.label("categorie"),
            func.count(Site.idSite).label("count")
        ).outerjoin(
            Site, Site.idCategorieSite == Categorie_Site.idCategorieSite
        ).group_by(
            Categorie_Site.nom
        ).order_by(
            func.count(Site.idSite).desc()
        ).all()  
    def get_pending_sites_count(self) -> Dict[str, int]:
        """
        Retourne le nombre de sites en attente (catégorie != 1) 
        et résidences en attente (catégorie == 1)
        Format de retour: {
            "sites_en_attente": int,
            "residences_en_attente": int
        }
        """
        # Nombre total de sites en attente (toutes catégories)
        total_pending = self.db.query(func.count(Site.idSite))\
                            .filter(Site.statut_approbation == "en_attente")\
                            .scalar() or 0

        # Nombre de résidences en attente (catégorie 1)
        residences_pending = self.db.query(func.count(Site.idSite))\
                                .filter(
                                    Site.statut_approbation == "en_attente",
                                    Site.idCategorieSite == 1
                                )\
                                .scalar() or 0

        # Nombre d'autres sites en attente (catégorie != 1)
        other_sites_pending = total_pending - residences_pending

        return {
            "sites_en_attente": other_sites_pending,
            "residences_en_attente": residences_pending
        }

    def get_pending_residences_count(self) -> int:
        """Retourne uniquement le nombre de résidences en attente (catégorie 1)"""
        return self.db.query(func.count(Site.idSite))\
                    .filter(
                        Site.statut_approbation == "en_attente",
                        Site.idCategorieSite == 1
                    )\
                    .scalar() or 0

    def get_pending_other_sites_count(self) -> int:
        """Retourne uniquement le nombre d'autres sites en attente (catégorie != 1)"""
        return self.db.query(func.count(Site.idSite))\
                    .filter(
                        Site.statut_approbation == "en_attente",
                        Site.idCategorieSite != 1
                    )\
                    .scalar() or 0
                    
    def _get_sites_stats_by_category(self, category_id: int) -> Dict[str, int]:
        """
        Fonction helper pour obtenir les stats d'une catégorie spécifique
        """
        # Requête de base pour la catégorie
        query = self.db.query(
            Site.statut_approbation,
            func.count(Site.idSite).label("count")
        ).filter(
            Site.idCategorieSite == category_id
        ).group_by(
            Site.statut_approbation
        )
        
        # Initialisation des compteurs
        stats = {
            "total": 0,
            "en_attente": 0,
            "approuvees": 0,
            "rejetees": 0
        }
        
        # Comptage total
        stats["total"] = self.db.query(func.count(Site.idSite))\
                            .filter(Site.idCategorieSite == category_id)\
                            .scalar() or 0
        
        # Remplissage des compteurs selon les résultats
        for statut, count in query.all():
            if statut == "en_attente":
                stats["en_attente"] = count
            elif statut == "approve":
                stats["approuvees"] = count
            elif statut == "non_approve":
                stats["rejetees"] = count
        
        return stats

    def _get_other_sites_stats(self) -> Dict[str, int]:
        """
        Fonction helper pour obtenir les stats des sites non résidentiels (catégorie != 1)
        """
        # Requête de base pour les autres catégories
        query = self.db.query(
            Site.statut_approbation,
            func.count(Site.idSite).label("count")
        ).filter(
            Site.idCategorieSite != 1
        ).group_by(
            Site.statut_approbation
        )
        
        # Initialisation des compteurs
        stats = {
            "total": 0,
            "en_attente": 0,
            "approuvees": 0,
            "rejetees": 0
        }
        
        # Comptage total
        stats["total"] = self.db.query(func.count(Site.idSite))\
                            .filter(Site.idCategorieSite != 1)\
                            .scalar() or 0
        
        # Remplissage des compteurs selon les résultats
        for statut, count in query.all():
            if statut == "en_attente":
                stats["en_attente"] = count
            elif statut == "approve":
                stats["approuvees"] = count
            elif statut == "non_approve":
                stats["rejetees"] = count
        
        return stats

    def get_residences_stats(self) -> Dict[str, int]:
        """Retourne les statistiques spécifiques aux résidences (catégorie 1)"""
        return self._get_sites_stats_by_category(1)

    def get_locaux_stats(self) -> Dict[str, int]:
        """Retourne les statistiques spécifiques aux locaux (catégorie != 1)"""
        return self._get_other_sites_stats()

