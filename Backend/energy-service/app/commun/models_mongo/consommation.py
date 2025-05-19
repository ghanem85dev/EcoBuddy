from pydantic import BaseModel, Field
from typing import Optional
from datetime import date
from bson import ObjectId

class PyObjectId(str):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, _values):
        if isinstance(v, ObjectId):
            return str(v)
        if isinstance(v, str) and ObjectId.is_valid(v):
            return v
        raise ValueError("Invalid ObjectId")

class Consommation(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    quantite: float
    jour: date
    idAppareil: int

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str},
        "json_schema_extra": {
            "example": {
                "quantite": 15.5,
                "jour": "2023-01-01",
                "idAppareil": 1
            }
        }
    }