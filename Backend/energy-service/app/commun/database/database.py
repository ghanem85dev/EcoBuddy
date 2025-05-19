from sqlalchemy import create_engine, Column, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient  # Option sync si besoin


DATABASE_URL = "postgresql://postgres:98664872@localhost/myenergyhub"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


MONGODB_URL = "mongodb://localhost:27017"
MONGODB_DB_NAME = "myenergyhub_mongo"  # Nom de la base MongoDB

# Client asynchrone (pour FastAPI)
mongo_async_client = AsyncIOMotorClient(MONGODB_URL)
mongo_db = mongo_async_client[MONGODB_DB_NAME]

# Client synchrone (pour les scripts ou opérations sync)
mongo_sync_client = MongoClient(MONGODB_URL)
mongo_sync_db = mongo_sync_client[MONGODB_DB_NAME]

# Fonction utilitaire pour obtenir la session MongoDB
def get_mongo_db():
    return mongo_db

# Fonction pour fermer les connexions (utile pour le shutdown)
def close_db_connections():
    engine.dispose()
    mongo_async_client.close()
    mongo_sync_client.close()