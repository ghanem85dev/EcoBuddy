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
    consommation = Consommation(idConsommation=70, quantite=5.0, jour=date.today(), idAppareil=70)

    db.add(user)
    db.add(categorie_site)
    db.add(categorie_app)
    db.add(site)
    
    db.add(appareil)
    db.add(consommation)
    db.commit()
    db.close()

    yield db  # Ceci est l'endroit où les tests peuvent être exécutés

    # Clean up après les tests
    db = SessionLocal()
    db.query(Consommation).filter_by(idConsommation=70).delete()
    db.query(Appareil).filter_by(idAppareil=70).delete()
    db.query(Site).filter_by(idSite=70).delete()
    db.query(Categorie_Site).filter_by(idCategorieSite=70).delete()
    db.query(Categorie_Appareil).filter_by(idCategorieAppareil=70).delete()
    db.query(User).filter_by(id=70).delete()
    db.commit()
    db.close()


# Initialisation du client de test
client = TestClient(app)


# Test pour la route /Consommation/site/{site_id}
def test_get_consommations_site(setup_db):
    response = client.get("/Consommation/site/70")
    assert response.status_code == 200
    data = response.json()
    assert "appareils" in data
    assert "values" in data
    assert len(data["appareils"]) > 0  # Vérifie qu'il y a des appareils


# # Test pour la route /api/consumption/{id_user}
def test_get_real_time_consumption(setup_db):
    response = client.get("/api/consumption/70")
    assert response.status_code == 200
    data = response.json()
    assert "appareils" in data
    assert "values" in data
    assert len(data["appareils"]) > 0  # Vérifie qu'il y a des appareils
    assert data["values"][0] == 5.0  # Vérifie que la consommation est correcte




# # Test pour la route /Comparison/category/{user_id}
def test_get_comparison_category(setup_db):
    response = client.get("/Comparison/category/70")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)  # La réponse doit être une liste
    assert len(data) > 0  # Vérifie qu'il y a des données



# # Test pour la route /Comparison/average_per_device/{user_id}/{site_id}
def test_get_average_consumption_per_device(setup_db):
    response = client.get("/Comparison/average_per_device/70/70")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)  # La réponse doit être une liste
    assert len(data) > 0  # Vérifie qu'il y a des données


# # Test pour la route /Comparison/range/{user_id}/{site_id}
def test_get_comparison_range(setup_db):
    start_date = date.today()
    end_date = date.today()
    response = client.get(f"/Comparison/range/70/70?start_date={start_date}&end_date={end_date}")
    assert response.status_code == 200
    data = response.json()
    assert "site" in data
    assert "consommation_pour_periode" in data


# # Test pour la route /Comparison/total/{user_id}
def test_get_total_consumption_for_user(setup_db):
    start_date = date.today()
    end_date = date.today()
    response = client.get(f"/Comparison/total/70?start_date={start_date}&end_date={end_date}")
    assert response.status_code == 200
    data = response.json()
    assert "consommation_pour_periode" in data  # Vérifie la présence de la clé correcte
    assert "user" in data



