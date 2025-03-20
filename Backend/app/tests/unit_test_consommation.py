from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from unittest.mock import MagicMock
from datetime import date, datetime
import pytest
from app.main import app
from app.database.database import SessionLocal
from app.models import User, Site, Appareil, Consommation

client = TestClient(app)

@pytest.fixture
def mock_db():
    """Fixture pour créer un mock de la session SQLAlchemy."""
    return MagicMock(spec=Session)

@pytest.fixture
def mock_data():
    """Fixture pour créer les données mockées partagées entre plusieurs tests."""
    user = User(id=1, email="user@gmail.com", password="password", role="particulier")
    site = Site(idSite=1, idUser=1, nom="Site 1", adresse="Adresse 1")
    
    categorie1, categorie2 = MagicMock(nom="Électroménager"), MagicMock(nom="Chauffage")
    appareil1 = Appareil(idAppareil=1, idSite=1, nom="Réfrigérateur", categorie=categorie1)
    appareil2 = Appareil(idAppareil=2, idSite=1, nom="Radiateur", categorie=categorie2)

    consommation1 = Consommation(idConsommation=1, idAppareil=1, quantite=50.5, jour=datetime.now())
    consommation2 = Consommation(idConsommation=2, idAppareil=2, quantite=30.0, jour=datetime.now())

    site.appareils = [appareil1, appareil2]

    return {
        "user": user, "site": site, "appareil1": appareil1, "appareil2": appareil2,
        "consommation1": consommation1, "consommation2": consommation2
    }

def setup_mock_db(mock_db, mock_data):
    """Configure le mock de la base de données avec les données simulées."""
    mock_db.query.return_value.filter.return_value.first.return_value = mock_data["user"]
    mock_db.query.return_value.join.return_value.join.return_value.filter.return_value.options.return_value.all.return_value = [
        mock_data["consommation1"], mock_data["consommation2"]
    ]
    app.dependency_overrides[SessionLocal] = lambda: mock_db

def test_get_real_time_consumption(mock_db, mock_data):
    setup_mock_db(mock_db, mock_data)

    response = client.get("/api/consumption/1")

    assert response.status_code == 200, f"Erreur: statut {response.status_code}"
    data = response.json()

    assert isinstance(data, dict), "La réponse doit être un dictionnaire"
    assert "appareils" in data, "La réponse doit contenir la clé 'appareils'"
    assert "values" in data, "La réponse doit contenir la clé 'values'"
    assert isinstance(data["appareils"], list), "La clé 'appareils' doit contenir une liste"
    assert isinstance(data["values"], list), "La clé 'values' doit contenir une liste"

def test_get_comparison_category(mock_db, mock_data):
    setup_mock_db(mock_db, mock_data)

    response = client.get("/Comparison/category/1")
    
    assert response.status_code == 200, f"Erreur: statut {response.status_code}"
    categories = [item["categorie"] for item in response.json()]
    assert "Électroménager" in categories, "Catégorie 'Électroménager' manquante"
    assert "Chauffage" in categories, "Catégorie 'Chauffage' manquante"

def test_get_total_consumption_for_user(mock_db, mock_data):
    setup_mock_db(mock_db, mock_data)

    start_date, end_date = date(2024, 1, 1), date(2024, 12, 31)
    response = client.get(f"/Comparison/total/1?start_date={start_date}&end_date={end_date}")

    assert response.status_code in [200, 404], f"Erreur: statut {response.status_code}"
    if response.status_code == 200:
        json_response = response.json()
        assert "user" in json_response, "Champ 'user' manquant"
        assert "consommation_pour_periode" in json_response, "Champ 'consommation_pour_periode' manquant"

def test_get_comparison_range(mock_db, mock_data):
    setup_mock_db(mock_db, mock_data)

    start_date, end_date = date(2024, 1, 1), date(2024, 12, 31)
    response = client.get(f"/Comparison/range/1/1?start_date={start_date}&end_date={end_date}")

    assert response.status_code in [200, 404], f"Erreur: statut {response.status_code}"
    if response.status_code == 200:
        json_response = response.json()
        assert "site" in json_response, "Champ 'site' manquant"
        assert "consommation_pour_periode" in json_response, "Champ 'consommation_pour_periode' manquant"
