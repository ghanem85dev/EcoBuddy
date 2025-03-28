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
from typing import List
import secrets
from ..models import PasswordResetToken
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta
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


# ---------- Authentification classique ----------

class UserLogin(BaseModel):
    email: str
    password: str


@router.post("/auth/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()

    if not db_user:
        raise HTTPException(status_code=400, detail="Utilisateur non trouvé")

    if not bcrypt.checkpw(user.password.encode(), db_user.password.encode()):
        raise HTTPException(status_code=400, detail="Mot de passe incorrect")

    access_token = create_access_token(
        {"sub": db_user.email, "role": db_user.role,"id":db_user.id},
        timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return {"access_token": access_token, "role": db_user.role, "id":db_user.id}


class UserCreate(BaseModel):
    email: str
    password: str
    role: str


@router.post("/auth/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if user.role not in ["entreprise", "particulier","collectivite"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    if existing_user:
        raise HTTPException(status_code=400, detail="Utilisateur déjà existant")

    hashed_password = bcrypt.hashpw(user.password.encode(), bcrypt.gensalt()).decode()
    new_user = User(email=user.email, password=hashed_password, role=user.role)
    db.add(new_user)
    db.commit()

    return {"message": "Inscription réussie"}


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


class GoogleLoginRequest(BaseModel):
    id_token: str


@router.post("/auth/google-login")
def google_login_endpoint(request: GoogleLoginRequest, db: Session = Depends(get_db)):
    """Connexion avec Google (sans création de compte)"""
    id_token_received = request.id_token
    print(f"Token reçu: {id_token_received}")

    try:
        google_user = id_token.verify_oauth2_token(id_token_received, google_requests.Request(), GOOGLE_CLIENT_ID)
        email = google_user.get("email")
        name = google_user.get("name")
        print(f"Utilisateur Google: {email}, {name}")

        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="Compte non trouvé. Inscrivez-vous d'abord.")

        jwt_token = create_access_token({"sub": email, "role": user.role,"id":user.id}, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
        return {"access_token": jwt_token, "email": email, "name": name, "role": user.role, "id":user.id}

    except ValueError as e:
        print(f"Erreur de validation du token: {e}")
        raise HTTPException(status_code=400, detail="ID Token invalide")


@router.post("/auth/google-signup")
def google_signup(request: GoogleLoginRequest, role: str, db: Session = Depends(get_db)):
    """Inscription avec Google (avec choix du rôle)"""
    id_token_received = request.id_token
    print(f"Token reçu: {id_token_received}")

    try:
        google_user = id_token.verify_oauth2_token(id_token_received, google_requests.Request(), GOOGLE_CLIENT_ID)
        email = google_user.get("email")
        name = google_user.get("name")
        print(f"Utilisateur Google: {email}, {name}, Rôle: {role}")

        user = db.query(User).filter(User.email == email).first()
        if user:
            raise HTTPException(status_code=400, detail="Un compte existe déjà avec cet email.")

        new_user = User(email=email, password="", role=role)
        db.add(new_user)
        db.commit()
        userDB = db.query(User).filter(User.email == email).first()
        jwt_token = create_access_token({"sub": email, "role": role}, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
        return {"access_token": jwt_token, "email": email, "name": name, "role": role, "id":userDB.id}

    except ValueError as e:
        print(f"Erreur de validation du token: {e}")
        raise HTTPException(status_code=400, detail="ID Token invalide")


# ---------- Authentification Facebook ----------

class FacebookLoginRequest(BaseModel):
    access_token: str


@router.post("/auth/facebook-login")
def facebook_login(request: FacebookLoginRequest, db: Session = Depends(get_db)):
    access_token = request.access_token
    user_info_url = f"https://graph.facebook.com/me?access_token={access_token}&fields=id,name,email"
    response = requests.get(user_info_url)
    user_info = response.json()

    if "error" in user_info:
        raise HTTPException(status_code=400, detail="Invalid Facebook token")

    email = user_info.get("email")
    name = user_info.get("name")

    if not email:
        raise HTTPException(status_code=400, detail="Email not provided by Facebook")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Compte non trouvé. Inscrivez-vous d'abord.")

    jwt_token = create_access_token(
        {"sub": user.email, "role": user.role},
        timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return {"access_token": jwt_token, "email": email, "name": name, "role": user.role, "id":user.id}


class FacebookSignupRequest(BaseModel):
    access_token: str


@router.post("/auth/facebook-signup")
def facebook_signup(request: FacebookSignupRequest, role: str, db: Session = Depends(get_db)):
    """
    Inscription avec Facebook (avec choix du rôle).
    """
    access_token = request.access_token
    user_info_url = f"https://graph.facebook.com/me?access_token={access_token}&fields=id,name,email"
    response = requests.get(user_info_url)
    user_info = response.json()

    if "error" in user_info:
        raise HTTPException(status_code=400, detail="Token Facebook invalide")

    email = user_info.get("email")
    name = user_info.get("name")

    if not email:
        raise HTTPException(status_code=400, detail="L'email n'est pas fourni par Facebook")

    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Un compte existe déjà avec cet email.")

    new_user = User(email=email, password="", role=role)
    db.add(new_user)
    db.commit()
    user=db.query(User).filter(User.email == email).first()
    jwt_token = create_access_token({"sub": email, "role": role}, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    return {"access_token": jwt_token, "email": email, "name": name, "role": role, "id":user.id}


class PasswordResetRequest(BaseModel):
    email: str
import logging

logger = logging.getLogger("fastapi")

@router.post("/auth/request-password-reset")
async def request_password_reset(request: PasswordResetRequest, db: Session = Depends(get_db)):
    email = request.email
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Email not found")
    request = db.query(PasswordResetToken).filter(PasswordResetToken.email == request.email).first()
    if request:
        db.delete(request)
        db.commit()
    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(hours=1)
    reset_token = PasswordResetToken(email=email, token=token, expires_at=expires_at)

    db.add(reset_token)
    db.commit()

    message = MessageSchema(
        subject="Password Reset Request",
        recipients=[email],
        body=f"Use this token to reset your password: {token}",
        subtype="plain"
    )

    try:
        fm = FastMail(conf)
        await fm.send_message(message)
        logger.info("Password reset email sent")
        return {"message": "Password reset email sent"}
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to send email: {e}")
class ResetPasswordRequest(BaseModel):
    email: EmailStr
    token: str
    new_password: str

@router.post("/auth/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    logger.info(f"Received reset password request for email: {request.email}, token: {request.token}")
    
    reset_token = db.query(PasswordResetToken).filter(PasswordResetToken.email == request.email, PasswordResetToken.token == request.token).first()
    if not reset_token:
        logger.error("Invalid token or email")
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    if reset_token.expires_at < datetime.utcnow():
        logger.error("Token has expired")
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        logger.error("User not found")
        raise HTTPException(status_code=404, detail="User not found")

    hashed_password = bcrypt.hashpw(request.new_password.encode(), bcrypt.gensalt()).decode()
    user.password = hashed_password
    
    db.commit()

    # Delete the used reset token
    db.delete(reset_token)
    db.commit()

    logger.info("Password reset successful")
    return {"message": "Password reset successful"}
