class Settings:
    HUGGINGFACE_API_KEY = "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"
    WEATHER_API_KEY = "ceaff2eff1cbf163c00de0f7d5c244c8"
    # Config GPT4All
    GPT4ALL_MODEL = "orca-mini-3b-gguf2-q4_0.gguf"  # ~1.8GB
    GPT4ALL_DEVICE = "cpu"  # Force l'utilisation du CPU
    
settings = Settings()