"""
routes/corrections.py — Corrections Log & Anonymized Pattern Sync
====================================================================
Purpose:
    Captures every time a user corrects something Luca got wrong — a
    category suggestion, an OCR-extracted field, or a split of a
    mis-categorized expense. This is the "Luca learns from corrections"
    feature: the first step is just reliably capturing these signals.

    Routes:
        POST /api/corrections                    → Log one correction (full local detail)
        GET  /api/corrections/telemetry-settings  → Read the sync toggle + endpoint
        PUT  /api/corrections/telemetry-settings  → Update the sync toggle + endpoint
        POST /api/corrections/sync                → Attempt to sync unsynced corrections

Privacy design (important — read before changing this file):
    Corrections are stored LOCALLY in full detail (useful for future
    per-user personalization — Luca learning an individual user's own
    patterns). But only a stripped payload is ever eligible for sync to
    the central system, and only if the user has opted in:

    SENT (if sync is on):
        - correction_type, category_before, category_after
        - amount (a number is not identifying on its own)
        - confidence, created_at

    NEVER SENT, under any configuration:
        - vendor name, description, notes, business name
        - account numbers, receipt files, anything free-text

    That's why category-type corrections carry category_before/after,
    but OCR field corrections (vendor/date) only log that a correction
    of that type happened — never the actual text that was corrected.

Connections:
    - Uses: database.py (corrections, telemetry_settings tables)
    - Called by: ExpenseForm, ExpensesPage, ExpenseList, DocumentsPage
      (whenever a correction is detected), SettingsPage (toggle UI)
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import httpx
from backend.app.database import get_db
from backend.app.logger import get_logger

logger = get_logger()
router = APIRouter(prefix="/api/corrections", tags=["corrections"])


class CorrectionLog(BaseModel):
    business_id: Optional[int] = None
    correction_type: str   # 'category_correction' | 'ocr_vendor_correction' |
                            # 'ocr_amount_correction' | 'ocr_date_correction' | 'split_correction'
    category_before: Optional[str] = None
    category_after: Optional[str] = None
    amount: Optional[float] = None
    confidence: Optional[str] = None


@router.post("/")
def log_correction(correction: CorrectionLog):
    """
    Log a correction. Fire-and-forget from the frontend's perspective —
    this is telemetry, not core functionality, so callers should not
    block the UI or surface errors to the user if this fails.
    """
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO corrections
                (business_id, correction_type, category_before, category_after, amount, confidence)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            correction.business_id,
            correction.correction_type,
            correction.category_before,
            correction.category_after,
            correction.amount,
            correction.confidence,
        ))
        conn.commit()
        return {"success": True, "id": cursor.lastrowid}
    except Exception as e:
        logger.error(f"Failed to log correction: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


class TelemetrySettingsUpdate(BaseModel):
    share_corrections: Optional[bool] = None
    sync_endpoint: Optional[str] = None


@router.get("/telemetry-settings")
def get_telemetry_settings():
    conn = get_db()
    try:
        row = conn.execute("SELECT * FROM telemetry_settings WHERE id = 1").fetchone()
        return dict(row) if row else {"share_corrections": True, "sync_endpoint": None, "last_synced_at": None}
    finally:
        conn.close()


@router.put("/telemetry-settings")
def update_telemetry_settings(update: TelemetrySettingsUpdate):
    conn = get_db()
    try:
        current = conn.execute("SELECT * FROM telemetry_settings WHERE id = 1").fetchone()
        current = dict(current) if current else {"share_corrections": True, "sync_endpoint": None}

        share = update.share_corrections if update.share_corrections is not None else current["share_corrections"]
        endpoint = update.sync_endpoint if update.sync_endpoint is not None else current["sync_endpoint"]

        conn.execute("""
            UPDATE telemetry_settings SET share_corrections = ?, sync_endpoint = ? WHERE id = 1
        """, (1 if share else 0, endpoint))
        conn.commit()

        row = conn.execute("SELECT * FROM telemetry_settings WHERE id = 1").fetchone()
        return dict(row)
    finally:
        conn.close()


@router.post("/sync")
def sync_corrections():
    """
    Best-effort sync of unsynced, anonymized corrections to the central
    endpoint. No-ops quietly (not an error) if sharing is off or no
    endpoint is configured yet — that's the expected state until a real
    collection server exists.
    """
    conn = get_db()
    try:
        settings = conn.execute("SELECT * FROM telemetry_settings WHERE id = 1").fetchone()
        settings = dict(settings) if settings else {}

        if not settings.get("share_corrections"):
            return {"success": True, "synced": 0, "reason": "sharing_disabled"}
        if not settings.get("sync_endpoint"):
            return {"success": True, "synced": 0, "reason": "no_endpoint_configured"}

        rows = conn.execute(
            "SELECT * FROM corrections WHERE synced = 0 ORDER BY id LIMIT 500"
        ).fetchall()
        if not rows:
            return {"success": True, "synced": 0, "reason": "nothing_to_sync"}

        # Strip to exactly the anonymized fields — never business_id, never
        # anything that could later be joined back to a specific user.
        payload = {
            "events": [
                {
                    "correction_type": r["correction_type"],
                    "category_before": r["category_before"],
                    "category_after": r["category_after"],
                    "amount": r["amount"],
                    "confidence": r["confidence"],
                    "created_at": r["created_at"],
                }
                for r in rows
            ]
        }

        try:
            resp = httpx.post(settings["sync_endpoint"], json=payload, timeout=10.0)
            resp.raise_for_status()
        except Exception as e:
            logger.warning(f"Correction sync failed (will retry later): {e}")
            return {"success": False, "synced": 0, "reason": "network_error"}

        ids = [r["id"] for r in rows]
        placeholders = ",".join("?" * len(ids))
        conn.execute(f"UPDATE corrections SET synced = 1 WHERE id IN ({placeholders})", ids)
        conn.execute(
            "UPDATE telemetry_settings SET last_synced_at = ? WHERE id = 1",
            (datetime.utcnow().isoformat(),)
        )
        conn.commit()

        logger.info(f"Synced {len(ids)} anonymized correction event(s)")
        return {"success": True, "synced": len(ids)}

    finally:
        conn.close()