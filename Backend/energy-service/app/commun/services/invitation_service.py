from sqlalchemy.orm import Session
from fastapi_mail import FastMail, MessageSchema
import secrets
from app.particulier.models import Site, UserSite
from app.commun.models import User
from ..models import Invitation
from fastapi import HTTPException
from pydantic import EmailStr
from typing import List
from pydantic import BaseModel
from datetime import datetime
from enum import Enum

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

class InvitationResponse(BaseModel):
    action: str  # "accept" or "reject"

class InvitationService:  
    def __init__(self, db: Session):
        self.db = db
    
    def get_invitations_sent_by_user(self, owner_id: int) -> List[InvitationOut]:
        """Get all invitations sent by a specific user with site names and owner email"""
        try:
            # Get the owner's email first
            owner = self.db.query(User).filter(User.id == owner_id).first()
            if not owner:
                raise HTTPException(status_code=404, detail="Owner not found")

            # Query invitations with site information
            invitations = (
                self.db.query(
                    Invitation,
                    Site.nom,
                    User.email
                )
                .join(Site, Invitation.site_id == Site.idSite)
                .join(User, Site.idUser == User.id)
                .filter(Site.idUser == owner_id)
                .all()
            )

            result = []
            for invite, site_name, site_owner_email in invitations:
                result.append(InvitationOut(
                    id=invite.id,
                    email=invite.email,
                    site_id=invite.site_id,
                    status=invite.status,
                    created_at=invite.created_at,
                    site_name=site_name,
                    owner_email=site_owner_email
                ))

            return result

        except Exception as e:
            raise HTTPException(
                status_code=400, 
                detail=f"Error fetching sent invitations: {str(e)}"
            )

    def get_invitations_received_by_user(self, user_id: int) -> List[InvitationOut]:
        try:
            # Récupérer l'utilisateur
            user = self.db.query(User).get(user_id)
            if not user:
                raise HTTPException(status_code=404, detail=f"User {user_id} not found")

            # Requête optimisée avec jointures
            invitations = (
                self.db.query(
                    Invitation.id,
                    Invitation.email,
                    Invitation.site_id,
                    Invitation.status,
                    Invitation.created_at,
                    Site.nom.label("site_name"),
                    User.email.label("owner_email")
                )
                .join(Site, Invitation.site_id == Site.idSite)
                .join(User, Site.idUser == User.id)
                .filter(
                    Invitation.email == user.email,
                    Invitation.status == "pending"
                )
                .all()
            )

            # Construction du résultat
            return [
                InvitationOut(
                    id=invite.id,
                    email=invite.email,
                    site_id=invite.site_id,
                    status=invite.status,
                    created_at=invite.created_at,
                    site_name=invite.site_name,
                    owner_email=invite.owner_email
                )
                for invite in invitations
            ]

        except Exception as e:
            print(f"Error: {str(e)}")  # Log pour débogage
            raise HTTPException(status_code=400, detail="Failed to fetch invitations")

    def invite_user(self, email: EmailStr, site_id: int, owner_id: int) -> str:
        """Invite a user to a site and return the token"""
        site = self.db.query(Site).filter(Site.idSite == site_id).first()
        if not site:
            raise HTTPException(status_code=404, detail="Site non trouvé")
        
        if site.idUser != owner_id:
            raise HTTPException(status_code=403, detail="Utilisateur non proprietaire")
        
        user = self.db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
        
        owner_user = self.db.query(User).filter(User.id == owner_id).first()
        if not owner_user:
            raise HTTPException(status_code=404, detail="Utilisateur propriétaire non trouvé")

        if user.role != owner_user.role:
            raise HTTPException(status_code=400, detail="Les rôles des utilisateurs ne correspondent pas")
        
        user_site = self.db.query(UserSite).filter(
            UserSite.user_id == user.id, 
            UserSite.site_id == site_id
        ).first()
        if user_site:
            raise HTTPException(status_code=400, detail="L'utilisateur est déjà membre de cette résidence")

        token = secrets.token_hex(16)
        invitation = Invitation(
            email=email, 
            site_id=site_id, 
            token=token, 
            status=InvitationStatus.PENDING.value,
        )
        self.db.add(invitation)
        self.db.commit()
        
        return token
    
    def respond_to_invitation(self, invitation_id: int, user_id: int, response: InvitationResponse) -> dict:
        """Respond to an invitation (accept or reject)"""
        # Get the user
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get the invitation
        invite = self.db.query(Invitation).filter(
            Invitation.id == invitation_id,
            Invitation.email == user.email,
            Invitation.status == InvitationStatus.PENDING.value
        ).first()
        
        if not invite:
            raise HTTPException(status_code=404, detail="Invitation non valide ou déjà traitée")

        if response.action == "accept":
            return self._accept_invitation(invite, user)
        elif response.action == "reject":
            return self._reject_invitation(invite)
        else:
            raise HTTPException(status_code=400, detail="Action invalide")

    def _accept_invitation(self, invite: Invitation, user: User) -> dict:
        """Handle invitation acceptance"""
        invite.status = InvitationStatus.ACCEPTED.value
        
        # Add user to site
        if user.role == "particulier":
            user_site = UserSite(
                user_id=user.id, 
                site_id=invite.site_id, 
                role="viewer"
            )
            self.db.add(user_site)
        else:
            db_site = self.db.query(Site).filter(Site.idSite == invite.site_id).first()
            if not db_site:
                raise HTTPException(status_code=404, detail="Site not found")
            db_site.idResponsable = user.id
        
        self.db.commit()
        return {"message": "Invitation acceptée et utilisateur ajouté au site !"}

    def _reject_invitation(self, invite: Invitation) -> dict:
        """Handle invitation rejection"""
        invite.status = InvitationStatus.REJECTED.value
        self.db.commit()
        return {"message": "Invitation refusée avec succès"}