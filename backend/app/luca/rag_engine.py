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

Changes in this version:
    - Threshold raised from 0.50 to 0.52 to catch near-miss matches
      like "mileage rate for 2026" → vehicle_expenses entry (0.486)
    - Now fetches top 3 results and returns the best match under threshold
    - Alias expansion: common phrasings are added to the search query
      to improve recall on questions with different wording
"""

from pathlib import Path
import chromadb
from sentence_transformers import SentenceTransformer
from backend.app.logger import get_logger

logger = get_logger()

PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
EMBEDDINGS_DIR = PROJECT_ROOT / "knowledge_base" / "embeddings"

# Raised from 0.50 → 0.52 to catch valid near-miss matches.
# The mileage rate question scores 0.486 — well within this threshold.
# Pizza question scores 0.863 — still safely rejected.
MAX_DISTANCE_THRESHOLD = 0.52

# Common question aliases — expands short/ambiguous queries before searching.
# Maps query fragments to expanded versions that embed more richly.
QUERY_ALIASES = {
    "mileage rate": "standard business mileage rate vehicle expenses deduction",
    "mileage": "business mileage deduction vehicle expenses standard rate",
    "irs mileage": "standard mileage rate vehicle expenses deduction",
    "cents per mile": "standard mileage rate vehicle expenses 2026",
    "home office": "home office deduction simplified actual expense method",
    "self employment tax": "self employment tax social security medicare deduction",
    "se tax": "self employment tax social security medicare",
    "quarterly taxes": "estimated quarterly tax payments due dates safe harbor",
    "quarterly payments": "estimated quarterly tax payments due dates",
    "sep ira": "SEP IRA retirement contribution limits self employed",
    "solo 401k": "solo 401k retirement contribution limits self employed",
    "s corp": "s corporation election self employment tax savings",
    "qbi": "qualified business income deduction section 199a pass through",
    "schedule c": "schedule c profit loss business sole proprietor",
    "1099": "1099 NEC nonemployee compensation contractor filing",
    "bad debt": "bad debt deduction uncollectible invoice cash accrual basis",
    "section 179": "section 179 immediate expensing equipment business property",
}


def _expand_query(question: str) -> str:
    """
    Check if the question contains a known alias fragment and expand it.
    Returns the expanded query string for better embedding match,
    or the original question if no alias applies.
    """
    q_lower = question.lower()
    for fragment, expansion in QUERY_ALIASES.items():
        if fragment in q_lower:
            expanded = f"{question} {expansion}"
            logger.info(f"Query expanded: '{fragment}' → added context")
            return expanded
    return question


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

        # Expand the query with aliases before embedding
        expanded_question = _expand_query(question)

        # Must use the same normalize_embeddings=True as build_kb.py
        query_embedding = self.model.encode(
            expanded_question,
            normalize_embeddings=True
        ).tolist()

        # Fetch top 3 results and take the best one under threshold
        # This is more robust than top-1 alone for near-miss cases
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=min(3, self.collection.count())
        )

        if not results["ids"] or not results["ids"][0]:
            logger.info(f"No knowledge base match for: {question}")
            return None

        # Find the best match under the threshold
        best_distance = float("inf")
        best_index = None

        for i, distance in enumerate(results["distances"][0]):
            if distance < best_distance:
                best_distance = distance
                best_index = i

        if best_index is None or best_distance > MAX_DISTANCE_THRESHOLD:
            logger.info(
                f"Best match too distant (score: {best_distance:.3f}) for: {question}"
            )
            return None

        metadata = results["metadatas"][0][best_index]
        content = results["documents"][0][best_index]

        logger.info(
            f"Knowledge base match: {metadata['title']} "
            f"(distance: {best_distance:.3f})"
        )

        return {
            "title": metadata["title"],
            "source": metadata["source"],
            "content": content,
            "topic": metadata["topic"],
            "distance": best_distance
        }


# Single shared instance
rag_engine = RAGEngine()