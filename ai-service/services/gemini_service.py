"""Google Gemini AI service wrapper."""
import google.generativeai as genai
from config import settings


# Configure Gemini
genai.configure(api_key=settings.gemini_api_key)


class GeminiService:
    """Handles interactions with the Google Gemini API."""

    def __init__(self):
        self.model = genai.GenerativeModel("gemini-2.0-flash")

    async def generate_response(self, prompt: str, context: str = "") -> str:
        """Generate a response from Gemini given a prompt and optional context."""
        try:
            full_prompt = self._build_prompt(prompt, context)
            response = self.model.generate_content(full_prompt)
            return response.text
        except Exception as e:
            print(f"Gemini API error: {e}")
            return f"I apologize, but I encountered an error processing your question. Please try again. Error: {str(e)}"

    def _build_prompt(self, question: str, context: str) -> str:
        """Build the complete prompt with system instructions and context."""
        system_prompt = """You are an intelligent AI study assistant embedded in the Institute Card Network platform.
Your role is to help students understand educational materials that have been shared with them through "Cards" (course containers).

IMPORTANT RULES:
1. Only answer questions based on the provided context/materials.
2. If the context doesn't contain enough information to answer, say so clearly.
3. Be educational, encouraging, and thorough in your explanations.
4. Use examples when helpful.
5. Format your responses with markdown for readability.
6. If asked about topics not in the materials, politely redirect to the available content.
"""

        if context:
            return f"""{system_prompt}

--- CARD MATERIALS & CONTEXT ---
{context}
--- END OF MATERIALS ---

Student's Question: {question}

Please provide a helpful, educational response based on the materials above."""
        else:
            return f"""{system_prompt}

Note: No specific materials are loaded for this card yet. Please answer based on general knowledge but inform the student that specific card materials are not available.

Student's Question: {question}"""

    async def generate_embeddings(self, text: str) -> list[float]:
        """Generate text embeddings using Gemini's embedding model."""
        try:
            result = genai.embed_content(
                model="models/text-embedding-004",
                content=text
            )
            return result['embedding']
        except Exception as e:
            print(f"Embedding error: {e}")
            return []


gemini_service = GeminiService()
