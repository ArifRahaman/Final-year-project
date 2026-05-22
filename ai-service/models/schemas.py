"""Pydantic schemas for API request/response models."""
from pydantic import BaseModel, Field
from typing import Optional


class ChatMessage(BaseModel):
    """A single message in a conversation."""
    role: str = Field(..., description="Either 'user' or 'assistant'")
    content: str = Field(..., description="The message content")


class ChatRequest(BaseModel):
    """Request body for the AI chat endpoint."""
    card_id: str = Field(..., description="The ID of the card to query about")
    question: str = Field(..., description="The user's question")
    user_id: str = Field(..., description="The authenticated user's ID")
    conversation_history: list[ChatMessage] = Field(
        default_factory=list,
        description="Previous messages in the conversation"
    )


class ChatResponse(BaseModel):
    """Response body from the AI chat endpoint."""
    answer: str = Field(..., description="The AI-generated response")
    sources: list[str] = Field(
        default_factory=list,
        description="Source resource names referenced"
    )


class IngestRequest(BaseModel):
    """Request body for the PDF ingestion endpoint."""
    card_id: str = Field(..., description="The ID of the card the PDF belongs to")
    text: str = Field(..., description="Extracted text content from the PDF")
    source: str = Field(..., description="Original filename of the PDF")


class IngestResponse(BaseModel):
    """Response from the ingestion endpoint."""
    status: str = "ok"
    chunks_stored: int = Field(0, description="Number of text chunks stored")
    card_id: str = ""


class EmbeddingRequest(BaseModel):
    """Request body for embedding generation."""
    card_id: str = Field(..., description="The ID of the card to embed")


class HealthResponse(BaseModel):
    """Health check response."""
    status: str = "ok"
    service: str = "ai-service"
