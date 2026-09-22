"""
models/business.py — Business Data Models
==========================================
Purpose:
    Pydantic models for business entities.
    Users can have multiple businesses (1 Free, 2 Growth, 5 Professional).
    Each business has its own state rules, expenses, and mileage tracking.
"""

from pydantic import BaseModel, Field
from typing import Optional

# Valid US entity types Luca supports (Phase 1)
ENTITY_TYPES = ["sole_prop", "llc", "s_corp", "partnership", "c_corp"]

# Industry templates change how reports group/label categories and which
# extra summary lines appear — the underlying expense categories themselves
# never change per industry (see backend/app/report_templates.py).
# real_estate and ria are kept separate: real estate agents (showings,
# listings, MLS) and financial advisors (compliance, custodian platforms)
# have different enough day-to-day expense patterns to warrant their own
# templates, even though they share some categories.
INDUSTRIES = ["general", "real_estate", "ria"]


class BusinessBase(BaseModel):
    name:        str = Field(..., description="Business name")
    entity_type: str = Field("sole_prop", description="Legal entity type")
    state:       str = Field("CA", description="State of registration (2-letter code)")
    industry:    str = Field("general", description="Industry template for report grouping — see INDUSTRIES")


class BusinessCreate(BusinessBase):
    pass


class BusinessResponse(BusinessBase):
    id:         int
    is_active:  bool
    created_at: str

    class Config:
        from_attributes = True