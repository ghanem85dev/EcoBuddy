from typing import Dict, Text, Any, List
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher

class TextCorrector:
    FRENCH_CORRECTIONS = {
        "conso": ["consommation", "conssom", "konso"],
        "appareil": ["apareil", "apréil", "apparail"],
        "énergie": ["energie", "énérgie", "nergie"]
    }

    @staticmethod
    def correct(text: str) -> str:
        for correct_word, variants in TextCorrector.FRENCH_CORRECTIONS.items():
            for variant in variants:
                text = text.replace(variant, correct_word)
        return text