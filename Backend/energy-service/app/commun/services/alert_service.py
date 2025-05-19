import smtplib
from email.message import EmailMessage
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from datetime import datetime
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from apscheduler.schedulers.background import BackgroundScheduler
import atexit
from app.commun.models import User, Alertes,Défi,Appareil,Categorie_Appareil
from app.particulier.models import Site
from app.commun.database.database import SessionLocal, get_mongo_db
from bson import ObjectId
from datetime import date
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from typing import List


def get_alertes_par_user(db: Session, user_id: int):
    return db.query(Alertes).filter(Alertes.user_id == user_id).all()

def compter_alertes_non_vues(db: Session, user_id: int):
    
    try:
        count = db.query(Alertes).filter(
            Alertes.user_id == user_id,
            Alertes.vu == False  # ou Alertes.vu.is_(False)
        ).count()
        
        return {
            "user_id": user_id,
            "alertes_non_vues": count
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors du comptage des alertes: {str(e)}"
        )

def marquer_alertes_comme_vues(db: Session, user_id: int):
    
    try:
        # Récupérer toutes les alertes non vues de l'utilisateur
        alertes_non_vues = db.query(Alertes).filter(
            Alertes.user_id == user_id,
            Alertes.vu == False  # ou Alertes.vu.is_(False) selon votre version SQLAlchemy
        ).all()
        
        if not alertes_non_vues:
            return {"message": "Aucune alerte non vue trouvée pour cet utilisateur", "count": 0}
        
        # Marquer toutes les alertes comme vues
        count = 0
        for alerte in alertes_non_vues:
            alerte.vu = True
            count += 1
        
        db.commit()
        
        return {
            "message": f"Toutes les alertes ({count}) ont été marquées comme vues",
            "count": count
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la mise à jour des alertes: {str(e)}"
        )

# Configuration du mail
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

async def send_alert_budget_max_email(email: str, consommation: float, budget_max: float):
    message = MessageSchema(
        subject="Alerte de consommation d'énergie",
        recipients=[email],
        body=f"""
        Bonjour, 
        
        Vous avez dépassé votre budget maximal de ce mois. 
        Consommation actuelle : {consommation:.2f} kWh
        Budget max : {budget_max:.2f} kWh
        
        Cordialement,  
        L'équipe MyEnergyHub
        """,
        subtype="plain"
    )
    await fm.send_message(message)

async def get_mongo_consumption(collection, appareil_ids, current_year, current_month):
    try:
        # Convertir les IDs en int si nécessaire (selon votre schéma)
        appareil_ids = [int(id) for id in appareil_ids]  # ou str() selon votre schéma
        
        from datetime import timezone
        start_date = datetime(current_year, current_month, 1, tzinfo=timezone.utc)
        end_date = (datetime(current_year, current_month + 1, 1, tzinfo=timezone.utc) 
                   if current_month < 12 
                   else datetime(current_year + 1, 1, 1, tzinfo=timezone.utc))
        print(f"🔍 Recherche consommation pour appareils: {appareil_ids}")
        print(f"📅 Période: {start_date} à {end_date}")

        # Vérifier d'abord s'il existe des documents correspondants
        count = await collection.count_documents({
            
        })
        print(f"📊 Nombre de documents trouvés: {count}")

        if count == 0:
            # Debug: vérifier les données existantes
            sample = await collection.find_one({"idAppareil": {"$in": appareil_ids}})
            print(f"ℹ️ Exemple de document: {sample}")
            return 0

        pipeline = [
            {
                "$match": {
                    "idAppareil": {"$in": appareil_ids},
                    "jour": {"$gte": start_date, "$lt": end_date}
                }
            },
            {
                "$group": {
                    "_id": None,
                    "total": {"$sum": "$quantite"}
                }
            }
        ]
        
        cursor = collection.aggregate(pipeline)
        result = await cursor.to_list(length=1)
        
        print(f"🔧 Résultat agrégation: {result}")
        
        if result and len(result) > 0:
            return float(result[0]["total"])
        return 0.0
        
    except Exception as e:
        print(f"❌ Erreur dans get_mongo_consumption: {str(e)}")
        return 0.0

async def check_consumptions_async():
    print(f"🔄 Vérification des consommations... {datetime.now()}")
    
    db = SessionLocal()
    mongo_client = AsyncIOMotorClient("mongodb://localhost:27017")  # Update with your connection string
    mongo_db =get_mongo_db()  # Update with your DB name
    consommation_collection = mongo_db["consommation"]

    current_month = datetime.now().month
    current_year = datetime.now().year

    try:
        users = db.query(User).all()

        for user in users:
            if user.budget_max is None:
                continue

            existing_alert = db.query(Alertes).filter(
                Alertes.user_id == user.id,
                func.extract('month', Alertes.date_alerte) == current_month,
                func.extract('year', Alertes.date_alerte) == current_year
            ).first()
            
            if existing_alert:
                print(f"❌ Alerte déjà envoyée à {user.email} ce mois-ci.")
                continue

            user_sites = db.query(Site).filter(Site.idUser == user.id).all()
            site_ids = [site.idSite for site in user_sites]

            if not site_ids:
                continue

            appareils = db.query(Appareil).filter(Appareil.idSite.in_(site_ids)).all()
            appareil_ids = [appareil.idAppareil for appareil in appareils]

            if not appareil_ids:
                continue
            for app in appareil_ids:
                print(f"current_year : {current_year}, current_month : {current_month}, appareil_ids : {app}")


            total_consommation = await get_mongo_consumption(
                consommation_collection,
                appareil_ids,
                current_year,
                current_month
            )
            
            consommation_calculee = total_consommation * 0.2516
            print(f"Utilisateur : {user.email}, Consommation : {consommation_calculee:.2f}, Budget max : {user.budget_max:.2f}")

            if consommation_calculee > user.budget_max * 0.80:
                print(f"🚨 Envoi d'une alerte à {user.email}")
                await send_alert_budget_max_email(user.email, consommation_calculee, user.budget_max)
                new_alerte = Alertes(user_id=user.id, categorie_alert_id=1)
                db.add(new_alerte)
                db.commit()

    finally:
        db.close()
        mongo_client.close()
        print(f"✅ Vérification terminée à {datetime.now()}.")

