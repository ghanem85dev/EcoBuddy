from datetime import date, time, datetime, timedelta
from typing import Dict, List, Optional, Tuple 
from sqlalchemy.orm import Session
from app.particulier.models import Site
from app.commun.models import User
from app.commun.models.defi import Défi, TypeCondition
from app.commun.models.defiCategorieAppareil import DefiCategorieAppareil
from app.commun.schemas.defi import DefiCreate, DefiUpdate
from app.commun.models_mongo import Consommation
from sqlalchemy import func
from app.commun.repositories.consommation_repository import ConsommationRepository
class DefiService:
    def __init__(self, db: Session):
        self.db = db

    def create_defi(self, defi_data: DefiCreate) -> Défi:
        """Crée un nouveau défi"""
        try:
            nouveau_defi = Défi(
                titre=defi_data.titre,
                points=defi_data.points,
                description=defi_data.description,
                cible=defi_data.cible,
                active=defi_data.active,
                mode_recurrence=defi_data.mode_recurrence,
                date_debut_base=defi_data.date_debut_base,
                heure_debut=self._parse_time(defi_data.heure_debut),
                heure_fin=self._parse_time(defi_data.heure_fin),
                duree_jours=defi_data.duree_jours,
                type_condition=defi_data.type_condition,
                valeur_cible=defi_data.valeur_cible,
                periode_comparaison=defi_data.periode_comparaison
            )
            
            self.db.add(nouveau_defi)
            self.db.commit()
            self.db.refresh(nouveau_defi)
            
            if defi_data.categories:
                self._associate_categories(nouveau_defi.idDefi, defi_data.categories)
            
            return nouveau_defi
            
        except Exception as e:
            self.db.rollback()
            raise ValueError(f"Erreur lors de la création du défi: {str(e)}")

    def get_defi(self, defi_id: int) -> Optional[Défi]:
        """Récupère un défi par son ID"""
        return self.db.query(Défi).filter(Défi.idDefi == defi_id).first()

    def get_all_defis(self, active_only: bool = True) -> List[Défi]:
        """Récupère tous les défis"""
        query = self.db.query(Défi)
        if active_only:
            query = query.filter(Défi.active == True)
        return query.all()

    def update_defi(self, defi_id: int, defi_data: DefiUpdate) -> Optional[Défi]:
        """Met à jour un défi existant"""
        defi = self.get_defi(defi_id)
        if not defi:
            return None
            
        try:
            for key, value in defi_data.dict(exclude_unset=True).items():
                if key == 'heure_debut' and value:
                    setattr(defi, key, self._parse_time(value))
                elif key == 'heure_fin' and value:
                    setattr(defi, key, self._parse_time(value))
                elif key == 'categories':
                    self._update_categories(defi_id, value)
                else:
                    setattr(defi, key, value)
            
            self.db.commit()
            self.db.refresh(defi)
            return defi
            
        except Exception as e:
            self.db.rollback()
            raise ValueError(f"Erreur lors de la mise à jour: {str(e)}")

    def delete_defi(self, defi_id: int) -> bool:
        """Supprime un défi"""
        defi = self.get_defi(defi_id)
        if not defi:
            return False
            
        try:
            # Supprimer d'abord les associations
            self.db.query(DefiCategorieAppareil).filter(
                DefiCategorieAppareil.idDefi == defi_id
            ).delete()
            
            self.db.delete(defi)
            self.db.commit()
            return True
            
        except Exception as e:
            self.db.rollback()
            raise ValueError(f"Erreur lors de la suppression: {str(e)}")

    def _parse_time(self, time_str: Optional[str]) -> Optional[time]:
        """Convertit une string en objet time"""
        if not time_str:
            return None
        if ':' in time_str:
            return time.fromisoformat(time_str)
        return time(int(time_str[:2]), int(time_str[2:4]))

    def _associate_categories(self, defi_id: int, category_ids: List[int]):
        """Associe des catégories à un défi"""
        for cat_id in category_ids:
            association = DefiCategorieAppareil(idDefi=defi_id, idCategorie=cat_id)
            self.db.add(association)
        self.db.commit()

    def _update_categories(self, defi_id: int, category_ids: List[int]):
        """Met à jour les associations de catégories"""
        # Supprimer les anciennes associations
        self.db.query(DefiCategorieAppareil).filter(
            DefiCategorieAppareil.idDefi == defi_id
        ).delete()
        
        # Ajouter les nouvelles
        self._associate_categories(defi_id, category_ids)
    async def check_defi_completion(self, defi_id: int) -> Dict[int, bool]:
        """
        Vérifie quels sites ont complété le défi
        Retourne un dictionnaire {site_id: bool} indiquant si le défi est réussi
        """
        defi = self.get_defi(defi_id)
        if not defi:
            raise ValueError("Défi non trouvé")
        
        if not self._is_evaluation_period_over(defi):
            raise ValueError("La période d'évaluation n'est pas encore terminée")
        
        if defi.cible.lower() == "catégorie appareil":
            return self._check_category_completion(defi)
        else:
            return self._check_site_completion(defi)

    def _check_category_completion(self, defi: Défi) -> Dict[int, bool]:
        """
        Vérifie la complétion pour les défis ciblant des catégories d'appareils par site
        """
        results = {}
        category_ids = [assoc.idCategorie for assoc in defi.categories_associees]
        
        # Récupérer tous les sites concernés
        sites = (self.db.query(Site)
                .join(Appareil, Appareil.idSite == Site.idSite)
                .filter(Appareil.idCategorie.in_(category_ids))
                .distinct()
                .all())
        
        for site in sites:
            comparison_cons = self._get_comparison_consumption(
                user_id=site.idUser,
                periode_comparaison=defi.periode_comparaison,
                category_ids=category_ids,
                date_debut=defi.date_debut_base,
                duree_jours=defi.duree_jours,
                heure_debut=defi.heure_debut,
                heure_fin=defi.heure_fin
            )
            
            challenge_cons = self._get_challenge_consumption(
                site.idUser,
                defi.date_debut_base,
                defi.duree_jours,
                category_ids,
                site.idSite  # Nouveau paramètre pour filtrer par site
            )
            
            if defi.type_condition == TypeCondition.REDUCTION_POURCENTAGE:
                reduction = ((comparison_cons - challenge_cons) / comparison_cons) * 100
                results[site.idSite] = reduction >= defi.valeur_cible
            else:  # LIMITE_ABSOLUE
                results[site.idSite] = challenge_cons <= defi.valeur_cible
                
        return results

    def _check_site_completion(self, defi: Défi) -> Dict[int, bool]:
        """
        Vérifie la complétion pour les défis ciblant les sites entiers
        """
        results = {}
        sites = self.db.query(Site).all()
        
        for site in sites:
            comparison_cons = self._get_comparison_consumption(
                user_id=site.idUser,
                periode_comparaison=defi.periode_comparaison,
                category_ids=None,  # Pas de filtre par catégorie pour les défis site entier
                date_debut=defi.date_debut_base,
                duree_jours=defi.duree_jours,
                heure_debut=defi.heure_debut,
                heure_fin=defi.heure_fin,
                site_id=site.idSite  # Ajout du site_id
            )
            
            challenge_cons = self._get_challenge_consumption(
                site.idUser,
                defi.date_debut_base,
                defi.duree_jours,
                None,  # Pas de filtre par catégorie
                site.idSite  # Filtre par site
            )
            
            if defi.type_condition == TypeCondition.REDUCTION_POURCENTAGE:
                reduction = ((comparison_cons - challenge_cons) / comparison_cons) * 100
                results[site.idSite] = reduction >= defi.valeur_cible
            else:  # LIMITE_ABSOLUE
                results[site.idSite] = challenge_cons <= defi.valeur_cible
                
        return results

    async def _get_comparison_consumption(self, 
                              user_id: int, 
                              periode_comparaison: str,
                              category_ids: Optional[List[int]] = None,
                              date_debut: Optional[datetime] = None,
                              duree_jours: Optional[int] = None,
                              heure_debut: Optional[time] = None,
                              heure_fin: Optional[time] = None,
                              site_id: Optional[int] = None )-> float:
        """
        Calcule la consommation de référence selon la période de comparaison
        avec possibilité de spécifier une période personnalisée.
        
        Args:
            user_id: ID de l'utilisateur
            periode_comparaison: Période de comparaison ("dernier mois", "même mois année dernière", 
                            "année précédente", "jours précédents", "même jours année dernière")
            category_ids: Liste des IDs de catégories (optionnel)
            date_debut: Date de début pour les comparaisons personnalisées (optionnel)
            duree_jours: Nombre de jours pour les comparaisons personnalisées (optionnel)
            heure_debut: Heure de début pour le filtre (optionnel)
            heure_fin: Heure de fin pour le filtre (optionnel)
        
        Returns:
            float: La consommation calculée
        
        Raises:
            ValueError: Si les paramètres sont invalides
        """
        now = datetime.now()
        
        if periode_comparaison == "année précédente":
            if date_debut is None or duree_jours is None:
                raise ValueError("date_debut et duree_jours sont obligatoires pour 'année précédente'")
            
            start_date = datetime(date_debut.year - 1, date_debut.month, date_debut.day)
            end_date = start_date + timedelta(days=duree_jours)
            
        elif periode_comparaison == "dernier mois":
            if duree_jours is not None and duree_jours > 30:
                raise ValueError("duree_jours ne peut pas dépasser 30 jours pour 'dernier mois'")
                
            start_date = (now - timedelta(days=30)).replace(day=1)
            end_date = start_date + timedelta(days=duree_jours if duree_jours is not None else 30)
            
        elif periode_comparaison == "même mois année dernière":
            if duree_jours is not None and duree_jours > 30:
                raise ValueError("duree_jours ne peut pas dépasser 30 jours pour 'même mois année dernière'")
                
            start_date = datetime(now.year - 1, now.month, 1)
            end_date = start_date + timedelta(days=duree_jours if duree_jours is not None else 30)
            
        elif periode_comparaison == "jour précédent":
            if duree_jours is None or duree_jours != 1:
                print(f"❌ dure {duree_jours} jours")
                raise ValueError("duree_jours doit être 1 pour 'jours précédents'")
                
            start_date = now - timedelta(days=1)
            end_date = now
            
        elif periode_comparaison == "même jours année dernière":
            if duree_jours is None or duree_jours != 1:
                raise ValueError("duree_jours doit être 1 pour 'même jours année dernière'")
                
            start_date = datetime(now.year - 1, now.month, now.day)
            end_date = start_date + timedelta(days=1)
            
        else:
            raise ValueError("Période de comparaison invalide")
        
        # Appliquer les heures si spécifiées
        if heure_debut is not None:
            start_date = datetime.combine(start_date.date(), heure_debut)
        if heure_fin is not None:
            end_date = datetime.combine(end_date.date(), heure_fin)
        
        return await self._calculate_consumption(
            user_id, 
            start_date, 
            end_date,
            category_ids,
            site_id  # Nouveau paramètre
        )

    async def _get_challenge_consumption(self, 
                                user_id: int, 
                                start_date: date,
                                duration_days: int,
                                category_ids: Optional[List[int]] = None,
                                site_id: Optional[int] = None) -> float:
        """
        Calcule la consommation pendant le défi avec possibilité de filtrer par site
        """
        end_date = start_date + timedelta(days=duration_days)
        return await self._calculate_consumption(
            user_id,
            start_date,
            end_date,
            category_ids,
            site_id  # Nouveau paramètre
        )

    async def _calculate_consumption(self, 
                        user_id: int,
                        start_date: datetime,
                        end_date: datetime,
                        category_ids: Optional[List[int]] = None,
                        site_id: Optional[int] = None) -> float:
        """
        Calcule la consommation totale avec filtres par catégorie et/ou site
        Utilise le ConsommationRepository pour interagir avec MongoDB
        """
        # Initialiser le repository
        consommation_repo = ConsommationRepository()
        
        # 1. Obtenir les appareils concernés
        from app.commun.models import Appareil  # Import nécessaire
        
        # Construire la requête pour les appareils
        appareil_query = self.db.query(Appareil.idAppareil)\
                            .join(Site, Site.idSite == Appareil.idSite)\
                            .join(User, User.id == Site.idUser)\
                            .filter(User.id == user_id)
        
        if category_ids:
            appareil_query = appareil_query.filter(Appareil.idCategorie.in_(category_ids))
        if site_id is not None:
            appareil_query = appareil_query.filter(Site.idSite == site_id)
        
        appareil_ids = [a.idAppareil for a in appareil_query.all()]
        
        if not appareil_ids:
            return 0.0
        
        # 2. Obtenir la consommation totale depuis MongoDB
        try:
            total = await consommation_repo.get_total_consumption_by_appareil_ids(
                appareil_ids=appareil_ids,
                start_date=start_date,
                end_date=end_date
            )
            print(f"total : {total}")
            return float(total)
        except Exception as e:
            print(f"Erreur lors du calcul de la consommation: {str(e)}")
            return 0.0
    async def get_defi_results(self, defi_id: int) -> Dict[int, Tuple[bool, float, float]]:
        """
        Retourne des résultats détaillés pour chaque site concerné par le défi
        Format: {site_id: (success: bool, challenge_cons: float, comparison_cons: float)}
        """
        defi = self.get_defi(defi_id)
        if not defi:
            raise ValueError("Défi non trouvé")
        
        results = {}
        
        if defi.cible.lower() == "catégorie appareil":
            category_ids = [assoc.idCategorie for assoc in defi.categories_associees]
            sites = (self.db.query(Site)
                    .join(Appareil, Appareil.idSite == Site.idSite)
                    .filter(Appareil.idCategorie.in_(category_ids))
                    .distinct()
                    .all())
        else:
            sites = self.db.query(Site).all()
            category_ids = None
        
        for site in sites:
            comparison_cons = await self._get_comparison_consumption(
                user_id=site.idUser,
                periode_comparaison=defi.periode_comparaison,
                category_ids=category_ids,
                date_debut=defi.date_debut_base,
                duree_jours=defi.duree_jours,
                heure_debut=defi.heure_debut,
                heure_fin=defi.heure_fin
            )
            print(f"comparison_cons : {comparison_cons}")
            challenge_cons = await self._get_challenge_consumption(
                site.idUser,
                defi.date_debut_base,
                defi.duree_jours,
                category_ids,
                site.idSite
            )
            print(f"challenge_cons : {challenge_cons}")
            if defi.type_condition == TypeCondition.REDUCTION_POURCENTAGE:
                reduction = ((comparison_cons - challenge_cons) / comparison_cons) * 100 if comparison_cons > 0 else 0
                print(f"reduction : {reduction}")
                success = reduction >= defi.valeur_cible
            else:  # LIMITE_ABSOLUE
                success = challenge_cons <= defi.valeur_cible
                print(f"success : {success}")
                
            results[site.idSite] = (success, challenge_cons, comparison_cons)
            print(f"result : {results[site.idSite]}")
            
        return results
    
    def get_defis_for_user(self, user_id: int, active_only: bool = True) -> List[Défi]:
        """
        Récupère tous les défis qui concernent un utilisateur spécifique.
        Pour les défis ciblant des catégories d'appareils, vérifie que l'utilisateur
        possède au moins un site avec des appareils des catégories concernées.
        
        Args:
            user_id: ID de l'utilisateur
            active_only: Si True, ne retourne que les défis actifs
            
        Returns:
            Liste des défis concernant l'utilisateur
        """
        from app.commun.models import Appareil  # Import nécessaire pour la relation
        
        # Récupérer tous les défis de base
        query = self.db.query(Défi)
        if active_only:
            query = query.filter(Défi.active == True)
        
        defis = query.all()
        user_defis = []
        
        # Récupérer tous les sites de l'utilisateur
        user_sites = self.db.query(Site).filter(Site.idUser == user_id).all()
        
        for defi in defis:
            if defi.cible.lower() == "tous":
                # Si le défi cible tous les sites, on l'ajoute directement
                user_defis.append(defi)
            else:
                # Pour les défis par catégorie, vérifier si l'utilisateur a des appareils concernés
                category_ids = [assoc.idCategorie for assoc in defi.categories_associees]
                
                # Vérifier si au moins un site de l'utilisateur a des appareils de ces catégories
                has_matching_appareils = self.db.query(Appareil)\
                    .join(Site, Site.idSite == Appareil.idSite)\
                    .filter(Site.idUser == user_id)\
                    .filter(Appareil.idCategorieAppareil.in_(category_ids))\
                    .first() is not None
                
                if has_matching_appareils:
                    user_defis.append(defi)
        
        return user_defis

    def get_defis_for_site(self, site_id: int, active_only: bool = True) -> List[Défi]:
        """
        Récupère tous les défis qui concernent un site spécifique.
        Pour les défis ciblant des catégories d'appareils, vérifie que le site
        possède des appareils des catégories concernées.
        
        Args:
            site_id: ID du site
            active_only: Si True, ne retourne que les défis actifs
            
        Returns:
            Liste des défis concernant le site
        """
        from app.commun.models import Appareil  # Import nécessaire pour la relation
        
        # Récupérer tous les défis de base
        query = self.db.query(Défi)
        if active_only:
            query = query.filter(Défi.active == True)
        
        defis = query.all()
        site_defis = []
        
        for defi in defis:
            if defi.cible.lower() == "tous":
                # Si le défi cible tous les sites, on l'ajoute directement
                site_defis.append(defi)
            else:
                # Pour les défis par catégorie, vérifier si le site a des appareils concernés
                category_ids = [assoc.idCategorie for assoc in defi.categories_associees]
                
                # Vérifier si le site a des appareils de ces catégories
                has_matching_appareils = self.db.query(Appareil)\
                    .filter(Appareil.idSite == site_id)\
                    .filter(Appareil.idCategorieAppareil.in_(category_ids))\
                    .first() is not None
                
                if has_matching_appareils:
                    site_defis.append(defi)
        
        return site_defis