from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.commun.database.database import SessionLocal
from app.commun.services.question import add_question, get_questions
from pydantic import BaseModel
from app.commun.services.question import get_questions_by_role
from fastapi import HTTPException
from app.commun.services.question import get_question_by_id



router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class QuestionCreate(BaseModel):
    question: str
    answer: str
    role: str   # Par défaut, toutes les questions viennent d'un utilisateur
class QuestionResponse(QuestionCreate):
    id: int

@router.post("/add_question", response_model=QuestionResponse)
def create_question(question: QuestionCreate, db: Session = Depends(get_db)):
    return add_question(db, question)

@router.get("/questions", response_model=list[QuestionResponse])
def fetch_questions(db: Session = Depends(get_db)):
    return get_questions(db)


@router.get("/get_questions")
def get_questions(role: str, db: Session = Depends(get_db)):
    return get_questions_by_role(db, role)

@router.get("/get_question/{question_id}", response_model=QuestionResponse)
def get_question(question_id: int, db: Session = Depends(get_db)):
    question = get_question_by_id(db, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question non trouvée")
    return question