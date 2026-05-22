"""Main entry point for the FastAPI AI microservice."""
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from config import settings
from routes.chat import router as chat_router
from services.rag_service import rag_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle (startup/shutdown)."""
    # Startup
    await rag_service.initialize()
    print(f"AI Service starting on http://{settings.host}:{settings.port}")
    yield
    # Shutdown
    await rag_service.close()
    print("AI Service shut down")


app = FastAPI(
    title="Institute Card Network - AI Service",
    description="RAG-powered AI assistant for educational card content",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(chat_router)


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=True
    )
