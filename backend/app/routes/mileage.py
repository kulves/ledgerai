"""
routes/mileage.py — Mileage Tracking API Routes
==================================================
Purpose:
    CRUD routes for mileage trip records.
    Automatically calculates the IRS deduction amount based on
    trip type and the 2026 standard mileage rates.

    Routes:
        POST   /api/mileage/         → Log a new mileage trip
        GET    /api/mileage/         → List all trips (filterable)
        GET    /api/mileage/{id}     → Get one trip
        DELETE /api/mileage/{id}     → Delete a trip
        GET    /api/mileage/summary  → Total miles + deduction by type

Connections:
    - Uses: database.py, models/mileage.py
    - Wired into: main.py via app.include_router()
    - Called by: frontend MileagePage (Module 11)
"""

from fastapi import APIRouter, HTTPException
from backend.app.database import get_db
from backend.app.models.mileage import MileageTripCreate, MileageTripResponse, MILEAGE_RATES
from backend.app.logger import get_logger

logger = get_logger()

router = APIRouter(prefix="/api/mileage", tags=["mileage"])


def calculate_deduction(miles: float, trip_type: str) -> float | None:
    """
    Calculate the IRS standard mileage deduction.
    Returns None for personal trips (not deductible).
    """
    rate = MILEAGE_RATES.get(trip_type)
    if rate is None:
        return None  # personal — not deductible
    return round(miles * rate, 2)


@router.post("/", response_model=MileageTripResponse)
def create_mileage_trip(trip: MileageTripCreate):
    """
    Log a new mileage trip.
    Deduction amount is calculated automatically from miles + trip type.
    """
    logger.info(f"Logging mileage trip: {trip.miles} miles, {trip.trip_type}")

    deduction = calculate_deduction(trip.miles, trip.trip_type)

    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO mileage_trips
                (business_id, date, purpose, miles, trip_type, deduction_amount, created_at)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
        """, (
            trip.business_id,
            trip.date,
            trip.purpose,
            trip.miles,
            trip.trip_type,
            deduction
        ))
        conn.commit()

        new_id = cursor.lastrowid
        row = conn.execute(
            "SELECT * FROM mileage_trips WHERE id = ?", (new_id,)
        ).fetchone()

        logger.info(f"Mileage trip created — ID: {new_id}, deduction: ${deduction}")
        return dict(row)

    except Exception as e:
        conn.rollback()
        logger.error(f"Failed to create mileage trip: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.get("/summary")
def get_mileage_summary(business_id: int):
    """
    Get total miles and deduction amounts grouped by trip type.
    Used for the dashboard summary card and reports.

    IMPORTANT: This route must be defined BEFORE /{trip_id}
    so FastAPI doesn't interpret 'summary' as an integer ID.
    """
    conn = get_db()
    try:
        rows = conn.execute("""
            SELECT
                trip_type,
                COUNT(*)        AS trip_count,
                SUM(miles)      AS total_miles,
                SUM(deduction_amount) AS total_deduction
            FROM mileage_trips
            WHERE business_id = ?
            GROUP BY trip_type
        """, (business_id,)).fetchall()

        summary = {}
        for row in rows:
            summary[row["trip_type"]] = {
                "trip_count":       row["trip_count"],
                "total_miles":      round(row["total_miles"] or 0, 1),
                "total_deduction":  round(row["total_deduction"] or 0, 2)
            }

        # Add current IRS rates to the response so frontend always shows correct rates
        summary["rates"] = MILEAGE_RATES
        logger.info(f"Mileage summary for business {business_id}: {summary}")
        return summary

    except Exception as e:
        logger.error(f"Failed to get mileage summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.get("/", response_model=list[MileageTripResponse])
def list_mileage_trips(business_id: int = None, trip_type: str = None):
    """List mileage trips. Optionally filter by business or trip type."""
    conn = get_db()
    try:
        query = "SELECT * FROM mileage_trips WHERE 1=1"
        params = []

        if business_id is not None:
            query += " AND business_id = ?"
            params.append(business_id)

        if trip_type is not None:
            query += " AND trip_type = ?"
            params.append(trip_type)

        query += " ORDER BY date DESC, created_at DESC"

        rows = conn.execute(query, params).fetchall()
        logger.info(f"Listed {len(rows)} mileage trips")
        return [dict(row) for row in rows]

    except Exception as e:
        logger.error(f"Failed to list mileage trips: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.get("/{trip_id}", response_model=MileageTripResponse)
def get_mileage_trip(trip_id: int):
    """Get a single mileage trip by ID."""
    conn = get_db()
    try:
        row = conn.execute(
            "SELECT * FROM mileage_trips WHERE id = ?", (trip_id,)
        ).fetchone()

        if not row:
            raise HTTPException(status_code=404, detail=f"Trip {trip_id} not found")

        return dict(row)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get mileage trip {trip_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.delete("/{trip_id}")
def delete_mileage_trip(trip_id: int):
    """Delete a mileage trip."""
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM mileage_trips WHERE id = ?", (trip_id,))
        conn.commit()

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail=f"Trip {trip_id} not found")

        logger.info(f"Mileage trip {trip_id} deleted")
        return {"success": True, "message": f"Trip {trip_id} deleted"}

    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.error(f"Failed to delete mileage trip {trip_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()