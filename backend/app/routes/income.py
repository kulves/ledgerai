"""
routes/income.py — Income Tracking Endpoints
=============================================
Handles manual income entry and income from 1099/invoice uploads.
Supports cash flow and P&L calculations.

Routes:
    POST   /api/income/           → Create income entry
    GET    /api/income/           → List income for a business
    DELETE /api/income/{id}       → Delete income entry
    GET    /api/income/summary    → Income summary for dashboard/reports
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from backend.app.database import get_db
from backend.app.logger import get_logger

logger = get_logger()
router = APIRouter(prefix="/api/income", tags=["income"])

INCOME_CATEGORIES = [
    'Consulting / Freelance Income',
    'Product Sales',
    'Service Revenue',
    '1099-NEC Income',
    '1099-MISC Income',
    'Rental Income',
    'Commission Income',
    'Investment Income',
    'Royalty Income',
    'Grant / Award Income',
    'Refunds / Reimbursements',
    'Other Income',
]


class IncomeCreate(BaseModel):
    business_id: int
    date: str
    source: str
    amount: float
    category: str = 'Other Income'
    description: Optional[str] = None
    doc_type: Optional[str] = 'manual'
    document_id: Optional[int] = None


@router.post("/")
def create_income(data: IncomeCreate):
    """Create a new income entry."""
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO income
                (business_id, date, source, amount, category,
                 description, doc_type, document_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        """, (
            data.business_id, data.date, data.source, data.amount,
            data.category, data.description, data.doc_type, data.document_id
        ))
        conn.commit()
        income_id = cursor.lastrowid
        row = conn.execute("SELECT * FROM income WHERE id = ?", (income_id,)).fetchone()
        logger.info(f"Income created: ${data.amount} from {data.source}")
        return dict(row)
    except Exception as e:
        conn.rollback()
        logger.error(f"Failed to create income: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.get("/")
def list_income(business_id: int, start_date: str = None, end_date: str = None):
    """List all income entries for a business, optionally filtered by date."""
    conn = get_db()
    try:
        query = "SELECT * FROM income WHERE business_id = ?"
        params = [business_id]
        if start_date:
            query += " AND date >= ?"
            params.append(start_date)
        if end_date:
            query += " AND date <= ?"
            params.append(end_date)
        query += " ORDER BY date DESC, created_at DESC"
        rows = conn.execute(query, params).fetchall()
        return [dict(r) for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.get("/summary")
def get_income_summary(business_id: int, start_date: str = None, end_date: str = None):
    """
    Return income summary for dashboard and reports.
    Includes total income, by category, and monthly breakdown.
    """
    conn = get_db()
    try:
        from datetime import date
        today = date.today()
        start = start_date or f"{today.year}-01-01"
        end = end_date or today.isoformat()

        # Total income
        total = conn.execute("""
            SELECT COALESCE(SUM(amount), 0) AS total
            FROM income
            WHERE business_id = ? AND date BETWEEN ? AND ?
        """, (business_id, start, end)).fetchone()["total"]

        # By category
        by_cat = conn.execute("""
            SELECT category, COALESCE(SUM(amount), 0) AS total
            FROM income
            WHERE business_id = ? AND date BETWEEN ? AND ?
            GROUP BY category ORDER BY total DESC
        """, (business_id, start, end)).fetchall()

        # Monthly breakdown
        by_month = conn.execute("""
            SELECT strftime('%Y-%m', date) AS month,
                   COALESCE(SUM(amount), 0) AS total
            FROM income
            WHERE business_id = ? AND date BETWEEN ? AND ?
            GROUP BY month ORDER BY month
        """, (business_id, start, end)).fetchall()

        return {
            "total_income": round(float(total), 2),
            "by_category": {r["category"]: round(float(r["total"]), 2) for r in by_cat},
            "by_month": {r["month"]: round(float(r["total"]), 2) for r in by_month},
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.delete("/{income_id}")
def delete_income(income_id: int):
    """Delete an income entry."""
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM income WHERE id = ?", (income_id,))
        conn.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Income entry not found")
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.get("/categories")
def get_income_categories():
    """Return the list of available income categories."""
    return {"categories": INCOME_CATEGORIES}