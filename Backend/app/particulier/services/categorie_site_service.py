from sqlalchemy.orm import Session
from typing import List
from app.particulier.models.categorie_site import Categorie_Site
from app.particulier.schemas.categorie_site_schema import CategorieSiteOut

def get_categories_sites(db: Session) -> List[CategorieSiteOut]:
    
    try:
        secteurs = db.query(Categorie_Site).all()
        return secteurs
    except Exception as e:
        raise e