from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from backend.app.config import get_settings
from backend.app.logger import get_logger
from backend.app.errors import custom_http_exception_handler, HTTPException
from backend.app.routes.luca import router as luca_router

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
# 
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
    return {
        "status": "ok",
        "app": settings.app_name,
        "version": settings.version,
        "model": settings.ollama_model
    }

if __name__ == "__main__":
    logger.info(f"Starting {settings.app_name} v{settings.version}...")
    uvicorn.run(
        "backend.app.main:app",
        host=settings.host,
        port=settings.port,
        reload=True
    )