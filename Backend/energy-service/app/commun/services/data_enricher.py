import aiohttp
import requests
from datetime import datetime, date
from config import settings

class DataEnricher:
    def __init__(self):
        self.api_key = settings.WEATHER_API_KEY

    async def fetch_weather_async(self, lat: float, lon: float, date: date) -> dict:
        """Version asynchrone avec aiohttp"""
        try:
            async with aiohttp.ClientSession() as session:
                url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={self.api_key}&units=metric"
                
                async with session.get(url) as response:
                    response.raise_for_status()
                    data = await response.json()
                    return {
                        "temp": data["main"]["temp"],  # Changed from data["current"]
                        "humidity": data["main"]["humidity"],  # Changed from data["current"]
                        "conditions": data["weather"][0]["main"]  # Changed from data["current"]
                    }
        except Exception as e:
            print(f"Error fetching weather: {str(e)}")
            return self._default_weather()

    def fetch_weather_sync(self, lat: float, lon: float, date: date) -> dict:
        """Version synchrone de secours"""
        try:
            response = requests.get(
                f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={self.api_key}&units=metric",
                timeout=5
            )
            response.raise_for_status()
            data = response.json()
            return {
                "temp": data["main"]["temp"],
                "humidity": data["main"]["humidity"],
                "conditions": data["weather"][0]["main"]
            }
        except Exception as e:
            print(f"Error in sync weather fetch: {str(e)}")
            return self._default_weather()

    def _default_weather(self) -> dict:
        return {
            "temp": 20.0,
            "humidity": 50.0,
            "conditions": "Clear"
        }

    @staticmethod
    def is_peak_hour(timestamp: datetime) -> bool:
        """Vérifie si c'est une heure de pointe"""
        return 17 <= timestamp.hour <= 20