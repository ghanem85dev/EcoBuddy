from typing import Dict, List, Text, Any, Optional, Tuple
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet
from datetime import date, datetime, timedelta
import requests
import logging
from pydantic import BaseModel
from calendar import monthrange

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ConsumptionPeriod(BaseModel):
    start_date: date
    end_date: date

# ==============================================
# Fonctions utilitaires
# ==============================================

def get_current_month_date_range() -> Tuple[date, date]:
    """Retourne la plage de dates du mois courant"""
    today = date.today()
    first_day = today.replace(day=1)
    _, last_day = monthrange(today.year, today.month)
    last_day_of_month = date(today.year, today.month, last_day)
    return (first_day, min(today, last_day_of_month))

def get_period_from_tracker(tracker: Tracker) -> ConsumptionPeriod:
    """Extrait la période des slots ou utilise la période par défaut"""
    slots = tracker.current_slot_values()
    
    # Gestion des entités de date
    entities = tracker.latest_message.get("entities", [])
    time_entity = next((e for e in entities if e["entity"] == "time"), None)
    
    if time_entity:
        try:
            from dateparser import parse
            parsed_date = parse(time_entity["value"])
            if parsed_date:
                if "month" in time_entity["value"].lower():
                    start_date = parsed_date.replace(day=1)
                    end_date = (start_date + timedelta(days=32)).replace(day=1) - timedelta(days=1)
                    return ConsumptionPeriod(start_date=start_date, end_date=end_date)
                elif "week" in time_entity["value"].lower():
                    start_date = parsed_date - timedelta(days=parsed_date.weekday())
                    end_date = start_date + timedelta(days=6)
                    return ConsumptionPeriod(start_date=start_date, end_date=end_date)
                else:  # journée spécifique
                    return ConsumptionPeriod(start_date=parsed_date, end_date=parsed_date)
        except Exception as e:
            logger.warning(f"Erreur d'analyse de date: {e}")

    # Fallback aux slots ou période par défaut
    start_date = slots.get("start_date")
    end_date = slots.get("end_date")
    
    if not start_date or not end_date:
        start_date, end_date = get_current_month_date_range()
    else:
        if isinstance(start_date, str):
            start_date = date.fromisoformat(start_date)
        if isinstance(end_date, str):
            end_date = date.fromisoformat(end_date)
    
    return ConsumptionPeriod(start_date=start_date, end_date=end_date)

# ==============================================
# Actions principales
# ==============================================

