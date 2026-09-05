"""
routes/reports.py — Reports & PDF Export
==========================================
Purpose:
    Generates financial summary reports for a business covering
    a specified date range. Returns both JSON (for the UI) andls
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

routes/reports.py — Reports, PDF, Excel & P&L
===============================================
Updated to include:
  - Income data in reports (cash flow + P&L)
  - Profit & Loss calculation
  - Excel (.xlsx) report export
  - Summary endpoint updated with income + P&L
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from datetime import datetime, date
from io import BytesIO
from backend.app.database import get_db
from backend.app.logger import get_logger
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.enums import TA_CENTER

logger = get_logger()
router = APIRouter(prefix="/api/reports", tags=["reports"])

NAVY  = colors.HexColor("#0C2340")
GOLD  = colors.HexColor("#C9962C")
GRAY  = colors.HexColor("#5F5E5A")
LIGHT = colors.HexColor("#F5F4F0")
GREEN = colors.HexColor("#059669")
RED   = colors.HexColor("#E11D48")
WHITE = colors.white


def get_report_data(business_id: int, start_date: str, end_date: str) -> dict:
    conn = get_db()
    try:
        business = conn.execute(
            "SELECT * FROM businesses WHERE id = ?", (business_id,)
        ).fetchone()
        if not business:
            raise HTTPException(status_code=404, detail=f"Business {business_id} not found")

        # Expenses
        expenses = conn.execute("""
            SELECT * FROM expenses
            WHERE business_id = ? AND date BETWEEN ? AND ?
            ORDER BY date ASC
        """, (business_id, start_date, end_date)).fetchall()
        expenses_list = [dict(e) for e in expenses]

        category_totals = conn.execute("""
            SELECT category, COUNT(*) AS count,
                   SUM(amount) AS total,
                   SUM(CASE
                    WHEN deductible=1 AND category LIKE '%Meals%' THEN amount * 0.5
                    WHEN deductible=1 THEN amount
                    ELSE 0
                    END) AS deductible_total
            FROM expenses
            WHERE business_id = ? AND date BETWEEN ? AND ?
            GROUP BY category ORDER BY total DESC
        """, (business_id, start_date, end_date)).fetchall()

        # Mileage
        mileage = conn.execute("""
            SELECT * FROM mileage_trips
            WHERE business_id = ? AND date BETWEEN ? AND ?
            ORDER BY date ASC
        """, (business_id, start_date, end_date)).fetchall()
        mileage_list = [dict(m) for m in mileage]

        mileage_totals = conn.execute("""
            SELECT trip_type, COUNT(*) AS trip_count,
                   SUM(miles) AS total_miles,
                   SUM(deduction_amount) AS total_deduction
            FROM mileage_trips
            WHERE business_id = ? AND date BETWEEN ? AND ?
            GROUP BY trip_type
        """, (business_id, start_date, end_date)).fetchall()

        # Income (if table exists)
        income_list = []
        income_by_category = {}
        total_income = 0.0
        try:
            income_rows = conn.execute("""
                SELECT * FROM income
                WHERE business_id = ? AND date BETWEEN ? AND ?
                ORDER BY date ASC
            """, (business_id, start_date, end_date)).fetchall()
            income_list = [dict(r) for r in income_rows]
            total_income = sum(r["amount"] for r in income_list)

            income_cat_rows = conn.execute("""
                SELECT category, SUM(amount) AS total
                FROM income
                WHERE business_id = ? AND date BETWEEN ? AND ?
                GROUP BY category ORDER BY total DESC
            """, (business_id, start_date, end_date)).fetchall()
            income_by_category = {r["category"]: round(float(r["total"]), 2) for r in income_cat_rows}
        except Exception:
            pass  # income table may not exist yet

        # Totals
        total_expenses          = sum(e["amount"] for e in expenses_list)
        total_deductible = sum(
            e["amount"] * 0.5 if (e.get("deductible") and 'meal' in (e.get("category") or '').lower())
            else e["amount"] if e.get("deductible")
            else 0
            for e in expenses_list
        )
        total_mileage_deduction = sum(m.get("deduction_amount") or 0 for m in mileage_list)
        total_miles             = sum(m["miles"] for m in mileage_list)
        total_deductions        = total_deductible + total_mileage_deduction
        net_profit              = total_income - total_expenses

        return {
            "business":          dict(business),
            "period":            {"start": start_date, "end": end_date},
            "expenses":          expenses_list,
            "category_totals":   [dict(c) for c in category_totals],
            "mileage":           mileage_list,
            "mileage_totals":    [dict(m) for m in mileage_totals],
            "income":            income_list,
            "income_by_category": income_by_category,
            "summary": {
                "total_income":            round(total_income, 2),
                "total_expenses":          round(total_expenses, 2),
                "total_deductible":        round(total_deductible, 2),
                "total_non_deductible":    round(total_expenses - total_deductible, 2),
                "total_miles":             round(total_miles, 1),
                "total_mileage_deduction": round(total_mileage_deduction, 2),
                "total_deductions":        round(total_deductions, 2),
                "net_profit":              round(net_profit, 2),
                "expense_count":           len(expenses_list),
                "mileage_trip_count":      len(mileage_list),
                "income_count":            len(income_list),
                "transaction_count":       len(expenses_list),
            }
        }
    finally:
        conn.close()


@router.get("/summary")
def get_summary(business_id: int, start_date: str = None, end_date: str = None):
    if not start_date: start_date = f"{date.today().year}-01-01"
    if not end_date:   end_date   = date.today().isoformat()
    logger.info(f"Summary: business {business_id}, {start_date} to {end_date}")
    try:
        data = get_report_data(business_id, start_date, end_date)
        # Flatten for frontend compatibility
        flat = {
            **data["summary"],
            "by_category":    {c["category"]: c["total"] for c in data["category_totals"]},
            "mileage_deduction": data["summary"]["total_mileage_deduction"],
            "total_miles":       data["summary"]["total_miles"],
        }
        return flat
    except HTTPException: raise
    except Exception as e:
        logger.error(f"Summary error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/pdf")
def download_pdf(
    business_id: int,
    start_date: str = None,
    end_date: str = None,
    watermark: bool = True
):
    if not start_date: start_date = f"{date.today().year}-01-01"
    if not end_date:   end_date   = date.today().isoformat()
    try:
        data = get_report_data(business_id, start_date, end_date)
        pdf_bytes = build_pdf(data, watermark=watermark)
        filename = (
            f"LedgerAI_Report_{data['business']['name'].replace(' ','_')}"
            f"_{start_date}_to_{end_date}.pdf"
        )
        return StreamingResponse(
            BytesIO(pdf_bytes), media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )
    except HTTPException: raise
    except Exception as e:
        logger.error(f"PDF error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/excel")
def download_excel(
    business_id: int,
    start_date: str = None,
    end_date: str = None,
):
    """Generate and return an Excel (.xlsx) report."""
    if not start_date: start_date = f"{date.today().year}-01-01"
    if not end_date:   end_date   = date.today().isoformat()
    try:
        import openpyxl
        from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
        from openpyxl.utils import get_column_letter

        data = get_report_data(business_id, start_date, end_date)
        wb = openpyxl.Workbook()

        NAVY_HEX  = "0C2340"
        GOLD_HEX  = "C9962C"
        GREEN_HEX = "059669"
        RED_HEX   = "E11D48"
        LIGHT_HEX = "F5F4F0"

        def hdr_style(ws, row, cols, text, merge=True):
            cell = ws.cell(row=row, column=1, value=text)
            if merge:
                ws.merge_cells(start_row=row, start_column=1, end_row=row, end_column=cols)
            cell = ws.cell(row=row, column=1, value=text)
            cell.font = Font(bold=True, color="FFFFFF", size=12)
            cell.fill = PatternFill("solid", fgColor=NAVY_HEX)
            cell.alignment = Alignment(horizontal="left", vertical="center")
            ws.row_dimensions[row].height = 24

        def col_hdr(ws, row, headers):
            for i, h in enumerate(headers, 1):
                c = ws.cell(row=row, column=i, value=h)
                c.font = Font(bold=True, color="FFFFFF", size=10)
                c.fill = PatternFill("solid", fgColor=GOLD_HEX)
                c.alignment = Alignment(horizontal="center")

        def auto_width(ws):
            for col in ws.columns:
                max_len = 0
                col_letter = get_column_letter(col[0].column)
                for cell in col:
                    try: max_len = max(max_len, len(str(cell.value or '')))
                    except: pass
                ws.column_dimensions[col_letter].width = min(max_len + 4, 40)

        biz  = data["business"]
        s    = data["summary"]
        per  = data["period"]

        # ── Sheet 1: Summary / P&L ──────────────────────────────────────
        ws1 = wb.active
        ws1.title = "P&L Summary"
        hdr_style(ws1, 1, 3, f"Ledger AI — {biz['name']}")
        ws1.cell(row=2, column=1, value=f"Period: {per['start']} to {per['end']}")
        ws1.cell(row=2, column=1).font = Font(italic=True, color=GOLD_HEX)
        ws1.row_dimensions[3].height = 10

        pl_rows = [
            ("INCOME", None, True),
            ("Total Income", s["total_income"], False),
            ("", None, False),
            ("EXPENSES", None, True),
            ("Total Expenses", s["total_expenses"], False),
            ("  Deductible", s["total_deductible"], False),
            ("  Non-Deductible", s["total_non_deductible"], False),
            ("", None, False),
            ("DEDUCTIONS", None, True),
            ("Expense Deductions", s["total_deductible"], False),
            ("Mileage Deduction", s["total_mileage_deduction"], False),
            ("Total Deductions", s["total_deductions"], False),
            ("", None, False),
            ("NET PROFIT / LOSS", s["net_profit"], True),
        ]

        start_row = 4
        for label, value, is_header in pl_rows:
            r = start_row
            c1 = ws1.cell(row=r, column=1, value=label)
            if is_header and label:
                c1.font = Font(bold=True, color="FFFFFF", size=10)
                c1.fill = PatternFill("solid", fgColor=NAVY_HEX)
                ws1.merge_cells(start_row=r, start_column=1, end_row=r, end_column=3)
            else:
                c1.font = Font(size=10)
            if value is not None:
                c2 = ws1.cell(row=r, column=3, value=value)
                c2.number_format = '"$"#,##0.00'
                c2.alignment = Alignment(horizontal="right")
                if label == "NET PROFIT / LOSS":
                    color = GREEN_HEX if value >= 0 else RED_HEX
                    c2.font = Font(bold=True, color=color, size=11)
                    c1.font = Font(bold=True, color="FFFFFF", size=11)
            start_row += 1

        auto_width(ws1)

        # ── Sheet 2: Expenses ──────────────────────────────────────────
        ws2 = wb.create_sheet("Expenses")
        hdr_style(ws2, 1, 5, "Expense Detail")
        col_hdr(ws2, 2, ["Date", "Vendor", "Category", "Deductible", "Amount"])
        for i, exp in enumerate(data["expenses"], 3):
            ws2.cell(row=i, column=1, value=exp.get("date", ""))
            ws2.cell(row=i, column=2, value=exp.get("vendor", ""))
            ws2.cell(row=i, column=3, value=exp.get("category", ""))
            ws2.cell(row=i, column=4, value="Yes" if exp.get("deductible") else "No")
            c = ws2.cell(row=i, column=5, value=exp.get("amount", 0))
            c.number_format = '"$"#,##0.00'
            if i % 2 == 0:
                for col in range(1, 6):
                    ws2.cell(row=i, column=col).fill = PatternFill("solid", fgColor=LIGHT_HEX)
        auto_width(ws2)

        # ── Sheet 3: Income ────────────────────────────────────────────
        ws3 = wb.create_sheet("Income")
        hdr_style(ws3, 1, 4, "Income Detail")
        col_hdr(ws3, 2, ["Date", "Source", "Category", "Amount"])
        for i, inc in enumerate(data["income"], 3):
            ws3.cell(row=i, column=1, value=inc.get("date", ""))
            ws3.cell(row=i, column=2, value=inc.get("source", ""))
            ws3.cell(row=i, column=3, value=inc.get("category", ""))
            c = ws3.cell(row=i, column=4, value=inc.get("amount", 0))
            c.number_format = '"$"#,##0.00'
            c.font = Font(color=GREEN_HEX)
            if i % 2 == 0:
                for col in range(1, 5):
                    ws3.cell(row=i, column=col).fill = PatternFill("solid", fgColor=LIGHT_HEX)
        auto_width(ws3)

        # ── Sheet 4: Mileage ───────────────────────────────────────────
        ws4 = wb.create_sheet("Mileage")
        hdr_style(ws4, 1, 4, "Mileage Trips")
        col_hdr(ws4, 2, ["Date", "Purpose", "Miles", "Deduction"])
        for i, trip in enumerate(data["mileage"], 3):
            ws4.cell(row=i, column=1, value=trip.get("date", ""))
            ws4.cell(row=i, column=2, value=trip.get("purpose", ""))
            ws4.cell(row=i, column=3, value=trip.get("miles", 0))
            c = ws4.cell(row=i, column=4, value=trip.get("deduction_amount", 0))
            c.number_format = '"$"#,##0.00'
        auto_width(ws4)

        # Save to buffer
        buf = BytesIO()
        wb.save(buf)
        buf.seek(0)

        filename = (
            f"LedgerAI_{biz['name'].replace(' ','_')}"
            f"_{start_date}_to_{end_date}.xlsx"
        )
        return StreamingResponse(
            buf,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )
    except HTTPException: raise
    except Exception as e:
        logger.error(f"Excel error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def build_pdf(data: dict, watermark: bool = True) -> bytes:
    """Build branded Ledger AI PDF report — unchanged from original."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=letter,
        leftMargin=0.75*inch, rightMargin=0.75*inch,
        topMargin=0.75*inch, bottomMargin=0.75*inch,
    )
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("Title", parent=styles["Normal"],
        fontName="Helvetica-Bold", fontSize=22, textColor=NAVY, leading=28, spaceAfter=4)
    subtitle_style = ParagraphStyle("Subtitle", parent=styles["Normal"],
        fontName="Helvetica", fontSize=11, textColor=GOLD, leading=16, spaceAfter=2)
    section_style = ParagraphStyle("Section", parent=styles["Normal"],
        fontName="Helvetica-Bold", fontSize=13, textColor=NAVY, leading=18, spaceBefore=16, spaceAfter=6)
    body_style = ParagraphStyle("Body", parent=styles["Normal"],
        fontName="Helvetica", fontSize=9, textColor=GRAY, leading=13, spaceAfter=3)
    disclaimer_style = ParagraphStyle("Disclaimer", parent=styles["Normal"],
        fontName="Helvetica-Oblique", fontSize=8, textColor=GRAY, leading=12, spaceAfter=4)

    business = data["business"]
    period   = data["period"]
    summary  = data["summary"]
    story    = []

    story.append(Paragraph("Ledger AI", title_style))
    story.append(Paragraph("Financial Summary Report", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=GOLD, spaceAfter=10))

    info_data = [
        ["Business:",   business["name"]],
        ["Entity Type:", business.get("entity_type","").replace("_"," ").title()],
        ["State:",      business.get("state","")],
        ["Period:",     f"{period['start']} to {period['end']}"],
        ["Generated:",  datetime.now().strftime("%B %d, %Y at %I:%M %p")],
    ]
    info_table = Table(info_data, colWidths=[1.5*inch, 5*inch])
    info_table.setStyle(TableStyle([
        ("FONTNAME",  (0,0),(0,-1),"Helvetica-Bold"),
        ("FONTSIZE",  (0,0),(-1,-1),9),
        ("TEXTCOLOR", (0,0),(0,-1),NAVY),
        ("TEXTCOLOR", (1,0),(1,-1),GRAY),
        ("BOTTOMPADDING",(0,0),(-1,-1),3),
    ]))
    story.append(info_table)
    story.append(Spacer(1,14))

    # P&L Summary
    story.append(Paragraph("Profit & Loss Summary", section_style))
    net = summary["net_profit"]
    pl_data = [
        ["", "Amount"],
        ["Total Income",           f"${summary['total_income']:.2f}"],
        ["Total Expenses",         f"${summary['total_expenses']:.2f}"],
        ["NET PROFIT / LOSS",      f"${net:.2f}"],
        ["", ""],
        ["Total Deductions",       f"${summary['total_deductions']:.2f}"],
        ["  Expense Deductions",   f"${summary['total_deductible']:.2f}"],
        ["  Mileage Deduction",    f"${summary['total_mileage_deduction']:.2f}"],
    ]
    pl_table = Table(pl_data, colWidths=[4*inch, 2.5*inch])
    net_color = GREEN if net >= 0 else RED
    pl_table.setStyle(TableStyle([
        ("BACKGROUND",  (0,0),(-1,0),NAVY),
        ("TEXTCOLOR",   (0,0),(-1,0),WHITE),
        ("FONTNAME",    (0,0),(-1,0),"Helvetica-Bold"),
        ("FONTSIZE",    (0,0),(-1,-1),9),
        ("ALIGN",       (1,0),(1,-1),"RIGHT"),
        ("ROWBACKGROUNDS",(0,1),(-1,-1),[WHITE,LIGHT]),
        ("BACKGROUND",  (0,3),(-1,3),GOLD),
        ("TEXTCOLOR",   (0,3),(-1,3),WHITE),
        ("FONTNAME",    (0,3),(-1,3),"Helvetica-Bold"),
        ("GRID",        (0,0),(-1,-1),0.5,colors.HexColor("#E0DED8")),
        ("BOTTOMPADDING",(0,0),(-1,-1),5),
        ("TOPPADDING",  (0,0),(-1,-1),5),
        ("LEFTPADDING", (0,0),(-1,-1),8),
    ]))
    story.append(pl_table)
    story.append(Spacer(1,12))

    if data["category_totals"]:
        story.append(Paragraph("Expenses by Category", section_style))
        cat_data = [["Category","Transactions","Deductible","Total"]]
        for cat in data["category_totals"]:
            cat_data.append([cat["category"],str(cat["count"]),
                f"${cat['deductible_total']:.2f}",f"${cat['total']:.2f}"])
        cat_table = Table(cat_data, colWidths=[3*inch,1.2*inch,1.2*inch,1.1*inch])
        cat_table.setStyle(TableStyle([
            ("BACKGROUND",(0,0),(-1,0),NAVY),("TEXTCOLOR",(0,0),(-1,0),WHITE),
            ("FONTNAME",(0,0),(-1,0),"Helvetica-Bold"),("FONTSIZE",(0,0),(-1,-1),8),
            ("ALIGN",(1,0),(-1,-1),"RIGHT"),("ROWBACKGROUNDS",(0,1),(-1,-1),[WHITE,LIGHT]),
            ("GRID",(0,0),(-1,-1),0.5,colors.HexColor("#E0DED8")),
            ("BOTTOMPADDING",(0,0),(-1,-1),4),("TOPPADDING",(0,0),(-1,-1),4),("LEFTPADDING",(0,0),(-1,-1),8),
        ]))
        story.append(cat_table)
        story.append(Spacer(1,12))

    story.append(HRFlowable(width="100%",thickness=0.5,color=GOLD,spaceAfter=8))
    story.append(Paragraph(
        "This report was generated by Ledger AI (Luca) and is intended for organizational "
        "purposes only. It does not constitute tax, financial, or legal advice. Always "
        "review with a licensed CPA, CFP, or tax advisor before filing.", disclaimer_style))
    if watermark:
        story.append(Spacer(1,6))
        wm_style = ParagraphStyle("Watermark",parent=styles["Normal"],
            fontName="Helvetica",fontSize=8,textColor=colors.HexColor("#C9C8C4"),alignment=TA_CENTER)
        story.append(Paragraph("Prepared with Ledger AI Free — ledgerai.app",wm_style))

    doc.build(story)
    buffer.seek(0)
    return buffer.read()