#!/bin/bash
# ====================================================================
# LEDGER AI — LINUX/MAC TERMINAL BACKUP SCRATCHPAD
# Purpose: Raw terminal shortcuts for creating project files on Linux.
# ====================================================================

# --------------------------------------------------------------------
# MODULE 2: RE-CREATING THE FASTAPI ENTRY POINT
# --------------------------------------------------------------------
cat > backend/app/main.py << 'EOL'
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="Ledger AI - Luca",
    description="Local-first AI bookkeeping and tax assistant",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "success": True,
        "message": "Luca Backend API running smoothly",
        "version": "0.1.0"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "database": "connected (sqlite3/cryptography secure layer ready)"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
EOL

echo "✅ Linux backend layout successfully written!"