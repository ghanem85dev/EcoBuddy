from fastapi.testclient import TestClient
from app.main import app  # Assurez-vous que FastAPI est correctement importé
import pytest

client = TestClient(app)

@pytest.fixture
def setup_db():
    # Setup pour préparer la base de données pour les tests (ajouter un utilisateur, etc.)
    pass

def test_get_user_sites(setup_db):
    # Suppose qu'il existe un utilisateur avec ID 1 et des sites associés
    response = client.get("/sites/1")
    assert response.status_code == 200
    sites = response.json()
    assert isinstance(sites, list)  # Vérifier que la réponse est une liste de sites
    assert "idSite" in sites[0]  # Vérifier que chaque site a un idSite
    assert "adresse" in sites[0]  # Vérifier que chaque site a une adresse


def test_add_site(setup_db):
    new_site = {
        "nom": "New Site",
        "adresse": "123 New Address"
    }
    response = client.post("/sites/1/2", json=new_site)  # Assurez-vous que l'utilisateur 1 existe et la catégorie 2
    assert response.status_code == 200
    assert response.json() == {"message": "Site ajouté avec succès."}
