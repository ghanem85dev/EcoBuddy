from pydantic import BaseModel

class BadgeBase(BaseModel):
    titre: str
    minPoints: int
    description: str

class BadgeCreate(BadgeBase):
    pass

class BadgeUpdate(BaseModel):
    titre: str | None = None
    minPoints: int | None = None
    description: str | None = None

class BadgeResponse(BadgeBase):
    idBadge: int
    
    class Config:
        from_attributes = True