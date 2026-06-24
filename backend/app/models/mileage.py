"""
models/mileage.py — Mileage Trip Data Models
===============================================
Purpose:
    Pydantic models for mileage trip records.
    Mileage deductions use the IRS standard mileage rate (not actual
    vehicle costs), so we track miles driven and calculate the
    deduction automatically using the rate from tax_rules/.

    2026 IRS standard mileage rates (from Bible Section 10.20):
    - Business:   72.5 cents per mile
    - Medical:    20.5 cents per mile
    - Charitable: 14.0 cents per mile
"""

from pydantic import BaseModel, Field
from typing import Optional

# 2026 IRS Standard Mileage Rates
# Source: IRS Rev. Proc. 2025-XX (update quarterly from tax_rules/)
MILEAGE_RATES = {
    "business":   0.725,
    "medical":    0.205,
    "charitable": 0.14
}

TRIP_TYPES = ["business", "medical", "charitable", "personal"]


class MileageTripBase(BaseModel):
    business_id: int   = Field(..., description="Which business this trip belongs to")
    date:        str   = Field(..., description="Date of trip (YYYY-MM-DD)")
    purpose:     str   = Field(..., description="Business purpose of the trip")
    miles:       float = Field(..., gt=0, description="Miles driven (must be positive)")
    trip_type:   str   = Field("business", description="Trip type: business/medical/charitable/personal")


class MileageTripCreate(MileageTripBase):
    pass


class MileageTripResponse(MileageTripBase):
    id:               int
    deduction_amount: Optional[float]  # Calculated automatically, None for personal
    created_at:       str

    class Config:
        from_attributes = True