
import numpy as np
from sklearn.ensemble import IsolationForest
from typing import List, Dict

class AnomalyDetector:
    def __init__(self, contamination=0.05):
        self.model = IsolationForest(contamination=contamination)
        self.min_samples = 10  # Minimum d'échantillons pour entraînement

    def detect(self, data: List[Dict]) -> List[Dict]:
        """Détecte les anomalies dans les données de consommation"""
        if not data or len(data) < self.min_samples:
            return []  # Retourne une liste vide si pas assez de données

        # Convertir en tableau numpy 2D
        try:
            # Extraire les features pertinentes
            X = np.array([
                [d['quantite'], d.get('weather', {}).get('temp', 20)]
                for d in data
            ])
            
            # Entraîner le modèle si assez de données
            if len(X) >= self.min_samples:
                self.model.fit(X)
                predictions = self.model.predict(X)
                return [data[i] for i, pred in enumerate(predictions) if pred == -1]
            
            return []
            
        except (KeyError, ValueError) as e:
            print(f"Error processing data for anomaly detection: {e}")
            return []