def check_and_send_alerts():
    asyncio.run(check_consumptions_async())

# Configurer le scheduler
scheduler = BackgroundScheduler()
scheduler.add_job(check_and_send_alerts, "interval", hours=24)
scheduler.start()
atexit.register(lambda: scheduler.shutdown())

async def send_defi_alert_email(email: str, defi: Défi):
    message = MessageSchema(
        subject=f"Nouveau défi: {defi.titre}",
        recipients=[email],
        body=f"""
        Bonjour,
        
        Un nouveau défi est disponible pour vous:
        
        Titre: {defi.titre}
        Description: {defi.description}
        Condition: {defi.get_condition_description()}
        Points: {defi.points}
        
        Cordialement,
        L'équipe MyEnergyHub
        """,
        subtype="plain"
    )
    await fm.send_message(message)

def get_users_for_defi(db: Session, defi: Défi) -> List[User]:
    """Retourne la liste des utilisateurs concernés par le défi"""
    if defi.cible.lower() == "catégorie appareil":
        # Récupérer les IDs des catégories concernées
        categorie_ids = [assoc.idCategorie for assoc in defi.categories_associees]
        
        # Trouver les utilisateurs ayant des appareils de ces catégories
        users = (db.query(User)
                .join(Site, Site.idUser == User.id)
                .join(Appareil, Appareil.idSite == Site.idSite)
                .join(Categorie_Appareil, Categorie_Appareil.idCategorieAppareil == Appareil.idCategorieAppareil)
                .filter(Categorie_Appareil.idCategorieAppareil.in_(categorie_ids))
                .distinct()
                .all())
    else:
        # Pour les défis non ciblés sur des catégories, tous les utilisateurs
        users = db.query(User).all()
    
    return users

def should_send_defi_today(defi: Défi) -> bool:
    """Détermine si le défi doit être envoyé aujourd'hui selon sa récurrence"""
    today = date.today()
    
    if defi.mode_recurrence == "Saisonnier":
        # Vérifier si c'est le jour de début (peu importe l'année)
        return (today.month == defi.date_debut_base.month and 
                today.day == defi.date_debut_base.day)
    
    elif defi.mode_recurrence == "Mensuel":
        # Vérifier si c'est le jour du mois (ex: chaque 15 du mois)
        return today.day == defi.date_debut_base.day
    
    elif defi.mode_recurrence == "Journalier":
        # Envoyer tous les jours
        return True
    
    return False

async def check_and_send_defi_alerts_async():
    print(f"🔄 Vérification des défis à envoyer... {datetime.now()}")
    
    db = SessionLocal()
    
    try:
        # Récupérer tous les défis actifs
        active_defis = db.query(Défi).filter(Défi.active == True).all()
        print(f"📊 Nombre de défis actifs trouvés: {len(active_defis)}")
        
        for defi in active_defis:
            if not should_send_defi_today(defi):
                print(f"⏩ Défi '{defi.titre}' ne doit pas être envoyé aujourd'hui (mode: {defi.mode_recurrence})")
                continue
            
            # Vérifier si l'alerte a déjà été envoyée aujourd'hui
            existing_alert = db.query(Alertes).filter(
                Alertes.defi_id == defi.idDefi,
                func.date(Alertes.date_alerte) == date.today()
            ).first()
            
            if existing_alert:
                print(f"⏭ Défi '{defi.titre}' déjà envoyé aujourd'hui")
                continue
            
            # Récupérer les utilisateurs concernés
            users = get_users_for_defi(db, defi)
            print(f"\n📨 Défi '{defi.titre}' - Utilisateurs concernés ({len(users)}):")
            for user in users:
                print(f"  👤 {user.email} (ID: {user.id})")
            
            for user in users:
                try:
                    print(f"\n🚀 Préparation envoi à {user.email} pour le défi '{defi.titre}'")
                    
                    # Envoyer l'email
                    await send_defi_alert_email(user.email, defi)
                    
                    # Enregistrer l'alerte
                    new_alerte = Alertes(
                        user_id=user.id,
                        defi_id=defi.idDefi,
                        categorie_alert_id=2  # ID pour les alertes de défis
                    )
                    db.add(new_alerte)
                    db.commit()
                    
                    print(f"✅ Email envoyé à {user.email}")
                    
                except Exception as e:
                    db.rollback()
                    print(f"❌ Erreur lors de l'envoi à {user.email}: {str(e)}")
    
    finally:
        db.close()
        print(f"\n✅ Vérification des défis terminée à {datetime.now()}")

def check_and_send_defi_alerts():
    print("\n" + "="*50)
    print("🚀 Début de la vérification des défis")
    print("="*50 + "\n")
    asyncio.run(check_and_send_defi_alerts_async())

# Configurer le scheduler pour vérifier tous les jours à minuit
scheduler = BackgroundScheduler()
scheduler.add_job(
    check_and_send_defi_alerts,
    "interval",
    hours=24,
    next_run_time=datetime.now()  # Démarrer immédiatement
)
scheduler.start()
atexit.register(lambda: scheduler.shutdown())