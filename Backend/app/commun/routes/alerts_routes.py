import smtplib
from email.message import EmailMessage
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from datetime import datetime
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from apscheduler.schedulers.background import BackgroundScheduler
import atexit
from app.commun.models import User, Consommation,Alertes
from app.commun.database.database import SessionLocal  # Vérifie que ton fichier database.py contient SessionLocal

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

# ✅ Fonction asynchrone pour envoyer un e-mail d'alerte
async def send_alert_email(email: str, consommation: float, budget_max: float):
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

# ✅ Fonction pour vérifier la consommation et envoyer les alertes
def check_and_send_alerts():
    print(f"🔄 Vérification des consommations... {datetime.now()}")  # Ajout de la date pour vérifier la fréquence

    db: Session = SessionLocal()
    current_month = datetime.now().month
    current_year = datetime.now().year

    users = db.query(User).all()

    for user in users:
        if user.budget_max is None:
            continue  # Ignorer les utilisateurs sans budget défini
        existing_alert = db.query(Alertes).filter(
            Alertes.user_id == user.id,
            func.extract('month', Alertes.date_alerte) == current_month,
            func.extract('year', Alertes.date_alerte) == current_year
            ).first()
        if existing_alert:
            print(f"❌ Alerte déjà envoyée à {user.email} ce mois-ci.")
            continue  # Ne pas envoyer l'alerte si elle a déjà été envoyée ce mois-ci

        total_consommation = (
            db.query(func.sum(Consommation.quantite))
            .filter(func.extract('month', Consommation.jour) == current_month,
                    func.extract('year', Consommation.jour) == current_year)
            .scalar() or 0
        )

        consommation_calculee = total_consommation * 0.2516

        print(f"Utilisateur : {user.email}, Consommation : {consommation_calculee:.2f}, Budget max : {user.budget_max:.2f}")

        # Calcul de 80% du budget max
        budget_80_percent = user.budget_max * 0.80

        if consommation_calculee > budget_80_percent:
            print(f"🚨 Envoi d'une alerte à {user.email}")
            import asyncio
            asyncio.run(send_alert_email(user.email, consommation_calculee, user.budget_max))
            new_alerte = Alertes(user_id=user.id, categorie_alert_id=1)
            db.add(new_alerte)
            db.commit()

    db.close()
    print(f"✅ Vérification terminée à {datetime.now()}.")

# ✅ Configurer le scheduler pour exécuter la tâche tous les jours
scheduler = BackgroundScheduler()
scheduler.add_job(check_and_send_alerts, "interval", hours=24)  # Exécution toutes les 24 heures
scheduler.start()

# ✅ Arrêter le scheduler proprement lors de l'arrêt de l'application
atexit.register(lambda: scheduler.shutdown())