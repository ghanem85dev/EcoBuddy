import pytest
from fastapi.testclient import TestClient
from app.main import app  # Assurez-vous que votre application FastAPI est importée correctement
from app.database.database import SessionLocal, Base, engine
from app.models import Site, Consommation, Appareil, User,Categorie_Appareil,Categorie_Site
from datetime import date


# Setup de la base de données pour les tests
@pytest.fixture(scope="module")
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Créer des utilisateurs, des sites, des appareils, etc.
    user = User(id=70, email="testuser70@example.com", password="Password123*", role="particulier")
    categorie_site = Categorie_Site(idCategorieSite=70, nom="Categorie Site 1")
    site = Site(idSite=70, nom="Site 1", idUser=70,idCategorieSite=70,adresse="adresse")
    categorie_app = Categorie_Appareil(idCategorieAppareil=70, nom="Categorie app 1", description="description cat 1")
    appareil = Appareil(idAppareil=70, nom="Appareil 1",marque="marque",modele="modele",puissance=100 ,idSite=70,idCategorieAppareil=70)
    
    
    db.add(user)
    db.add(categorie_site)
    db.add(categorie_app)
    db.add(site)
    
    db.add(appareil)
    
    
    db.commit()
    db.close()

    yield db  # Ceci est l'endroit où les tests peuvent être exécutés

    # Clean up après les tests
    db = SessionLocal()
    db.query(Appareil).filter_by(idAppareil=70).delete()
    db.query(Site).filter_by(idSite=70).delete()
    db.query(Categorie_Site).filter_by(idCategorieSite=70).delete()
    db.query(Categorie_Appareil).filter_by(idCategorieAppareil=70).delete()
    db.query(User).filter_by(id=70).delete()
    db.commit()
    db.close()


# Initialisation du client de test
client = TestClient(app)

def test_get_appareils_site(setup_db):
    response = client.get("/appareils/70")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1  # Vérifie qu'il y a bien un appareil pour ce site
    assert data[0]["nom"] == "Appareil 1"
    
def test_get_appareils_user(setup_db):
    response = client.get("/appareils/user/70")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1  # Vérifie qu'il y a bien un appareil pour ce site
    assert data[0]["nom"] == "Appareil 1"
