from datetime import datetime
from typing import List, Dict, Any
from app.commun.database.database import get_mongo_db

class ConversationRepository:
    def __init__(self):
        self.db=get_mongo_db()
        self.collection = self.db["conversations"]

    async def create_conversation(self, conversation_data: Dict[str, Any]) -> Dict[str, Any]:
        conversation_data["timestamp"] = datetime.utcnow()
        result = await self.collection.insert_one(conversation_data)
        created_conversation = await self.collection.find_one({"_id": result.inserted_id})
        created_conversation["id"] = str(created_conversation["_id"])
        return created_conversation

    async def get_conversations_by_sender(self, sender_id: str) -> List[Dict[str, Any]]:
        conversations = []
        async for conv in self.collection.find({"sender_id": sender_id}).sort("timestamp", 1):
            conv["id"] = str(conv["_id"])
            conversations.append(conv)
        return conversations