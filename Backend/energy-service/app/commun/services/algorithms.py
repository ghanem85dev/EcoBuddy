from datetime import datetime, timedelta
from typing import Dict, List
from collections import defaultdict

def analyze_consumption(user_data: Dict, devices: List, consumption: List) -> Dict:
    """Analyse les données et retourne des insights"""
    results = {
        'global_analysis': global_consumption_analysis(consumption),
        'device_analysis': device_specific_analysis(devices, consumption),
        'time_patterns': time_pattern_analysis(consumption)
    }
    return results

def global_consumption_analysis(consumption: List) -> Dict:
    """Analyse la consommation globale"""
    total = sum(c.quantite for c in consumption)
    daily_avg = total / len({c.jour for c in consumption}) if consumption else 0
    
    return {
        'total_consumption': total,
        'daily_average': daily_avg,
        'is_high': daily_avg > 20  # Seuil à ajuster
    }

def device_specific_analysis(devices: List, consumption: List) -> List[Dict]:
    """Analyse par appareil"""
    device_consumption = defaultdict(float)
    for c in consumption:
        device_consumption[c.idAppareil] += c.quantite
    
    analysis = []
    for device in devices:
        total = device_consumption.get(device.idAppareil, 0)
        analysis.append({
            'device_id': device.idAppareil,
            'name': device.nom,
            'consumption': total,
            'percentage': total / sum(device_consumption.values()) if device_consumption else 0
        })
    
    return sorted(analysis, key=lambda x: x['consumption'], reverse=True)

def time_pattern_analysis(consumption: List) -> Dict:
    """Détecte des patterns temporels"""
    hourly = defaultdict(float)
    weekday = defaultdict(float)
    
    for c in consumption:
        hour = c.jour.hour
        day = c.jour.weekday()
        hourly[hour] += c.quantite
        weekday[day] += c.quantite
    
    return {
        'hourly_pattern': dict(hourly),
        'weekday_pattern': dict(weekday),
        'night_ratio': sum(hourly[h] for h in range(22, 24) + range(0, 6)) / sum(hourly.values()) if hourly else 0
    }