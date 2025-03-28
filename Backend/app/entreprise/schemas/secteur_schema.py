from pydantic import BaseModel

class SecteurOut(BaseModel):
    idSecteur: int
    nom: str

    class Config:
        from_attributes = True  