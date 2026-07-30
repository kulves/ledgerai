"""
routes/setup.py — Ollama Setup & Model Management
===================================================
Purpose:
    Handles first-run setup: checking Ollama status, listing installed
    models, and streaming model pull progress to the frontend.

    Routes:
        GET  /api/setup/status   → Ollama status + installed models
        POST /api/setup/pull     → Pull a model, stream progress as JSON

Connections:
    - Called by: frontend OllamaSetup.jsx
    - Talks to: Ollama at localhost:11434
    - Wired into: main.py via app.include_router()
"""

import httpx
import json
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from backend.app.config import get_settings
from backend.app.logger import get_logger

logger = get_logger()
config = get_settings()

router = APIRouter(prefix="/api/setup", tags=["setup"])

OLLAMA_BASE = "http://127.0.0.1:11434"


@router.get("/status")
async def get_setup_status():
    """
    Check if Ollama is running and which models are installed.
    Returns a clean status object for the setup wizard.
    """
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{OLLAMA_BASE}/api/tags")

        if response.status_code != 200:
            return {
                "ollama_running": False,
                "models": [],
                "chat_model_ready": False,
                "vision_model_ready": False
            }

        tags = response.json()
        models = [m["name"] for m in tags.get("models", [])]

        chat_ready   = any(m.startswith("llama3.2:1b") for m in models)
        vision_ready = any(m.startswith("llama3.2-vision") for m in models)

        logger.info(f"Setup status: Ollama running, models: {models}")

        return {
            "ollama_running": True,
            "models": models,
            "chat_model_ready": chat_ready,
            "vision_model_ready": vision_ready
        }

    except Exception as e:
        logger.info(f"Ollama not running: {e}")
        return {
            "ollama_running": False,
            "models": [],
            "chat_model_ready": False,
            "vision_model_ready": False
        }


class PullRequest(BaseModel):
    model: str  # e.g. "llama3.2:1b" or "llama3.2-vision"


@router.post("/pull")
async def pull_model(request: PullRequest):
    """
    Pull (download) an Ollama model and stream progress back to the frontend.
    The frontend reads the stream and updates the progress bar in real time.

    Ollama's pull endpoint returns a stream of JSON lines like:
        {"status": "downloading", "completed": 1234567, "total": 987654321}
        {"status": "success"}
    We forward these directly to the frontend.
    """
    model = request.model.strip()

    # Whitelist allowed models for security
    ALLOWED_MODELS = {"llama3.2:1b", "llama3.2-vision", "llama3", "phi3:mini"}
    if model not in ALLOWED_MODELS:
        logger.warning(f"Setup pull attempted for non-allowed model: {model}")
        return {"error": f"Model '{model}' is not in the allowed list"}

    logger.info(f"Starting model pull: {model}")

    async def stream_pull():
        """Stream Ollama's pull progress as JSON lines."""
        try:
            async with httpx.AsyncClient(timeout=3600.0) as client:  # 1 hour timeout for large models
                async with client.stream(
                    "POST",
                    f"{OLLAMA_BASE}/api/pull",
                    json={"name": model, "stream": True}
                ) as response:
                    async for line in response.aiter_lines():
                        if line.strip():
                            yield line + "\n"

        except httpx.ConnectError:
            yield json.dumps({"error": "Cannot connect to Ollama. Is it running?"}) + "\n"
        except Exception as e:
            logger.error(f"Model pull error for {model}: {e}")
            yield json.dumps({"error": str(e)}) + "\n"

    return StreamingResponse(
        stream_pull(),
        media_type="application/x-ndjson"
    )