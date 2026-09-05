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

Updated to support PDF extraction via two paths:
  1. Text-based PDFs (Amazon receipts etc): pdfplumber extracts text directly
  2. Scanned PDFs: pdf2image converts to image, llama3.2-vision reads it
  3. Images (jpg/png): sent directly to llama3.2-vision as before
routes/documents.py — Document Upload & Vision Extraction
Improved PDF extraction with better amount detection and no vision fallback
for text-based PDFs (avoids memory errors with llama3.2-vision).

Also supports post-save editing: the extracted fields (vendor, amount,
date, doc_type, description) are a best guess from OCR/vision and are
often slightly wrong, so users can correct them from the Documents page,
and can open the original file (image or PDF) inline to check it against
what was extracted.
"""
 
import os
import uuid
import json
import re
import tempfile
from pathlib import Path
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from pydantic import BaseModel
from backend.app.database import get_db
from backend.app.luca.engine import luca
from backend.app.logger import get_logger
 
logger = get_logger()
router = APIRouter(prefix="/api/documents", tags=["documents"])
 
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf"}
MAX_FILE_SIZE_MB = 10
 
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
RECEIPTS_DIR = PROJECT_ROOT / "uploads" / "receipts"
POPPLER_PATH = str(PROJECT_ROOT / "poppler" / "poppler-24.08.0" / "Library" / "bin")
 
EXTRACTION_INSTRUCTION = """
Extract all financial information from this document or receipt image.
Return ONLY a JSON object with exactly these fields:
{
  "vendor": "Business or store name (string, or null if not visible)",
  "amount": "Total amount as a number (float, or null if not visible)",
  "date": "Date in YYYY-MM-DD format (string, or null if not visible)",
  "doc_type": "One of: receipt, invoice, bank_statement, 1099, W2, other",
  "description": "Brief description of what was purchased (string, or null)",
  "confidence": "high, medium, or low"
}
Return ONLY the JSON. No explanation. No markdown.
"""
 
TEXT_EXTRACTION_PROMPT = """You extract financial data from receipt text. Return ONLY valid JSON.
 
Receipt text:
{text}
 
Return exactly this JSON (fill in values, use null for missing):
{{"vendor": "store name or null", "amount": 99.99, "date": "YYYY-MM-DD", "doc_type": "receipt", "description": "what was bought", "confidence": "high"}}
 
