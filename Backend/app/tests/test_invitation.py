# import pytest
# from fastapi.testclient import TestClient
# from app.main import app  # Assurez-vous d'importer l'application FastAPI correctement
# from app.database.database import SessionLocal  # Assurez-vous que SessionLocal est correctement importé
# from app.models import User, Site, UserSite, Invitation, Categorie_Site
# from pydantic import EmailStr

# # Créez une instance de TestClient pour tester l'API
# client = TestClient(app)

# # Setup d'une base de données de test avec quelques données
# @pytest.fixture(scope="module")
# def setup_test_db():
#     db = SessionLocal()
    
#     # Créez un utilisateur de test (propriétaire)
#     user_owner = User(id=80, email="owner@example.com", password="Password123*", role="particulier")
#     db.add(user_owner)
#     db.commit()
#     db.refresh(user_owner)

#     # Créez un site de test
#     categorie_site = Categorie_Site(idCategorieSite=80, nom="Categorie Site 1")
#     site = Site(idSite=80, nom="Site 1", idUser=80,idCategorieSite=80,adresse="adresse")
#     db.add(categorie_site)
#     db.add(site)
#     db.commit()
#     db.refresh(site)

#     return db, user_owner, site

# @pytest.fixture(scope="module")
# def setup_test_user(setup_test_db):
#     db, user_owner, site = setup_test_db
    
#     # Créez un utilisateur à inviter
#     user_to_invite = User(email="ilefneji@gamil.com", password="Password123*", role="professionnel")
#     db.add(user_to_invite)
#     db.commit()
#     db.refresh(user_to_invite)

#     return user_to_invite, site, db


# def test_invite_user(setup_test_user):
#     user_to_invite, site, db = setup_test_user
    
#     # Préparez la requête pour l'invitation
#     invite_request = {
#         "email": user_to_invite.email,
#         "site_id": site.idSite,
#         "owner_id": user_to_invite.id  # Utilisateur propriétaire
#     }
    
#     # Test de l'endpoint d'invitation
#     response = client.post("/api/invite", json=invite_request)
#     assert response.status_code == 200
#     assert response.json() == {"message": "Invitation envoyée avec succès"}

#     # Vérifiez que l'invitation a bien été enregistrée dans la base de données
#     invitation = db.query(Invitation).filter(Invitation.email == user_to_invite.email).first()
#     assert invitation is not None
#     assert invitation.status == "pending"


# def test_invite_user_invalid_site(setup_test_user):
#     user_to_invite, _, db = setup_test_user

#     # Test d'une invitation avec un site inexistant
#     invite_request = {
#         "email": user_to_invite.email,
#         "site_id": 9999,  # ID de site invalide
#         "owner_id": user_to_invite.id
#     }

#     response = client.post("/api/invite", json=invite_request)
#     assert response.status_code == 404
#     assert response.json() == {"detail": "Site non trouvé"}


# def test_invite_user_invalid_role(setup_test_user):
#     user_to_invite, _, db = setup_test_user

#     # Test d'une invitation où les rôles ne correspondent pas
#     invite_request = {
#         "email": user_to_invite.email,
#         "site_id": 80,
#         "owner_id": 80  # ID de l'utilisateur propriétaire invalide
#     }

#     response = client.post("/api/invite", json=invite_request)
#     assert response.status_code == 400
#     assert response.json() == {"detail": "Les rôles des utilisateurs ne correspondent pas"}


# def test_accept_invite_invalid_token(setup_test_user):
#     _, _, db = setup_test_user
    
#     # Test d'acceptation avec un token invalide
#     response = client.get("/accept-invite/invalidtoken")
#     assert response.status_code == 404
#     assert response.json() == {"detail": "Invitation non valide"}
