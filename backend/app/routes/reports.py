"""
routes/reports.py — Reports & PDF Export
==========================================
Purpose:
    Generates financial summary reports for a business covering
    a specified date range. Returns both JSON (for the UI) and
    a downloadable PDF (for the user's CPA or records).

    Per Bible Section 7 — Free tier gets watermarked quarterly PDF.
    Growth and Professional get clean full reports.

    Routes:
        GET  /api/reports/summary     → JSON summary for UI display
        GET  /api/reports/pdf         → Download PDF report

Connections:
    - Uses: database.py (expenses + mileage queries)
    - Uses: ReportLab for PDF generation
    - Called by: frontend ReportsPage (Module 13)
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from datetime import datetime, date
from io import BytesIO
from backend.app.database import get_db
from backend.app.logger import get_logger

# ReportLab imports for PDF generation
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.enums import TA_CENTER, TA_RIGHT

logger = get_logger()

router = APIRouter(prefix="/api/reports", tags=["reports"])

# ── Brand colors ──────────────────────────────────────────────────────────────
NAVY  = colors.HexColor("#0C2340")
GOLD  = colors.HexColor("#C9962C")
GRAY  = colors.HexColor("#5F5E5A")
LIGHT = colors.HexColor("#F5F4F0")
WHITE = colors.white


# ── Helper: fetch report data ─────────────────────────────────────────────────
def get_report_data(business_id: int, start_date: str, end_date: str) -> dict:
    """
    Query the database for all expenses and mileage in the date range.
    Returns a structured dict used by both the JSON and PDF endpoints.
    """
    conn = get_db()
    try:
        # ── Business info ──────────────────────────────────────────────────
        business = conn.execute(
            "SELECT * FROM businesses WHERE id = ?", (business_id,)
        ).fetchone()

        if not business:
            raise HTTPException(status_code=404, detail=f"Business {business_id} not found")

        # ── Expenses in range ──────────────────────────────────────────────
        expenses = conn.execute("""
            SELECT * FROM expenses
            WHERE business_id = ? AND date BETWEEN ? AND ?
            ORDER BY date ASC
        """, (business_id, start_date, end_date)).fetchall()

        expenses_list = [dict(e) for e in expenses]

        # ── Expense totals by category ─────────────────────────────────────
        category_totals = conn.execute("""
            SELECT category,
                   COUNT(*)    AS count,
                   SUM(amount) AS total,
                   SUM(CASE WHEN deductible = 1 THEN amount ELSE 0 END) AS deductible_total
            FROM expenses
            WHERE business_id = ? AND date BETWEEN ? AND ?
            GROUP BY category
            ORDER BY total DESC
        """, (business_id, start_date, end_date)).fetchall()

        # ── Mileage in range ───────────────────────────────────────────────
        mileage = conn.execute("""
            SELECT * FROM mileage_trips
            WHERE business_id = ? AND date BETWEEN ? AND ?
            ORDER BY date ASC
        """, (business_id, start_date, end_date)).fetchall()

        mileage_list = [dict(m) for m in mileage]

        # ── Mileage totals by type ─────────────────────────────────────────
        mileage_totals = conn.execute("""
            SELECT trip_type,
                   COUNT(*)             AS trip_count,
                   SUM(miles)           AS total_miles,
                   SUM(deduction_amount) AS total_deduction
            FROM mileage_trips
            WHERE business_id = ? AND date BETWEEN ? AND ?
            GROUP BY trip_type
        """, (business_id, start_date, end_date)).fetchall()

        # ── Totals ─────────────────────────────────────────────────────────
        total_expenses  = sum(e["amount"] for e in expenses_list)
        total_deductible = sum(
            e["amount"] for e in expenses_list if e.get("deductible")
        )
        total_mileage_deduction = sum(
            m.get("deduction_amount") or 0 for m in mileage_list
        )
        total_miles = sum(m["miles"] for m in mileage_list)

        return {
            "business": dict(business),
            "period": {"start": start_date, "end": end_date},
            "expenses": expenses_list,
            "category_totals": [dict(c) for c in category_totals],
            "mileage": mileage_list,
            "mileage_totals": [dict(m) for m in mileage_totals],
            "summary": {
                "total_expenses":          round(total_expenses, 2),
                "total_deductible":        round(total_deductible, 2),
                "total_non_deductible":    round(total_expenses - total_deductible, 2),
                "total_miles":             round(total_miles, 1),
                "total_mileage_deduction": round(total_mileage_deduction, 2),
                "total_deductions":        round(total_deductible + total_mileage_deduction, 2),
                "expense_count":           len(expenses_list),
                "mileage_trip_count":      len(mileage_list),
            }
        }
    finally:
        conn.close()


@router.get("/summary")
def get_summary(
    business_id: int,
    start_date: str = None,
    end_date: str = None
):
    """
    Return a JSON summary of expenses and mileage for the UI dashboard.
    Defaults to the current year if no dates provided.
    """
    if not start_date:
        start_date = f"{date.today().year}-01-01"
    if not end_date:
        end_date = date.today().isoformat()

    logger.info(f"Summary report: business {business_id}, {start_date} to {end_date}")

    try:
        data = get_report_data(business_id, start_date, end_date)
        return data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to generate summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/pdf")
def download_pdf(
    business_id: int,
    start_date: str = None,
    end_date: str = None,
    watermark: bool = True
):
    """
    Generate and return a PDF report as a downloadable file.
    Free tier reports are watermarked per Bible Section 7.
    """
    if not start_date:
        start_date = f"{date.today().year}-01-01"
    if not end_date:
        end_date = date.today().isoformat()

    logger.info(f"PDF report: business {business_id}, {start_date} to {end_date}")

    try:
        data = get_report_data(business_id, start_date, end_date)
        pdf_bytes = build_pdf(data, watermark=watermark)

        filename = (
            f"LedgerAI_Report_{data['business']['name'].replace(' ', '_')}"
            f"_{start_date}_to_{end_date}.pdf"
        )

        return StreamingResponse(
            BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to generate PDF: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── PDF builder ───────────────────────────────────────────────────────────────
def build_pdf(data: dict, watermark: bool = True) -> bytes:
    """Build a branded Ledger AI PDF report using ReportLab."""

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=0.75 * inch,
        rightMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "Title", parent=styles["Normal"],
        fontName="Helvetica-Bold", fontSize=22,
        textColor=NAVY, leading=28, spaceAfter=4
    )
    subtitle_style = ParagraphStyle(
        "Subtitle", parent=styles["Normal"],
        fontName="Helvetica", fontSize=11,
        textColor=GOLD, leading=16, spaceAfter=2
    )
    section_style = ParagraphStyle(
        "Section", parent=styles["Normal"],
        fontName="Helvetica-Bold", fontSize=13,
        textColor=NAVY, leading=18, spaceBefore=16, spaceAfter=6
    )
    body_style = ParagraphStyle(
        "Body", parent=styles["Normal"],
        fontName="Helvetica", fontSize=9,
        textColor=GRAY, leading=13, spaceAfter=3
    )
    disclaimer_style = ParagraphStyle(
        "Disclaimer", parent=styles["Normal"],
        fontName="Helvetica-Oblique", fontSize=8,
        textColor=GRAY, leading=12, spaceAfter=4
    )

    business = data["business"]
    period   = data["period"]
    summary  = data["summary"]

    story = []

    # ── Header ────────────────────────────────────────────────────────────
    story.append(Paragraph("Ledger AI", title_style))
    story.append(Paragraph("Financial Summary Report", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=GOLD, spaceAfter=10))

    # Business + period info
    info_data = [
        ["Business:",   business["name"]],
        ["Entity Type:", business.get("entity_type", "").replace("_", " ").title()],
        ["State:",      business.get("state", "")],
        ["Period:",     f"{period['start']} to {period['end']}"],
        ["Generated:",  datetime.now().strftime("%B %d, %Y at %I:%M %p")],
    ]
    info_table = Table(info_data, colWidths=[1.5*inch, 5*inch])
    info_table.setStyle(TableStyle([
        ("FONTNAME",  (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE",  (0, 0), (-1, -1), 9),
        ("TEXTCOLOR", (0, 0), (0, -1), NAVY),
        ("TEXTCOLOR", (1, 0), (1, -1), GRAY),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 14))

    # ── Summary totals ─────────────────────────────────────────────────────
    story.append(Paragraph("Summary", section_style))

    totals_data = [
        ["Category", "Amount"],
        ["Total Expenses",          f"${summary['total_expenses']:.2f}"],
        ["Total Deductible",        f"${summary['total_deductible']:.2f}"],
        ["Total Non-Deductible",    f"${summary['total_non_deductible']:.2f}"],
        ["Mileage Deduction",       f"${summary['total_mileage_deduction']:.2f}"],
        ["TOTAL DEDUCTIONS",        f"${summary['total_deductions']:.2f}"],
    ]

    totals_table = Table(totals_data, colWidths=[4*inch, 2.5*inch])
    totals_table.setStyle(TableStyle([
        # Header row
        ("BACKGROUND",  (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR",   (0, 0), (-1, 0), WHITE),
        ("FONTNAME",    (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE",    (0, 0), (-1, -1), 9),
        ("ALIGN",       (1, 0), (1, -1), "RIGHT"),
        # Alternating rows
        ("ROWBACKGROUNDS", (0, 1), (-1, -2), [WHITE, LIGHT]),
        # Total deductions row
        ("BACKGROUND",  (0, -1), (-1, -1), GOLD),
        ("TEXTCOLOR",   (0, -1), (-1, -1), WHITE),
        ("FONTNAME",    (0, -1), (-1, -1), "Helvetica-Bold"),
        # Grid
        ("GRID",        (0, 0), (-1, -1), 0.5, colors.HexColor("#E0DED8")),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING",    (0, 0), (-1, -1), 5),
        ("LEFTPADDING",   (0, 0), (-1, -1), 8),
    ]))
    story.append(totals_table)
    story.append(Spacer(1, 12))

    # ── Expenses by category ──────────────────────────────────────────────
    if data["category_totals"]:
        story.append(Paragraph("Expenses by Category", section_style))

        cat_data = [["Category", "Transactions", "Deductible", "Total"]]
        for cat in data["category_totals"]:
            cat_data.append([
                cat["category"],
                str(cat["count"]),
                f"${cat['deductible_total']:.2f}",
                f"${cat['total']:.2f}",
            ])

        cat_table = Table(cat_data, colWidths=[3*inch, 1.2*inch, 1.2*inch, 1.1*inch])
        cat_table.setStyle(TableStyle([
            ("BACKGROUND",     (0, 0), (-1, 0), NAVY),
            ("TEXTCOLOR",      (0, 0), (-1, 0), WHITE),
            ("FONTNAME",       (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE",       (0, 0), (-1, -1), 8),
            ("ALIGN",          (1, 0), (-1, -1), "RIGHT"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT]),
            ("GRID",           (0, 0), (-1, -1), 0.5, colors.HexColor("#E0DED8")),
            ("BOTTOMPADDING",  (0, 0), (-1, -1), 4),
            ("TOPPADDING",     (0, 0), (-1, -1), 4),
            ("LEFTPADDING",    (0, 0), (-1, -1), 8),
        ]))
        story.append(cat_table)
        story.append(Spacer(1, 12))

    # ── Expense detail ────────────────────────────────────────────────────
    if data["expenses"]:
        story.append(Paragraph("Expense Detail", section_style))

        exp_data = [["Date", "Vendor", "Category", "Ded.", "Amount"]]
        for exp in data["expenses"]:
            exp_data.append([
                exp["date"],
                exp["vendor"][:28] + "..." if len(exp.get("vendor","")) > 28 else exp.get("vendor",""),
                exp["category"][:22] + "..." if len(exp.get("category","")) > 22 else exp.get("category",""),
                "Y" if exp.get("deductible") else "N",
                f"${exp['amount']:.2f}",
            ])

        exp_table = Table(exp_data, colWidths=[0.9*inch, 2.1*inch, 1.9*inch, 0.4*inch, 1.2*inch])
        exp_table.setStyle(TableStyle([
            ("BACKGROUND",     (0, 0), (-1, 0), NAVY),
            ("TEXTCOLOR",      (0, 0), (-1, 0), WHITE),
            ("FONTNAME",       (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE",       (0, 0), (-1, -1), 7.5),
            ("ALIGN",          (3, 0), (-1, -1), "RIGHT"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT]),
            ("GRID",           (0, 0), (-1, -1), 0.5, colors.HexColor("#E0DED8")),
            ("BOTTOMPADDING",  (0, 0), (-1, -1), 3),
            ("TOPPADDING",     (0, 0), (-1, -1), 3),
            ("LEFTPADDING",    (0, 0), (-1, -1), 6),
        ]))
        story.append(exp_table)
        story.append(Spacer(1, 12))

    # ── Mileage summary ───────────────────────────────────────────────────
    if data["mileage"]:
        story.append(Paragraph("Mileage Summary", section_style))

        mil_data = [["Trip Type", "Trips", "Total Miles", "Deduction"]]
        for m in data["mileage_totals"]:
            mil_data.append([
                m["trip_type"].title(),
                str(m["trip_count"]),
                f"{m['total_miles']:.1f} mi",
                f"${m['total_deduction']:.2f}" if m.get("total_deduction") else "—",
            ])

        mil_table = Table(mil_data, colWidths=[2*inch, 1.2*inch, 1.8*inch, 1.5*inch])
        mil_table.setStyle(TableStyle([
            ("BACKGROUND",     (0, 0), (-1, 0), NAVY),
            ("TEXTCOLOR",      (0, 0), (-1, 0), WHITE),
            ("FONTNAME",       (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE",       (0, 0), (-1, -1), 8),
            ("ALIGN",          (1, 0), (-1, -1), "RIGHT"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT]),
            ("GRID",           (0, 0), (-1, -1), 0.5, colors.HexColor("#E0DED8")),
            ("BOTTOMPADDING",  (0, 0), (-1, -1), 4),
            ("TOPPADDING",     (0, 0), (-1, -1), 4),
            ("LEFTPADDING",    (0, 0), (-1, -1), 8),
        ]))
        story.append(mil_table)
        story.append(Spacer(1, 16))

    # ── Disclaimer ────────────────────────────────────────────────────────
    story.append(HRFlowable(width="100%", thickness=0.5, color=GOLD, spaceAfter=8))
    story.append(Paragraph(
        "This report was generated by Ledger AI (Luca) and is intended for organizational "
        "purposes only. It does not constitute tax, financial, or legal advice. Always "
        "review with a licensed CPA, CFP, or tax advisor before filing.",
        disclaimer_style
    ))

    # ── Watermark ─────────────────────────────────────────────────────────
    if watermark:
        story.append(Spacer(1, 6))
        wm_style = ParagraphStyle(
            "Watermark", parent=styles["Normal"],
            fontName="Helvetica", fontSize=8,
            textColor=colors.HexColor("#C9C8C4"),
            alignment=TA_CENTER
        )
        story.append(Paragraph(
            "Prepared with Ledger AI Free — ledgerai.app", wm_style
        ))

    doc.build(story)
    buffer.seek(0)
    return buffer.read()