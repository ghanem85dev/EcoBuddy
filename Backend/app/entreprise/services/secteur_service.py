from sqlalchemy.orm import Session
from typing import List
from app.entreprise.models.secteur import Secteur
from app.entreprise.schemas.secteur_schema import SecteurOut

def get_secteurs(db: Session) -> List[SecteurOut]:
    
    try:
        secteurs = db.query(Secteur).all()
        return secteurs
    except Exception as e:
        raise e
    
def get_secteur_by_id(db: Session,idSecteur:int) -> List[SecteurOut]:
    
    try:
        secteur = db.query(Secteur).filter(Secteur.idSecteur == idSecteur).first()
        return secteur
    except Exception as e:
        raise e