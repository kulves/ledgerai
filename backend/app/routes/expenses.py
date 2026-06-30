"""
routes/expenses.py — Expense API Routes
=========================================
Purpose:
    Full CRUD (Create, Read, Update, Delete) for expense records.
    These are the routes the frontend calls when a user logs, views,
    edits, or deletes a financial transaction.

    Routes:
        POST   /api/expenses/           → Log a new expense
        GET    /api/expenses/           → List all expenses (with filters)
        GET    /api/expenses/{id}       → Get one expense by ID
        PUT    /api/expenses/{id}       → Update an expense
        DELETE /api/expenses/{id}       → Delete an expense

Connections:
    - Uses: database.py (get_db), models/expense.py (schemas)
    - Wired into: main.py via app.include_router()
    - Called by: frontend expense form (Module 10)
"""

from fastapi import APIRouter, HTTPException
from datetime import datetime
from backend.app.database import get_db
from backend.app.models.expense import ExpenseCreate, ExpenseUpdate, ExpenseResponse
from backend.app.logger import get_logger

logger = get_logger()

router = APIRouter(prefix="/api/expenses", tags=["expenses"])


@router.post("/", response_model=ExpenseResponse)
def create_expense(expense: ExpenseCreate):
    """
    Log a new expense.
    Called when the user submits the expense form in the frontend.
    """
    # ── Tier limit check (Bible Section 7 — Free tier: 25 tx/month) ────────
    from backend.app.models.license import TIER_LIMITS
    from datetime import date as _date

    today = _date.today()
    month_start = f"{today.year}-{today.month:02d}-01"

    limit_conn = get_db()
    try:
        license_row = limit_conn.execute("SELECT tier FROM license WHERE id = 1").fetchone()
        tier = license_row["tier"] if license_row else "free"
        tx_limit = TIER_LIMITS.get(tier, TIER_LIMITS["free"])["monthly_transactions"]

        if tx_limit is not None:
            tx_count = limit_conn.execute(
                "SELECT COUNT(*) AS c FROM expenses WHERE date >= ?", (month_start,)
            ).fetchone()["c"]

            if tx_count >= tx_limit:
                raise HTTPException(
                    status_code=402,
                    detail=(
                        f"You've reached your Free tier limit of {tx_limit} transactions "
                        f"this month. Upgrade to Growth ($19.99/month) for unlimited "
                        f"transactions, or wait until next month."
                    )
                )
    finally:
        limit_conn.close()
        
    logger.info(f"Creating expense: {expense.vendor} ${expense.amount}")

    conn = get_db()
    try:
        cursor = conn.cursor()
        now = datetime.utcnow().isoformat()

        cursor.execute("""
            INSERT INTO expenses
                (business_id, date, vendor, amount, category,
                 description, deductible, confidence, needs_review,
                 receipt_path, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            expense.business_id,
            expense.date,
            expense.vendor,
            expense.amount,
            expense.category,
            expense.description,
            1 if expense.deductible else 0,
            expense.confidence,
            1 if expense.needs_review else 0,
            expense.receipt_path,
            now,
            now
        ))
        conn.commit()

        # Fetch the newly created record to return it with its ID
        new_id = cursor.lastrowid
        row = conn.execute(
            "SELECT * FROM expenses WHERE id = ?", (new_id,)
        ).fetchone()

        logger.info(f"Expense created with ID: {new_id}")
        return dict(row)

    except Exception as e:
        conn.rollback()
        logger.error(f"Failed to create expense: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.get("/", response_model=list[ExpenseResponse])
def list_expenses(business_id: int = None, needs_review: bool = None):
    """
    List expenses. Optionally filter by business or review status.

    Query parameters (all optional):
        business_id:  Filter to one business only
        needs_review: Filter to expenses flagged for review
    """
    conn = get_db()
    try:
        query = "SELECT * FROM expenses WHERE 1=1"
        params = []

        if business_id is not None:
            query += " AND business_id = ?"
            params.append(business_id)

        if needs_review is not None:
            query += " AND needs_review = ?"
            params.append(1 if needs_review else 0)

        query += " ORDER BY date DESC, created_at DESC"

        rows = conn.execute(query, params).fetchall()
        logger.info(f"Listed {len(rows)} expenses")
        return [dict(row) for row in rows]

    except Exception as e:
        logger.error(f"Failed to list expenses: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.get("/{expense_id}", response_model=ExpenseResponse)
def get_expense(expense_id: int):
    """Get a single expense by its ID."""
    conn = get_db()
    try:
        row = conn.execute(
            "SELECT * FROM expenses WHERE id = ?", (expense_id,)
        ).fetchone()

        if not row:
            raise HTTPException(status_code=404, detail=f"Expense {expense_id} not found")

        return dict(row)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get expense {expense_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.put("/{expense_id}", response_model=ExpenseResponse)
def update_expense(expense_id: int, updates: ExpenseUpdate):
    """
    Update an existing expense.
    Only the fields you send are updated — others stay unchanged.
    """
    conn = get_db()
    try:
        # Build dynamic UPDATE query from only the fields that were sent
        fields = updates.model_dump(exclude_none=True)

        if not fields:
            raise HTTPException(status_code=400, detail="No fields provided to update")

        # Always update the updated_at timestamp
        fields["updated_at"] = datetime.utcnow().isoformat()

        # Convert booleans to integers for SQLite
        for key in ["deductible", "needs_review"]:
            if key in fields:
                fields[key] = 1 if fields[key] else 0

        set_clause = ", ".join(f"{k} = ?" for k in fields.keys())
        values = list(fields.values()) + [expense_id]

        cursor = conn.cursor()
        cursor.execute(
            f"UPDATE expenses SET {set_clause} WHERE id = ?", values
        )
        conn.commit()

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail=f"Expense {expense_id} not found")

        row = conn.execute(
            "SELECT * FROM expenses WHERE id = ?", (expense_id,)
        ).fetchone()

        logger.info(f"Expense {expense_id} updated")
        return dict(row)

    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.error(f"Failed to update expense {expense_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.delete("/{expense_id}")
def delete_expense(expense_id: int):
    """
    Delete an expense permanently.
    Returns a confirmation message.
    """
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM expenses WHERE id = ?", (expense_id,))
        conn.commit()

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail=f"Expense {expense_id} not found")

        logger.info(f"Expense {expense_id} deleted")
        return {"success": True, "message": f"Expense {expense_id} deleted"}

    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.error(f"Failed to delete expense {expense_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()