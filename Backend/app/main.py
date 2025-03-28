from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.commun.routes import auth,preferences,appareil,consommation,invitation,user_settings,question
from app.particulier.routes import site,categorie_site_route
from app.entreprise.routes import entreprise_route,secteur_route
from app.admin.routes import users_route

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

@app.get("/test")
def test_endpoint():
    return {"message": "Server is working!"}
# Include your routers here
app.include_router(auth.router)
app.include_router(preferences.router)  
app.include_router(site.router) 
app.include_router(appareil.router)
app.include_router(consommation.router)
app.include_router(invitation.router)
app.include_router(user_settings.router)
app.include_router(question.router)
app.include_router(entreprise_route.router)
app.include_router(secteur_route.router)
app.include_router(categorie_site_route.router)
app.include_router(users_route.router)
@app.on_event("startup")
def start_scheduler():
    if not scheduler.running:
        print("🕒 Démarrage du scheduler...")
        scheduler.start()
@app.get("/")
def read_root():
    return {"message": "Hello, FastAPI!"}
