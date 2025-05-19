from typing import List, Dict, Any
from ..models_mongo.conversation import ConversationCreate
from ..repositories.conversation_repository import ConversationRepository

async def create_conversation(conversation: ConversationCreate) -> Dict[str, Any]:
    conversation_data = conversation.model_dump()
    return await ConversationRepository().create_conversation(conversation_data)

async def get_conversations(sender_id: str) -> List[Dict[str, Any]]:
    return await ConversationRepository().get_conversations_by_sender(sender_id)