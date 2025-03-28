from sqlalchemy.orm import Session
from app.commun.models.question import Question
from pydantic import BaseModel
 
class QuestionCreate(BaseModel):
    question: str
    answer: str
    role: str  # Par défaut, toutes les questions viennent d'un utilisateur
    categorie: str

# Modèle pour la réponse après création
class QuestionResponse(QuestionCreate):
    id: int

# Ajouter une nouvelle question à la base de données
def add_question(db: Session, question_data: QuestionCreate) -> Question:
    new_question = Question(
        question=question_data.question, 
        answer=question_data.answer, 
        role=question_data.role, 
        categorie=question_data.categorie  
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
    
def get_categories_by_role(db: Session, role: str):
    """Récupère toutes les catégories disponibles pour un rôle donné."""
    return db.query(Question.categorie).filter(Question.role == role).distinct().all()

def get_questions_by_category(db: Session, role: str, categorie: str):
    """Récupère toutes les questions d'une catégorie spécifique pour un rôle donné."""
    return (
        db.query(Question)
        .filter(Question.role == role, Question.categorie == categorie)
        .all()
    )

def get_categories_by_role(db: Session, role: str):
    return db.query(Question.categorie).filter(Question.role == role).distinct().all()

def update_question(db: Session, question_id: int, question_data):
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        return None

    question.question = question_data.question
    question.answer = question_data.answer

    db.commit()
    db.refresh(question)
    return question
def get_question_by_id(db: Session, question_id: int):
    return db.query(Question).filter(Question.id == question_id).first()