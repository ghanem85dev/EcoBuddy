from fastapi import FastAPI, HTTPException, Request,APIRouter
from fastapi.middleware.cors import CORSMiddleware
import httpx

router = APIRouter()

RASA_API_URL = "http://localhost:5005/webhooks/rest/webhook"

@router.post("/api/chatbot")
async def chatbot_proxy(request: Request):
    try:
        # Récupérer les données du frontend
        payload = await request.json()
        
        # Vous pouvez ajouter ici :
        # - Authentification
        # - Logging
        # - Transformation des données
        
        # Transmettre à Rasa
        async with httpx.AsyncClient() as client:
            rasa_response = await client.post(
                RASA_API_URL,
                json={
                    "sender": payload.get("sender"),
                    "message": payload.get("message")
                },
                timeout=30.0
            )
            
            # Vérifier la réponse
            rasa_response.raise_for_status()
            
            # Vous pouvez traiter la réponse de Rasa ici si nécessaire
            return rasa_response.json()
            
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=e.response.status_code,
            detail="Erreur de communication avec le service Rasa"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur interne du serveur: {str(e)}"
        )