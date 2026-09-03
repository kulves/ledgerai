"""
routes/dashboard.py — Dashboard Summary Endpoint
==================================================
Purpose:
    Returns all the numbers the dashboard needs in a single API call.
    Aggregates data from expenses, mileage, and documents for the
    selected business — current month, current year, and recent activity.

    One endpoint returns everything so the dashboard loads fast
    with a single network request instead of 4-5 separate calls.

    Route:
        GET /api/dashboard/?business_id=1

Connections:
    - Uses: database.py
    - Called by: frontend DashboardPage (Module 14)
"""

from fastapi import APIRouter, HTTPException
from datetime import date
from backend.app.database import get_db
from backend.app.logger import get_logger

logger = get_logger()
router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/")
def get_dashboard(business_id: int):
    """
    Return all dashboard data for a business in one call:
    - Year-to-date expense and deduction totals
    - Current month expense total
    - Mileage summary (year to date)
    - Recent expenses (last 5)
    - Recent mileage trips (last 3)
    - Document count
    - Expenses needing review
    """
    today = date.today()
    year_start  = f"{today.year}-01-01"
    month_start = f"{today.year}-{today.month:02d}-01"
    today_str   = today.isoformat()

    logger.info(f"Dashboard request for business {business_id}")

    conn = get_db()
    try:
        # ── Verify business exists ─────────────────────────────────────────
        business = conn.execute(
            "SELECT * FROM businesses WHERE id = ?", (business_id,)
        ).fetchone()
        if not business:
            raise HTTPException(status_code=404, detail="Business not found")

        # ── Year-to-date expense totals ────────────────────────────────────
        ytd = conn.execute("""
            SELECT
                COUNT(*)                                          AS expense_count,
                COALESCE(SUM(amount), 0)                         AS total_expenses,
                COALESCE(SUM(
                    CASE
                        WHEN deductible=1 AND category LIKE '%Meals%' THEN amount * 0.5
                        WHEN deductible=1 THEN amount
                        ELSE 0
                    END
                    ), 0) AS total_deductible,
                COALESCE(SUM(CASE WHEN needs_review=1 THEN 1 ELSE 0 END), 0)
                                                                  AS needs_review_count
            FROM expenses
            WHERE business_id = ? AND date BETWEEN ? AND ?
        """, (business_id, year_start, today_str)).fetchone()

        # ── This month's expenses ──────────────────────────────────────────
        month = conn.execute("""
            SELECT COALESCE(SUM(amount), 0) AS month_total
            FROM expenses
            WHERE business_id = ? AND date >= ?
        """, (business_id, month_start)).fetchone()

        # ── Year-to-date mileage ───────────────────────────────────────────
        mileage = conn.execute("""
            SELECT
                COUNT(*)                                  AS trip_count,
                COALESCE(SUM(miles), 0)                   AS total_miles,
                COALESCE(SUM(deduction_amount), 0)        AS total_deduction
            FROM mileage_trips
            WHERE business_id = ? AND date BETWEEN ? AND ?
              AND trip_type = 'business'
        """, (business_id, year_start, today_str)).fetchone()

        # ── Total deductions (expenses + mileage) ─────────────────────────
        total_deductions = round(
            float(ytd["total_deductible"]) + float(mileage["total_deduction"]), 2
        )
        # ── Year-to-date income ────────────────────────────────────────────────
        try:
            income = conn.execute("""
                SELECT COALESCE(SUM(amount), 0) AS total_income
                FROM income
                WHERE business_id = ? AND date BETWEEN ? AND ?
            """, (business_id, year_start, today_str)).fetchone()
            total_income = round(float(income["total_income"]), 2)
        except Exception:
            total_income = 0.0
        net_profit = round(total_income - float(ytd["total_expenses"]), 2)

        # ── Recent expenses (last 5) ───────────────────────────────────────
        recent_expenses = conn.execute("""
            SELECT id, date, vendor, amount, category, deductible, needs_review
            FROM expenses
            WHERE business_id = ?
            ORDER BY date DESC, created_at DESC
            LIMIT 5
        """, (business_id,)).fetchall()

        # ── Recent mileage trips (last 3) ─────────────────────────────────
        recent_mileage = conn.execute("""
            SELECT id, date, purpose, miles, trip_type, deduction_amount
            FROM mileage_trips
            WHERE business_id = ?
            ORDER BY date DESC, created_at DESC
            LIMIT 3
        """, (business_id,)).fetchall()

        # ── Document count ─────────────────────────────────────────────────
        doc_count = conn.execute(
            "SELECT COUNT(*) AS count FROM documents WHERE business_id = ?",
            (business_id,)
        ).fetchone()["count"]

        # Monthly breakdowns for Live Trend chart
        monthly_expenses = conn.execute("""
            SELECT strftime('%Y-%m', date) AS month,
                   COALESCE(SUM(amount), 0) AS total,
                   COALESCE(SUM(CASE
                       WHEN deductible=1 AND category LIKE '%Meal%' THEN amount*0.5
                       WHEN deductible=1 THEN amount ELSE 0
                   END), 0) AS deductions
            FROM expenses
            WHERE business_id = ? AND date BETWEEN ? AND ?
            GROUP BY month ORDER BY month
        """, (business_id, year_start, today_str)).fetchall()

        monthly_mileage = conn.execute("""
            SELECT strftime('%Y-%m', date) AS month,
                   COALESCE(SUM(deduction_amount), 0) AS deduction
            FROM mileage_trips
            WHERE business_id = ? AND date BETWEEN ? AND ?
              AND trip_type = 'business'
            GROUP BY month ORDER BY month
        """, (business_id, year_start, today_str)).fetchall()

        monthly_income_rows = []
        try:
            monthly_income_rows = conn.execute("""
                SELECT strftime('%Y-%m', date) AS month,
                       COALESCE(SUM(amount), 0) AS total
                FROM income
                WHERE business_id = ? AND date BETWEEN ? AND ?
                GROUP BY month ORDER BY month
            """, (business_id, year_start, today_str)).fetchall()
        except Exception:
            pass

        all_months = sorted(set(
            [r['month'] for r in monthly_expenses] +
            [r['month'] for r in monthly_mileage] +
            [r['month'] for r in monthly_income_rows]
        ))
        exp_by_month = {r['month']: float(r['total'])     for r in monthly_expenses}
        ded_by_month = {r['month']: float(r['deductions']) for r in monthly_expenses}
        mil_by_month = {r['month']: float(r['deduction'])  for r in monthly_mileage}
        inc_by_month = {r['month']: float(r['total'])      for r in monthly_income_rows}

        monthly_chart = {
            'months':     all_months,
            'expenses':   [exp_by_month.get(m, 0) for m in all_months],
            'deductions': [ded_by_month.get(m, 0) + mil_by_month.get(m, 0) for m in all_months],
            'income':     [inc_by_month.get(m, 0) for m in all_months],
            'cashflow':   [inc_by_month.get(m, 0) - exp_by_month.get(m, 0) for m in all_months],
        }

        return {
            "business":  dict(business),
            "period":    {"year_start": year_start, "today": today_str},
            "ytd": {
                "expense_count":      ytd["expense_count"],
                "total_expenses":     round(float(ytd["total_expenses"]), 2),
                "total_deductible":   round(float(ytd["total_deductible"]), 2),
                "needs_review_count": ytd["needs_review_count"],
                "total_deductions":   total_deductions,
                "total_income":       total_income,
                "net_profit":         net_profit,
            },
            "month": {
                "total_expenses": round(float(month["month_total"]), 2),
                "label": today.strftime("%B %Y"),
            },
            "mileage": {
                "trip_count":      mileage["trip_count"],
                "total_miles":     round(float(mileage["total_miles"]), 1),
                "total_deduction": round(float(mileage["total_deduction"]), 2),
            },
            "recent_expenses": [dict(e) for e in recent_expenses],
            "recent_mileage":  [dict(m) for m in recent_mileage],
            "document_count":  doc_count,
            "monthly_chart":   monthly_chart,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Dashboard error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()