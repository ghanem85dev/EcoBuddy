from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.date import DateTrigger
import atexit
from typing import Optional
import asyncio
from app.particulier.models import Site
from app.commun.models import User,Récompense
from datetime import date, time, datetime, timedelta
from concurrent.futures import ThreadPoolExecutor
from threading import Lock
import asyncio
from app.commun.models.defi import Défi, TypeCondition
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.commun.schemas.defi import DefiCreate
from app.commun.services.defi_service import DefiService
# Ajouter ces imports en haut du fichier
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
# Configuration email (identique à votre configuration existante)
conf = ConnectionConfig(
    MAIL_USERNAME="ilefneji334@gmail.com",
    MAIL_PASSWORD="viwqeaoxfzhdxdaz",
    MAIL_FROM="ilefneji334@gmail.com",
    MAIL_PORT=587,
    MAIL_SERVER="smtp.gmail.com",
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

fm = FastMail(conf)

class DefiCompletionChecker:
    _instance = None
    _lock = Lock()
    
    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
                cls._instance.scheduler = BackgroundScheduler()
                cls._instance.scheduler.start()
                cls._instance.executor = ThreadPoolExecutor(max_workers=4)
                atexit.register(cls._instance.shutdown)
        return cls._instance
    
    def shutdown(self):
        self.scheduler.shutdown(wait=False)
        self.executor.shutdown(wait=False)
    
    
    def schedule_defi_check(self, defi: Défi, db: Session):
        """Planifie la vérification automatique d'un défi"""
        today = date.today()
    
        if not defi.date_debut_base:
            raise ValueError("La date de début de base est requise")
        
        try:
            if defi.mode_recurrence == "Saisonnier":
                date_debut = date(today.year, defi.date_debut_base.month, defi.date_debut_base.day)
            elif defi.mode_recurrence == "Mensuel":
                # Gestion du cas où le jour n'existe pas dans le mois courant (ex: 31 février)
                try:
                    date_debut = date(today.year, today.month, defi.date_debut_base.day)
                except ValueError:
                    # Si le jour n'existe pas, prendre le dernier jour du mois
                    last_day = (date(today.year, today.month + 1, 1) - timedelta(days=1)).day
                    date_debut = date(today.year, today.month, min(defi.date_debut_base.day, last_day))
            elif defi.mode_recurrence == "Journalier":
                date_debut = today
            else:
                date_debut = defi.date_debut_base
            
            end_date = date_debut + timedelta(days=defi.duree_jours)
        except Exception as e:
            raise ValueError(f"Erreur dans le calcul des dates: {str(e)}")
        # if datetime.now().date() >= end_date:
        #     print(f"\n🚀 Le défi est déjà terminé")
        #     return  # Le défi est déjà terminé
            
        trigger_time = datetime.combine(end_date, time(23, 51))  # 8h du matin
        
        self.scheduler.add_job(
            self._execute_defi_check,
            trigger=DateTrigger(run_date=trigger_time),
            args=[defi.idDefi, db],
            id=f"defi_check_{defi.idDefi}",
            replace_existing=True
        )
        print(f"⏰ Vérification du défi {defi.idDefi} planifiée pour {trigger_time}")
    def _parse_time(self, time_str: Optional[str]) -> Optional[time]:
        """Convertit une string en objet time"""
        if not time_str:
            return None
        if ':' in time_str:
            return time.fromisoformat(time_str)
        return time(int(time_str[:2]), int(time_str[2:4]))
    def create_defi(self, defi_data: DefiCreate, db: Session) -> Défi:
        """Crée un nouveau défi et planifie sa vérification"""
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
            
            db.add(nouveau_defi)
            db.commit()
            db.refresh(nouveau_defi)
            
            if defi_data.categories:
                self._associate_categories(nouveau_defi.idDefi, defi_data.categories, db)
            
            # Planifier la vérification automatique
            self.schedule_defi_check(nouveau_defi, db)
            
            return nouveau_defi
            
        except Exception as e:
            db.rollback()
            raise ValueError(f"Erreur lors de la création du défi: {str(e)}")
    
    def _execute_defi_check(self, defi_id: int, db: Session):
        """Exécute la vérification du défi"""
        try:
            defi = db.query(Défi).get(defi_id)
            if not defi:
                print(f"❌ Défi {defi_id} introuvable")
                return
            
            print(f"🔍 Début vérification du défi {defi_id} ({defi.titre})")
            
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            # Utiliser DefiService pour la vérification
            defi_service = DefiService(db)
            results = loop.run_until_complete(
                defi_service.get_defi_results(defi_id))
            print(f"results : {results}")
            
            # Traiter les résultats
            for site_id, (success, challenge_cons, comparison_cons) in results.items():
                print(f"site : {site_id}")
                self.executor.submit(
                    self._process_site_result,
                    db, site_id, defi, success, challenge_cons, comparison_cons
                )
            print(f"done execute ")
                
        except Exception as e:
            print(f"❌ Erreur vérification défi {defi_id}: {str(e)}")
        # finally:
        #     db.close()
    
    def _process_site_result(self, db: Session, site_id: int, defi: Défi, 
                           success: bool, challenge_cons: float, comparison_cons: float):
        """Traite le résultat pour un site"""
        from app.particulier.models import Site
        from app.commun.database.database import SessionLocal
        from app.commun.models import Badge, BadgeHistorique
        from app.commun.services.recompense_service import RecompenseService
        from datetime import date
        print(f" debut")
        db = SessionLocal()
        
        try:
            site = db.query(Site).get(site_id)
            if not site:
                return
            print(f" middle")
            user = db.query(User).filter(User.id == site.idUser).first()
            if not user:
                print(f"❌ Aucun utilisateur trouvé pour le site {site_id}")
                return
            if success:
                print(f" Success")
                self._reward_site(db, site, defi)
                recompense_service = RecompenseService(db)
                total_points = recompense_service.get_total_points_user(user.id)["total"]
                
                print(f"Points totaux de l'utilisateur {user.id}: {total_points}")
                
                # Trouver le badge le plus élevé que l'utilisateur n'a pas encore obtenu
                nouveau_badge = (db.query(Badge)
                            .filter(Badge.minPoints <= total_points)
                            .order_by(Badge.minPoints.desc())
                            .first())
                
                if nouveau_badge:
                    print(f"Badge potentiel trouvé: {nouveau_badge.titre} (minPoints: {nouveau_badge.minPoints})")
                    
                    # Vérifier si l'utilisateur a déjà ce badge
                    badge_existe = (db.query(BadgeHistorique)
                                .filter(
                                    BadgeHistorique.idUser == user.id,
                                    BadgeHistorique.idBadge == nouveau_badge.idBadge)
                                .first() is not None)
                    
                    if not badge_existe:
                        print(f"🎉 Nouveau badge débloqué: {nouveau_badge.titre}")
                        
                        # Créer l'historique du badge
                        historique = BadgeHistorique(
                            idUser=user.id,
                            idBadge=nouveau_badge.idBadge,
                            date=date.today()
                        )
                        
                        db.add(historique)
                        db.commit()
                        print(f"Historique de badge créé pour l'utilisateur {user.id}")
                        
                        # TODO: Ajouter une notification pour le nouveau badge
                        # self._send_badge_notification(user, nouveau_badge)
                self._send_success_notification(user, defi, site,challenge_cons, comparison_cons)
            else:
                self._send_failure_notification(user, defi, site, challenge_cons, comparison_cons)
                
        except Exception as e:
            print(f"❌ Erreur traitement du site {site_id}: {str(e)}")
        finally:
            db.close()

    
    def _reward_site(self, db: Session, site: Site, defi: Défi):
        """Récompense l'utilisateur en créant une nouvelle récompense"""
        # Crée une nouvelle récompense
        nouvelle_recompense = Récompense(
            date=date.today(),
            idSite=site.idSite,
            idDefi=defi.idDefi if defi else None
        )
        
        # Ajoute la récompense à la base de données
        db.add(nouvelle_recompense)
        db.commit()
        
        print(f"🎉 Site {site.idSite} a reçu une nouvelle récompense (Défi: {defi.idDefi if defi else 'None'})")

    
    def _send_success_notification(self, user: User, defi: Défi, site :Site,challenge_cons: float, comparison_cons: float):
        """Envoie une notification de réussite"""
        message = f"""
        Félicitations {user.nom} !
        
        Votre site {site.nom} a réussi le défi "{defi.titre}" et gagné {defi.points} points.
        
        Détails:
        - Consommation pendant le défi: {challenge_cons:.2f} kWh
        - Consommation de référence: {comparison_cons:.2f} kWh
        - Réduction: {((comparison_cons - challenge_cons)/comparison_cons*100 if comparison_cons > 0 else 0):.1f}%
        
        Continuez ainsi !
        """
        asyncio.run(self._send_email(user.email, f"Défi réussi: {defi.titre}", message))
    
    def _send_failure_notification(self, user: User, defi: Défi, site:Site ,challenge_cons: float, comparison_cons: float):
        """Envoie une notification d'échec"""
        message = f"""
        Bonjour {user.nom},
        
        Votre site {site.nom} n'a pas rempli les conditions du défi "{defi.titre}".
        
        Détails:
        - Consommation pendant le défi: {challenge_cons:.2f} kWh
        - Consommation de référence: {comparison_cons:.2f} kWh
        - Réduction: {((comparison_cons - challenge_cons)/comparison_cons*100 if comparison_cons > 0 else 0):.1f}%
        
        Ne vous découragez pas, de nouveaux défis vous attendent !
        """
        asyncio.run(self._send_email(user.email, f"Résultat du défi: {defi.titre}", message))
    
    async def _send_email(self, email: str, subject: str, body: str):
        """Envoie un email"""
        try:
            message = MessageSchema(
                subject=subject,
                recipients=[email],
                body=body,
                subtype="plain"
            )
            await fm.send_message(message)
        except Exception as e:
            print(f"❌ Erreur envoi email à {email}: {str(e)}")

# Initialisation globale du vérificateur
defi_checker = DefiCompletionChecker()


# Ajouter cette méthode pour planifier les défis existants au démarrage
def schedule_existing_defis(db: Session):
    """Planifie la vérification des défis existants"""
    try:
        defis = db.query(Défi).filter(Défi.active == True).all()
        for defi in defis:
            defi_checker.schedule_defi_check(defi, db)
        print(f"🔔 {len(defis)} défis planifiés pour vérification")
    except Exception as e:
        print(f"❌ Erreur planification défis existants: {str(e)}")