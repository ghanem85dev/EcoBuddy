import asyncio
from datetime import datetime, date
from sqlalchemy import create_engine, Column, Integer, Float, Date
from sqlalchemy.orm import declarative_base, sessionmaker
from pymongo import MongoClient
from bson import ObjectId
from typing import List
from pydantic import BaseModel, ConfigDict

# Configuration PostgreSQL
POSTGRES_DB_URL = "postgresql://postgres:98664872@localhost/myenergyhub"
engine = create_engine(POSTGRES_DB_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Configuration MongoDB
MONGODB_URL = "mongodb://localhost:27017"
MONGODB_DB_NAME = "myenergyhub_mongo"
mongo_client = MongoClient(MONGODB_URL)
mongo_db = mongo_client[MONGODB_DB_NAME]

# Modèle SQLAlchemy pour la table consommation
class ConsommationPG(Base):
    __tablename__ = 'Consommation'
    
    idConsommation = Column(Integer, primary_key=True, index=True)
    quantite = Column(Float)
    jour = Column(Date)
    idAppareil = Column(Integer)

# Modèle Pydantic pour MongoDB avec configuration moderne
class ConsommationMongo(BaseModel):
    quantite: float
    jour: date
    idAppareil: int
    
    # Configuration pour Pydantic v2
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={date: lambda d: datetime.combine(d, datetime.min.time())}
    )

def convert_date_to_datetime(obj):
    """Convertit les dates en datetime pour MongoDB"""
    if isinstance(obj, date):
        return datetime.combine(obj, datetime.min.time())
    return obj

def get_pg_data() -> List[ConsommationMongo]:
    """Récupère toutes les données de consommation depuis PostgreSQL"""
    db = SessionLocal()
    try:
        records = db.query(ConsommationPG).all()
        return [
            ConsommationMongo(
                quantite=record.quantite,
                jour=record.jour,
                idAppareil=record.idAppareil
            )
            for record in records
        ]
    finally:
        db.close()

def migrate_to_mongo(data: List[ConsommationMongo]):
    """Migre les données vers MongoDB"""
    collection = mongo_db["consommation"]
    
    # Convertir les modèles Pydantic en dictionnaires et les dates en datetime
    documents = []
    for item in data:
        doc = item.model_dump()
        doc['jour'] = convert_date_to_datetime(doc['jour'])
        documents.append(doc)
    
    if documents:
        try:
            result = collection.insert_many(documents)
            print(f"Migration terminée. {len(result.inserted_ids)} documents insérés.")
        except Exception as e:
            print(f"Erreur lors de l'insertion: {str(e)}")
    else:
        print("Aucune donnée à migrer.")

def main():
    print("Début de la migration...")
    
    # 1. Récupération des données
    print("Récupération des données depuis PostgreSQL...")
    data = get_pg_data()
    print(f"{len(data)} enregistrements récupérés.")
    
    # 2. Migration
    print("Migration vers MongoDB...")
    migrate_to_mongo(data)
    
    print("Vérification finale...")
    print(f"Documents dans MongoDB: {mongo_db.consommation.count_documents({})}")

if __name__ == "__main__":
    main()