import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock
from sqlalchemy.orm import Session
from app.main import app  # Importez l'application FastAPI
from app.models import Site, Appareil, User

client = TestClient(app)

@pytest.fixture
def mock_db():
    """Mock de la session de base de données SQLAlchemy."""
    db = MagicMock(spec=Session)
    return db



def test_get_appareils_site_not_found(mock_db):
    """Test pour un site inexistant (retourne 404)."""
    mock_db.query.return_value.filter.return_value.first.return_value = None

    response = client.get("/appareils/99")

    assert response.status_code == 404
    assert response.json() == {"detail": "Site not found"}




def test_get_appareils_user_not_found(mock_db):
    """Test pour un utilisateur inexistant (retourne 404)."""
    mock_db.query.return_value.filter.return_value.first.return_value = None

    response = client.get("/appareils/user/99")

    assert response.status_code == 404
    assert response.json() == {"detail": "User not found"}


def test_add_site(mock_db):
    """Test pour ajouter un nouvel appareil à un site existant."""
    
    mock_site = Site(idSite=18, nom="Site Test",adresse="adresse")
    mock_db.query.return_value.filter.return_value.first.return_value = mock_site

    new_appareil_data = {
        "nom": "Climatiseur",
        "marque": "Samsung",
        "modele": "X100",
        "puissance": 2200.0
    }

    response = client.post("/appareils/18/3", json=new_appareil_data)

    assert response.status_code == 200
    assert response.json().get("message") == "Appareil ajouté avec succès."