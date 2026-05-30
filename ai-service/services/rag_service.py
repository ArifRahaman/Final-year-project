"""RAG (Retrieval-Augmented Generation) service for contextual AI responses."""
import re
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from config import settings
from services.azure_openai_service import azure_openai_service

CHUNK_SIZE = 500       # characters per chunk
CHUNK_OVERLAP = 100    # overlap between consecutive chunks
TOP_K = 5              # number of top chunks to retrieve
STOP_WORDS = {
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "how",
    "i", "in", "is", "it", "of", "on", "or", "that", "the", "this", "to",
    "what", "when", "where", "which", "who", "why", "with", "you", "your",
}


def _chunk_text(text: str, size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """Split text into overlapping chunks."""
    chunks = []
    start = 0
    while start < len(text):
        end = start + size
        chunks.append(text[start:end].strip())
        start += size - overlap
    return [c for c in chunks if len(c) > 50]  # discard tiny tail chunks


def _tokenize(text: str) -> set[str]:
    """Extract meaningful tokens for simple local retrieval."""
    words = re.findall(r"[a-zA-Z0-9]+", text.lower())
    return {word for word in words if len(word) > 2 and word not in STOP_WORDS}


def _keyword_score(query: str, chunk: str) -> float:
    """Score chunk relevance without external embedding APIs."""
    query_tokens = _tokenize(query)
    chunk_tokens = _tokenize(chunk)
    if not query_tokens or not chunk_tokens:
        return 0.0
    matches = query_tokens.intersection(chunk_tokens)
    return len(matches) / len(query_tokens)


def _source_score(query: str, source: str) -> float:
    """Boost files whose names match the user's intent."""
    query_tokens = _tokenize(query)
    source_tokens = _tokenize(source)
    score = 0.0

    if query_tokens and source_tokens:
        score += len(query_tokens.intersection(source_tokens)) / len(query_tokens)

    query_lower = query.lower()
    source_lower = source.lower()
    if any(term in query_lower for term in ["cv", "resume", "curriculum vitae"]):
        if any(term in source_lower for term in ["cv", "resume", "curriculum vitae"]):
            score += 2.0

    return score


class RAGService:
    """Retrieval-Augmented Generation pipeline for card-specific Q&A."""

    def __init__(self):
        self.client = None
        self.db = None

    async def initialize(self):
        """Initialize the MongoDB connection."""
        self.client = AsyncIOMotorClient(settings.mongodb_uri)
        self.db = self.client.get_default_database()
        await self.db.card_embeddings.create_index("card_id")
        await self.db.card_embeddings.create_index([("card_id", 1), ("source", 1)])
        print("RAG Service: MongoDB connected")

    async def close(self):
        """Close the MongoDB connection."""
        if self.client:
            self.client.close()

    # ------------------------------------------------------------------
    # Ingestion
    # ------------------------------------------------------------------

    async def ingest_card_pdf(self, card_id: str, text: str, source: str) -> int:
        """Chunk text and store it for local retrieval.

        Azure credentials currently provide a chat deployment, so ingestion avoids
        Gemini embeddings and keeps the AI service independent of Gemini quotas.
        """
        chunks = _chunk_text(text)
        stored = 0
        await self.db.card_embeddings.delete_many({
            "card_id": card_id,
            "source": source
        })
        for index, chunk in enumerate(chunks):
            await self.db.card_embeddings.insert_one({
                "card_id": card_id,
                "source": source,
                "chunk": chunk,
                "chunk_index": index,
                "created_at": datetime.now(timezone.utc)
            })
            stored += 1
        print(f"📚 Stored {stored} chunks for card {card_id} from '{source}'")
        return stored

    async def get_ingestion_status(self, card_id: str) -> dict:
        """Return stored PDF chunk counts for one card only."""
        pipeline = [
            {"$match": {"card_id": card_id}},
            {
                "$group": {
                    "_id": "$source",
                    "chunks": {"$sum": 1}
                }
            },
            {"$sort": {"_id": 1}}
        ]
        sources = await self.db.card_embeddings.aggregate(pipeline).to_list(length=100)
        return {
            "card_id": card_id,
            "total_chunks": sum(source["chunks"] for source in sources),
            "sources": [
                {"source": source["_id"], "chunks": source["chunks"]}
                for source in sources
            ],
        }

    # ------------------------------------------------------------------
    # Semantic search
    # ------------------------------------------------------------------

    async def semantic_search(self, card_id: str, query: str, top_k: int = TOP_K) -> str:
        """Return the top-k relevant chunks as a single context string."""
        docs = await self.db.card_embeddings.find({"card_id": card_id}).sort([
            ("source", 1),
            ("chunk_index", 1),
            ("created_at", 1)
        ]).to_list(length=2000)
        if not docs:
            return ""

        scored = [
            (
                doc,
                _keyword_score(query, f"{doc.get('source', '')} {doc.get('chunk', '')}")
                + _source_score(query, doc.get("source", ""))
            )
            for doc in docs
        ]
        scored.sort(key=lambda x: (x[1], -int(x[0].get("chunk_index", 0))), reverse=True)
        top_docs = [item for item in scored if item[1] > 0][:top_k]
        if not top_docs:
            top_docs = scored[:top_k]

        sources_seen = set()
        parts = []
        for doc, score in top_docs:
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

        answer = await azure_openai_service.generate_response(full_question, context)

        # Collect unique source names shown to user
        card = await self.db.cards.find_one({"_id": ObjectId(card_id)})
        sources = []
        if card:
            sources = [r.get('originalName', 'Unknown') for r in card.get('resources', [])]

        return {"answer": answer, "sources": sources}


rag_service = RAGService()
