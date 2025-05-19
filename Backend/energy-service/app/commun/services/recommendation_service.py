# from datetime import datetime, timedelta
# from typing import List, Dict
# from app.commun.repositories.consommation_repository import ConsommationRepository
# from app.commun.ai.anomaly_detector import AnomalyDetector
# from app.commun.ai.advice_generator import AdviceGenerator
# from app.commun.services.data_enricher import DataEnricher
# from app.commun.models import Appareil,Categorie_Appareil
# from app.particulier.models import Site

# class RecommendationService:
#     def __init__(self, db_session):
#         self.db = db_session
#         self.consommation_repo = ConsommationRepository()
#         self.detector = AnomalyDetector()
#         self.advisor = AdviceGenerator()  # Modèle plus puissant
#         self.enricher = DataEnricher()

#     async def _get_user_appareil_ids(self, user_id: int) -> List[int]:
#         """Récupère les IDs des appareils d'un utilisateur"""
#         appareils = self.db.query(Appareil).join(Site).filter(
#             Site.idUser == user_id
#         ).all()
#         return [appareil.idAppareil for appareil in appareils]

    
#     async def generate_for_user(self, user_id: int):
#         try:
#             # 1. Get device IDs for user
#             appareil_ids = await self._get_user_appareil_ids(user_id)
#             if not appareil_ids:
#                 return {
#                     "status": "success",
#                     "message": "No devices found for user",
#                     "recommendations": []
#                 }

#             # 2. Get consumption data (last 30 days)
#             end_date = datetime.now().date()
#             start_date = end_date - timedelta(days=210)
            
#             consommations = await self.consommation_repo.get_consommations_by_date_range_and_appareils(
#                 start_date=start_date,
#                 end_date=end_date,
#                 appareil_ids=appareil_ids
#             )

#             if not consommations:
#                 return {
#                     "status": "success",
#                     "message": "No consumption data available",
#                     "recommendations": []
#                 }

#             # 3. Enrich data
#             enriched_data = []
#             for conso in consommations:
#                 try:
#                     enriched = await self._enrich_consumption(conso)
#                     if enriched:  # Vérifier que l'enrichissement a réussi
#                         enriched_data.append(enriched)
#                 except Exception as e:
#                     print(f"Error enriching consumption: {e}")

#             # 4. Vérifier qu'on a assez de données avant détection
#             if len(enriched_data) < self.detector.min_samples:
#                 return {
#                     "status": "success",
#                     "message": f"Not enough data for analysis (need {self.detector.min_samples}, got {len(enriched_data)})",
#                     "recommendations": []
#                 }

#             # 5. Detect anomalies
#             anomalies = self.detector.detect(enriched_data)
            
#             # 6. Generate recommendations
#             recommendations = []
#             for anomaly in anomalies:
#                 try:
#                     advice = self.advisor.generate(anomaly)
#                     recommendations.append({
#                         "device_id": anomaly.get('idAppareil'),
#                         "date": anomaly.get('jour').isoformat() if anomaly.get('jour') else "unknown",
#                         "consumption": anomaly.get('quantite'),
#                         "advice": advice
#                     })
#                 except Exception as e:
#                     print(f"Error generating advice: {e}")

#             category_analysis = self._analyze_by_category(recommendations)
            
#             return {
#                 "status": "success",
#                 "user_id": user_id,
#                 "period": {
#                     "start": start_date.isoformat(),
#                     "end": end_date.isoformat()
#                 },
#                 "category_analysis": category_analysis,
#                 "recommendations": [
#                     {
#                         **rec,
#                         "energy_impact": self._calculate_energy_impact(rec),
#                         "cost_saving": self._estimate_saving(rec)
#                     }
#                     for rec in recommendations
#                 ]
#             }

#         except Exception as e:
#             logging.error(f"Erreur génération recommandations: {str(e)}")
#             return {
#                 "status": "error",
#                 "message": "Une erreur est survenue",
#                 "recommendations": []
#             }

#     def _analyze_by_category(self, recommendations: list) -> dict:
#         """Analyse approfondie par catégorie d'appareil"""
#         analysis = {}
#         for rec in recommendations:
#             category = rec.get("device_type", "autre")
#             if category not in analysis:
#                 analysis[category] = {
#                     "total_consumption": 0,
#                     "devices": [],
#                     "potential_saving": 0
#                 }
            
#             analysis[category]["total_consumption"] += rec.get("consumption", 0)
#             analysis[category]["devices"].append(rec["device_id"])
            
#             # Estimation économie basée sur le niveau d'alerte
#             if "🔴" in rec["advice"]:
#                 analysis[category]["potential_saving"] += rec.get("consumption", 0) * 0.3  # 30% d'économie potentielle
#             elif "🟠" in rec["advice"]:
#                 analysis[category]["potential_saving"] += rec.get("consumption", 0) * 0.15
        
#         return analysis

#     def _calculate_energy_impact(self, recommendation: dict) -> str:
#         """Calcule l'impact énergétique"""
#         consumption = recommendation.get("consumption", 0)
#         if consumption > 50:
#             return "Très élevé"
#         elif consumption > 20:
#             return "Élevé"
#         return "Modéré"

#     def _estimate_saving(self, recommendation: dict) -> float:
#         """Estime les économies potentielles"""
#         level = "high" if "🔴" in recommendation["advice"] else "medium" if "🟠" in recommendation["advice"] else "low"
#         savings = {
#             "high": recommendation.get("consumption", 0) * 0.3,
#             "medium": recommendation.get("consumption", 0) * 0.15,
#             "low": recommendation.get("consumption", 0) * 0.05
#         }
#         return round(savings.get(level, 0), 2)

#     async def _enrich_consumption(self, consommation):
#         """Enrich consumption data with device category"""
#         appareil = self.db.query(Appareil).filter(
#             Appareil.idAppareil == consommation.idAppareil
#         ).first()
        
#         if not appareil:
#             raise ValueError(f"Device {consommation.idAppareil} not found")
            
#         site = self.db.query(Site).filter(
#             Site.idSite == appareil.idSite
#         ).first()
        
#         if not site:
#             raise ValueError(f"Site {appareil.idSite} not found")

#         # Get the category name
#         category = self.db.query(Categorie_Appareil).filter(
#             Categorie_Appareil.idCategorieAppareil == appareil.idCategorieAppareil
#         ).first()

#         weather = await self.enricher.fetch_weather_async(
#             lat=site.latitude,
#             lon=site.longitude,
#             date=consommation.jour
#         )

#         return {
#             **consommation.dict(),
#             "device_type": category.nom if category else "unknown",  # Use category name as device type
#             "device_name": appareil.nom,
#             "device_model": appareil.modele,
#             "site_name": site.nom,
#             "weather": weather,
#             "is_peak_hour": self.enricher.is_peak_hour(
#                 datetime.combine(consommation.jour, datetime.min.time())
#             )
#         }