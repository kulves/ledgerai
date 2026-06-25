"""
routes/documents.py — Document Upload & Vision Extraction
===========================================================
Purpose:
    Handles receipt and document uploads. When a file is uploaded,
    Luca's vision engine (llama3.2-vision) reads it and extracts
    financial information: vendor, amount, date, document type.

    This is the OCR feature from Bible Section 10.19 — Free tier
    gets 5 uploads/month, Growth and Professional get unlimited.

    Routes:
        POST /api/documents/upload     → Upload file + run vision extraction
        GET  /api/documents/           → List uploaded documents
        GET  /api/documents/{id}       → Get one document
        DELETE /api/documents/{id}     → Delete a document

Connections:
    - Uses: engine.py (LucaEngine.read_document for vision)
    - Uses: database.py (documents table)
    - Saves files to: uploads/receipts/ and uploads/documents/
    - Called by: frontend DocumentsPage (Module 12)

Vision extraction instruction (sent to llama3.2-vision):
    Extracts vendor, amount, date, and document type from any image.
    Returns structured JSON that the frontend uses to pre-fill
    the expense form, saving the user from manual data entry.
"""

import os
import uuid
import json
import re
from pathlib import Path
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from backend.app.database import get_db
from backend.app.luca.engine import luca
from backend.app.logger import get_logger

logger = get_logger()

router = APIRouter(prefix="/api/documents", tags=["documents"])

# Supported file types for upload
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf"}
MAX_FILE_SIZE_MB = 10

# Where files are saved (relative to project root)
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
RECEIPTS_DIR = PROJECT_ROOT / "uploads" / "receipts"
DOCUMENTS_DIR = PROJECT_ROOT / "uploads" / "documents"

# Vision extraction prompt — tells Luca what to extract and how to format it
EXTRACTION_INSTRUCTION = """
Extract all financial information from this document or receipt image.

Return a JSON object with exactly these fields:
{
  "vendor": "Business or store name (string, or null if not visible)",
  "amount": "Total amount as a number (float, or null if not visible)",
  "date": "Date in YYYY-MM-DD format (string, or null if not visible)",
  "doc_type": "One of: receipt, invoice, bank_statement, 1099, W2, other",
  "description": "Brief description of what was purchased (string, or null)",
  "confidence": "Your confidence in this extraction: high, medium, or low"
}

Return ONLY the JSON object. No explanation, no preamble, no markdown.
If a field is not visible or unclear, use null for that field.
"""


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    business_id: int = Form(...),
):
    """
    Upload a receipt or document and extract financial data using vision AI.

    Steps:
    1. Validate the file type and size
    2. Save the file to uploads/receipts/
    3. Run Luca's vision engine to extract financial data
    4. Save the document record to the database
    5. Return the extracted data + document ID

    The frontend uses the extracted data to pre-fill the expense form.
    """
    logger.info(f"Document upload: {file.filename} for business {business_id}")

    # ── Validate file ───────────────────────────────────────────────────────
    suffix = Path(file.filename).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type {suffix} not supported. Use: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Read file content
    content = await file.read()

    if len(content) > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE_MB}MB."
        )

    # ── Save file to disk ───────────────────────────────────────────────────
    RECEIPTS_DIR.mkdir(parents=True, exist_ok=True)

    # Generate unique filename to prevent collisions
    unique_name = f"{uuid.uuid4().hex}{suffix}"
    file_path = RECEIPTS_DIR / unique_name

    with open(file_path, "wb") as f:
        f.write(content)

    logger.info(f"File saved: {file_path}")

    # ── Run vision extraction (skip for PDFs — vision model handles images) ─
    extracted_data = {}
    extraction_success = False

    if suffix in {".jpg", ".jpeg", ".png", ".gif", ".webp"}:
        logger.info("Running Luca vision extraction...")
        result = await luca.read_document(
            image_path=str(file_path),
            instruction=EXTRACTION_INSTRUCTION
        )

        if result["success"]:
            # Parse the JSON from Luca's response
            try:
                raw = result["extracted_text"]
                json_match = re.search(r'\{.*\}', raw, re.DOTALL)
                if json_match:
                    extracted_data = json.loads(json_match.group())
                    extraction_success = True
                    logger.info(f"Vision extraction succeeded: {extracted_data}")
            except Exception as e:
                logger.warning(f"Could not parse vision JSON: {e} | raw: {raw[:200]}")
        else:
            logger.warning(f"Vision extraction failed: {result['error']}")
    else:
        # PDF — mark for manual review, vision support for PDFs coming in Phase 2
        extracted_data = {"doc_type": "pdf", "confidence": "low"}
        logger.info("PDF uploaded — vision extraction not yet supported, flagged for review")

    # ── Save to database ────────────────────────────────────────────────────
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO documents
                (business_id, filename, file_path, doc_type,
                 extracted_data, reviewed, created_at)
            VALUES (?, ?, ?, ?, ?, 0, datetime('now'))
        """, (
            business_id,
            file.filename,
            str(file_path),
            extracted_data.get("doc_type", "receipt"),
            json.dumps(extracted_data)
        ))
        conn.commit()
        doc_id = cursor.lastrowid

        logger.info(f"Document record saved — ID: {doc_id}")

    except Exception as e:
        conn.rollback()
        logger.error(f"Failed to save document record: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

    return {
        "success": True,
        "document_id": doc_id,
        "filename": file.filename,
        "file_path": str(file_path),
        "extraction_success": extraction_success,
        "extracted": extracted_data,
        "message": (
            "Luca extracted the financial data from your document."
            if extraction_success
            else "Document uploaded. Luca could not extract data — please fill in details manually."
        )
    }


@router.get("/")
def list_documents(business_id: int = None):
    """List uploaded documents, optionally filtered by business."""
    conn = get_db()
    try:
        if business_id:
            rows = conn.execute(
                "SELECT * FROM documents WHERE business_id = ? ORDER BY created_at DESC",
                (business_id,)
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM documents ORDER BY created_at DESC"
            ).fetchall()

        result = []
        for row in rows:
            doc = dict(row)
            # Parse extracted_data JSON string back to dict
            if doc.get("extracted_data"):
                try:
                    doc["extracted_data"] = json.loads(doc["extracted_data"])
                except Exception:
                    doc["extracted_data"] = {}
            result.append(doc)

        return result

    except Exception as e:
        logger.error(f"Failed to list documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.get("/{doc_id}")
def get_document(doc_id: int):
    """Get a single document by ID."""
    conn = get_db()
    try:
        row = conn.execute(
            "SELECT * FROM documents WHERE id = ?", (doc_id,)
        ).fetchone()

        if not row:
            raise HTTPException(status_code=404, detail=f"Document {doc_id} not found")

        doc = dict(row)
        if doc.get("extracted_data"):
            try:
                doc["extracted_data"] = json.loads(doc["extracted_data"])
            except Exception:
                doc["extracted_data"] = {}
        return doc

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get document {doc_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.delete("/{doc_id}")
def delete_document(doc_id: int):
    """Delete a document record (does not delete the file from disk)."""
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
        conn.commit()

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail=f"Document {doc_id} not found")

        logger.info(f"Document {doc_id} deleted")
        return {"success": True, "message": f"Document {doc_id} deleted"}

    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.error(f"Failed to delete document {doc_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()