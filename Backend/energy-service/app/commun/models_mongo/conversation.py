from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class ConversationBase(BaseModel):
    sender_id: str
    message: str
    sender_type: str  # 'user' ou 'bot'
    timestamp: Optional[datetime] = None
    

class ConversationCreate(ConversationBase):
    pass

class Conversation(ConversationBase):
    id: str
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }