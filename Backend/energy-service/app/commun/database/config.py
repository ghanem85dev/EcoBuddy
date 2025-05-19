class Config:
    # Paramètres IA
    MODEL_PATH = "models/energy_recommendation_model"
    TRAINING_DATA_DAYS = 180  # Période d'historique pour l'entraînement
    
    # Seuils de consommation
    HIGH_CONSUMPTION_THRESHOLD = 25  # kWh/jour
    NIGHT_CONSUMPTION_RATIO_ALERT = 0.3
    
    # Types de recommandations prédéfinis
    RECOMMENDATION_TYPES = {
        "economy": "Recommandation d'économie",
        "safety": "Alerte de sécurité",
        "optimization": "Optimisation énergétique"
    }