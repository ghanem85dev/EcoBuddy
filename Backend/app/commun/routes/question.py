from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.commun.database.database import SessionLocal
from app.commun.services.question import add_question, get_questions, get_question_by_id, update_question, get_questions_by_role, get_questions_by_category
from pydantic import BaseModel
from app.commun.models import Question

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
    role: str  # Par défaut, toutes les questions viennent d'un utilisateur
    categorie: str  # Ajouter l'attribut categorie

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

@router.get("/get_questions_by_category")
def get_questions_by_category_route(role: str, categorie: str, db: Session = Depends(get_db)):
    questions = get_questions_by_category(db, role, categorie)
    return questions

@router.get("/get_roles")
def get_roles(db: Session = Depends(get_db)):
    roles = db.query(Question.role).distinct().all()
    return [role[0] for role in roles]

@router.get("/get_categories_by_role/{role}")
def get_categories_by_role(role: str, db: Session = Depends(get_db)):
    categories = db.query(Question.categorie).filter(Question.role == role).distinct().all()
    return [category[0] for category in categories]

@router.get("/get_questions_by_role_and_category")
def get_questions_by_role_and_category(role: str, category: str, db: Session = Depends(get_db)):
    questions = (
        db.query(Question)
        .filter(Question.role == role, Question.categorie == category)
        .all()
    )
    if not questions:
        return {"message": "Aucune question trouvée pour ce rôle et cette catégorie."}

    return [
        {"id": question.id, "question": question.question, "answer": question.answer}
        for question in questions
    ]

class QuestionUpdate(BaseModel):
    question: str
    answer: str

@router.put("/update_question/{question_id}")
def update_question_route(question_id: int, updated_question: QuestionUpdate, db: Session = Depends(get_db)):
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question non trouvée")

    # Mise à jour des champs de la question
    question.question = updated_question.question
    question.answer = updated_question.answer

    db.commit()  # Sauvegarder les modifications
    db.refresh(question)  # Rafraîchir l'instance pour refléter les changements

    return {"message": "Question mise à jour", "new_data": question}
# Fonction pour supprimer une question par son ID
@router.delete("/delete_question/{question_id}")
def delete_question(question_id: int, db: Session = Depends(get_db)):
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question non trouvée")

    db.delete(question)  # Supprimer la question
    db.commit()  # Valider la suppression

    return {"message": f"Question avec l'ID {question_id} supprimée avec succès"}

@router.get("/get_categories")
def get_categories(role: str, db: Session = Depends(get_db)):
    categories = db.query(Question.categorie).filter(Question.role == role).distinct().all()
    return [category[0] for category in categories]