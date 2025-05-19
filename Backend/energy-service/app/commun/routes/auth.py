from sqlalchemy import Column, String, Integer, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.commun.models.models import Base
from google.auth.transport import requests as google_requests
from pydantic import BaseModel
import jwt
import bcrypt
from datetime import datetime, timedelta
from google.oauth2 import id_token
from fastapi import APIRouter, Depends, FastAPI, HTTPException, Request
from sqlalchemy.orm import Session
from app.commun.database.database import SessionLocal
from ..models import User
import requests
import os
from dotenv import load_dotenv
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from pydantic import EmailStr
from typing import List, Optional
import secrets
from ..models import PasswordResetToken
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta
from fastapi.security import OAuth2PasswordBearer

# Charger les variables d'environnement
load_dotenv()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "https://localhost:8000/auth/callback")

FACEBOOK_APP_ID = os.getenv("FACEBOOK_APP_ID")
FACEBOOK_APP_SECRET = os.getenv("FACEBOOK_APP_SECRET")

app = FastAPI()

SECRET_KEY = "MY_SECRET_KEY"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

router = APIRouter()

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

# Modèles Pydantic
class UserLogin(BaseModel):
    email: str
    password: str

class UserCreate(BaseModel):
    email: str
    password: str
    role: str
    nom: Optional[str] = None
    prenom: Optional[str] = None
    telephone: Optional[str] = None
    adresse: Optional[str] = None

class GoogleLoginRequest(BaseModel):
    id_token: str

class FacebookLoginRequest(BaseModel):
    access_token: str

class PasswordResetRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    token: str
    new_password: str

class UserUpdate(BaseModel):
    nom: Optional[str] = None
    prenom: Optional[str] = None
    telephone: Optional[str] = None
    adresse: Optional[str] = None
    budget_max: Optional[float] = None

# Fonctions utilitaires
def create_access_token(data: dict, expires_delta: timedelta):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return {"id": user.id, "email": user.email, "role": user.role}

