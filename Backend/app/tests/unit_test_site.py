from unittest.mock import MagicMock
from fastapi.testclient import TestClient
from app.main import app  
from app.routes.site import get_user_sites, add_site, update_site
from app.models import User, Site, UserSite
from sqlalchemy.orm import Session
import pytest
from pydantic import BaseModel
from fastapi import HTTPException
from app.routes.site import update_site as delete_site  

client = TestClient(app)

# Modèle pour simuler les requêtes POST et PUT
class MockNewSite(BaseModel):
    nom: str
    adresse: str

@pytest.fixture
def mock_db():
    """Fixture qui crée un mock de la session SQLAlchemy"""
    return MagicMock(spec=Session)


def test_get_user_sites_not_found(mock_db):
    mock_db.query.return_value.filter.return_value.first.return_value = None

    with pytest.raises(HTTPException) as excinfo:
        get_user_sites(999, mock_db)
    assert excinfo.value.status_code == 404
    assert excinfo.value.detail == "Utilisateur non trouvé"
    
def test_add_site_unit(mock_db):
    """Test unitaire pour ajouter un site."""
    mock_user = User(id=1, email="user@gmail.com",password="password",role="particulier")
    mock_db.query().filter().first.return_value = mock_user  

    new_site = MockNewSite(nom="New Test Site", adresse="123 New Address")

    response = add_site(1, 2, new_site, mock_db)  
    
    assert response == {"message": "Site ajouté avec succès."}  
    mock_db.add.assert_called_once()  
    mock_db.commit.assert_called_once()  

def test_get_user_sites_unit(mock_db):
    mock_user = User(id=1, email="user@gmail.com", password="password", role="particulier")
    mock_user.sites = [Site(idSite=1, nom="Site 1", adresse="Adresse 1", idCategorieSite=2, idUser=1)]

    # Mock the database query
    mock_db.query.return_value.filter.return_value.first.return_value = mock_user

    response = get_user_sites(1, mock_db)

    assert isinstance(response, list)
    assert len(response) == 1
    assert response[0]["nom"] == "Site 1"
    assert response[0]["adresse"] == "Adresse 1"
    
def test_delete_site_unit(mock_db):
    """Test unitaire pour supprimer un site."""
    mock_site = Site(idSite=1, nom="Site to Delete", adresse="Some Address", idCategorieSite=2, idUser=1)
    mock_db.query().filter().first.return_value = mock_site  

    
    response = delete_site(1, mock_db)  
    
    assert response == {"message": "Site supprimé avec succès."}  
    mock_db.delete.assert_called_once_with(mock_site)  
    mock_db.commit.assert_called_once()  

