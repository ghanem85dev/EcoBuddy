from datetime import date, datetime
from typing import List
from app.commun.database.database import get_mongo_db
from ..models_mongo import Consommation
from bson import ObjectId
from typing import Optional,Dict

class ConsommationRepository:
    def __init__(self):
        self.db = get_mongo_db()
        self.collection = self.db["consommation"]

    async def create_consommation(self, consommation_data: dict) -> str:
        # Convertir la date en ISO format si c'est un objet date
        if isinstance(consommation_data.get("jour"), date):
            consommation_data["jour"] = consommation_data["jour"].isoformat()
        result = await self.collection.insert_one(consommation_data)
        return str(result.inserted_id)
    

    async def get_consommation(self, consommation_id: str) -> Optional[Consommation]:
        doc = await self.collection.find_one({"_id": ObjectId(consommation_id)})
        if doc:
            doc["idConsommation"] = str(doc["_id"])
            doc["jour"] = date.fromisoformat(doc["jour"])
            return Consommation(**doc)
        return None
    
    async def get_consommations_by_appareil(self, idAppareil: int) -> List[Consommation]:
        consommations = []
        async for doc in self.collection.find({"idAppareil": idAppareil}):
            doc["idConsommation"] = str(doc["_id"])
            if isinstance(doc["jour"], str):
                try:
                    doc["jour"] = date.fromisoformat(doc["jour"])
                except ValueError:
                    doc["jour"] = datetime.strptime(doc["jour"], "%Y-%m-%d").date()
            elif isinstance(doc["jour"], datetime):
                doc["jour"] = doc["jour"].date()
            elif isinstance(doc["jour"], date):
                pass
            else:
                doc["jour"] = date.today()  # or raise an exception
            consommations.append(Consommation(**doc))
        return consommations
    async def get_consommations_by_date_range(self, start_date: date, end_date: date) -> List[Consommation]:
        consommations = []
        async for doc in self.collection.find({
            "jour": {
                "$gte": start_date.isoformat(),
                "$lte": end_date.isoformat()
            }
        }):
            doc["idConsommation"] = str(doc["_id"])
            doc["jour"] = date.fromisoformat(doc["jour"])
            consommations.append(Consommation(**doc))
        return consommations

    async def delete_consommation(self, consommation_id: str) -> bool:
        result = await self.collection.delete_one({"_id": ObjectId(consommation_id)})
        return result.deleted_count > 0
    
    async def get_consommations_by_appareil_ids(self, appareil_ids: List[int]) -> List[Consommation]:
        consommations = []
        async for doc in self.collection.find({"idAppareil": {"$in": appareil_ids}}):
            consommation_data = {
                "_id": str(doc["_id"]),
                "quantite": doc["quantite"],
                "jour": date.fromisoformat(doc["jour"]) if isinstance(doc["jour"], str) else doc["jour"],
                "idAppareil": doc["idAppareil"]
            }
            consommations.append(Consommation(**consommation_data))
        return consommations


    
    async def get_consommations_by_date_range_and_appareils(
    self, 
    start_date: date, 
    end_date: date,
    appareil_ids: List[int]
) -> List[Consommation]:
        try:
            consommations = []
            start_datetime = datetime.combine(start_date, datetime.min.time())
            end_datetime = datetime.combine(end_date, datetime.max.time())
            query = {
                "jour": {
                    "$gte": start_datetime,
                    "$lte": end_datetime
                },
                "idAppareil": {"$in": appareil_ids}
            }
            print(f"Requête MongoDB envoyée: {query}")  # Debug important
            async for doc in self.collection.find(query):
                try:
                    doc["idConsommation"] = str(doc["_id"])
                    if isinstance(doc["jour"], datetime):
                        doc["jour"] = doc["jour"].date()
                    elif isinstance(doc["jour"], str):
                        doc["jour"] = date.fromisoformat(doc["jour"])
                    consommations.append(Consommation(**doc))
                except Exception as e:
                    print(f"Erreur conversion document: {e}")
                    continue
            print(f"Nombre de documents trouvés: {len(consommations)}")  # Debug
            return consommations
        except Exception as e:
            print(f"Erreur majeure dans get_consommations_by_date_range_and_appareils: {str(e)}")
            return []  # Retourner une liste vide plutôt que None
        
    async def get_total_consumption_by_appareil_ids(self, appareil_ids: List[int],start_date: Optional[date] = None,end_date: Optional[date] = None) -> float:
        try:
            print(f"Appareils recherchés: {appareil_ids}")  # Debug
            print(f"Dates recherchées: {start_date} à {end_date}")  # Debug
             # Construction de la requête de base
            query = {"idAppareil": {"$in": appareil_ids}}
            
            if start_date and end_date:
                query["jour"] = {
                    "$gte": datetime.combine(start_date, datetime.min.time()),
                    "$lte": datetime.combine(end_date, datetime.max.time())
                }
            elif start_date:
                query["jour"] = {"$gte": datetime.combine(start_date, datetime.min.time())}
            elif end_date:
                query["jour"] = {"$lte": datetime.combine(end_date, datetime.max.time())}
            print(f"Requête MongoDB: {query}")
            pipeline = [
                {"$match": query},
                {"$group": {
                    "_id": None,
                    "total_consumption": {"$sum": "$quantite"}
                }}
            ]
            cursor = self.collection.aggregate(pipeline)
            result = await cursor.to_list(length=1)
            print(f"Document trouvé: {result}")
            return result[0]["total_consumption"] if result else 0.0
        except Exception as e:
            print(f"Erreur dans get_total_consumption_by_appareil_ids: {str(e)}")
            return 0.0
    
    async def get_most_least_consuming_devices(
        self, 
        appareil_ids: List[int],
        start_date: date,
        end_date: date ) -> Dict[str, Dict]:
        query = {
            "idAppareil": {"$in": appareil_ids},
            "jour": {
                "$gte": datetime.combine(start_date, datetime.min.time()),
                "$lte": datetime.combine(end_date, datetime.max.time())
            }
        }
    
        pipeline = [
           {"$match": query},
           {"$group": {
                "_id": "$idAppareil",
                "total_consumption": {"$sum": "$quantite"}
            }}
        ]
    
        cursor = self.collection.aggregate(pipeline)
        results = await cursor.to_list(length=1000)
    
        if not results:
            return {}
    
    
        most = max(results, key=lambda x: x["total_consumption"])
        least = min(results, key=lambda x: x["total_consumption"])
    
        return {
            "most_consuming": {
                "device_id": most["_id"],
                "consumption": most["total_consumption"]
            },
            "least_consuming": {
                "device_id": least["_id"],
                "consumption": least["total_consumption"]
            }
        }

    async def get_most_least_consuming_sites(
        self,
        site_appareil_mapping: Dict[int, List[int]],  # {site_id: [appareil_ids]}
        start_date: date,
        end_date: date ) -> Dict[str, Dict]:
    
        site_consumptions = {}
    
        for site_id, appareil_ids in site_appareil_mapping.items():
            total = await self.get_total_consumption_by_appareil_ids(
                appareil_ids=appareil_ids,
                start_date=start_date,
                end_date=end_date
            )
            site_consumptions[site_id] = total
    
        if not site_consumptions:
            return {}
    
        most_id = max(site_consumptions.items(), key=lambda x: x[1])[0]
        least_id = min(site_consumptions.items(), key=lambda x: x[1])[0]
    
        return {
            "most_consuming": {
                "site_id": most_id,
                "consumption": site_consumptions[most_id]
            },
            "least_consuming": {
                "site_id": least_id,
                "consumption": site_consumptions[least_id]
            }
        }

    async def get_consommations_with_date_range(self, id_appareil: int, start_date: datetime, end_date: datetime):
        query = {
            "idAppareil": id_appareil,
            "jour": {
                "$gte": start_date,
                "$lte": end_date
            }
        }
        return await self.collection.find(query).to_list(length=None)

    