class ActionGetCurrentMonthConsumption(Action):
    def name(self) -> Text:
        return "action_get_current_month_consumption"

    async def run(self, dispatcher: CollectingDispatcher,
                 tracker: Tracker,
                 domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        user_id = tracker.sender_id
        try:
            response = requests.get(
                f"http://energy-service:8000/chatbot/consumption/{user_id}/current-month",
                timeout=5
            )
            response.raise_for_status()
            
            data = response.json()
            dispatcher.utter_message(
                text=f"Votre consommation ce mois-ci est de {data['consumption']:.2f} kWh "
                     f"pour {data['device_count']} appareils (du {data['period_start']} au {data['period_end']})."
            )
        except requests.exceptions.RequestException as e:
            logger.error(f"API Error: {str(e)}")
            dispatcher.utter_message(
                text="Désolé, je n'ai pas pu récupérer votre consommation actuelle."
            )
        return []

class ActionIdentifyMostConsumingDevice(Action):
    def name(self) -> Text:
        return "action_identify_most_consuming_device"

    async def run(self, dispatcher: CollectingDispatcher,
                 tracker: Tracker,
                 domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        user_id = tracker.sender_id
        period = get_period_from_tracker(tracker)
        
        try:
            response = requests.get(
                f"http://energy-service:8000/consumption/most-least-consuming/devices/{user_id}",
                params={
                    "start_date": period.start_date.isoformat(),
                    "end_date": period.end_date.isoformat()
                },
                timeout=5
            )
            
            if response.status_code == 200:
                data = response.json()
                message = (f"L'appareil le plus énergivore est {data['most_consuming']['device_name']} "
                          f"avec {data['most_consuming']['consumption']:.2f} kWh "
                          f"(du {period.start_date} au {period.end_date}).")
                dispatcher.utter_message(text=message)
            else:
                dispatcher.utter_message("Je n'ai pas pu identifier l'appareil le plus gourmand.")
        except Exception as e:
            logger.error(f"Error: {str(e)}")
            dispatcher.utter_message("Une erreur s'est produite lors de la recherche.")
        return []

class ActionIdentifyLeastConsumingDevice(Action):
    def name(self) -> Text:
        return "action_identify_least_consuming_device"

    async def run(self, dispatcher: CollectingDispatcher,
                 tracker: Tracker,
                 domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        user_id = tracker.sender_id
        period = get_period_from_tracker(tracker)
        
        try:
            response = requests.get(
                f"http://energy-service:8000/consumption/most-least-consuming/devices/{user_id}",
                params={
                    "start_date": period.start_date.isoformat(),
                    "end_date": period.end_date.isoformat()
                },
                timeout=5
            )
            
            if response.status_code == 200:
                data = response.json()
                message = (f"L'appareil le plus économe est {data['least_consuming']['device_name']} "
                          f"avec {data['least_consuming']['consumption']:.2f} kWh "
                          f"(du {period.start_date} au {period.end_date}).")
                dispatcher.utter_message(text=message)
            else:
                dispatcher.utter_message("Je n'ai pas pu identifier l'appareil le plus économe.")
        except Exception as e:
            logger.error(f"Error: {str(e)}")
            dispatcher.utter_message("Une erreur s'est produite lors de la recherche.")
        return []

class ActionIdentifyMostConsumingSite(Action):
    def name(self) -> Text:
        return "action_identify_most_consuming_site"

    async def run(self, dispatcher: CollectingDispatcher,
                 tracker: Tracker,
                 domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        user_id = tracker.sender_id
        period = get_period_from_tracker(tracker)
        
        try:
            response = requests.get(
                f"http://energy-service:8000/consumption/most-least-consuming/sites/{user_id}",
                params={
                    "start_date": period.start_date.isoformat(),
                    "end_date": period.end_date.isoformat()
                },
                timeout=5
            )
            
            if response.status_code == 200:
                data = response.json()
                message = (f"Le site le plus énergivore est {data['most_consuming']['site_name']} "
                          f"avec {data['most_consuming']['consumption']:.2f} kWh "
                          f"(du {period.start_date} au {period.end_date}).")
                dispatcher.utter_message(text=message)
            else:
                dispatcher.utter_message("Je n'ai pas pu identifier le site le plus gourmand.")
        except Exception as e:
            logger.error(f"Error: {str(e)}")
            dispatcher.utter_message("Une erreur s'est produite lors de la recherche.")
        return []

class ActionIdentifyLeastConsumingSite(Action):
    def name(self) -> Text:
        return "action_identify_least_consuming_site"

    async def run(self, dispatcher: CollectingDispatcher,
                 tracker: Tracker,
                 domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        user_id = tracker.sender_id
        period = get_period_from_tracker(tracker)
        
        try:
            response = requests.get(
                f"http://energy-service:8000/consumption/most-least-consuming/sites/{user_id}",
                params={
                    "start_date": period.start_date.isoformat(),
                    "end_date": period.end_date.isoformat()
                },
                timeout=5
            )
            
            if response.status_code == 200:
                data = response.json()
                message = (f"Le site le plus économe est {data['least_consuming']['site_name']} "
                          f"avec {data['least_consuming']['consumption']:.2f} kWh "
                          f"(du {period.start_date} au {period.end_date}).")
                dispatcher.utter_message(text=message)
            else:
                dispatcher.utter_message("Je n'ai pas pu identifier le site le plus économe.")
        except Exception as e:
            logger.error(f"Error: {str(e)}")
            dispatcher.utter_message("Une erreur s'est produite lors de la recherche.")
        return []

class ActionGetConsumptionByCategory(Action):
    def name(self) -> Text:
        return "action_get_consumption_by_category"

    async def run(self, dispatcher: CollectingDispatcher,
                 tracker: Tracker,
                 domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        user_id = tracker.sender_id
        period = get_period_from_tracker(tracker)
        
        try:
            response = requests.get(
                f"http://energy-service:8000/Comparison/category/{user_id}",
                params={
                    "start_date": period.start_date.isoformat(),
                    "end_date": period.end_date.isoformat()
                },
                timeout=5
            )
            
            if response.status_code == 200:
                data = response.json()
                if data:
                    message = "Consommation par catégorie:\n" + "\n".join(
                        f"- {item['categorie']}: {item['consommation']:.2f} kWh"
                        for item in data
                    )
                    dispatcher.utter_message(text=message)
                else:
                    dispatcher.utter_message("Aucune donnée de consommation par catégorie disponible.")
            else:
                dispatcher.utter_message("Je n'ai pas pu récupérer les données par catégorie.")
        except Exception as e:
            logger.error(f"Error: {str(e)}")
            dispatcher.utter_message("Une erreur s'est produite lors de la récupération des données.")
        return []

class ActionGetHistoricalConsumption(Action):
    def name(self) -> Text:
        return "action_get_historical_consumption"

    async def run(self, dispatcher: CollectingDispatcher,
                 tracker: Tracker,
                 domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        user_id = tracker.sender_id
        period = get_period_from_tracker(tracker)
        
        try:
            response = requests.get(
                f"http://energy-service:8000/consommation/historique-entreprise/0/{user_id}",
                params={
                    "start_date": period.start_date.isoformat(),
                    "end_date": period.end_date.isoformat()
                },
                timeout=5
            )
            
            if response.status_code == 200:
                data = response.json()
                if data:
                    # Limiter à 10 entrées max pour éviter des messages trop longs
                    limited_data = data[:10]
                    message = "Historique de consommation:\n" + "\n".join(
                        f"- {item['date']}: {item['consumption']:.2f} kWh"
                        for item in limited_data
                    )
                    if len(data) > 10:
                        message += f"\n...et {len(data)-10} périodes supplémentaires"
                    dispatcher.utter_message(text=message)
                else:
                    dispatcher.utter_message("Aucune donnée historique disponible pour cette période.")
            else:
                dispatcher.utter_message("Je n'ai pas pu récupérer l'historique de consommation.")
        except Exception as e:
            logger.error(f"Error: {str(e)}")
            dispatcher.utter_message("Une erreur s'est produite lors de la récupération de l'historique.")
        return []

class ActionCompareConsumption(Action):
    def name(self) -> Text:
        return "action_compare_consumption"

    async def run(self, dispatcher: CollectingDispatcher,
                 tracker: Tracker,
                 domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        user_id = tracker.sender_id
        try:
            # Période actuelle
            current_period = get_period_from_tracker(tracker)
            
            # Période précédente (même durée)
            delta = current_period.end_date - current_period.start_date
            prev_period_end = current_period.start_date - timedelta(days=1)
            prev_period_start = prev_period_end - delta
            
            # Récupérer les consommations
            current_response = requests.get(
                f"http://energy-service:8000/Comparison/total/{user_id}",
                params={
                    "start_date": current_period.start_date.isoformat(),
                    "end_date": current_period.end_date.isoformat()
                },
                timeout=5
            )
            
            prev_response = requests.get(
                f"http://energy-service:8000/Comparison/total/{user_id}",
                params={
                    "start_date": prev_period_start.isoformat(),
                    "end_date": prev_period_end.isoformat()
                },
                timeout=5
            )
            
            if current_response.status_code == 200 and prev_response.status_code == 200:
                current = current_response.json()
                previous = prev_response.json()
                
                difference = current['consommation_pour_periode'] - previous['consommation_pour_periode']
                if previous['consommation_pour_periode'] > 0:
                    percent_change = (difference / previous['consommation_pour_periode']) * 100
                else:
                    percent_change = 0
                
                if difference > 0:
                    message = (f"Votre consommation a augmenté de {abs(percent_change):.1f}% "
                              f"(+{difference:.2f} kWh) par rapport à la période précédente.")
                elif difference < 0:
                    message = (f"Votre consommation a diminué de {abs(percent_change):.1f}% "
                              f"(-{abs(difference):.2f} kWh) par rapport à la période précédente.")
                else:
                    message = "Votre consommation est stable par rapport à la période précédente."
                
                dispatcher.utter_message(text=message)
            else:
                dispatcher.utter_message("Je n'ai pas pu comparer votre consommation.")
        except Exception as e:
            logger.error(f"Error: {str(e)}")
            dispatcher.utter_message("Une erreur s'est produite lors de la comparaison.")
        return []

# ==============================================
# Actions de conseils et recommandations
# ==============================================

class ActionProvideSavingTips(Action):
    def name(self) -> Text:
        return "action_provide_saving_tips"

    async def run(self, dispatcher: CollectingDispatcher,
                 tracker: Tracker,
                 domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        tips = [
            "💡 Éteignez les appareils en veille pour économiser jusqu'à 10% d'énergie",
            "🔌 Utilisez des multiprises avec interrupteur pour couper facilement l'alimentation",
            "🌡️ Optimisez l'utilisation de votre chauffage (1°C de moins = 7% d'économie)",
            "⏱️ Privilégiez les heures creuses pour les appareils énergivores",
            "🧹 Nettoyez régulièrement les filtres de vos appareils",
            "❄️ Réglez votre réfrigérateur entre 4°C et 5°C pour une efficacité optimale",
            "☀️ Profitez de la lumière naturelle au maximum pendant la journée"
        ]
        
        dispatcher.utter_message(text="Voici quelques conseils pour économiser l'énergie:")
        for tip in tips:
            dispatcher.utter_message(text=tip)
        
        return []

class ActionSuggestDeviceOptimization(Action):
    def name(self) -> Text:
        return "action_suggest_device_optimization"

    async def run(self, dispatcher: CollectingDispatcher,
                 tracker: Tracker,
                 domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        user_id = tracker.sender_id
        try:
            # Obtenir l'appareil le plus énergivore
            response = requests.get(
                f"http://energy-service:8000/consumption/most-least-consuming/devices/{user_id}",
                params={
                    "start_date": date.today().replace(day=1).isoformat(),
                    "end_date": date.today().isoformat()
                },
                timeout=5
            )
            
            if response.status_code == 200:
                data = response.json()
                device_name = data['most_consuming']['device_name']
                consumption = data['most_consuming']['consumption']
                
                # Base de connaissances des conseils
                tips_db = {
                    "chauffage": [
                        "Baisser le thermostat de 1°C peut réduire la consommation de 7%",
                        "Programmez des plages horaires adaptées à votre présence",
                        "Entretenez votre chaudière annuellement pour maintenir son efficacité"
                    ],
                    "climatiseur": [
                        "Maintenez une différence max de 8°C avec la température extérieure",
                        "Nettoyez les filtres chaque mois pendant la saison d'utilisation",
                        "Utilisez des ventilateurs en complément pour réduire la clim"
                    ],
                    "réfrigérateur": [
                        "Évitez de l'ouvrir trop souvent et trop longtemps",
                        "Vérifiez que les joints sont étanches (test du billet)",
                        "Dégivrez régulièrement si ce n'est pas un modèle No Frost"
                    ],
                    "lave-linge": [
                        "Privilégiez les lavages à basse température (30-40°C)",
                        "Remplissez complètement le tambour mais sans tasser",
                        "Utilisez des programmes éco quand disponibles"
                    ],
                    "default": [
                        "Vérifiez s'il est possible de le mettre en veille quand inutilisé",
                        "Éteignez-le complètement lorsqu'il n'est pas utilisé pendant longtemps",
                        "Consultez le manuel pour les modes économes en énergie"
                    ]
                }
                
                # Trouver des conseils correspondants
                device_type = "default"
                for key in tips_db.keys():
                    if key.lower() in device_name.lower():
                        device_type = key
                        break
                
                tips = tips_db[device_type]
                
                dispatcher.utter_message(
                    text=f"Conseils pour optimiser votre {device_name} ({consumption:.2f} kWh/mois):"
                )
                for tip in tips:
                    dispatcher.utter_message(text=f"• {tip}")
            else:
                dispatcher.utter_message("Je n'ai pas pu identifier des optimisations spécifiques.")
        except Exception as e:
            logger.error(f"Error: {str(e)}")
            dispatcher.utter_message("Je ne peux pas fournir de conseils personnalisés actuellement.")
        return []

# ==============================================
# Actions de gestion de conversation
# ==============================================

class ActionSetPeriodSlot(Action):
    def name(self) -> Text:
        return "action_set_period_slot"

    async def run(self, dispatcher: CollectingDispatcher,
                 tracker: Tracker,
                 domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        entities = tracker.latest_message.get("entities", [])
        time_entity = next((e for e in entities if e["entity"] == "time"), None)
        
        if time_entity:
            try:
                from dateparser import parse
                parsed_date = parse(time_entity["value"])
                if parsed_date:
                    if "month" in time_entity["value"].lower():
                        start_date = parsed_date.replace(day=1)
                        end_date = (start_date + timedelta(days=32)).replace(day=1) - timedelta(days=1)
                        return [SlotSet("start_date", start_date.isoformat()),
                                SlotSet("end_date", end_date.isoformat())]
                    elif "week" in time_entity["value"].lower():
                        start_date = parsed_date - timedelta(days=parsed_date.weekday())
                        end_date = start_date + timedelta(days=6)
                        return [SlotSet("start_date", start_date.isoformat()),
                                SlotSet("end_date", end_date.isoformat())]
                    else:  # journée spécifique
                        return [SlotSet("start_date", parsed_date.isoformat()),
                                SlotSet("end_date", parsed_date.isoformat())]
            except Exception as e:
                logger.warning(f"Date parsing error: {e}")
        
        return []
class ActionHandleCombinedRequest(Action):
    def name(self) -> Text:
        return "action_handle_combined_request"

    async def run(self, dispatcher: CollectingDispatcher,
                 tracker: Tracker,
                 domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        try:
            # 1. Récupérer la consommation
            consumption_action = ActionGetCurrentMonthConsumption()
            await consumption_action.run(dispatcher, tracker, domain)
            
            # 2. Récupérer l'appareil le plus gourmand
            device_action = ActionIdentifyMostConsumingDevice()
            await device_action.run(dispatcher, tracker, domain)
            
           
            
        except Exception as e:
            logger.error(f"Erreur combinée : {str(e)}")
            dispatcher.utter_message("Je n'ai pas pu préparer l'analyse combinée complète")
        
        return []