Critical rules:
- amount: number only, no $ sign. Search for: Order Total, Grand Total, Total Due, Amount Due, Balance Due, TOTAL, Subtotal
- date: YYYY-MM-DD format only
- Return ONLY the JSON object, nothing else"""
 
 
def parse_json_response(raw: str) -> dict:
    """Try multiple strategies to parse JSON from LLM response."""
    if not raw:
        return {}
    # Strategy 1: direct parse
    try:
        return json.loads(raw.strip())
    except Exception:
        pass
    # Strategy 2: find JSON object in text
    try:
        m = re.search(r'\{[^{}]*\}', raw, re.DOTALL)
        if m:
            return json.loads(m.group())
    except Exception:
        pass
    # Strategy 3: strip markdown fences
    try:
        cleaned = re.sub(r'```json|```', '', raw).strip()
        return json.loads(cleaned)
    except Exception:
        pass
    # Strategy 4: regex field extraction
    result = {}
    for key, pattern in [
        ('vendor',      r'"vendor"\s*:\s*"([^"]+)"'),
        ('date',        r'"date"\s*:\s*"(\d{4}-\d{2}-\d{2})"'),
        ('doc_type',    r'"doc_type"\s*:\s*"([^"]+)"'),
        ('description', r'"description"\s*:\s*"([^"]+)"'),
        ('confidence',  r'"confidence"\s*:\s*"([^"]+)"'),
    ]:
        m = re.search(pattern, raw, re.IGNORECASE)
        if m:
            result[key] = m.group(1)
    m = re.search(r'"amount"\s*:\s*([\d.]+)', raw)
    if m:
        try:
            result['amount'] = float(m.group(1))
        except Exception:
            pass
    return result
 
 
def regex_extract_from_text(text: str) -> dict:
    """
    Direct regex extraction from PDF text — faster and more reliable
    than LLM for well-structured receipts. Used as primary or fallback.
    """
    result = {"doc_type": "receipt", "confidence": "medium"}
 
    # Amount — ordered by specificity
    amount_patterns = [
        r'(?:Order Total|Grand Total|Total Due|Amount Due|Balance Due|Total Amount)\s*:?\s*\$?\s*([\d,]+\.\d{2})',
        r'(?:^|\n)\s*Total\s*:?\s*\$?\s*([\d,]+\.\d{2})',
        r'TOTAL\s*\$?\s*([\d,]+\.\d{2})',
        r'\$\s*([\d,]+\.\d{2})\s*(?:USD)?\s*$',
    ]
    for pattern in amount_patterns:
        m = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
        if m:
            try:
                amt = float(m.group(1).replace(',', ''))
                if amt > 0:
                    result['amount'] = amt
                    result['confidence'] = 'high'
                    break
            except Exception:
                pass
 
    # Date
    date_patterns = [
        (r'(\d{4}[-/]\d{2}[-/]\d{2})', lambda m: m.group(1).replace('/', '-')),
        (r'(\d{1,2}[-/]\d{1,2}[-/]\d{4})', lambda m: None),  # skip, hard to normalize
        (r'((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4})', lambda m: m.group(1)),
    ]
    months = {'jan':'01','feb':'02','mar':'03','apr':'04','may':'05','jun':'06',
              'jul':'07','aug':'08','sep':'09','oct':'10','nov':'11','dec':'12'}
    for pattern, normalizer in date_patterns:
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            date_str = normalizer(m)
            if date_str and re.match(r'\d{4}-\d{2}-\d{2}', date_str):
                result['date'] = date_str
                break
            elif date_str:
                # Try to parse "April 6, 2026" style
                parts = re.split(r'[\s,]+', date_str)
                if len(parts) >= 3:
                    mon = months.get(parts[0][:3].lower())
                    if mon:
                        try:
                            result['date'] = f"{parts[2]}-{mon}-{int(parts[1]):02d}"
                            break
                        except Exception:
                            pass
 
    # Vendor
    for pattern in [
        r'(?:Sold by|Vendor|Merchant|Store|From|Bill From|Company)\s*:?\s*([^\n]+)',
        r'(?:Ship from|Shipped by)\s*:?\s*([^\n]+)',
    ]:
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            result['vendor'] = m.group(1).strip()[:80]
            break
    if 'vendor' not in result:
        lines = [l.strip() for l in text.split('\n') if l.strip() and len(l.strip()) > 3]
        if lines:
            result['vendor'] = lines[0][:80]
 
    # Description
    desc_patterns = [
        r'(?:Item|Product|Description|Purchased)\s*:?\s*([^\n]{5,80})',
        r'Order\s+#?\s*[\d-]+',
    ]
    for pattern in desc_patterns:
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            result['description'] = m.group(0).strip()[:120]
            break
 
    return result
 
 
def extract_pdf_text(file_path: str) -> str:
    """Extract text from PDF using pdfplumber."""
    try:
        import pdfplumber
        with pdfplumber.open(file_path) as pdf:
            text = ""
            for page in pdf.pages[:3]:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        return text.strip()
    except Exception as e:
        logger.warning(f"pdfplumber failed: {e}")
        return ""
 
 
def convert_pdf_to_image(file_path: str) -> str | None:
    """Convert first page of PDF to PNG. Returns temp file path or None."""
    try:
        from pdf2image import convert_from_path
        images = convert_from_path(
            file_path, first_page=1, last_page=1,
            dpi=200, poppler_path=POPPLER_PATH
        )
        if not images:
            return None
        tmp = tempfile.NamedTemporaryFile(suffix=".png", delete=False, dir=str(RECEIPTS_DIR))
        images[0].save(tmp.name, "PNG")
        logger.info(f"PDF→image: {tmp.name}")
        return tmp.name
    except Exception as e:
        logger.warning(f"PDF→image failed: {e}")
        return None
 
 
async def extract_from_file(file_path: str, suffix: str) -> tuple[dict, str]:
    """
    Main extraction dispatcher. Returns (extracted_data, method).
    """
    # ── Images: vision model ────────────────────────────────────────────────
    if suffix in {".jpg", ".jpeg", ".png", ".gif", ".webp"}:
        result = await luca.read_document(str(file_path), EXTRACTION_INSTRUCTION)
        if result["success"]:
            data = parse_json_response(result["extracted_text"])
            if data:
                return data, "vision"
        return {}, "failed"
 
    # ── PDFs: text first, vision only for scanned ───────────────────────────
    if suffix == ".pdf":
        text = extract_pdf_text(str(file_path))
 
        if text:
            logger.info(f"PDF text extracted: {len(text)} chars")
            # Try regex first (fast and reliable for structured receipts)
            regex_data = regex_extract_from_text(text)
            if regex_data.get('amount') and regex_data.get('vendor'):
                logger.info(f"Regex extraction: {regex_data}")
                return regex_data, "regex_text"
 
            # Try LLM if regex didn't get amount
            prompt = TEXT_EXTRACTION_PROMPT.format(text=text[:3000])
            result = await luca.chat(
                user_message="Extract financial data from this receipt.",
                system_prompt=prompt
            )
            if result["success"]:
                logger.info(f"LLM response: {result['response'][:200]}")
                llm_data = parse_json_response(result["response"])
                if llm_data.get('amount') or llm_data.get('vendor'):
                    # Merge with regex data (regex may have found things LLM missed)
                    merged = {**regex_data, **{k: v for k, v in llm_data.items() if v}}
                    logger.info(f"LLM extraction: {merged}")
                    return merged, "text_extraction"
 
            # Return regex data even if incomplete — better than nothing
            if regex_data.get('vendor') or regex_data.get('date'):
                return regex_data, "partial_text"
 
        else:
            # Scanned PDF: use vision
            logger.info("Scanned PDF — trying vision OCR")
            img_path = convert_pdf_to_image(str(file_path))
            if img_path:
                result = await luca.read_document(img_path, EXTRACTION_INSTRUCTION)
                try:
                    os.unlink(img_path)
                except Exception:
                    pass
                if result["success"]:
                    data = parse_json_response(result["extracted_text"])
                    if data:
                        return data, "vision_pdf"
 
    return {"doc_type": "pdf", "confidence": "low"}, "failed"
 
 
@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    business_id: int = Form(...),
):
    logger.info(f"Upload: {file.filename} for business {business_id}")
    suffix = Path(file.filename).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File type {suffix} not supported.")
 
    content = await file.read()
    if len(content) > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File too large. Max {MAX_FILE_SIZE_MB}MB.")
 
    RECEIPTS_DIR.mkdir(parents=True, exist_ok=True)
    unique_name = f"{uuid.uuid4().hex}{suffix}"
    file_path = RECEIPTS_DIR / unique_name
    with open(file_path, "wb") as f:
        f.write(content)
    logger.info(f"Saved: {file_path}")
 
    extracted_data, method = await extract_from_file(file_path, suffix)
    extraction_success = method != "failed" and bool(extracted_data)
 
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO documents (business_id, filename, file_path, doc_type,
                                   extracted_data, reviewed, created_at)
            VALUES (?, ?, ?, ?, ?, 0, datetime('now'))
        """, (
            business_id, file.filename, str(file_path),
            extracted_data.get("doc_type", "receipt"),
            json.dumps(extracted_data)
        ))
        conn.commit()
        doc_id = cursor.lastrowid
        logger.info(f"Document saved — ID: {doc_id}, method: {method}")
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
 
    return {
        "success": True,
        "document_id": doc_id,
        "filename": file.filename,
        "file_path": str(file_path),
        "extraction_success": extraction_success,
        "extraction_method": method,
        "extracted": extracted_data,
        "message": (
            "Luca extracted the financial data from your document."
            if extraction_success
            else "Document uploaded. Could not extract data automatically — please fill in details manually."
        )
    }
 
 
