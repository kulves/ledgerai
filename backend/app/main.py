from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from backend.app.routes.mileage import router as mileage_router
from backend.app.config import get_settings
from backend.app.logger import get_logger
from backend.app.errors import custom_http_exception_handler, HTTPException
from backend.app.routes.luca import router as luca_router
from backend.app.database import init_db
from backend.app.routes.expenses import router as expenses_router
from backend.app.routes.businesses import router as businesses_router
from backend.app.routes.documents import router as documents_router
from backend.app.routes.reports import router as reports_router
from backend.app.routes.dashboard import router as dashboard_router
from backend.app.luca.engine import luca

settings = get_settings()
logger = get_logger()

app = FastAPI(
    title=settings.app_name,
    description="Local-first AI bookkeeping and tax assistant",
    version=settings.version,
    debug=settings.debug
)

# Error handler
app.add_exception_handler(HTTPException, custom_http_exception_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(luca_router)
app.include_router(expenses_router)
app.include_router(businesses_router)
app.include_router(mileage_router)
app.include_router(documents_router)
app.include_router(reports_router)
app.include_router(dashboard_router)
# 
@app.on_event("startup")
async def startup():
    """Initialize database tables on server start."""
    init_db()
    
@app.get("/")
async def root():
    logger.info("Root endpoint accessed")
    return {
        "success": True,
        "message": f"{settings.app_name} Backend is running!",
        "version": settings.version
    }

@app.get("/health")
async def health():
    logger.info("Health check performed")
    ollama_running = await luca.is_ollama_running()
    return {
        "status": "ok",
        "app": settings.app_name,
        "version": settings.version,
        "ollama_running": ollama_running,
        "chat_model": settings.ollama_model,
        "vision_model": settings.ollama_vision_model,
    }

if __name__ == "__main__":
    logger.info(f"Starting {settings.app_name} v{settings.version}...")
    uvicorn.run(
        "backend.app.main:app",
        host=settings.host,
        port=settings.port,
        reload=True
    )