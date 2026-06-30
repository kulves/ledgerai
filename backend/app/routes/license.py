"""
routes/license.py — Subscription Tier & License Management
==============================================================
Purpose:
    Manages the user's subscription tier. Free tier limits are
    enforced by counting real usage (expenses this month, OCR
    uploads this month) against TIER_LIMITS — no separate counter
    table to keep in sync, just the source of truth.

    Routes:
        GET  /api/license/status     → Current tier + usage + limits
        POST /api/license/activate   → Activate a license key
        POST /api/license/checkout   → Create Stripe checkout session
        POST /api/license/downgrade  → Revert to Free tier (testing/cancel)

Connections:
    - Uses: database.py (license table + expenses/documents for usage counts)
    - Used by: routes/expenses.py, routes/documents.py (limit checks)
    - Called by: frontend SubscriptionPage (Module 17)

License key format (simple, local validation):
    Real implementation would verify against Stripe subscription status.
    For Phase 1, license keys are validated using a signed format:
    LEDGERAI-{TIER}-{SIGNATURE}, checked against LICENSE_SIGNING_KEY.
"""

import hashlib
from datetime import date
from fastapi import APIRouter, HTTPException
from backend.app.database import get_db
from backend.app.config import get_settings
from backend.app.models.license import (
    LicenseStatus, ActivateLicenseRequest, CheckoutRequest,
    TIER_LIMITS, VALID_TIERS
)
from backend.app.logger import get_logger

logger = get_logger()
config = get_settings()

router = APIRouter(prefix="/api/license", tags=["license"])


def get_current_usage(conn, month_start: str) -> dict:
    """Count actual usage this month from real data — no separate tracker."""
    tx_count = conn.execute(
        "SELECT COUNT(*) AS c FROM expenses WHERE date >= ?", (month_start,)
    ).fetchone()["c"]

    ocr_count = conn.execute(
        "SELECT COUNT(*) AS c FROM documents WHERE created_at >= ?", (month_start,)
    ).fetchone()["c"]

    biz_count = conn.execute(
        "SELECT COUNT(*) AS c FROM businesses WHERE is_active = 1"
    ).fetchone()["c"]

    return {"tx": tx_count, "ocr": ocr_count, "businesses": biz_count}


def get_license_row(conn) -> dict:
    row = conn.execute("SELECT * FROM license WHERE id = 1").fetchone()
    return dict(row) if row else {"tier": "free", "license_key": None, "activated_at": None}


