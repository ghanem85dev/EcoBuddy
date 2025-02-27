from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth,preferences,site,appareil,consommation

app = FastAPI()

origins = [
    "http://localhost:3000",
    "https://localhost:3000"
]

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
@app.get("/")
def read_root():
    return {"message": "Hello, FastAPI!"}


