from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import HTTPException
from backend.app.logger import get_logger

logger = get_logger()

async def custom_http_exception_handler(request: Request, exc: HTTPException):
    logger.warning(f"HTTP Error {exc.status_code} on {request.url.path}: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": exc.detail}
    )