@router.get("/")
def list_documents(business_id: int = None):
    conn = get_db()
    try:
        query = "SELECT * FROM documents"
        params = []
        if business_id:
            query += " WHERE business_id = ?"
            params.append(business_id)
        query += " ORDER BY created_at DESC"
        rows = conn.execute(query, params).fetchall()
        result = []
        for row in rows:
            doc = dict(row)
            if doc.get("extracted_data"):
                try:
                    doc["extracted_data"] = json.loads(doc["extracted_data"])
                except Exception:
                    doc["extracted_data"] = {}
            result.append(doc)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
 
 
@router.get("/{doc_id}")
def get_document(doc_id: int):
    conn = get_db()
    try:
        row = conn.execute("SELECT * FROM documents WHERE id = ?", (doc_id,)).fetchone()
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
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
 
 
@router.get("/{doc_id}/file")
def get_document_file(doc_id: int):
    """
    Serve the original uploaded file so the frontend can preview it
    (inline image, or PDF in an <iframe>/<object>).
    """
    conn = get_db()
    try:
        row = conn.execute("SELECT file_path, filename FROM documents WHERE id = ?", (doc_id,)).fetchone()
    finally:
        conn.close()
 
    if not row:
        raise HTTPException(status_code=404, detail=f"Document {doc_id} not found")
 
    file_path = Path(row["file_path"])
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Original file is missing from disk")
 
    media_types = {
        ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
        ".gif": "image/gif", ".webp": "image/webp", ".pdf": "application/pdf",
    }
    media_type = media_types.get(file_path.suffix.lower(), "application/octet-stream")
 
    # inline (not attachment) so browsers render it instead of downloading it
    return FileResponse(
        path=str(file_path),
        media_type=media_type,
        headers={"Content-Disposition": f'inline; filename="{row["filename"]}"'}
    )
 
 
