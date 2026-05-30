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
    azure_openai_endpoint: str = os.getenv("AZURE_OPENAI_ENDPOINT", "")
    azure_openai_api_version: str = os.getenv("AZURE_OPENAI_API_VERSION", "2025-01-01-preview")
    azure_openai_deployment: str = os.getenv("AZURE_OPENAI_DEPLOYMENT", "")
    azure_openai_chatgpt_deployment: str = os.getenv("AZURE_OPENAI_CHATGPT_DEPLOYMENT", "")
    azure_openai_api_key: str = os.getenv("AZURE_OPENAI_API_KEY", "")
    azure_tenant_id: str = os.getenv("AZURE_TENANT_ID", os.getenv("TECHDEMO_TENANT_ID", ""))
    azure_client_id: str = os.getenv("AZURE_CLIENT_ID", os.getenv("TECHDEMO_CLIENT_ID", ""))
    azure_client_secret: str = os.getenv("AZURE_CLIENT_SECRET", os.getenv("TECHDEMO_CLIENT_SECRET", ""))

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
