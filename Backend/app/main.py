from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.commun.routes import auth,preferences,appareil,consommation,invitation,user_settings,question
from app.particulier.routes import site

from app.commun.routes.alerts_routes import scheduler  
app = FastAPI()

origins = [
    "http://localhost:3000",
    "https://localhost:3000"
]
@app.middleware("https")
async def add_coop_headers(request, call_next):
    response = await call_next(request)
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin-allow-popups"
    response.headers["Cross-Origin-Embedder-Policy"] = "require-corp"
    return response
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# Include your routers here
app.include_router(auth.router)
app.include_router(preferences.router)  
app.include_router(site.router) 
app.include_router(appareil.router)
app.include_router(consommation.router)
app.include_router(invitation.router)
app.include_router(user_settings.router)
app.include_router(question.router)
@app.on_event("startup")
def start_scheduler():
    if not scheduler.running:
        print("🕒 Démarrage du scheduler...")
        scheduler.start()
@app.get("/")
def read_root():
    return {"message": "Hello, FastAPI!"}
