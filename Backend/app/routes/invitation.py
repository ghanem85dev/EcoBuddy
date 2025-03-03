from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi_mail import FastMail, MessageSchema,ConnectionConfig
import secrets
from ..models import Invitation, Site
from app.database.database import SessionLocal
from pydantic import BaseModel
from pydantic import EmailStr
from sqlalchemy.orm import Session
from app.models import UserSite, User  # Assurez-vous d'importer le modèle User et UserSite
from fastapi import HTTPException, Depends
from ..models import Invitation
router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        
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
async def send_invite_email(email: str, token: str):
    invite_link = f"http://localhost:8000/accept-invite/{token}"
    
    message = MessageSchema(
        subject="Invitation à MyEnergyHub",
        recipients=[email],
        body=f"""
        Bonjour, 
        
        Vous avez été invité(e) à gérer la consommation énergétique sur MyEnergyHub.
        Cliquez sur le lien suivant pour accepter l'invitation :
        {invite_link}
        
        Cordialement,  
        L'équipe MyEnergyHub
        """,
        subtype="plain"
    )

    fm = FastMail(conf)
    await fm.send_message(message)

class InviteRequest(BaseModel):
    email: EmailStr
    site_id: int
    owner_id: int


router = APIRouter()

@router.post("/api/invite")
async def invite_user(request: InviteRequest, db: Session = Depends(get_db)):
    email = request.email
    site_id = request.site_id
    owner_id = request.owner_id
    print(f"Requête reçue: email={request.email}, site_id={request.site_id}")
    # Vérifier si le site existe
    site = db.query(Site).filter(Site.idSite == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site non trouvé")
    print(f"Requête reçue: email={request.email}, site_id={request.site_id}")
    # Vérifier si l'utilisateur existe dans la base de données
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    print(f"Requête reçue: email={request.email}, site_id={request.site_id}")
    # Vérifier si l'utilisateur est déjà membre du site
    user_site = db.query(UserSite).filter(UserSite.user_id == user.id, UserSite.site_id == site_id).first()
    if user_site:
        raise HTTPException(status_code=400, detail="L'utilisateur est déjà membre de cette résidence")

    # Générer un token et créer l'invitation
    token = secrets.token_hex(16)
    invitation = Invitation(email=email, site_id=site_id, token=token, status="pending", owner_id=owner_id)  # owner_id mis à None
    db.add(invitation)
    db.commit()

    # Envoyer l'invitation par email
    await send_invite_email(email, token)

    return {"message": "Invitation envoyée avec succès"}

@router.get("/accept-invite/{token}")
def accept_invite(token: str, db: Session = Depends(get_db)):
    # Récupérer l'invitation en fonction du token
    invite = db.query(Invitation).filter(Invitation.token == token).first()
    if not invite or invite.status != "pending":
        raise HTTPException(status_code=404, detail="Invitation non valide")

    # Mettre à jour le statut de l'invitation
    invite.status = "accepted"
    db.commit()

    # Récupérer l'utilisateur associé à l'email de l'invitation
    user = db.query(User).filter(User.email == invite.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Veuillez creer compte !")

    # Ajouter l'utilisateur à la table UserSite avec le rôle "viewer"
    user_site = UserSite(user_id=user.id, site_id=invite.site_id, role="viewer")
    db.add(user_site)
    db.commit()

    return {"message": "Invitation acceptée et utilisateur ajouté au site !"}