"""Configuration module for the AI microservice."""
import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    mongodb_uri: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017/institute_card_network")
    node_api_url: str = os.getenv("NODE_API_URL", "http://localhost:5000")
    host: str = os.getenv("HOST", "0.0.0.0")
    port: int = int(os.getenv("PORT", "8000"))

    class Config:
        env_file = ".env"


settings = Settings()
