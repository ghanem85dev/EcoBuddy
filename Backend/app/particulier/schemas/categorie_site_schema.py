from pydantic import BaseModel

class CategorieSiteOut(BaseModel):
    idCategorieSite: int
    nom: str

    class Config:
        from_attributes = True  