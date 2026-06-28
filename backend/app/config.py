import os
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # App Identity
    app_name: str = "Ledger AI - Luca"
    version: str = "0.1.0"
    debug: bool = True

    # Server
    host: str = "127.0.0.1"
    port: int = 8000

    # AI — chat uses a lighter text model; vision is only for document OCR
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3"
    ollama_vision_model: str = "llama3.2-vision"

    # Security & Services (loaded from .env)
    app_secret: str = "change-me-in-production"
    stripe_secret_key: str = "sk_test_placeholder"
    stripe_publishable_key: str = "pk_test_placeholder"
    plaid_client_id: str = ""
    plaid_secret: str = ""

    # Database
    database_path: str = "database/ledgerai.db"

    class Config:
        env_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()