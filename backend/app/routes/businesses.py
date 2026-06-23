"""
routes/businesses.py — Business API Routes
============================================
Purpose:
    CRUD routes for managing business entities.
    Users set up their businesses during onboarding — each business
    gets its own state tax rules, expense tracking, and reports.
"""

from fastapi import APIRouter, HTTPException
from backend.app.database import get_db
from backend.app.models.business import BusinessCreate, BusinessResponse
from backend.app.logger import get_logger

logger = get_logger()

router = APIRouter(prefix="/api/businesses", tags=["businesses"])


@router.post("/", response_model=BusinessResponse)
def create_business(business: BusinessCreate):
    """Create a new business entity."""
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO businesses (name, entity_type, state)
            VALUES (?, ?, ?)
        """, (business.name, business.entity_type, business.state))
        conn.commit()

        new_id = cursor.lastrowid
        row = conn.execute(
            "SELECT * FROM businesses WHERE id = ?", (new_id,)
        ).fetchone()

        logger.info(f"Business created: {business.name} (ID: {new_id})")
        return dict(row)

    except Exception as e:
        conn.rollback()
        logger.error(f"Failed to create business: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.get("/", response_model=list[BusinessResponse])
def list_businesses():
    """List all active businesses."""
    conn = get_db()
    try:
        rows = conn.execute(
            "SELECT * FROM businesses WHERE is_active = 1 ORDER BY name"
        ).fetchall()
        return [dict(row) for row in rows]
    except Exception as e:
        logger.error(f"Failed to list businesses: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.get("/{business_id}", response_model=BusinessResponse)
def get_business(business_id: int):
    """Get a single business by ID."""
    conn = get_db()
    try:
        row = conn.execute(
            "SELECT * FROM businesses WHERE id = ?", (business_id,)
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail=f"Business {business_id} not found")
        return dict(row)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get business {business_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()