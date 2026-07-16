"""
build_kb.py — Knowledge Base Builder
======================================
Purpose:
    Reads all JSON entries from knowledge_base/entries/, converts each
    entry's content into a semantic vector (embedding), and stores them
    in a local ChromaDB collection for fast searching.

    Run this script manually whenever you add or update a knowledge
    base entry. It does NOT run automatically at app startup.

Connections:
    - Reads from: knowledge_base/entries/*.json
    - Writes to:  knowledge_base/embeddings/ (ChromaDB storage)
    - Used by:    rag_engine.py reads the embeddings this script creates

Important — embedding normalization:
    We explicitly normalize embeddings AND tell ChromaDB to use cosine
    distance. This makes the distance score predictable (0 = identical,
    1 = unrelated, 2 = opposite) regardless of the raw model's output
    scale. Without this, a "good match" threshold would be meaningless.

Usage:
    python -m backend.app.luca.build_kb
"""

import json
from pathlib import Path
import chromadb
from sentence_transformers import SentenceTransformer
from backend.app.logger import get_logger

logger = get_logger()

PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
ENTRIES_DIR = PROJECT_ROOT / "knowledge_base" / "entries"
EMBEDDINGS_DIR = PROJECT_ROOT / "knowledge_base" / "embeddings"


def build_knowledge_base():
    """
    Reads all knowledge base JSON entries, generates normalized
    embeddings, and stores them in a local ChromaDB collection
    configured for cosine distance search.
    """
    logger.info("Starting knowledge base build...")

    logger.info("Loading sentence-transformer model...")
    model = SentenceTransformer("all-MiniLM-L6-v2")

    EMBEDDINGS_DIR.mkdir(parents=True, exist_ok=True)
    client = chromadb.PersistentClient(path=str(EMBEDDINGS_DIR))

    # Delete existing collection if present, so we always rebuild fresh
    try:
        client.delete_collection("luca_knowledge")
    except Exception:
        pass  # Collection didn't exist yet — that's fine

    # IMPORTANT: explicitly set cosine distance space.
    # Without this, ChromaDB defaults to squared L2 distance, whose scale
    # depends on raw embedding magnitude — making thresholds unreliable.
    collection = client.create_collection(
        "luca_knowledge",
        metadata={"hnsw:space": "cosine"}
    )

    entry_files = list(ENTRIES_DIR.glob("*.json"))
    logger.info(f"Found {len(entry_files)} knowledge base entries")

    if not entry_files:
        logger.warning("No entries found in knowledge_base/entries/")
        return

    for entry_file in entry_files:
        with open(entry_file, "r", encoding="utf-8") as f:
            entry = json.load(f)

        text_to_embed = f"{entry['title']}. {entry['content']}"

        # normalize_embeddings=True ensures consistent vector length,
        # which makes cosine distance scores meaningful and comparable.
        embedding = model.encode(
            text_to_embed,
            normalize_embeddings=True
        ).tolist()

        # Support both old flat schema (source) and new nested schema (irs_source)
        irs = entry.get("irs_source", {})
        source = entry.get("source") or irs.get("publication") or "Ledger AI"
        last_verified = entry.get("last_verified") or irs.get("last_verified") or "2026-01"

        collection.add(
            ids=[entry["id"]],
            embeddings=[embedding],
            documents=[entry["content"]],
            metadatas=[{
                "title": entry["title"],
                "source": source,
                "topic": entry["topic"],
                "last_verified": last_verified
            }]
        )

        logger.info(f"  Added: {entry['id']}")

    logger.info(f"Knowledge base build complete — {len(entry_files)} entries indexed")


if __name__ == "__main__":
    build_knowledge_base()