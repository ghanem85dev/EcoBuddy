from sqlalchemy import Column, Integer, String
from .models import Base

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    question = Column(String, nullable=False)
    answer = Column(String, nullable=False)
    role = Column(String, default="particulier") 