import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.database import get_db, Base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="module")
def client():
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as c:
        yield c
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="module")
def db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        
def test_register_user(client):
    response = client.post("/auth/register", json={
        "email": "test4@gmail.com",
        "password": "Securepassword123*",
        "role":"professionnel"
    })
    assert response.status_code == 200
    assert response.json()["message"] == "Inscription réussie"

def test_login_user(client):
    response = client.post("/auth/login", json={
        "email": "test@example.com",
        "password": "securepassword"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()
    