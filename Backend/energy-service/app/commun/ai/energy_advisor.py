import numpy as np
from sklearn.ensemble import IsolationForest
from datetime import datetime, time
import pandas as pd
from app.particulier.models import Site
from app.commun.models import Appareil,Categorie_Appareil,User
from app.commun.models_mongo import Consommation
from ..repositories.consommation_repository import ConsommationRepository
from datetime import datetime, timedelta  
from collections import defaultdict
class EnergyAdvisor:
    def __init__(self, db_session):
        self.db = db_session
        self.consommation_repo = ConsommationRepository() 
        self.tarifs = {
            "pleine": {"heures": (8, 20), "prix": 0.25},  # 8h-20h
            "creuse": {"heures": (20, 8), "prix": 0.15}    # 20h-8h
        }
        self.puissance_moyenne = {
            "réfrigérateur": 150,
            "chauffage": 2000,
            "lave-linge": 2500,
            # Ajoutez d'autres types d'appareils...
        }

    def _analyze_usage_patterns(self, appareils: list) -> dict:
        """Analyse approfondie des habitudes d'utilisation"""
        if not appareils:
            return {}

        usage_stats = defaultdict(lambda: {
            "total_hours": 0,
            "peak_hours": defaultdict(int),
            "conso_moyenne": 0,
            "days_used": set()
        })

        for appareil in appareils:
            if not appareil.get("consommations"):
                continue

            try:
                # Create DataFrame with proper field names
                data = []
                for conso in appareil["consommations"]:
                    if "quantite" not in conso or "date" not in conso:
                        continue
                    data.append({
                        "quantite": conso["quantite"],
                        "jour": conso["date"]  # Map 'date' to 'jour'
                    })

                if not data:
                    continue

                df = pd.DataFrame(data)
                df["datetime"] = pd.to_datetime(df["jour"])
                df["hour"] = df["datetime"].dt.hour

                stats = usage_stats[appareil["id"]]
                stats["conso_moyenne"] = df["quantite"].mean()
                stats["days_used"].update(df["datetime"].dt.date)
                
                for hour in df["hour"]:
                    stats["peak_hours"][hour] += 1
                    stats["total_hours"] += 1

            except Exception as e:
                logger.error(f"Error analyzing device {appareil.get('id')}: {str(e)}")
                continue

        results = {}
        for appareil_id, stats in usage_stats.items():
            appareil = next((a for a in appareils if a["id"] == appareil_id), None)
            if not appareil:
                continue
                
            peak_hour = max(stats["peak_hours"].items(), key=lambda x: x[1])[0] if stats["peak_hours"] else None
            usage_rate = len(stats["days_used"]) / 30 if stats["days_used"] else 0
            
            results[appareil_id] = {
                "nom": appareil["nom"],
                "type": appareil["type"],
                "heure_pointe": peak_hour,
                "taux_utilisation": round(usage_rate * 100, 1),
                "conso_moyenne": round(stats["conso_moyenne"], 2),
                "estimation_annuelle": round(stats["conso_moyenne"] * 365, 2)
            }

        return results

    def _calculate_savings(self, user_data: dict) -> dict:
        """Calcul précis des économies potentielles"""
        savings = {
            "decalage_horaire": 0.0,
            "optimisation_appareils": 0.0,
            "remplacement": 0.0,
            "total_annuel": 0.0
        }

        # 1. Économies par décalage horaire
        for appareil in user_data["appareils"]:
            usage_stats = self._analyze_usage_patterns([appareil])
            if not usage_stats or appareil["id"] not in usage_stats:
                continue

            stats = usage_stats[appareil["id"]]
            peak_hour = stats.get("heure_pointe")
            
            if peak_hour and self._is_peak_rate(peak_hour):
                # Calcul économie si décalé en heures creuses
                conso_jour = stats["conso_moyenne"]
                savings["decalage_horaire"] += conso_jour * (self.tarifs["pleine"]["prix"] - self.tarifs["creuse"]["prix"]) * 30

        # 2. Économies par optimisation des paramètres
        for appareil in user_data["appareils"]:
            puissance = appareil.get("puissance", 0)
            type_app = appareil.get("type", "").lower()
            
            # Réduction de 10% pour les appareils énergivores
            if puissance > 2000 or type_app in ["chauffage", "climatisation"]:
                savings["optimisation_appareils"] += puissance * 0.1 * 0.25 * 8 * 30 / 1000  # 10% sur 8h/jour

        # 3. Économies par remplacement d'appareils
        for appareil in user_data["appareils"]:
            type_app = appareil.get("type", "").lower()
            if type_app in self.puissance_moyenne:
                diff_puissance = appareil["puissance"] - self.puissance_moyenne[type_app]
                if diff_puissance > 0:
                    savings["remplacement"] += diff_puissance * 0.25 * 8 * 30 / 1000  # 8h/jour

        # Calcul du total annualisé
        savings["total_annuel"] = round(sum(savings.values()) * 12, 2)
        savings["decalage_horaire"] = round(savings["decalage_horaire"], 2)
        savings["optimisation_appareils"] = round(savings["optimisation_appareils"], 2)
        savings["remplacement"] = round(savings["remplacement"], 2)

        return savings

    def _is_peak_rate(self, hour: int) -> bool:
        """Détermine si une heure est en tarif pleine"""
        return self.tarifs["pleine"]["heures"][0] <= hour < self.tarifs["pleine"]["heures"][1]
    
    async def generate_recommendations(self, user_id: int) -> dict:
        """Point d'entrée principal pour générer des recommandations"""
        # 1. Récupération des données
        user_data = await self._get_user_data(user_id)
        
        # 2. Analyse complète
        analysis = {
            "consommation": self._analyze_consumption(user_data["consommations"]),
            "habitudes": self._analyze_usage_patterns(user_data["appareils"]),
            "economies": self._calculate_savings(user_data)
        }
        
        # 3. Génération des recommandations
        return self._generate_personalized_advice(user_data, analysis)

    async def _get_user_data(self, user_id: int) -> dict:
        """Récupère toutes les données nécessaires"""
        try:
            sites = self.db.query(Site).filter(Site.idUser == user_id).all()
            appareils = []
            consommations = []
            
            for site in sites:
                for appareil in site.appareils:
                    conso = await self.consommation_repo.get_consommations_with_date_range(
                        id_appareil=appareil.idAppareil,
                        start_date=datetime.now() - timedelta(days=30),
                        end_date=datetime.now()
                    )
                    
                    # Map consumption data to expected format
                    consommations_list = []
                    for c in conso:
                        consommations_list.append({
                            "quantite": c["quantite"],
                            "date": c["jour"]  # Keep original field name
                        })
                        consommations.append({
                            "appareil_id": appareil.idAppareil,
                            "quantite": c["quantite"],
                            "date": c["jour"]
                        })
                    
                    appareils.append({
                        "id": appareil.idAppareil,
                        "nom": appareil.nom,
                        "type": appareil.categorie.nom,
                        "puissance": appareil.puissance,
                        "consommations": consommations_list
                    })
            
            return {
                "user": self.db.query(User).filter(User.id == user_id).first(),
                "sites": sites,
                "appareils": appareils,
                "consommations": consommations
            }
        except Exception as e:
            logger.error(f"Error fetching user data: {str(e)}")
            raise
    def _analyze_consumption(self, consommations: list) -> dict:
        """Analyse avancée des consommations"""
        df = pd.DataFrame(consommations)
        
        # Détection d'anomalies
        model = IsolationForest(contamination=0.05)
        anomalies = model.fit_predict(df[['quantite']])
        
        # Statistiques
        stats = df.groupby('appareil_id')['quantite'].agg(['mean', 'max', 'std'])
        
        return {
            "anomalies": df[anomalies == -1].to_dict('records'),
            "stats": stats.to_dict()
        }

    def _generate_personalized_advice(self, user_data: dict, analysis: dict) -> dict:
        """Génère des conseils personnalisés"""
        advices = []
        
        # 1. Conseils basés sur les anomalies
        for anomaly in analysis["consommation"].get("anomalies", []):
            try:
                device = next(a for a in user_data["appareils"] if a["id"] == anomaly["appareil_id"])
                advices.append({
                    "type": "anomalie",
                    "appareil": device,
                    "message": f"Consommation anormale détectée: {anomaly['quantite']} kWh",
                    "action": "Vérifiez le bon fonctionnement de l'appareil"
                })
            except (StopIteration, KeyError):
                continue
        
        # 2. Conseils d'optimisation
        stats = analysis["consommation"].get("stats", {})
        for appareil in user_data["appareils"]:
            try:
                device_stats = stats.get(str(appareil["id"]))
                if not device_stats:
                    continue
                    
                avg_cons = device_stats.get("mean", 0)
                if avg_cons > 10:  # Seuil pour appareils énergivores
                    advices.append({
                        "type": "optimisation",
                        "appareil": appareil,
                        "message": f"{appareil['nom']} consomme {avg_cons:.1f} kWh/jour en moyenne",
                        "action": "Envisagez de remplacer cet appareil par un modèle plus économe"
                    })
            except Exception as e:
                logger.error(f"Error generating advice for device {appareil.get('id')}: {str(e)}")
                continue
        
        # 3. Conseils financiers
        user = user_data.get("user")
        if user and hasattr(user, 'budget_max') and user.budget_max:
            try:
                total = sum(a.get("puissance", 0) * 0.25 * 30 for a in user_data["appareils"])
                if total > user.budget_max:
                    advices.append({
                        "type": "budget",
                        "message": f"Votre consommation estimée ({total:.2f}€) dépasse votre budget",
                        "action": "Activez le mode économie sur vos appareils principaux"
                    })
            except Exception as e:
                logger.error(f"Error calculating budget advice: {str(e)}")
        
        return {
            "user_id": getattr(user, 'id', None) if user else None,
            "period": {
                "start": (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d"),
                "end": datetime.now().strftime("%Y-%m-%d")
            },
            "advices": advices,
            "potential_savings": analysis.get("economies", {})
        }