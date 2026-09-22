"""
report_templates.py — Industry Report Templates
====================================================================
Purpose:
    Industry templates change how a report GROUPS, LABELS, and ORDERS
    the same underlying expense categories into sections — they never
    introduce a second category taxonomy. Every category name referenced
    here must exactly match a name in
    frontend/src/constants/categories.js's EXPENSE_CATEGORIES, since that
    unified list is the single source of truth for how expenses are
    actually stored (see the "Meals & Entertainment" pie-chart bug from
    earlier in this project — this file exists specifically to avoid
    ever repeating that mistake).

    A business with industry="general" (the default) gets no template —
    reports.py falls back to its existing flat, alphabetical-by-total
    category listing.

    Real estate agents and RIAs (financial advisors) are kept as separate
    templates rather than one combined one — showings/listings/MLS work
    (real estate) and compliance/custodian-platform work (RIA) are
    different enough day-to-day that a shared template blurred both.

Connections:
    - Used by: routes/reports.py (PDF + Excel generation)
    - Business.industry (backend/app/models/business.py) selects the template
"""

REAL_ESTATE_TEMPLATE = {
    "label": "Real Estate Agent",
    "sections": [
        {
            "title": "Marketing & Listings",
            "categories": ["Marketing & Advertising"],
        },
        {
            "title": "Showings & Client Travel",
            "categories": ["Travel & Mileage", "Meals & Entertainment"],
        },
        {
            "title": "Licensing & Insurance",
            "categories": ["Insurance", "Education & Development"],
        },
        {
            "title": "MLS, CRM & Technology",
            "categories": ["Software & Subscriptions"],
        },
        {
            "title": "Office & Operations",
            "categories": ["Office Supplies", "Home Office", "Equipment & Assets",
                            "Utilities & Facilities", "Banking & Finance"],
        },
        {
            "title": "Referral Fees & Team",
            "categories": ["Payroll & Labor", "Professional Services"],
        },
    ],
    "other_title": "Other",
    "highlight_metric": {
        "label": "Marketing & Client Acquisition Spend (% of Deductible Total)",
        "section_titles": ["Marketing & Listings", "Showings & Client Travel"],
    },
}

RIA_TEMPLATE = {
    "label": "RIA / Financial Advisor",
    "sections": [
        {
            "title": "Client Acquisition & Marketing",
            "categories": ["Marketing & Advertising"],
        },
        {
            "title": "Client Meetings & Travel",
            "categories": ["Travel & Mileage", "Meals & Entertainment"],
        },
        {
            "title": "Compliance, Licensing & Insurance",
            "categories": ["Insurance", "Education & Development", "Professional Services"],
        },
        {
            "title": "Platform, Custodian & Technology",
            "categories": ["Software & Subscriptions", "Banking & Finance"],
        },
        {
            "title": "Office & Operations",
            "categories": ["Office Supplies", "Home Office", "Equipment & Assets", "Utilities & Facilities"],
        },
        {
            "title": "Team & Staff",
            "categories": ["Payroll & Labor"],
        },
    ],
    "other_title": "Other",
    "highlight_metric": {
        "label": "Client Acquisition Spend (% of Deductible Total)",
        "section_titles": ["Client Acquisition & Marketing", "Client Meetings & Travel"],
    },
}

TEMPLATES = {
    "real_estate": REAL_ESTATE_TEMPLATE,
    "ria": RIA_TEMPLATE,
}


def get_template(industry: str):
    return TEMPLATES.get(industry)


def apply_template(category_totals: list, industry: str):
    """
    Groups category_totals (list of dicts with category/count/total/
    deductible_total, as returned by reports.py's get_report_data) into
    industry-specific sections, in template order. Anything not covered
    by the template falls into a catch-all "Other" section — nothing is
    ever silently dropped. Returns None if there's no template for this
    industry (caller should fall back to the existing flat listing).
    """
    template = get_template(industry)
    if not template:
        return None

    by_category = {c["category"]: c for c in category_totals}
    used = set()
    sections = []

    for section_def in template["sections"]:
        section_cats = []
        section_total = 0.0
        section_deductible = 0.0
        for cat_name in section_def["categories"]:
            used.add(cat_name)
            row = by_category.get(cat_name)
            if row:
                section_cats.append(row)
                section_total += row.get("total") or 0
                section_deductible += row.get("deductible_total") or 0
        sections.append({
            "title": section_def["title"],
            "categories": section_cats,
            "total": round(section_total, 2),
            "deductible_total": round(section_deductible, 2),
        })

    other_cats = [row for cat, row in by_category.items() if cat not in used]
    if other_cats:
        sections.append({
            "title": template.get("other_title", "Other"),
            "categories": other_cats,
            "total": round(sum(r.get("total") or 0 for r in other_cats), 2),
            "deductible_total": round(sum(r.get("deductible_total") or 0 for r in other_cats), 2),
        })

    return sections


def compute_highlight_metric(sections: list, industry: str):
    """
    Computes the template's headline ratio (e.g. client-acquisition spend
    as a % of total deductible spend) from already-grouped sections.
    Returns None if this template has no highlight metric defined.
    """
    template = get_template(industry)
    if not template or "highlight_metric" not in template:
        return None

    metric = template["highlight_metric"]
    total_deductible = sum(s["deductible_total"] for s in sections)
    if total_deductible <= 0:
        return None

    highlighted = sum(
        s["deductible_total"] for s in sections if s["title"] in metric["section_titles"]
    )
    return {
        "label": metric["label"],
        "value": round((highlighted / total_deductible) * 100, 1),
    }