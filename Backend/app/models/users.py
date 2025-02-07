from sqlalchemy import Column, String
from .models import Base

class User(Base):
    __tablename__ = "users"
   
    email = Column(String, primary_key=True, index=True)
    password = Column(String, nullable=False)
    role = Column(String, nullable=False)