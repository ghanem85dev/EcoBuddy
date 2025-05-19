from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from pydantic import BaseModel, EmailStr
from typing import List
from datetime import datetime
from enum import Enum
from ..services.invitation_service import InvitationService
from ..models import Invitation
from app.particulier.models import Site, UserSite
from app.commun.models import User
from app.commun.database.database import SessionLocal

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

router = APIRouter()

class InvitationStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"

class InvitationOut(BaseModel):
    id: int
    email: str
    site_id: int
    status: str
    created_at: datetime
    site_name: str
    owner_email: str
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class InviteRequest(BaseModel):
    email: EmailStr
    site_id: int
    owner_id: int

class InvitationResponse(BaseModel):
    action: str  # "accept" or "reject"

@router.get("/api/invitations/received/{user_id}", response_model=List[InvitationOut])
def get_received_invitations(
    user_id: int, 
    db: Session = Depends(get_db)
):
    try:
        service = InvitationService(db)
        return service.get_invitations_received_by_user(user_id)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=400, 
            detail=f"Error processing request: {str(e)}"
        )

@router.post("/api/invite")
async def invite_user(
    request: InviteRequest, 
    db: Session = Depends(get_db)
):
    service = InvitationService(db)
    token = service.invite_user(request.email, request.site_id, request.owner_id)
    
    # Send email
    await send_invite_email(request.email, token)
    
    return {"message": "Invitation envoyée avec succès"}

@router.get("/api/invitations/respond/{token}")
def respond_to_invitation_via_get(
    token: str,
    action: str = Query(..., regex="^(accept|reject)$"),
    db: Session = Depends(get_db)
):
    # Trouver l'invitation par token
    invite = db.query(Invitation).filter(
        Invitation.token == token,
        Invitation.status == InvitationStatus.PENDING.value
    ).first()
    
    if not invite:
        raise HTTPException(status_code=404, detail="Invitation non valide ou déjà traitée")

    # Trouver l'utilisateur par email
    user = db.query(User).filter(User.email == invite.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

    # Créer un objet InvitationResponse
    response = InvitationResponse(action=action)
    
    # Utiliser le service existant
    service = InvitationService(db)
    return service.respond_to_invitation(invite.id, user.id, response)

@router.post("/api/invitations/{invitation_id}/respond/{user_id}")
def respond_to_invitation(
    invitation_id: int,
    user_id: int,
    response: InvitationResponse,
    db: Session = Depends(get_db)
):
    service = InvitationService(db)
    try:
        result = service.respond_to_invitation(invitation_id, user_id, response)
        return result
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/api/invitations/sent/{owner_id}", response_model=List[InvitationOut])
def get_sent_invitations(
    owner_id: int, 
    db: Session = Depends(get_db)
):
    service = InvitationService(db)
    try:
        invitations = service.get_invitations_sent_by_user(owner_id)
        return invitations
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Email configuration and sending function
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
    accept_link = f"http://localhost:8000/api/invitations/respond/{token}?action=accept"
    reject_link = f"http://localhost:8000/api/invitations/respond/{token}?action=reject"
    
    message = MessageSchema(
        subject="Invitation à MyEnergyHub",
        recipients=[email],
        body=f"""
        Bonjour, 
        
        Vous avez été invité(e) à gérer la consommation énergétique sur MyEnergyHub.
        
        Options:
        - Accepter l'invitation: {accept_link}
        - Refuser l'invitation: {reject_link}
        
        Cordialement,  
        L'équipe MyEnergyHub
        """,
        subtype="plain"
    )

    fm = FastMail(conf)
    await fm.send_message(message)