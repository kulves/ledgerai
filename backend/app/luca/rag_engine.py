"""
rag_engine.py — Retrieval-Augmented Generation Engine
========================================================
Purpose:
    Searches the local knowledge base (built by build_kb.py) to find
    the best-matching verified entry for a user's question. This is
    what prevents Luca from hallucinating tax information — it can
    ONLY answer from content that exists in this knowledge base.

Connections:
    - Reads from: knowledge_base/embeddings/ (built by build_kb.py)
    - Used by:    routes/luca.py (chat endpoint) when a knowledge
                  question is detected

How it works (see Bible Section 10.19):
    1. User asks a question
    2. This file searches for the closest matching knowledge entry
    3. If a good match is found, return it with source + content
    4. If no good match, return None — caller must refer to CPA

Distance scale (cosine distance, since build_kb.py sets hnsw:space=cosine):
    0.0 = identical meaning
    0.2 = very closely related
    0.5 = loosely related
    1.0 = unrelated (orthogonal)
    This scale is predictable BECAUSE both this file and build_kb.py
    use normalize_embeddings=True with the same model.
"""

from pathlib import Path
import chromadb
from sentence_transformers import SentenceTransformer
from backend.app.logger import get_logger

logger = get_logger()

PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
EMBEDDINGS_DIR = PROJECT_ROOT / "knowledge_base" / "embeddings"

# Cosine distance threshold — 0.0 (identical) to 1.0 (unrelated).
# 0.5 is a reasonably permissive starting point for short conceptual
# questions. TUNE THIS after testing with real questions — see the
# test command below, which prints the actual score for visibility.
MAX_DISTANCE_THRESHOLD = 0.5


class RAGEngine:
    """
    Handles semantic search against the local knowledge base.
    Loaded once at startup — the embedding model and ChromaDB
    connection are reused for every search.
    """

    def __init__(self):
        logger.info("Initializing RAG engine...")

        # Must match build_kb.py's model exactly, or search quality breaks.
        self.model = SentenceTransformer("all-MiniLM-L6-v2")

        try:
            client = chromadb.PersistentClient(path=str(EMBEDDINGS_DIR))
            self.collection = client.get_collection("luca_knowledge")
            logger.info("RAG engine connected to knowledge base")
        except Exception as e:
            logger.warning(
                f"Knowledge base not found — run build_kb.py first. Error: {e}"
            )
            self.collection = None

    def search(self, question: str) -> dict | None:
        """
        Search the knowledge base for the best match to a user's question.

        Args:
            question: The user's question in natural language

        Returns:
            dict with the matching entry's content, title, source, and
            distance score, or None if no good match was found.
        """
        if self.collection is None:
            logger.warning("RAG search attempted but knowledge base not loaded")
            return None

        # Must use the same normalize_embeddings=True as build_kb.py
        query_embedding = self.model.encode(
            question,
            normalize_embeddings=True
        ).tolist()

        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=1
        )

        if not results["ids"] or not results["ids"][0]:
            logger.info(f"No knowledge base match for: {question}")
            return None

        distance = results["distances"][0][0]
        if distance > MAX_DISTANCE_THRESHOLD:
            logger.info(
                f"Best match too distant (score: {distance:.3f}) for: {question}"
            )
            return None

        metadata = results["metadatas"][0][0]
        content = results["documents"][0][0]

        logger.info(
            f"Knowledge base match: {metadata['title']} (distance: {distance:.3f})"
        )

        return {
            "title": metadata["title"],
            "source": metadata["source"],
            "content": content,
            "topic": metadata["topic"],
            "distance": distance
        }


# Single shared instance
rag_engine = RAGEngine()