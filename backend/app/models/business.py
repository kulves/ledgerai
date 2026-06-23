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


class BusinessBase(BaseModel):
    name:        str = Field(..., description="Business name")
    entity_type: str = Field("sole_prop", description="Legal entity type")
    state:       str = Field("CA", description="State of registration (2-letter code)")


class BusinessCreate(BusinessBase):
    pass


class BusinessResponse(BusinessBase):
    id:         int
    is_active:  bool
    created_at: str

    class Config:
        from_attributes = True