class DocumentUpdate(BaseModel):
    vendor: str | None = None
    amount: float | None = None
    date: str | None = None
    doc_type: str | None = None
    description: str | None = None
    reviewed: bool | None = None
 
 
@router.put("/{doc_id}")
def update_document(doc_id: int, update: DocumentUpdate):
    """
    Edit a document's extracted data after it's been saved — OCR/vision
    is a best guess, so users can correct vendor/amount/date/etc. here.
    """
    conn = get_db()
    try:
        row = conn.execute("SELECT * FROM documents WHERE id = ?", (doc_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail=f"Document {doc_id} not found")
 
        doc = dict(row)
        try:
            extracted = json.loads(doc.get("extracted_data") or "{}")
        except Exception:
            extracted = {}
 
        # Merge only the fields that were actually sent
        updates = update.model_dump(exclude_unset=True, exclude={"doc_type", "reviewed"})
        extracted.update({k: v for k, v in updates.items() if v is not None})
 
        new_doc_type = update.doc_type if update.doc_type is not None else doc["doc_type"]
        new_reviewed = int(update.reviewed) if update.reviewed is not None else doc["reviewed"]
 
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE documents
            SET doc_type = ?, extracted_data = ?, reviewed = ?
            WHERE id = ?
        """, (new_doc_type, json.dumps(extracted), new_reviewed, doc_id))
        conn.commit()
 
        updated = dict(conn.execute("SELECT * FROM documents WHERE id = ?", (doc_id,)).fetchone())
        updated["extracted_data"] = extracted
        return updated
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
 
 
@router.delete("/{doc_id}")
def delete_document(doc_id: int):
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
        conn.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail=f"Document {doc_id} not found")
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()