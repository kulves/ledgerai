"""
engine.py — Luca AI Engine
===========================
Purpose:
    The core brain of Luca. Sends text and image requests to the local
    Ollama model (llama3.2-vision) and returns structured responses.
    All AI communication goes through this file — no other module
    calls Ollama directly.

Connections:
    - Called by: routes/luca.py (chat endpoint), rag_engine.py,
                 routes/documents.py (vision/OCR)
    - Reads from: config.py (model name, Ollama URL)
    - Uses: logger.py for all logging

How Ollama communication works:
    Ollama runs locally at http://localhost:11434
    We send HTTP POST requests to its /api/generate endpoint
    The model processes text OR images and returns a response
    Everything stays on the user's machine — no internet required
"""

import httpx                          # HTTP client for calling Ollama API
import base64                         # Encodes images to send to vision model
import json
from pathlib import Path              # Cross-platform file path handling
from backend.app.config import get_settings
from backend.app.logger import get_logger

# Get shared settings and logger instances
settings = get_settings()
logger = get_logger()

# ── Load prompt files ─────────────────────────────────────────────────────────
# Prompts are stored as plain .txt files in backend/app/luca/prompts/
# This means you can edit Luca's personality without touching Python code
PROMPTS_DIR = Path(__file__).parent / "prompts"


def load_prompt(filename: str) -> str:
    """
    Load a prompt from the prompts/ folder.

    Args:
        filename: Name of the .txt file (e.g. "base.txt")

    Returns:
        The prompt text as a string, or empty string if file not found.
    """
    prompt_path = PROMPTS_DIR / filename
    if prompt_path.exists():
        return prompt_path.read_text(encoding="utf-8").strip()
    else:
        logger.warning(f"Prompt file not found: {prompt_path}")
        return ""


# ── Main Luca Engine class ────────────────────────────────────────────────────

