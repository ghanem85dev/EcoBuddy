from fastapi import APIRouter
from typing import List
from ..models_mongo.conversation import Conversation,ConversationCreate  # Supposant que vous avez ce modèle Pydantic
from ..services.conversation_service import create_conversation,get_conversations

router = APIRouter()

@router.post("/conversations/", response_model=Conversation)
async def add_conversation(conversation: ConversationCreate):
    try:
        return await create_conversation(conversation)
    except Exception as e:
        logger.error(f"Error creating conversation: {e}")
        raise


    

@router.get("/conversations/{sender_id}", response_model=List[Conversation])
async def fetch_conversations(sender_id: str):
    return await get_conversations(sender_id)
    