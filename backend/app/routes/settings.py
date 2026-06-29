"""
routes/settings.py — App Settings & Data Management
======================================================
Purpose:
    Handles settings operations: viewing app info, managing businesses,
    and data management (backup export, clear data).

    Routes:
        GET    /api/settings/info              → App version, model, stats
        GET    /api/settings/businesses        → List all businesses
        PUT    /api/settings/businesses/{id}   → Update a business
        DELETE /api/settings/businesses/{id}   → Deactivate a business
        GET    /api/settings/stats             → Database stats
        DELETE /api/settings/clear             → Clear all data (with confirmation)

Connections:
    - Uses: database.py, config.py
    - Called by: frontend SettingsPage (Module 16)
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from backend.app.database import get_db
from backend.app.config import get_settings
from backend.app.logger import get_logger

logger = get_logger()
config = get_settings()

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("/info")
def get_app_info():
    """
    Return app version, AI model, and basic configuration.
    Shown at the top of the Settings page.
    """
    conn = get_db()
    try:
        biz_count = conn.execute(
            "SELECT COUNT(*) AS c FROM businesses WHERE is_active = 1"
        ).fetchone()["c"]
        exp_count = conn.execute(
            "SELECT COUNT(*) AS c FROM expenses"
        ).fetchone()["c"]
        mil_count = conn.execute(
            "SELECT COUNT(*) AS c FROM mileage_trips"
        ).fetchone()["c"]
        doc_count = conn.execute(
            "SELECT COUNT(*) AS c FROM documents"
        ).fetchone()["c"]

        return {
            "app_name":        config.app_name,
            "app_version":     config.version,
            "ai_model":        config.ollama_model,
            "ollama_url":      config.ollama_base_url,
            "database_path":   config.database_path,
            "stats": {
                "businesses": biz_count,
                "expenses":   exp_count,
                "mileage":    mil_count,
                "documents":  doc_count,
            }
        }
    except Exception as e:
        logger.error(f"Settings info error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


class BusinessUpdate(BaseModel):
    name:        Optional[str] = None
    entity_type: Optional[str] = None
    state:       Optional[str] = None


@router.put("/businesses/{business_id}")
def update_business(business_id: int, updates: BusinessUpdate):
    """Update a business name, entity type, or state."""
    conn = get_db()
    try:
        fields = updates.model_dump(exclude_none=True)
        if not fields:
            raise HTTPException(status_code=400, detail="No fields to update")

        set_clause = ", ".join(f"{k} = ?" for k in fields)
        values = list(fields.values()) + [business_id]

        cursor = conn.cursor()
        cursor.execute(
            f"UPDATE businesses SET {set_clause} WHERE id = ?", values
        )
        conn.commit()

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Business not found")

        row = conn.execute(
            "SELECT * FROM businesses WHERE id = ?", (business_id,)
        ).fetchone()
        logger.info(f"Business {business_id} updated")
        return dict(row)

    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.error(f"Business update error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.delete("/businesses/{business_id}")
def deactivate_business(business_id: int):
    """
    Deactivate a business — marks is_active=0 but keeps all data.
    Per Bible Section 7.2 — nothing is ever deleted from Ledger AI.
    """
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE businesses SET is_active = 0 WHERE id = ?",
            (business_id,)
        )
        conn.commit()

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Business not found")

        logger.info(f"Business {business_id} deactivated")
        return {"success": True, "message": "Business deactivated. All data preserved."}

    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.error(f"Business deactivate error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.get("/stats")
def get_stats():
    """Detailed database statistics for the Settings page."""
    conn = get_db()
    try:
        # Expenses by category
        by_category = conn.execute("""
            SELECT category, COUNT(*) AS count, SUM(amount) AS total
            FROM expenses
            GROUP BY category
            ORDER BY total DESC
        """).fetchall()

        # Mileage by type
        by_type = conn.execute("""
            SELECT trip_type, COUNT(*) AS count, SUM(miles) AS miles
            FROM mileage_trips
            GROUP BY trip_type
        """).fetchall()

        # Total counts
        totals = conn.execute("""
            SELECT
                (SELECT COUNT(*) FROM businesses WHERE is_active=1) AS businesses,
                (SELECT COUNT(*) FROM expenses)                     AS expenses,
                (SELECT COUNT(*) FROM mileage_trips)               AS mileage,
                (SELECT COUNT(*) FROM documents)                   AS documents,
                (SELECT COALESCE(SUM(amount),0) FROM expenses)     AS total_logged
        """).fetchone()

        return {
            "totals":         dict(totals),
            "by_category":    [dict(r) for r in by_category],
            "by_mileage_type":[dict(r) for r in by_type],
        }
    except Exception as e:
        logger.error(f"Stats error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


class ClearRequest(BaseModel):
    confirmation: str  # Must equal "DELETE ALL MY DATA" to proceed


@router.delete("/clear")
def clear_all_data(request: ClearRequest):
    """
    Permanently delete ALL user data.
    Requires exact confirmation string for safety.
    This is the nuclear option — used only when a user
    wants to start completely fresh.
    """
    if request.confirmation != "DELETE ALL MY DATA":
        raise HTTPException(
            status_code=400,
            detail="Confirmation string does not match. No data was deleted."
        )

    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM documents")
        cursor.execute("DELETE FROM mileage_trips")
        cursor.execute("DELETE FROM expenses")
        cursor.execute("DELETE FROM businesses")
        conn.commit()

        logger.warning("ALL USER DATA CLEARED by user request")
        return {
            "success": True,
            "message": "All data has been permanently deleted."
        }
    except Exception as e:
        conn.rollback()
        logger.error(f"Clear data error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()