# ---------- Authentification classique ----------
@router.post("/auth/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()

    if not db_user:
        raise HTTPException(status_code=400, detail="Utilisateur non trouvé")

    if not bcrypt.checkpw(user.password.encode(), db_user.password.encode()):
        raise HTTPException(status_code=400, detail="Mot de passe incorrect")

    access_token = create_access_token(
        {"sub": db_user.email, "role": db_user.role, "id": db_user.id},
        timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return {
        "access_token": access_token,
        "user": {
            "id": db_user.id,
            "email": db_user.email,
            "role": db_user.role,
            "nom": db_user.nom,
            "prenom": db_user.prenom,
            "telephone": db_user.telephone,
            "adresse": db_user.adresse,
            "budget_max": db_user.budget_max
        }
    }

@router.post("/auth/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if user.role not in ["entreprise", "particulier", "collectivite"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    if existing_user:
        raise HTTPException(status_code=400, detail="Utilisateur déjà existant")

    hashed_password = bcrypt.hashpw(user.password.encode(), bcrypt.gensalt()).decode()
    new_user = User(
        email=user.email,
        password=hashed_password,
        role=user.role,
        nom=user.nom,
        prenom=user.prenom,
        telephone=user.telephone,
        adresse=user.adresse
    )
    db.add(new_user)
    db.commit()

    db.refresh(new_user)
    access_token = create_access_token(
        {"sub": new_user.email, "role": new_user.role, "id": new_user.id},
        timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return {
        "access_token": access_token,
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "role": new_user.role,
            "nom": new_user.nom,
            "prenom": new_user.prenom,
            "telephone": new_user.telephone,
            "adresse": new_user.adresse
        }
    }

# ---------- Authentification Google ----------
@router.get("/auth/google")
def google_login():
    """Retourne l'URL d'authentification de Google"""
    auth_url = (
        "https://accounts.google.com/o/oauth2/auth"
        f"?client_id={GOOGLE_CLIENT_ID}"
        "&response_type=code"
        "&scope=openid%20email%20profile"
        f"&redirect_uri={REDIRECT_URI}"
    )
    return {"auth_url": auth_url}

@router.post("/auth/google-login")
def google_login_endpoint(request: GoogleLoginRequest, db: Session = Depends(get_db)):
    """Connexion avec Google (sans création de compte)"""
    id_token_received = request.id_token

    try:
        google_user = id_token.verify_oauth2_token(id_token_received, google_requests.Request(), GOOGLE_CLIENT_ID)
        email = google_user.get("email")
        name = google_user.get("name")

        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="Compte non trouvé. Inscrivez-vous d'abord.")

        jwt_token = create_access_token(
            {"sub": user.email, "role": user.role, "id": user.id}, 
            timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        return {
            "access_token": jwt_token,
            "user": {
                "id": user.id,
                "email": user.email,
                "role": user.role,
                "nom": user.nom,
                "prenom": user.prenom,
                "telephone": user.telephone,
                "adresse": user.adresse,
                "budget_max": user.budget_max
            }
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail="ID Token invalide")

@router.post("/auth/google-signup")
def google_signup(request: GoogleLoginRequest, role: str, db: Session = Depends(get_db)):
    """Inscription avec Google (avec choix du rôle)"""
    id_token_received = request.id_token

    try:
        google_user = id_token.verify_oauth2_token(id_token_received, google_requests.Request(), GOOGLE_CLIENT_ID)
        email = google_user.get("email")
        given_name = google_user.get("given_name", "")
        family_name = google_user.get("family_name", "")

        user = db.query(User).filter(User.email == email).first()
        if user:
            raise HTTPException(status_code=400, detail="Un compte existe déjà avec cet email.")

        new_user = User(
            email=email,
            password="",
            role=role,
            prenom=given_name,
            nom=family_name
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        jwt_token = create_access_token(
            {"sub": email, "role": role, "id": new_user.id}, 
            timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        return {
            "access_token": jwt_token,
            "user": {
                "id": new_user.id,
                "email": email,
                "role": role,
                "nom": family_name,
                "prenom": given_name,
                "telephone": None,
                "adresse": None
            }
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail="ID Token invalide")

# ---------- Authentification Facebook ----------
@router.post("/auth/facebook-login")
def facebook_login(request: FacebookLoginRequest, db: Session = Depends(get_db)):
    access_token = request.access_token
    user_info_url = f"https://graph.facebook.com/me?access_token={access_token}&fields=id,name,email,first_name,last_name"
    response = requests.get(user_info_url)
    user_info = response.json()

    if "error" in user_info:
        raise HTTPException(status_code=400, detail="Invalid Facebook token")

    email = user_info.get("email")
    first_name = user_info.get("first_name", "")
    last_name = user_info.get("last_name", "")

    if not email:
        raise HTTPException(status_code=400, detail="Email not provided by Facebook")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Compte non trouvé. Inscrivez-vous d'abord.")

    jwt_token = create_access_token(
        {"sub": user.email, "role": user.role, "id": user.id},
        timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return {
        "access_token": jwt_token,
        "user": {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "nom": user.nom or last_name,
            "prenom": user.prenom or first_name,
            "telephone": user.telephone,
            "adresse": user.adresse,
            "budget_max": user.budget_max
        }
    }

@router.post("/auth/facebook-signup")
def facebook_signup(request: FacebookLoginRequest, role: str, db: Session = Depends(get_db)):
    access_token = request.access_token
    user_info_url = f"https://graph.facebook.com/me?access_token={access_token}&fields=id,name,email,first_name,last_name"
    response = requests.get(user_info_url)
    user_info = response.json()

    if "error" in user_info:
        raise HTTPException(status_code=400, detail="Token Facebook invalide")

    email = user_info.get("email")
    first_name = user_info.get("first_name", "")
    last_name = user_info.get("last_name", "")

    if not email:
        raise HTTPException(status_code=400, detail="L'email n'est pas fourni par Facebook")

    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Un compte existe déjà avec cet email.")

    new_user = User(
        email=email,
        password="",
        role=role,
        prenom=first_name,
        nom=last_name
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    jwt_token = create_access_token(
        {"sub": email, "role": role, "id": new_user.id},
        timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return {
        "access_token": jwt_token,
        "user": {
            "id": new_user.id,
            "email": email,
            "role": role,
            "nom": last_name,
            "prenom": first_name,
            "telephone": None,
            "adresse": None
        }
    }

# ---------- Gestion du profil ----------
@router.put("/auth/update-profile/{user_id}")
def update_profile(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this profile")

    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    if user_data.nom is not None:
        db_user.nom = user_data.nom
    if user_data.prenom is not None:
        db_user.prenom = user_data.prenom
    if user_data.telephone is not None:
        db_user.telephone = user_data.telephone
    if user_data.adresse is not None:
        db_user.adresse = user_data.adresse
    if user_data.budget_max is not None:
        db_user.budget_max = user_data.budget_max

    db.commit()
    db.refresh(db_user)

    return {
        "message": "Profile updated successfully",
        "user": {
            "id": db_user.id,
            "email": db_user.email,
            "role": db_user.role,
            "nom": db_user.nom,
            "prenom": db_user.prenom,
            "telephone": db_user.telephone,
            "adresse": db_user.adresse,
            "budget_max": db_user.budget_max
        }
    }

# ---------- Réinitialisation du mot de passe ----------
@router.post("/auth/request-password-reset")
async def request_password_reset(request: PasswordResetRequest, db: Session = Depends(get_db)):
    email = request.email
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Email not found")
    
    # Supprimer les anciens tokens
    db.query(PasswordResetToken).filter(PasswordResetToken.email == email).delete()
    db.commit()

    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(hours=1)
    reset_token = PasswordResetToken(email=email, token=token, expires_at=expires_at)

    db.add(reset_token)
    db.commit()

    reset_link = f"https://votre-site.com/reset-password?token={token}&email={email}"
    message = MessageSchema(
        subject="Réinitialisation de votre mot de passe",
        recipients=[email],
        body=f"""
        <p>Bonjour,</p>
        <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le lien ci-dessous :</p>
        <p><a href="{reset_link}">Réinitialiser mon mot de passe</a></p>
        <p>Ce lien expirera dans 1 heure.</p>
        <p>Si vous n'êtes pas à l'origine de cette demande, veuillez ignorer cet email.</p>
        """,
        subtype="html"
    )

    try:
        fm = FastMail(conf)
        await fm.send_message(message)
        return {"message": "Email de réinitialisation envoyé"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {e}")

@router.post("/auth/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    reset_token = db.query(PasswordResetToken).filter(
        PasswordResetToken.email == request.email,
        PasswordResetToken.token == request.token
    ).first()

    if not reset_token:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    if reset_token.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    hashed_password = bcrypt.hashpw(request.new_password.encode(), bcrypt.gensalt()).decode()
    user.password = hashed_password
    
    db.delete(reset_token)
    db.commit()

    return {"message": "Password reset successful"}