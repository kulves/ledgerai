"""
models/license.py — License & Subscription Tier Definitions
===============================================================
Purpose:
    Defines the three Ledger AI subscription tiers and their limits,
    per Bible Section 7 (Pricing Model). Free tier limits are enforced
    by counting actual usage from the expenses/documents tables —
    no separate usage-tracking table needed.

Tiers (Bible Section 7):
    Free:         25 transactions/month, 5 OCR uploads/month, 1 business
    Growth:       Unlimited transactions, unlimited OCR, 2 businesses
    Professional: Unlimited transactions, unlimited OCR, 5 businesses
"""

from pydantic import BaseModel
from typing import Optional

TIER_LIMITS = {
    "free": {
        "monthly_transactions": 25,
        "monthly_ocr_uploads":  5,
        "max_businesses":       1,
        "label": "Free",
        "price": "$0/month",
    },
    "growth": {
        "monthly_transactions": None,  # None = unlimited
        "monthly_ocr_uploads":  None,
        "max_businesses":       2,
        "label": "Growth",
        "price": "$19.99/month",
    },
    "professional": {
        "monthly_transactions": None,
        "monthly_ocr_uploads":  None,
        "max_businesses":       5,
        "label": "Professional",
        "price": "$49.99/month",
    },
}

VALID_TIERS = list(TIER_LIMITS.keys())


class LicenseStatus(BaseModel):
    tier:                  str
    tier_label:             str
    monthly_tx_limit:       Optional[int]
    monthly_tx_used:        int
    monthly_ocr_limit:      Optional[int]
    monthly_ocr_used:       int
    max_businesses:         int
    businesses_used:        int
    is_at_tx_limit:         bool
    is_at_ocr_limit:        bool
    is_at_business_limit:   bool
    activated_at:           Optional[str]
    license_key:            Optional[str]


class ActivateLicenseRequest(BaseModel):
    license_key: str


class CheckoutRequest(BaseModel):
    tier: str  # "growth" or "professional"