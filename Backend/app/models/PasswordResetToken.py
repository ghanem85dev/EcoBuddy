# models.py
from sqlalchemy import Column, Engine, String, DateTime
from .models import Base  

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    email = Column(String, primary_key=True, index=True)
    token = Column(String, unique=True, index=True)
    expires_at = Column(DateTime)