from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
import numpy as np
from ..models import Consommation, Appareil

class ConsumptionAnalyzer:
    def __init__(self, db: Session):
        self.db = db
    
    async def get_user_stats(self, user_id: int) -> Dict:
        """Calcule les statistiques clés pour un utilisateur"""
        # 1. Récupérer les appareils de l'utilisateur
        devices = await self._get_user_devices(user_id)
        device_ids = [d.idAppareil for d in devices]
        
        # 2. Récupérer la consommation récente
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=30)
        consumptions = self.db.query(Consommation).filter(
            Consommation.idAppareil.in_(device_ids),
            Consommation.jour.between(start_date, end_date)
        ).all()
        
        # 3. Calculer les statistiques
        if not consumptions:
            return {}
            
        quantities = [c.quantite for c in consumptions]
        hours = [c.jour.hour for c in consumptions]
        weekdays = [c.jour.weekday() for c in consumptions]
        
        return {
            "daily_average": np.mean(quantities),
            "night_ratio": sum(1 for h in hours if h <= 6 or h >= 22) / len(hours),
            "peak_hours_ratio": sum(1 for h in hours if 8 <= h <= 20) / len(hours),
            "weekend_ratio": sum(1 for d in weekdays if d >= 5) / len(weekdays),
            "total_power": sum(d.puissance for d in devices)
        }
    
    async def _get_user_devices(self, user_id: int):
        """Récupère les appareils d'un utilisateur"""
        return self.db.query(Appareil).join(Site).filter(
            Site.idUser == user_id
        ).all()