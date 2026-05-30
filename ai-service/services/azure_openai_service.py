"""Azure OpenAI service wrapper."""
import time
from typing import Optional

import httpx

from config import settings


class AzureOpenAIService:
    """Handles chat completions through Azure OpenAI."""

    def __init__(self):
        self.endpoint = settings.azure_openai_endpoint.rstrip("/")
        self.api_version = settings.azure_openai_api_version
        self.deployment = (
            settings.azure_openai_chatgpt_deployment
            or settings.azure_openai_deployment
        )
        self.api_key = settings.azure_openai_api_key
        self._access_token: Optional[str] = None
        self._access_token_expires_at = 0.0

    async def generate_response(self, prompt: str, context: str = "") -> str:
        """Generate a response from Azure OpenAI given a prompt and context."""
        if not self.endpoint or not self.deployment:
            return "Azure OpenAI is not configured. Please check the AI service environment variables."

        try:
            response = await self._chat_completion(prompt, context)
            return response
        except Exception as e:
            print(f"Azure OpenAI API error: {e}")
            return (
                "I apologize, but I encountered an error processing your question. "
                f"Please try again. Error: {str(e)}"
            )

    async def _chat_completion(self, question: str, context: str) -> str:
        """Call the Azure OpenAI chat completions API."""
        url = (
            f"{self.endpoint}/openai/deployments/{self.deployment}"
            f"/chat/completions?api-version={self.api_version}"
        )

        payload = {
            "messages": [
                {"role": "system", "content": self._system_prompt()},
                {"role": "user", "content": self._build_user_prompt(question, context)},
            ],
            "temperature": 0.3,
            "max_tokens": 1000,
        }

        async with httpx.AsyncClient(timeout=60) as client:
            result = await client.post(url, headers=await self._headers(), json=payload)

        if result.status_code >= 400:
            raise RuntimeError(f"{result.status_code}: {result.text}")

        data = result.json()
        return data["choices"][0]["message"]["content"].strip()

    async def _headers(self) -> dict[str, str]:
        """Build auth headers, preferring an API key when provided."""
        headers = {"Content-Type": "application/json"}
        if self.api_key and self.api_key != "your_api_key":
            headers["api-key"] = self.api_key
        else:
            headers["Authorization"] = f"Bearer {await self._get_access_token()}"
        return headers

    async def _get_access_token(self) -> str:
        """Get and cache an Azure AD access token for Azure OpenAI."""
        if self._access_token and time.time() < self._access_token_expires_at:
            return self._access_token

        if not all([
            settings.azure_tenant_id,
            settings.azure_client_id,
            settings.azure_client_secret,
        ]):
            raise RuntimeError("Azure AD credentials are missing.")

        token_url = (
            f"https://login.microsoftonline.com/{settings.azure_tenant_id}"
            "/oauth2/v2.0/token"
        )
        data = {
            "grant_type": "client_credentials",
            "client_id": settings.azure_client_id,
            "client_secret": settings.azure_client_secret,
            "scope": "https://cognitiveservices.azure.com/.default",
        }

        async with httpx.AsyncClient(timeout=30) as client:
            result = await client.post(token_url, data=data)

        if result.status_code >= 400:
            raise RuntimeError(f"Azure token request failed: {result.status_code}: {result.text}")

        token_data = result.json()
        self._access_token = token_data["access_token"]
        self._access_token_expires_at = time.time() + int(token_data.get("expires_in", 3600)) - 60
        return self._access_token

    def _system_prompt(self) -> str:
        return """You are an intelligent AI study assistant embedded in the Institute Card Network platform.
Your role is to help students understand educational materials that have been shared with them through Cards.

IMPORTANT RULES:
1. Prefer answers based on the provided context/materials.
2. If the context does not contain enough information, say so clearly.
3. Be educational, encouraging, and thorough in your explanations.
4. Use examples when helpful.
5. Format your responses with markdown for readability.
6. If asked about topics not in the materials, politely redirect to the available content."""

    def _build_user_prompt(self, question: str, context: str) -> str:
        if context:
            return f"""--- CARD MATERIALS & CONTEXT ---
{context}
--- END OF MATERIALS ---

Student's Question: {question}

Please provide a helpful, educational response based on the materials above."""

        return f"""No specific materials are loaded for this card yet.
Tell the student that card materials are not available, then answer using general knowledge if appropriate.

Student's Question: {question}"""


azure_openai_service = AzureOpenAIService()
