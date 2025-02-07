from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel
import jwt
import bcrypt
from datetime import datetime, timedelta


from fastapi import APIRouter
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

# Base de données simulée (à remplacer par PostgreSQL)
users_db = {
    "user1@example.com": {
        "password": bcrypt.hashpw(b"password123", bcrypt.gensalt()).decode(),
        "role": "particulier"
    },
    "admin@entreprise.com": {
        "password": bcrypt.hashpw(b"adminpass", bcrypt.gensalt()).decode(),
        "role": "professionnel"
    },
    "collectivite@hub.com": {
        "password": bcrypt.hashpw(b"collectifpass", bcrypt.gensalt()).decode(),
        "role": "collectivite"
    }
}

router = APIRouter()
class UserLogin(BaseModel):
    email: str
    password: str

def create_access_token(data: dict, expires_delta: timedelta):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# @app.post("/auth/login")
# def login(user: UserLogin):
#     if user.email not in users_db:
#         raise HTTPException(status_code=400, detail="Utilisateur non trouvé")
   
#     stored_password = users_db[user.email]["password"]
#     if not bcrypt.checkpw(user.password.encode(), stored_password.encode()):
#         raise HTTPException(status_code=400, detail="Mot de passe incorrect")

#     role = users_db[user.email]["role"]
#     access_token = create_access_token({"sub": user.email, "role": role}, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
#     return {"access_token": access_token, "role": role}

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

@router.post("/auth/callback")
def google_callback(code: str, db: Session = Depends(get_db)):
    """Gère la redirection et récupère le token d'accès"""
    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": REDIRECT_URI,
    }
    response = requests.post(token_url, data=data)
    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="Erreur d'authentification Google")

    tokens = response.json()
    access_token = tokens.get("access_token")

    # Récupération des informations utilisateur
    userinfo_url = "https://www.googleapis.com/oauth2/v2/userinfo"
    headers = {"Authorization": f"Bearer {access_token}"}
    user_info_response = requests.get(userinfo_url, headers=headers)

    if user_info_response.status_code != 200:
        raise HTTPException(status_code=400, detail="Impossible de récupérer les infos utilisateur")

    user_info = user_info_response.json()
    email = user_info.get("email")
    name = user_info.get("name")

    # Vérifier si l'utilisateur existe, sinon l'enregistrer
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(email=email, password="", role="particulier")  # Pas de mot de passe pour les comptes Google
        db.add(user)
        db.commit()

    # Générer un token JWT
    jwt_token = create_access_token({"sub": email, "role": user.role}, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))

    return {"access_token": jwt_token, "email": email, "name": name, "role": user.role}