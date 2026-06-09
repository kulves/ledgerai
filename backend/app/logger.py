import sys
import os
from loguru import logger

# Resolve project root for logs
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
LOG_DIR = os.path.join(PROJECT_ROOT, "logs")
os.makedirs(LOG_DIR, exist_ok=True)

logger.remove()

# Console (colorful)
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level="INFO",
    colorize=True
)

# File (with rotation)
logger.add(
    os.path.join(LOG_DIR, "ledgerai.log"),
    rotation="10 MB",
    retention="30 days",
    level="DEBUG",
    encoding="utf-8"
)

def get_logger():
    return logger