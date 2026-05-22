"""AI Chat route handlers."""
from fastapi import APIRouter, HTTPException
from models.schemas import ChatRequest, ChatResponse, IngestRequest, IngestResponse, EmbeddingRequest, HealthResponse
from services.rag_service import rag_service

router = APIRouter(prefix="/api/ai", tags=["AI"])


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Process a chat message using RAG pipeline with card-specific context."""
    try:
        result = await rag_service.chat(
            card_id=request.card_id,
            question=request.question,
            conversation_history=[
                {"role": msg.role, "content": msg.content}
                for msg in request.conversation_history
            ]
        )
        return ChatResponse(
            answer=result["answer"],
            sources=result["sources"]
        )
    except Exception as e:
        print(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=f"AI processing error: {str(e)}")


@router.post("/ingest", response_model=IngestResponse)
async def ingest_pdf(request: IngestRequest):
    """Ingest extracted PDF text: chunk, embed, and store for semantic search."""
    try:
        if not request.text or len(request.text.strip()) < 50:
            return IngestResponse(status="skipped", chunks_stored=0, card_id=request.card_id)
        chunks_stored = await rag_service.ingest_card_pdf(
            card_id=request.card_id,
            text=request.text,
            source=request.source
        )
        return IngestResponse(status="ok", chunks_stored=chunks_stored, card_id=request.card_id)
    except Exception as e:
        print(f"Ingest error: {e}")
        raise HTTPException(status_code=500, detail=f"Ingestion error: {str(e)}")


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint for the AI service."""
    return HealthResponse()