@router.get("/status", response_model=LicenseStatus)
def get_status():
    """Return current tier, limits, and real usage for this month."""
    today = date.today()
    month_start = f"{today.year}-{today.month:02d}-01"

    conn = get_db()
    try:
        license_row = get_license_row(conn)
        tier = license_row.get("tier", "free")
        if tier not in TIER_LIMITS:
            tier = "free"

        limits = TIER_LIMITS[tier]
        usage = get_current_usage(conn, month_start)

        tx_limit  = limits["monthly_transactions"]
        ocr_limit = limits["monthly_ocr_uploads"]
        biz_limit = limits["max_businesses"]

        return LicenseStatus(
            tier=tier,
            tier_label=limits["label"],
            monthly_tx_limit=tx_limit,
            monthly_tx_used=usage["tx"],
            monthly_ocr_limit=ocr_limit,
            monthly_ocr_used=usage["ocr"],
            max_businesses=biz_limit,
            businesses_used=usage["businesses"],
            is_at_tx_limit=(tx_limit is not None and usage["tx"] >= tx_limit),
            is_at_ocr_limit=(ocr_limit is not None and usage["ocr"] >= ocr_limit),
            is_at_business_limit=(usage["businesses"] >= biz_limit),
            activated_at=license_row.get("activated_at"),
            license_key=license_row.get("license_key"),
        )
    except Exception as e:
        logger.error(f"License status error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


def _validate_key_format(key: str) -> str | None:
    """
    Validate a license key's format and signature.
    Format: LEDGERAI-{TIER}-{SIGNATURE}
    Returns the tier if valid, None if invalid.

    This is local validation for Phase 1. Real Stripe-issued keys
    would be verified against the Stripe subscription API instead.
    """
    parts = key.strip().upper().split("-")
    if len(parts) != 3 or parts[0] != "LEDGERAI":
        return None

    tier = parts[1].lower()
    signature = parts[2]

    if tier not in ("growth", "professional"):
        return None

    # Recompute expected signature using the app's signing key
    expected = hashlib.sha256(
        f"{tier}{config.license_signing_key}".encode()
    ).hexdigest()[:8].upper()

    if signature != expected:
        return None

    return tier


@router.post("/activate")
def activate_license(request: ActivateLicenseRequest):
    """
    Activate a license key, upgrading the tier.
    Validates format + signature before applying.
    """
    tier = _validate_key_format(request.license_key)

    if tier is None:
        logger.warning(f"Invalid license key attempted: {request.license_key[:20]}...")
        raise HTTPException(
            status_code=400,
            detail="Invalid license key. Please check the key and try again, "
                   "or contact support if you believe this is an error."
        )

    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE license
            SET tier = ?, license_key = ?, activated_at = datetime('now'), updated_at = datetime('now')
            WHERE id = 1
        """, (tier, request.license_key.strip().upper()))
        conn.commit()

        logger.info(f"License activated — tier upgraded to: {tier}")
        return {
            "success": True,
            "tier": tier,
            "message": f"Activated! You're now on the {TIER_LIMITS[tier]['label']} tier."
        }
    except Exception as e:
        conn.rollback()
        logger.error(f"License activation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.post("/checkout")
def create_checkout(request: CheckoutRequest):
    """
    Create a Stripe checkout session for upgrading to Growth or Professional.
    Requires a real STRIPE_SECRET_KEY in .env to function — returns a
    helpful message if Stripe isn't configured yet (e.g. during development).
    """
    if request.tier not in ("growth", "professional"):
        raise HTTPException(status_code=400, detail="Invalid tier requested")

    if config.stripe_secret_key.startswith("sk_test_placeholder") or not config.stripe_secret_key:
        logger.warning("Checkout attempted without real Stripe keys configured")
        return {
            "success": False,
            "message": (
                "Stripe is not yet configured for this installation. "
                "Add your real STRIPE_SECRET_KEY to .env to enable checkout. "
                "For testing, use a license key with: LEDGERAI-{TIER}-{SIGNATURE} format."
            )
        }

    try:
        import stripe
        stripe.api_key = config.stripe_secret_key

        price_lookup = {
            "growth":       "price_growth_placeholder",       # Replace with real Stripe Price ID
            "professional": "price_professional_placeholder",  # Replace with real Stripe Price ID
        }

        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{"price": price_lookup[request.tier], "quantity": 1}],
            mode="subscription",
            success_url="http://127.0.0.1:5173/?checkout=success",
            cancel_url="http://127.0.0.1:5173/?checkout=cancelled",
        )

        logger.info(f"Stripe checkout session created for tier: {request.tier}")
        return {"success": True, "checkout_url": session.url}

    except ImportError:
        return {
            "success": False,
            "message": "Stripe package not installed. Run: pip install stripe"
        }
    except Exception as e:
        logger.error(f"Stripe checkout error: {e}")
        return {"success": False, "message": f"Checkout error: {str(e)}"}


@router.post("/downgrade")
def downgrade_to_free():
    """Revert to Free tier. Used for testing or manual cancellation."""
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE license
            SET tier = 'free', license_key = NULL, updated_at = datetime('now')
            WHERE id = 1
        """)
        conn.commit()
        logger.info("License downgraded to Free tier")
        return {"success": True, "message": "Reverted to Free tier."}
    except Exception as e:
        conn.rollback()
        logger.error(f"Downgrade error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()