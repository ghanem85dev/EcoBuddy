

from google.auth.transport import requests as google_requests

from pydantic import BaseModel
import jwt
import bcrypt
from datetime import datetime, timedelta


from google.oauth2 import id_token
from fastapi import APIRouter, Depends, FastAPI, HTTPException



from sqlalchemy.orm import Session

from app.database.database import SessionLocal
from app.models import User

import requests
import os
from dotenv import load_dotenv




# Charger les variables d'environnement
load_dotenv()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = "http://localhost:8000/auth/callback"
app = FastAPI()

SECRET_KEY = "MY_SECRET_KEY"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60




router = APIRouter()
class UserLogin(BaseModel):
    email: str
    password: str

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

@router.post("/auth/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    
    if not db_user:
        raise HTTPException(status_code=400, detail="Utilisateur non trouvé")
    
    if not bcrypt.checkpw(user.password.encode(), db_user.password.encode()):
        raise HTTPException(status_code=400, detail="Mot de passe incorrect")
    
    access_token = create_access_token(
        {"sub": db_user.email, "role": db_user.role},
        timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return {"access_token": access_token, "role": db_user.role}




class UserCreate(BaseModel):
    email: str
    password: str
    role: str

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/auth/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Utilisateur déjà existant")

    hashed_password = bcrypt.hashpw(user.password.encode(), bcrypt.gensalt()).decode()
    new_user = User(email=user.email, password=hashed_password, role=user.role)
   
    db.add(new_user)
    db.commit()
   
    return {"message": "Inscription réussie"}


@router.post("/auth/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    
    if not db_user:
        raise HTTPException(status_code=400, detail="Utilisateur non trouvé")
    
    if not bcrypt.checkpw(user.password.encode(), db_user.password.encode()):
        raise HTTPException(status_code=400, detail="Mot de passe incorrect")

    access_token = create_access_token(
        {"sub": db_user.email, "role": db_user.role},
        timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return {"access_token": access_token, "role": db_user.role}



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
def google_login(request: GoogleLoginRequest, db: Session = Depends(get_db)):
    """Connexion avec Google (sans création de compte)"""
    id_token_received = request.id_token
    print(f"Token reçu: {id_token_received}")

    try:
        google_user = id_token.verify_oauth2_token(id_token_received, google_requests.Request(), GOOGLE_CLIENT_ID)
        email = google_user.get("email")
        name = google_user.get("name")
        print(f"Utilisateur Google: {email}, {name}")

        # Vérifier si l'utilisateur existe
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="Compte non trouvé. Inscrivez-vous d'abord.")

        # Générer un JWT
        jwt_token = create_access_token({"sub": email, "role": user.role}, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
        return {"access_token": jwt_token, "email": email, "name": name, "role": user.role}

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

        # Vérifier si l'utilisateur existe déjà
        user = db.query(User).filter(User.email == email).first()
        if user:
            raise HTTPException(status_code=400, detail="Un compte existe déjà avec cet email.")

        # Créer un nouvel utilisateur avec le rôle spécifié
        new_user = User(email=email, password="", role=role)
        db.add(new_user)
        db.commit()

        # Générer un JWT
        jwt_token = create_access_token({"sub": email, "role": role}, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
        return {"access_token": jwt_token, "email": email, "name": name, "role": role}

    except ValueError as e:
        print(f"Erreur de validation du token: {e}")
        raise HTTPException(status_code=400, detail="ID Token invalide")

