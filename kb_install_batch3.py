import json
from pathlib import Path

ENTRIES_DIR = Path("knowledge_base/entries")
ENTRIES_DIR.mkdir(parents=True, exist_ok=True)

ENTRIES = {

"qbi_deduction_section_199a": {
  "id": "qbi_deduction_section_199a", "knowledge_version": "2026.1", "topic": "Tax Credits and Benefits",
  "title": "QBI Deduction (Section 199A) — 20% Deduction for Pass-Through Income",
  "audience": ["sole_prop","single_member_llc","s_corp","partnership"], "applies_to": ["sole_prop","single_member_llc","s_corp","partnership"],
  "irs_source": {"publication":"Publication 535","section":"Chapter 12","url":"https://www.irs.gov/pub/irs-pdf/p535.pdf","last_verified":"2026-07-01","tax_year":2026},
  "jurisdiction": {"country":"US","federal":True,"state_specific":False},
  "confidence": "high", "review_status": "Approved — v1.0",
  "last_reviewed_by": ["Claude (Anthropic)","Grok (xAI)","ChatGPT (OpenAI)"],
  "summary": "The QBI deduction allows eligible pass-through business owners to deduct up to 20% of qualified business income. IMPORTANT: Verify current legislative status for 2026 — the deduction was scheduled to expire after 2025.",
  "content": "The Qualified Business Income (QBI) deduction under IRC Section 199A allows eligible sole proprietors, single-member LLCs, S-corp shareholders, and partners to deduct up to 20% of their qualified business income on their personal tax return. This is a below-the-line deduction taken on Form 1040, reducing taxable income even if you take the standard deduction. Qualified business income is generally your net business income from domestic operations, excluding capital gains, dividends, and interest income not allocable to the trade or business. For taxpayers below the taxable income threshold (confirm 2026 thresholds at IRS.gov — the 2025 thresholds were $197,300 single and $394,600 joint filers), the deduction is straightforward: 20% of QBI or 20% of taxable income, whichever is smaller. Above the threshold, restrictions apply for Specified Service Trades or Businesses (SSTBs) — which include health, law, consulting, athletics, financial services, and performing arts. IMPORTANT: The QBI deduction was originally scheduled to expire after 2025 under the Tax Cuts and Jobs Act. Verify with your CPA whether this deduction has been extended, modified, or made permanent for the 2026 tax year, as this is subject to active legislative change. Do not assume availability without confirming current law.",
  "related_articles": [{"id":"above_below_line_deductions","relationship":"expands_on"},{"id":"sole_proprietor_vs_llc","relationship":"related"},{"id":"s_corp_election","relationship":"often_used_together"},{"id":"schedule_c_basics","relationship":"related"}],
  "luca_flags": []
},

"eitc_earned_income_credit": {
  "id": "eitc_earned_income_credit", "knowledge_version": "2026.1", "topic": "Tax Credits and Benefits",
  "title": "Earned Income Tax Credit (EITC) — What It Is and Who Generally Qualifies",
  "audience": ["sole_prop","single_member_llc"], "applies_to": ["sole_prop","single_member_llc"],
  "irs_source": {"publication":"Publication 596","section":"Chapter 1","url":"https://www.irs.gov/pub/irs-pdf/p596.pdf","last_verified":"2026-07-01","tax_year":2026},
  "jurisdiction": {"country":"US","federal":True,"state_specific":False},
  "confidence": "high", "review_status": "Approved — v1.0",
  "last_reviewed_by": ["Claude (Anthropic)","Grok (xAI)","ChatGPT (OpenAI)"],
  "summary": "The EITC is a refundable federal tax credit for low-to-moderate income workers, including self-employed individuals. The credit amount depends on income, filing status, and number of qualifying children.",
  "content": "The Earned Income Tax Credit (EITC) is one of the largest refundable tax credits available to working individuals and families. Unlike a deduction that reduces taxable income, a refundable credit directly reduces the amount of tax you owe — and if the credit exceeds your tax liability, you receive the difference as a refund. Self-employed individuals can qualify for the EITC based on their net self-employment income. To qualify for 2026, you must have earned income below the IRS threshold for your filing status and number of qualifying children (check IRS.gov for the current 2026 income limits, as they adjust annually for inflation). You must have a valid Social Security number, be a US citizen or resident alien, not file as Married Filing Separately, and meet investment income limits. The credit is larger for families with qualifying children, but workers without children may also qualify for a smaller credit amount. Luca can flag your account if your income pattern suggests you may qualify for the EITC, but eligibility determination requires review of your complete tax situation. Always confirm eligibility with a tax professional before claiming the credit, as incorrect EITC claims can result in penalties.",
  "related_articles": [{"id":"schedule_c_basics","relationship":"related"},{"id":"self_employment_tax","relationship":"related"},{"id":"estimated_quarterly_taxes","relationship":"related"}],
  "luca_flags": ["potential_credit_eitc"]
},

"child_tax_credit_basics": {
  "id": "child_tax_credit_basics", "knowledge_version": "2026.1", "topic": "Tax Credits and Benefits",
  "title": "Child Tax Credit — General Overview for Self-Employed Filers",
  "audience": ["sole_prop","single_member_llc","s_corp","partnership"], "applies_to": ["sole_prop","single_member_llc","s_corp","partnership"],
  "irs_source": {"publication":"Publication 972","section":"Chapter 1","url":"https://www.irs.gov/pub/irs-pdf/p972.pdf","last_verified":"2026-07-01","tax_year":2026},
  "jurisdiction": {"country":"US","federal":True,"state_specific":False},
  "confidence": "medium", "review_status": "Approved — v1.0",
  "last_reviewed_by": ["Claude (Anthropic)","Grok (xAI)","ChatGPT (OpenAI)"],
  "summary": "The Child Tax Credit provides a credit of up to $2,000 per qualifying child under age 17. Self-employed individuals can claim it like any other taxpayer, though it phases out at higher income levels. Verify 2026 amounts with your CPA.",
  "content": "The Child Tax Credit is a personal tax credit available to taxpayers with qualifying children. For 2026, the credit is generally up to $2,000 per qualifying child under age 17 (verify the current amount at IRS.gov, as this credit has changed multiple times and may be subject to further legislative action). A qualifying child must be under 17 at the end of the tax year, be your dependent, have a valid Social Security number, and meet relationship and residency tests. The credit phases out for higher-income taxpayers — the phase-out begins at $200,000 of modified adjusted gross income for single filers and $400,000 for joint filers. A portion of the credit may be refundable through the Additional Child Tax Credit (ACTC). For self-employed individuals, your net profit from Schedule C is included in your adjusted gross income and affects your eligibility. Luca will flag that this credit may be relevant based on your income level and remind you to discuss it with your CPA at tax time.",
  "related_articles": [{"id":"eitc_earned_income_credit","relationship":"compare_with"},{"id":"schedule_c_basics","relationship":"related"}],
  "luca_flags": ["potential_credit_ctc"]
},

"work_opportunity_tax_credit": {
  "id": "work_opportunity_tax_credit", "knowledge_version": "2026.1", "topic": "Tax Credits and Benefits",
  "title": "Work Opportunity Tax Credit (WOTC) — Business Credit for Hiring Target Groups",
  "audience": ["sole_prop","single_member_llc","s_corp","partnership"], "applies_to": ["sole_prop","single_member_llc","s_corp","partnership"],
  "irs_source": {"publication":"Publication 954","section":"Chapter 2","url":"https://www.irs.gov/pub/irs-pdf/p954.pdf","last_verified":"2026-07-01","tax_year":2026},
  "jurisdiction": {"country":"US","federal":True,"state_specific":False},
  "confidence": "high", "review_status": "Approved — v1.0",
  "last_reviewed_by": ["Claude (Anthropic)","Grok (xAI)","ChatGPT (OpenAI)"],
  "summary": "The WOTC provides a tax credit to businesses that hire employees from certain target groups including veterans, long-term unemployed individuals, and recipients of certain public assistance programs.",
  "content": "The Work Opportunity Tax Credit (WOTC) is a federal business tax credit available to employers who hire individuals from specific groups that have historically faced barriers to employment. Target groups include qualified veterans, long-term family assistance recipients, designated community residents, vocational rehabilitation referrals, ex-felons, recipients of Supplemental Security Income (SSI), and long-term unemployment recipients. The credit is generally equal to 40% of up to $6,000 in first-year wages for most target groups (maximum credit of $2,400 per qualifying new hire), with higher amounts for qualified veterans and long-term assistance recipients. To claim the credit, you must obtain certification from your state workforce agency. The certification request (Form 8850) must be submitted within 28 days of the employee's start date. The WOTC is a general business credit claimed on Form 3800. The employee must work at least 120 hours for a partial credit, or at least 400 hours for the full credit. If your business does not yet have employees, this credit does not currently apply, but it is worth knowing about as your business grows.",
  "related_articles": [{"id":"contractor_vs_employee","relationship":"related"},{"id":"hiring_independent_contractors","relationship":"related"}],
  "luca_flags": []
},

"energy_efficiency_credits": {
  "id": "energy_efficiency_credits", "knowledge_version": "2026.1", "topic": "Tax Credits and Benefits",
  "title": "Energy Efficiency Tax Credits — Business and Home Office Overview",
  "audience": ["sole_prop","single_member_llc","s_corp","partnership"], "applies_to": ["sole_prop","single_member_llc","s_corp","partnership"],
  "irs_source": {"publication":"Form 3468 Instructions","section":"Investment Credit","url":"https://www.irs.gov/pub/irs-pdf/i3468.pdf","last_verified":"2026-07-01","tax_year":2026},
  "jurisdiction": {"country":"US","federal":True,"state_specific":False},
  "confidence": "medium", "review_status": "Approved — v1.0",
  "last_reviewed_by": ["Claude (Anthropic)","Grok (xAI)","ChatGPT (OpenAI)"],
  "summary": "Businesses can claim tax credits for qualifying energy-efficient improvements. Energy credit rules are complex and subject to ongoing legislative changes under the Inflation Reduction Act — verify current availability with your CPA.",
  "content": "Several federal tax credits are available for energy-efficient investments that may apply to your small business or home office. For businesses, the Investment Tax Credit (ITC) under IRC Section 48 provides a credit for qualifying clean energy installations including solar panels, wind energy systems, fuel cells, and energy storage systems. The Alternative Fuel Vehicle Refueling Property Credit may apply if you install electric vehicle charging equipment for business use. For home-based business owners, the Residential Clean Energy Credit (IRC Section 25D) applies to qualifying solar, wind, and battery storage systems at your primary residence. Energy credit rules are among the most complex in the tax code, and many provisions under the Inflation Reduction Act are subject to ongoing legislative changes, phase-outs, and potential expiration. Verify current availability and amounts directly with IRS.gov or your CPA before claiming any energy credit. Luca can help you flag and organize energy-related expenses for your CPA to review, but calculating specific credit amounts requires professional guidance.",
  "related_articles": [{"id":"home_office_deduction","relationship":"often_used_together"},{"id":"section_179_expensing","relationship":"compare_with"},{"id":"depreciation_basics","relationship":"related"}],
  "luca_flags": []
},

"irs_record_retention_rules": {
  "id": "irs_record_retention_rules", "knowledge_version": "2026.1", "topic": "Record Keeping and Compliance",
  "title": "IRS Record Retention Rules — What to Keep and How Long",
  "audience": ["sole_prop","single_member_llc","s_corp","partnership"], "applies_to": ["sole_prop","single_member_llc","s_corp","partnership"],
  "irs_source": {"publication":"Publication 583","section":"Chapter 1","url":"https://www.irs.gov/pub/irs-pdf/p583.pdf","last_verified":"2026-07-01","tax_year":2026},
  "jurisdiction": {"country":"US","federal":True,"state_specific":False},
  "confidence": "high", "review_status": "Approved — v1.0",
  "last_reviewed_by": ["Claude (Anthropic)","Grok (xAI)","ChatGPT (OpenAI)"],
  "summary": "The IRS generally has 3 years from the filing date to audit your return, but 6 years if you underreported income by more than 25%. Ledger AI recommends keeping all business records for at least 7 years as a conservative default.",
  "content": "The IRS statute of limitations determines how long the IRS has to audit your tax return and assess additional taxes. Generally, the IRS has 3 years from the date you filed your return to audit and assess additional taxes. The limit extends to 6 years if you omitted more than 25% of your gross income. There is no statute of limitations if you filed a fraudulent return or never filed at all. Ledger AI recommends a seven-year retention period as a simple, conservative default. Different record types may have shorter or longer legal retention requirements under IRS rules — seven years covers the most common audit scenarios safely. Records to keep include copies of filed tax returns, all receipts and invoices supporting business expense deductions, bank and credit card statements, mileage logs, payroll records, 1099 forms issued and received, contracts and agreements, asset purchase records and depreciation schedules, and any correspondence with the IRS. Property records should be kept for as long as you own the property plus 7 years after you sell it. Employment tax records must be kept for at least 4 years. Digital records are fully acceptable to the IRS.",
  "related_articles": [{"id":"digital_receipts_and_electronic_records","relationship":"expands_on"},{"id":"audit_readiness","relationship":"often_used_together"},{"id":"business_bank_account_separation","relationship":"related"}],
  "luca_flags": []
},

"business_bank_account_separation": {
  "id": "business_bank_account_separation", "knowledge_version": "2026.1", "topic": "Record Keeping and Compliance",
  "title": "Business Bank Account Separation — Why It Matters Legally and for Taxes",
  "audience": ["sole_prop","single_member_llc","s_corp","partnership"], "applies_to": ["sole_prop","single_member_llc","s_corp","partnership"],
  "irs_source": {"publication":"Publication 583","section":"Chapter 1","url":"https://www.irs.gov/pub/irs-pdf/p583.pdf","last_verified":"2026-07-01","tax_year":2026},
  "jurisdiction": {"country":"US","federal":True,"state_specific":False},
  "confidence": "high", "review_status": "Approved — v1.0",
  "last_reviewed_by": ["Claude (Anthropic)","Grok (xAI)","ChatGPT (OpenAI)"],
  "summary": "Keeping a dedicated business bank account separate from your personal finances protects your LLC liability shield, simplifies tax preparation, and dramatically improves automatic categorization accuracy in Luca.",
  "content": "Maintaining a dedicated business checking account is one of the foundational practices of good business financial management. For tax purposes, a separate business account makes it dramatically easier to identify and document deductible business expenses, calculate your net profit, and respond to any IRS inquiries. For LLC owners, separation is essential to maintaining the liability protection your LLC structure provides. If you mix personal and business finances, a court can determine that your LLC is not a genuinely separate entity from you personally — called piercing the corporate veil — and hold you personally liable for business debts. For practical implementation, open a business checking account using your business name and EIN. All business income should be deposited into this account. All business expenses should be paid from this account. Even if you are a sole proprietor with no legal requirement for separation, treating the accounts as completely separate simplifies your bookkeeping dramatically. Additionally, separate bank feeds dramatically improve automatic categorization accuracy — Luca is designed to work most effectively when your business account is the source of your tracked expenses.",
  "related_articles": [{"id":"business_income_vs_personal","relationship":"often_used_together"},{"id":"irs_record_retention_rules","relationship":"related"},{"id":"sole_proprietor_vs_llc","relationship":"related"}],
  "luca_flags": []
},

"accounting_methods_cash_vs_accrual": {
  "id": "accounting_methods_cash_vs_accrual", "knowledge_version": "2026.1", "topic": "Record Keeping and Compliance",
  "title": "Accounting Methods — Cash Basis vs. Accrual Basis",
  "audience": ["sole_prop","single_member_llc","s_corp","partnership"], "applies_to": ["sole_prop","single_member_llc","s_corp","partnership"],
  "irs_source": {"publication":"Publication 538","section":"Chapter 1","url":"https://www.irs.gov/pub/irs-pdf/p538.pdf","last_verified":"2026-07-01","tax_year":2026},
  "jurisdiction": {"country":"US","federal":True,"state_specific":False},
  "confidence": "high", "review_status": "Approved — v1.0",
  "last_reviewed_by": ["Claude (Anthropic)","Grok (xAI)","ChatGPT (OpenAI)"],
  "summary": "Most small businesses use the cash basis method, where income is recorded when received and expenses when paid. The accrual method records income when earned and expenses when incurred, regardless of when money changes hands.",
  "content": "Your accounting method determines when you report income and expenses on your tax return. Under the cash basis method, you report income in the year you actually receive payment and deduct expenses in the year you actually pay them. This is the simpler method and is used by most sole proprietors and small businesses. Under the accrual method, you report income when it is earned and deduct expenses when they are incurred, regardless of when money actually changes hands. Most small businesses use the cash basis method. C-corporations with average annual gross receipts exceeding $30 million are generally required to use the accrual method. Businesses with inventory may be required to use the accrual method for purchases and sales. Once you choose an accounting method, you must get IRS approval (Form 3115) to change it. By default, Luca records transactions using the cash basis method, although future versions may support accrual accounting for businesses that require it.",
  "related_articles": [{"id":"schedule_c_basics","relationship":"related"},{"id":"inventory_and_cogs","relationship":"related"},{"id":"irs_record_retention_rules","relationship":"related"}],
  "luca_flags": []
},

"sales_tax_basics": {
  "id": "sales_tax_basics", "knowledge_version": "2026.1", "topic": "Record Keeping and Compliance",
  "title": "Sales Tax Basics — Nexus, Collection, and Remittance",
  "audience": ["sole_prop","single_member_llc","s_corp","partnership"], "applies_to": ["sole_prop","single_member_llc","s_corp","partnership"],
  "irs_source": {"publication":"State tax authorities — not IRS","section":"Sales tax is state-administered, not federal","url":"https://www.irs.gov/businesses/small-businesses-self-employed/state-and-local-taxes","last_verified":"2026-07-01","tax_year":2026},
  "jurisdiction": {"country":"US","federal":False,"state_specific":True},
  "confidence": "high", "review_status": "Approved — v1.0",
  "last_reviewed_by": ["Claude (Anthropic)","Grok (xAI)","ChatGPT (OpenAI)"],
  "summary": "Sales tax is administered by individual states, not the IRS. You must collect and remit sales tax in states where you have nexus. Economic nexus rules now apply to online sellers based on sales volume alone.",
  "content": "Sales tax is a state and local tax, not a federal tax — the IRS is not involved in sales tax collection or enforcement. Each state that has a sales tax sets its own rates, rules about what is taxable, filing deadlines, and penalties. The key concept is nexus — your business must have a sufficient connection to a state before you are required to collect and remit that state's sales tax. Physical nexus arises from a physical presence in a state: an office, warehouse, employees, or inventory stored there. Economic nexus, established by the Supreme Court's 2018 South Dakota v. Wayfair decision, requires sales tax collection based on sales volume or transaction count in a state even without physical presence. Most states have set economic nexus thresholds at $100,000 in annual sales or 200 transactions. Service businesses are often not subject to sales tax, but rules vary significantly by state. Sales tax you collect from customers is not your income — it is held in trust until you remit it to the state. If your business is growing or sells across state lines, consult a CPA or sales tax specialist to evaluate your nexus obligations.",
  "related_articles": [{"id":"accounting_methods_cash_vs_accrual","relationship":"related"},{"id":"business_bank_account_separation","relationship":"related"},{"id":"irs_record_retention_rules","relationship":"related"}],
  "luca_flags": []
},

"digital_receipts_and_electronic_records": {
  "id": "digital_receipts_and_electronic_records", "knowledge_version": "2026.1", "topic": "Record Keeping and Compliance",
  "title": "Digital Receipts and Electronic Records — IRS Acceptance and Best Practices",
  "audience": ["sole_prop","single_member_llc","s_corp","partnership"], "applies_to": ["sole_prop","single_member_llc","s_corp","partnership"],
  "irs_source": {"publication":"Revenue Procedure 98-25","section":"Section 4","url":"https://www.irs.gov/pub/irs-pdf/p583.pdf","last_verified":"2026-07-01","tax_year":2026},
  "jurisdiction": {"country":"US","federal":True,"state_specific":False},
  "confidence": "high", "review_status": "Approved — v1.0",
  "last_reviewed_by": ["Claude (Anthropic)","Grok (xAI)","ChatGPT (OpenAI)"],
  "summary": "The IRS fully accepts digital and scanned receipts as valid documentation. You do not need to keep paper originals as long as digital copies are legible, accurate, and accessible if requested.",
  "content": "The IRS officially accepts digital and electronic records as valid documentation for tax purposes under Revenue Procedure 98-25 and subsequent guidance. This means you do not need to keep paper receipts — a clear photo or scan of a receipt carries the same legal weight as the original paper document. For a digital receipt to satisfy IRS requirements, it must be a complete and accurate image of the original document, be legible and contain all relevant information (vendor, date, amount, and description), be stored in a format that can be reproduced and presented to the IRS if requested, and be kept for the required retention period. Email receipts from vendors are also fully acceptable as long as you retain them. Luca's document upload feature stores both the original uploaded image and the extracted OCR data. This means if an auditor requests to see the original receipt, it is available — the OCR extraction is a convenience layer, not a replacement for the source document. Paper receipts printed on thermal paper are especially prone to fading, making digital capture particularly important for those receipts.",
  "related_articles": [{"id":"irs_record_retention_rules","relationship":"expands_on"},{"id":"audit_readiness","relationship":"often_used_together"},{"id":"business_meals_50_percent","relationship":"related"}],
  "luca_flags": ["document_uploaded"]
},

"audit_readiness": {
  "id": "audit_readiness", "knowledge_version": "2026.1", "topic": "Record Keeping and Compliance",
  "title": "Audit Readiness — What Luca Helps You Organize and What the IRS Looks For",
  "audience": ["sole_prop","single_member_llc","s_corp","partnership"], "applies_to": ["sole_prop","single_member_llc","s_corp","partnership"],
  "irs_source": {"publication":"Publication 556","section":"Chapter 1","url":"https://www.irs.gov/pub/irs-pdf/p556.pdf","last_verified":"2026-07-01","tax_year":2026},
  "jurisdiction": {"country":"US","federal":True,"state_specific":False},
  "confidence": "high", "review_status": "Approved — v1.0",
  "last_reviewed_by": ["Claude (Anthropic)","Grok (xAI)","ChatGPT (OpenAI)"],
  "summary": "An IRS audit is a review of your tax return and supporting records. The best audit defense is organized, complete records maintained year-round. Luca is designed to maintain exactly the documentation the IRS looks for.",
  "content": "An IRS audit is simply a review of your tax return and the records that support it. Most small business audits are correspondence audits — the IRS mails you a letter asking for documentation of specific items, and you respond by mail. The IRS selects returns for audit based on statistical formulas, computer scoring, and random selection. Certain items commonly trigger scrutiny: unusually high business expenses relative to income, home office deductions, vehicle expenses, cash-intensive businesses, large charitable donations, and net operating losses for multiple consecutive years. The best audit defense is organized, accurate records maintained year-round. What the IRS looks for includes bank statements showing all business income was reported, receipts supporting expense deductions, mileage logs for vehicle deductions, documentation of the business purpose for meals and travel, and copies of contracts for large payments to contractors. Luca is specifically designed to help you maintain these records throughout the year. Every expense logged includes date, vendor, amount, category, and description. Every document uploaded is stored and linked. Every mileage trip includes the business purpose. Together, this helps you maintain the organized documentation that can support your tax positions during an audit.",
  "related_articles": [{"id":"irs_record_retention_rules","relationship":"often_used_together"},{"id":"digital_receipts_and_electronic_records","relationship":"often_used_together"},{"id":"business_bank_account_separation","relationship":"related"}],
  "luca_flags": []
},

"section_179_expensing": {
  "id": "section_179_expensing", "knowledge_version": "2026.1", "topic": "Deductions Often Missed",
  "title": "Section 179 — Immediate Expensing of Business Equipment",
  "audience": ["sole_prop","single_member_llc","s_corp","partnership"], "applies_to": ["sole_prop","single_member_llc","s_corp","partnership"],
  "irs_source": {"publication":"Publication 946","section":"Chapter 2","url":"https://www.irs.gov/pub/irs-pdf/p946.pdf","last_verified":"2026-07-01","tax_year":2026},
  "jurisdiction": {"country":"US","federal":True,"state_specific":False},
  "confidence": "high", "review_status": "Approved — v1.0",
  "last_reviewed_by": ["Claude (Anthropic)","Grok (xAI)","ChatGPT (OpenAI)"],
  "summary": "Section 179 allows businesses to immediately deduct the full cost of qualifying equipment in the year of purchase. The 2025 limit was $1,160,000 with a phase-out beginning at $2,890,000 — verify the 2026 limit at IRS.gov.",
  "content": "Section 179 of the Internal Revenue Code allows businesses to immediately expense — deduct in full in the year of purchase — the cost of qualifying business property rather than spreading the deduction over multiple years through depreciation. Qualifying property includes machinery and equipment, computers and technology hardware, office furniture and fixtures, certain vehicles (with limits), and off-the-shelf business software. The property must be placed in service during the tax year — meaning you must actually start using it, not just purchase it. The Section 179 deduction limit is adjusted annually for inflation. For 2026, confirm the exact limit at IRS.gov — as a reference, the 2025 limit was $1,160,000 with a phase-out beginning at $2,890,000 in total equipment purchases. The deduction cannot exceed your net taxable business income for the year — you cannot use Section 179 to create a loss. Vehicles have special limitations under Section 179 — luxury auto caps significantly limit the deduction for passenger vehicles, while larger vehicles like heavy SUVs and trucks have their own separate limits. Luca categorizes equipment purchases and flags them for your CPA to evaluate Section 179 eligibility.",
  "related_articles": [{"id":"depreciation_basics","relationship":"compare_with"},{"id":"assets_vs_supplies","relationship":"referenced_by"},{"id":"vehicle_expenses_mileage_vs_actual","relationship":"compare_with"}],
  "luca_flags": ["expense_category_equipment"]
},

"inventory_and_cogs": {
  "id": "inventory_and_cogs", "knowledge_version": "2026.1", "topic": "Deductions Often Missed",
  "title": "Inventory and Cost of Goods Sold (COGS) — How It Works for Product Businesses",
  "audience": ["sole_prop","single_member_llc","s_corp","partnership"], "applies_to": ["sole_prop","single_member_llc","s_corp","partnership"],
  "irs_source": {"publication":"Publication 334","section":"Chapter 6","url":"https://www.irs.gov/pub/irs-pdf/p334.pdf","last_verified":"2026-07-01","tax_year":2026},
  "jurisdiction": {"country":"US","federal":True,"state_specific":False},
  "confidence": "high", "review_status": "Approved — v1.0",
  "last_reviewed_by": ["Claude (Anthropic)","Grok (xAI)","ChatGPT (OpenAI)"],
  "summary": "If your business sells physical products, you cannot simply deduct the cost of inventory when you buy it. You calculate Cost of Goods Sold (COGS) — the cost of inventory you actually sold during the year — and deduct that on Schedule C.",
  "content": "If your business manufactures, purchases, or sells physical products, you must track inventory and calculate Cost of Goods Sold (COGS) rather than simply expensing product purchases as they occur. COGS represents the direct cost of the products you actually sold during the tax year. The basic COGS formula is: Beginning Inventory plus Purchases minus Ending Inventory equals Cost of Goods Sold. For example, if you started the year with $10,000 in inventory, purchased $40,000 more during the year, and ended the year with $8,000 unsold, your COGS is $42,000 — that is what you deduct, not the $40,000 you purchased. The unsold $8,000 remains as an asset and will be deducted in future years when those items are sold. COGS is calculated in Part III of Schedule C. Service businesses with no physical products do not have inventory or COGS. Businesses with annual gross receipts of $27 million or less may qualify for a simplified accounting method that allows immediate expensing of inventory items. Consult your CPA to determine whether the inventory accounting rules apply to your business.",
  "related_articles": [{"id":"schedule_c_basics","relationship":"referenced_by"},{"id":"accounting_methods_cash_vs_accrual","relationship":"related"},{"id":"gross_profit_vs_net_profit","relationship":"referenced_by"},{"id":"assets_vs_supplies","relationship":"compare_with"}],
  "luca_flags": []
},

"depreciation_basics": {
  "id": "depreciation_basics", "knowledge_version": "2026.1", "topic": "Deductions Often Missed",
  "title": "Depreciation Basics — What It Is and When It Applies",
  "audience": ["sole_prop","single_member_llc","s_corp","partnership"], "applies_to": ["sole_prop","single_member_llc","s_corp","partnership"],
  "irs_source": {"publication":"Publication 946","section":"Chapter 1","url":"https://www.irs.gov/pub/irs-pdf/p946.pdf","last_verified":"2026-07-01","tax_year":2026},
  "jurisdiction": {"country":"US","federal":True,"state_specific":False},
  "confidence": "high", "review_status": "Approved — v1.0",
  "last_reviewed_by": ["Claude (Anthropic)","Grok (xAI)","ChatGPT (OpenAI)"],
  "summary": "Depreciation allows you to deduct the cost of business assets over their useful life. The IRS assigns recovery periods by asset type — computers 5 years, office furniture 7 years, commercial buildings 39 years.",
  "content": "Depreciation is the method the IRS uses to allow businesses to deduct the cost of long-lived assets over time, reflecting that the asset gradually wears out or becomes obsolete as it helps generate business income. When you purchase a business asset worth more than $2,500 that has a useful life beyond one year, you generally cannot deduct the full cost immediately unless you use Section 179 or bonus depreciation. Instead, you spread the deduction over the asset's IRS-assigned recovery period using a depreciation method. The most common method is MACRS (Modified Accelerated Cost Recovery System). Under MACRS, the IRS assigns a recovery period to each asset class: 5 years for computers, cars, and light trucks; 7 years for office furniture, fixtures, and most manufacturing equipment; 15 years for land improvements; 27.5 years for residential rental property; and 39 years for commercial real estate. Understanding depreciation matters especially when you sell a depreciated asset — the IRS may require you to pay depreciation recapture tax on the gain attributable to previously claimed depreciation. Luca flags equipment purchases above $2,500 for your CPA to evaluate the best deduction strategy.",
  "related_articles": [{"id":"section_179_expensing","relationship":"compare_with"},{"id":"assets_vs_supplies","relationship":"summarized_by"},{"id":"vehicle_expenses_mileage_vs_actual","relationship":"expands_on"}],
  "luca_flags": ["expense_category_equipment"]
},

"luca_app_navigation_help": {
  "id": "luca_app_navigation_help", "knowledge_version": "2026.1", "topic": "Luca App Help",
  "title": "How to Navigate Luca — Finding Expenses, Reports, Mileage, and Documents",
  "audience": ["all"], "applies_to": ["all"],
  "app_context": {"feature_area":"Navigation","app_version":"0.1.0","last_updated":"2026-07-01"},
  "jurisdiction": {"country":"US","federal":False,"state_specific":False},
  "confidence": "high", "review_status": "Approved — v1.0",
  "last_reviewed_by": ["Claude (Anthropic)","Grok (xAI)","ChatGPT (OpenAI)"],
  "summary": "Luca has eight main sections in the navigation bar: Dashboard, Ask Luca, Expenses, Mileage, Documents, Reports, Subscription, and Settings. Each section handles a specific part of your bookkeeping.",
  "content": "Luca is organized into eight main sections, all accessible from the navigation bar at the top of the app. The Dashboard is your home screen — it shows your total deductions year-to-date, this month's spending, business mileage summary, and recent activity. It updates automatically as you log expenses and trips. The Ask Luca section is your AI tax and bookkeeping assistant. Type any tax or bookkeeping question and Luca will answer from her verified knowledge base. Questions outside the knowledge base are redirected to your CPA. The Expenses section is where you log business transactions. Enter the date, vendor, amount, and a brief description, then click Ask Luca to Categorize and Luca will suggest the IRS category automatically. You can accept her suggestion or choose your own from the dropdown. The Mileage section tracks business driving. Log each trip with the date, miles driven, trip type, and the business purpose. Luca automatically calculates your IRS deduction. The Documents section lets you upload receipts and financial documents. Drag a file onto the upload area or click to browse. Luca will attempt to extract the vendor, amount, and date automatically. The Reports section generates financial summaries. Choose your business and date range, and Luca produces a breakdown by category and a downloadable PDF report. The Subscription section shows your current plan and upgrade options. The Settings section lets you manage your businesses, view data statistics, and reset or clear your data. To switch between businesses, click the business name pill at the top of any page.",
  "related_articles": [{"id":"luca_receipt_categorization_help","relationship":"often_used_together"}],
  "luca_flags": []
},

"luca_receipt_categorization_help": {
  "id": "luca_receipt_categorization_help", "knowledge_version": "2026.1", "topic": "Luca App Help",
  "title": "How to Use Luca to Categorize Receipts and Analyze Documents",
  "audience": ["all"], "applies_to": ["all"],
  "app_context": {"feature_area":"Documents and Expenses","app_version":"0.1.0","last_updated":"2026-07-01"},
  "jurisdiction": {"country":"US","federal":False,"state_specific":False},
  "confidence": "high", "review_status": "Approved — v1.0",
  "last_reviewed_by": ["Claude (Anthropic)","Grok (xAI)","ChatGPT (OpenAI)"],
  "summary": "Luca can read receipt images and extract financial information automatically. Upload receipts in the Documents section, or log an expense and click Ask Luca to Categorize to get an AI-suggested IRS category.",
  "content": "Luca has two ways to help you categorize receipts and financial documents. The first is the Documents section, where you can upload photos or scans of receipts, invoices, and other financial documents. To upload, click the Documents tab, make sure your business is selected, then drag a file onto the upload area or click to browse your files. Supported formats are JPG, PNG, and PDF up to 10MB. Once uploaded, Luca's vision AI reads the document and attempts to extract the vendor name, total amount, date, and document type. The extraction results appear below the upload area. You can then go to the Expenses tab and log the expense using the extracted information. The second way is the Ask Luca to Categorize button in the Expenses section. When you enter a vendor name, amount, and optional description and click that button, Luca analyzes the information and suggests an IRS expense category, a confidence level (high, medium, or low), whether the expense is likely deductible, and notes explaining her reasoning. You can accept her suggestion or override it with your own choice from the dropdown. For best categorization results, include a description of what the expense was for — for example, Client meeting lunch gives Luca much better context than just Starbucks. If Luca marks an expense as low confidence or flags it for review, it means she is uncertain and wants you to verify the category manually.",
  "related_articles": [{"id":"luca_app_navigation_help","relationship":"often_used_together"},{"id":"digital_receipts_and_electronic_records","relationship":"expands_on"}],
  "luca_flags": ["document_uploaded","expense_logged"]
},

}

created = 0
for entry_id, entry in ENTRIES.items():
    path = ENTRIES_DIR / f"{entry_id}.json"
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(entry, f, indent=2, ensure_ascii=False)
    print(f"  OK  {entry_id}")
    created += 1

total = len(list(Path("knowledge_base/entries").glob("*.json")))
print(f"\nBatch 3 complete: {created} entries installed")
print(f"Total entries in knowledge_base/entries/: {total}")
print("\nNext step — rebuild the embeddings:")
print("  python -m backend.app.luca.build_kb")
