"""RAG (Retrieval-Augmented Generation) service for contextual AI responses."""
import numpy as np
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from config import settings
from services.gemini_service import gemini_service

CHUNK_SIZE = 500       # characters per chunk
CHUNK_OVERLAP = 100    # overlap between consecutive chunks
TOP_K = 5              # number of top chunks to retrieve


def _chunk_text(text: str, size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """Split text into overlapping chunks."""
    chunks = []
    start = 0
    while start < len(text):
        end = start + size
        chunks.append(text[start:end].strip())
        start += size - overlap
    return [c for c in chunks if len(c) > 50]  # discard tiny tail chunks


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    """Compute cosine similarity between two embedding vectors."""
    va = np.array(a, dtype=np.float32)
    vb = np.array(b, dtype=np.float32)
    norm_a = np.linalg.norm(va)
    norm_b = np.linalg.norm(vb)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(va, vb) / (norm_a * norm_b))


class RAGService:
    """Retrieval-Augmented Generation pipeline for card-specific Q&A."""

    def __init__(self):
        self.client = None
        self.db = None

    async def initialize(self):
        """Initialize the MongoDB connection."""
        self.client = AsyncIOMotorClient(settings.mongodb_uri)
        self.db = self.client.get_default_database()
        # Create index on card_id for fast retrieval
        await self.db.card_embeddings.create_index("card_id")
        print("RAG Service: MongoDB connected")

    async def close(self):
        """Close the MongoDB connection."""
        if self.client:
            self.client.close()

    # ------------------------------------------------------------------
    # Ingestion
    # ------------------------------------------------------------------

    async def ingest_card_pdf(self, card_id: str, text: str, source: str) -> int:
        """Chunk text, embed each chunk, and store in card_embeddings collection.
        Returns the number of chunks stored."""
        chunks = _chunk_text(text)
        stored = 0
        for chunk in chunks:
            embedding = await gemini_service.generate_embeddings(chunk)
            if not embedding:
                continue
            await self.db.card_embeddings.insert_one({
                "card_id": card_id,
                "source": source,
                "chunk": chunk,
                "embedding": embedding
            })
            stored += 1
        print(f"📚 Stored {stored} chunks for card {card_id} from '{source}'")
        return stored

    # ------------------------------------------------------------------
    # Semantic search
    # ------------------------------------------------------------------

    async def semantic_search(self, card_id: str, query: str, top_k: int = TOP_K) -> str:
        """Embed the query and return the top-k most relevant chunks as a single context string."""
        query_embedding = await gemini_service.generate_embeddings(query)
        if not query_embedding:
            return ""

        docs = await self.db.card_embeddings.find({"card_id": card_id}).to_list(length=2000)
        if not docs:
            return ""

        scored = [
            (doc, _cosine_similarity(query_embedding, doc["embedding"]))
            for doc in docs
        ]
        scored.sort(key=lambda x: x[1], reverse=True)
        top_docs = scored[:top_k]

        sources_seen = set()
        parts = []
        for doc, score in top_docs:
            if score < 0.3:
                continue
            source = doc.get("source", "Unknown")
            if source not in sources_seen:
                parts.append(f"--- From: {source} ---")
                sources_seen.add(source)
            parts.append(doc["chunk"])

        return "\n\n".join(parts)

    # ------------------------------------------------------------------
    # Context building
    # ------------------------------------------------------------------

    async def get_card_context(self, card_id: str, query: str = "") -> str:
        """Build context: card metadata + semantically relevant PDF chunks."""
        try:
            card = await self.db.cards.find_one({"_id": ObjectId(card_id)})
            if not card:
                return ""

            context_parts = []
            context_parts.append(f"Card Title: {card.get('title', 'Untitled')}")
            context_parts.append(f"Subject: {card.get('subject', 'Unknown')}")
            context_parts.append(f"Description: {card.get('description', '')}")

            if card.get('textContent'):
                context_parts.append(f"\n--- Text Content ---\n{card['textContent'][:3000]}")

            # Semantic search over PDF chunks
            if query:
                pdf_context = await self.semantic_search(card_id, query)
                if pdf_context:
                    context_parts.append(f"\n--- Relevant PDF Content ---\n{pdf_context}")
            else:
                # Fall back: list available resource names
                resources = card.get('resources', [])
                if resources:
                    resource_list = [
                        f"- {r.get('originalName', 'Unknown')} ({r.get('type', 'unknown')})"
                        for r in resources
                    ]
                    context_parts.append("\n--- Available Resources ---\n" + "\n".join(resource_list))

            return "\n\n".join(context_parts)

        except Exception as e:
            print(f"Error building card context: {e}")
            return ""

    # ------------------------------------------------------------------
    # Chat
    # ------------------------------------------------------------------

    async def chat(self, card_id: str, question: str, conversation_history: list = None) -> dict:
        """Process a chat query using RAG pipeline with semantic PDF search."""
        context = await self.get_card_context(card_id, query=question)

        history_text = ""
        if conversation_history:
            history_parts = []
            for msg in conversation_history[-6:]:
                role = "Student" if msg.get("role") == "user" else "Assistant"
                history_parts.append(f"{role}: {msg.get('content', '')}")
            history_text = "\n\nPrevious conversation:\n" + "\n".join(history_parts)

        full_question = question
        if history_text:
            full_question = f"{history_text}\n\nCurrent question: {question}"

        answer = await gemini_service.generate_response(full_question, context)

        # Collect unique source names shown to user
        card = await self.db.cards.find_one({"_id": ObjectId(card_id)})
        sources = []
        if card:
            sources = [r.get('originalName', 'Unknown') for r in card.get('resources', [])]

        return {"answer": answer, "sources": sources}


rag_service = RAGService()