class LucaEngine:
    """
    Luca's AI brain. Handles all communication with the local Ollama model.

    Two main capabilities:
    1. Text chat — for conversation, categorization, and reasoning
    2. Vision — for reading receipt photos, 1099s, W-2s, and documents

    Chat uses ollama_model (default llama3). Document OCR uses ollama_vision_model.
    """

    def __init__(self):
        """Set up the engine with config values and load the base prompt."""
        self.chat_model = settings.ollama_model
        self.vision_model = settings.ollama_vision_model
        self.base_url = settings.ollama_base_url  # "http://localhost:11434"
        self.api_url = f"{self.base_url}/api/generate"

        # Load Luca's base personality from prompts/base.txt
        self.base_prompt = load_prompt("base.txt")

        logger.info(
            f"LucaEngine initialized — chat: {self.chat_model}, "
            f"vision: {self.vision_model}"
        )

    async def chat(self, user_message: str, system_prompt: str = None) -> dict:
        """
        Send a text message to Luca and get a response.

        Used for: expense categorization, answering tax questions,
                  logging entries from natural language, general chat.

        Args:
            user_message:  What the user typed or said to Luca
            system_prompt: Optional override for the system prompt.
                           If None, uses the base prompt from base.txt

        Returns:
            dict with keys:
                success (bool)    — True if Ollama responded correctly
                response (str)    — Luca's reply text
                error (str)       — Error message if success is False
        """
        # Use the provided system prompt or fall back to base personality
        prompt = system_prompt if system_prompt else self.base_prompt

        # Build the full prompt: system instructions + user message
        full_prompt = f"{prompt}\n\nUser: {user_message}\nLuca:"

        logger.info(f"Luca chat request — message length: {len(user_message)} chars")

        try:
            # Call Ollama's generate endpoint
            # stream=False means we wait for the complete response
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    self.api_url,
                    json={
                        "model": self.chat_model,
                        "prompt": full_prompt,
                        "stream": False,           # Get complete response at once
                        "num_ctx": 512
                    }
                )

            # Check if Ollama returned a successful HTTP response
            if response.status_code != 200:
                detail = self._ollama_error_detail(response, self.chat_model)
                logger.error(f"Ollama returned status {response.status_code}: {detail}")
                return {
                    "success": False,
                    "response": "",
                    "error": detail
                }

            # Parse the JSON response from Ollama
            result = response.json()
            luca_reply = result.get("response", "").strip()

            logger.info(f"Luca replied — response length: {len(luca_reply)} chars")

            return {
                "success": True,
                "response": luca_reply,
                "error": None
            }

        except httpx.ConnectError:
            # Ollama is not running
            logger.error("Cannot connect to Ollama — is it running?")
            return {
                "success": False,
                "response": "",
                "error": "Ollama is not running. Please start Ollama and try again."
            }

        except httpx.TimeoutException:
            logger.error(f"Ollama chat timed out waiting for {self.chat_model}")
            return {
                "success": False,
                "response": "",
                "error": (
                    f"Ollama is taking too long to respond with {self.chat_model}. "
                    "The model may still be loading — wait a moment and try again."
                )
            }

        except Exception as e:
            logger.error(f"Unexpected error in LucaEngine.chat: {e}")
            return {
                "success": False,
                "response": "",
                "error": f"Unexpected error: {str(e)}"
            }


    async def _unload_chat_model(self):
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                await client.post(self.api_url, json={'model': self.chat_model, 'prompt': '', 'keep_alive': 0})
            logger.info(f'Chat model unloaded: {self.chat_model}')
        except Exception as e:
            logger.warning(f'Could not unload chat model: {e}')

    async def _reload_chat_model(self):
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                await client.post(self.api_url, json={'model': self.chat_model, 'prompt': '', 'keep_alive': 300, 'stream': False})
            logger.info(f'Chat model reloaded: {self.chat_model}')
        except Exception as e:
            logger.warning(f'Could not reload chat model: {e}')

    async def read_document(self, image_path: str, instruction: str = None) -> dict:
        """
        Send an image or document to Luca for vision processing.

        Used for: reading receipt photos, extracting data from 1099s,
                  W-2s, bank statements, and any uploaded documents.

        Args:
            image_path:   Full path to the image file on disk
            instruction:  What to extract from the image.
                          Defaults to general document extraction prompt.

        Returns:
            dict with keys:
                success (bool)       — True if extraction worked
                extracted_text (str) — Raw text/data extracted from image
                response (str)       — Luca's structured interpretation
                error (str)          — Error message if success is False
        """
        # Default instruction if none provided
        if not instruction:
            instruction = (
                "Extract all financial information from this document. "
                "Return: date, vendor/payer name, amount, document type "
                "(receipt/1099/W2/statement), and any other relevant details. "
                "Be precise with numbers and dates."
            )

        await self._unload_chat_model()
        logger.info(f"Luca vision request — file: {image_path}")

        try:
            # Read the image file and encode it as base64
            # Ollama requires images to be base64-encoded strings
            image_file = Path(image_path)
            if not image_file.exists():
                return {
                    "success": False,
                    "extracted_text": "",
                    "response": "",
                    "error": f"Image file not found: {image_path}"
                }

            with open(image_file, "rb") as f:
                image_data = base64.b64encode(f.read()).decode("utf-8")

            # Build the vision prompt
            vision_prompt = f"{self.base_prompt}\n\n{instruction}"

            # Call Ollama with both text prompt and image
            async with httpx.AsyncClient(timeout=120.0) as client:  # Longer timeout for vision
                response = await client.post(
                    self.api_url,
                    json={
                        "model": self.vision_model,
                        "prompt": vision_prompt,
                        "images": [image_data],   # List of base64-encoded images
                        "stream": False,
                        "num_ctx": 512
                    }
                )

            if response.status_code != 200:
                detail = self._ollama_error_detail(response, self.vision_model)
                logger.error(f"Ollama vision returned status {response.status_code}: {detail}")
                return {
                    "success": False,
                    "extracted_text": "",
                    "response": "",
                    "error": detail
                }

            result = response.json()
            luca_reply = result.get("response", "").strip()

            logger.info(f"Luca vision complete — extracted {len(luca_reply)} chars")

            return {
                "success": True,
                "extracted_text": luca_reply,
                "response": luca_reply,
                "error": None
            }

        except httpx.ConnectError:
            logger.error("Cannot connect to Ollama for vision — is it running?")
            return {
                "success": False,
                "extracted_text": "",
                "response": "",
                "error": "Ollama is not running. Please start Ollama and try again."
            }

        except Exception as e:
            logger.error(f"Unexpected error in LucaEngine.read_document: {e}")
            return {
                "success": False,
                "extracted_text": "",
                "response": "",
                "error": f"Unexpected error: {str(e)}"
            }
        finally:
            await self._reload_chat_model()

    def _ollama_error_detail(self, response: httpx.Response, model: str) -> str:
        """Turn an Ollama HTTP error into a user-facing message."""
        try:
            body = response.json()
            message = body.get("error", "").strip()
        except Exception:
            message = ""

        if message:
            if "memory layout cannot be allocated" in message.lower():
                return (
                    f"The {model} model could not load into memory. "
                    "Try restarting Ollama, closing other apps, or using a smaller model."
                )
            return f"Ollama error: {message}"

        return f"Ollama error: HTTP {response.status_code}"

    async def is_ollama_running(self) -> bool:
        """
        Quick health check — is Ollama running and reachable?

        Returns:
            True if Ollama is running, False if not.
        """
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self.base_url}/api/tags")
            return response.status_code == 200
        except Exception:
            return False


# ── Single shared instance ────────────────────────────────────────────────────
# Import this instance in route files instead of creating a new LucaEngine()
# This ensures the model and prompts load only once at startup
luca = LucaEngine()