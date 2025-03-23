from sqlalchemy.orm import Session
from app.commun.models.question import Question
from pydantic import BaseModel
class QuestionCreate(BaseModel):
    question: str
    answer: str
    role: str   # Par défaut, toutes les questions viennent d'un utilisateur
class QuestionResponse(QuestionCreate):
    id: int
def add_question(db: Session, question_data: QuestionCreate):
    new_question = Question(
        question=question_data.question, 
        answer=question_data.answer, 
        role=question_data.role  # Ajout du rôle
    )
    db.add(new_question)
    db.commit()
    db.refresh(new_question)
    return new_question

def get_questions(db: Session):
    return db.query(Question).all()

def get_questions_by_role(db: Session, role: str):
    return db.query(Question).filter(Question.role == role).all()

def get_question_by_id(db: Session, question_id: int):
    return db.query(Question).filter(Question.id == question_id).first()