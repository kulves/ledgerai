"""
kb_install_batch2.py — Knowledge Base Installer Batch 2 of 3
==============================================================
Run from: ~/Documents/ledgerai (project root, with venv active)
Command:  python kb_install_batch2.py
 
Creates 15 entries: Business Deductions (6) + Entity & Structure (6) + Retirement (3)
"""
import json
from pathlib import Path

ENTRIES_DIR = Path("knowledge_base/entries")
ENTRIES_DIR.mkdir(parents=True, exist_ok=True)

ENTRIES = {

"education_and_development": {
  "id": "education_and_development", "knowledge_version": "2026.1", "topic": "Business Deductions",
  "title": "Education and Professional Development Deductions",
  "audience": ["sole_prop","single_member_llc","s_corp","partnership"], "applies_to": ["sole_prop","single_member_llc","s_corp","partnership"],
  "irs_source": {"publication":"Publication 970","section":"Chapter 12","url":"https://www.irs.gov/pub/irs-pdf/p970.pdf","last_verified":"2026-07-01","tax_year":2026},
  "jurisdiction": {"country":"US","federal":True,"state_specific":False},
  "confidence": "high", "review_status": "Approved — v1.0",
  "last_reviewed_by": ["Claude (Anthropic)","Grok (xAI)","ChatGPT (OpenAI)"],
  "summary": "Education expenses that maintain or improve skills required in your current business are deductible. Education that qualifies you for a new career or business is not deductible.",
  "content": "Self-employed individuals can deduct education and professional development expenses that maintain or improve the skills required in their current trade or business. Deductible expenses include professional courses and workshops directly related to your field, industry conferences and seminars, books and professional publications, online courses and learning platforms, and professional certification renewal costs. The key test is whether the education maintains or improves skills required in your existing business. Education that meets the minimum requirements to enter a new field, or that qualifies you for an entirely new career, does not qualify as a business deduction. Professional memberships and dues paid to trade associations or professional organizations are also generally deductible as a business expense under Publication 535 as long as the membership is ordinary and necessary for your business.",
  "related_articles": [{"id":"assets_vs_supplies","relationship":"related"},{"id":"startup_costs_deduction","relationship":"related"}],
  "luca_flags": ["expense_category_education"]
},

"business_insurance_deductions": {
  "id": "business_insurance_deductions", "knowledge_version": "2026.1", "topic": "Business Deductions",
  "title": "Business Insurance Deductions",
  "audience": ["sole_prop","single_member_llc","s_corp","partnership"], "applies_to": ["sole_prop","single_member_llc","s_corp","partnership"],
  "irs_source": {"publication":"Publication 535","section":"Chapter 6","url":"https://www.irs.gov/pub/irs-pdf/p535.pdf","last_verified":"2026-07-01","tax_year":2026},
  "jurisdiction": {"country":"US","federal":True,"state_specific":False},
  "confidence": "high", "review_status": "Approved — v1.0",
  "last_reviewed_by": ["Claude (Anthropic)","Grok (xAI)","ChatGPT (OpenAI)"],
  "summary": "Business insurance premiums are generally fully deductible as ordinary and necessary business expenses, including general liability, professional liability, commercial property, workers compensation, and business interruption insurance.",
  "content": "The premiums you pay for insurance that protects your business are generally deductible as ordinary and necessary business expenses. Deductible business insurance types include general liability insurance, professional liability or errors and omissions (E&O) insurance, commercial property insurance, business interruption insurance, commercial auto insurance for business vehicles, workers compensation insurance, cyber liability insurance, and product liability insurance. If you work from home and have added business coverage to your homeowner's or renter's policy, the business-related portion of that rider is deductible. Life insurance premiums are generally not deductible as a business expense if you or your business is the beneficiary. Disability insurance that replaces lost business income is also generally not deductible. Health insurance premiums for self-employed individuals are deductible under a separate provision covered in the self-employed health insurance deduction entry. Insurance premiums must be for the current tax year to be deductible — if you pay a multi-year premium in advance, you can only deduct the portion that applies to the current tax year.",
  "related_articles": [{"id":"self_employed_health_insurance","relationship":"compare_with"},{"id":"irs_record_retention_rules","relationship":"related"}],
  "luca_flags": ["expense_category_insurance"]
},

"bank_fees_and_interest": {
  "id": "bank_fees_and_interest", "knowledge_version": "2026.1", "topic": "Business Deductions",
  "title": "Bank Fees and Business Interest Deductions",
  "audience": ["sole_prop","single_member_llc","s_corp","partnership"], "applies_to": ["sole_prop","single_member_llc","s_corp","partnership"],
  "irs_source": {"publication":"Publication 535","section":"Chapter 4","url":"https://www.irs.gov/pub/irs-pdf/p535.pdf","last_verified":"2026-07-01","tax_year":2026},
  "jurisdiction": {"country":"US","federal":True,"state_specific":False},
  "confidence": "high", "review_status": "Approved — v1.0",
  "last_reviewed_by": ["Claude (Anthropic)","Grok (xAI)","ChatGPT (OpenAI)"],
  "summary": "Business bank account fees, merchant processing fees, and interest paid on business loans are fully deductible. Personal loan interest used for business follows different tracing rules.",
  "content": "Bank and financial fees related to your business are deductible as ordinary and necessary business expenses. Deductible items include monthly business checking or savings account fees, wire transfer fees, overdraft fees on business accounts, merchant processing and credit card transaction fees such as those charged by Stripe, Square, or PayPal, business credit card annual fees, and loan origination fees amortized over the life of the loan. Interest paid on business loans is also deductible — this includes interest on business lines of credit, equipment financing, SBA loans, and business credit cards used for business purchases. The interest deduction applies to the interest portion of payments only, not the principal repayment. If you take out a personal loan and use the funds entirely for business purposes, the interest may be deductible, but you must document that the borrowed funds were used for business. Keep monthly statements and loan documents as records.",
  "related_articles": [{"id":"business_bank_account_separation","relationship":"related"},{"id":"home_office_deduction","relationship":"related"}],
  "luca_flags": ["expense_category_banking"]
},

"startup_costs_deduction": {
  "id": "startup_costs_deduction", "knowledge_version": "2026.1", "topic": "Business Deductions",
  "title": "Startup Costs Deduction — Up to $5,000 in Your First Year",
  "audience": ["sole_prop","single_member_llc","s_corp","partnership"], "applies_to": ["sole_prop","single_member_llc","s_corp","partnership"],
  "irs_source": {"publication":"Publication 535","section":"Chapter 8","url":"https://www.irs.gov/pub/irs-pdf/p535.pdf","last_verified":"2026-07-01","tax_year":2026},
  "jurisdiction": {"country":"US","federal":True,"state_specific":False},
  "confidence": "high", "review_status": "Approved — v1.0",
  "last_reviewed_by": ["Claude (Anthropic)","Grok (xAI)","ChatGPT (OpenAI)"],
  "summary": "You can deduct up to $5,000 in startup costs in your first year of business. Costs above $5,000 must be amortized over 180 months. The $5,000 limit phases out if total startup costs exceed $50,000.",
  "content": "Starting a new business involves costs before you ever earn your first dollar. The IRS allows you to deduct up to $5,000 of these startup costs in your first year of business under IRC Section 195. Startup costs are expenses incurred before your business opens that would be deductible as ordinary business expenses if you were already operating. Examples include costs to investigate starting or buying a business, advertising before opening, employee training wages, travel to find suppliers or customers, and professional fees for business planning or legal setup. Organizational costs — the fees to legally form your LLC or corporation — are separately eligible for an additional $5,000 deduction in year one. Any startup costs above the $5,000 threshold must be amortized ratably over 180 months (15 years) beginning in the month your business opens. If your total startup costs exceed $50,000, the $5,000 first-year deduction phases out dollar for dollar.",
  "related_articles": [{"id":"section_179_expensing","relationship":"related"},{"id":"depreciation_basics","relationship":"related"},{"id":"sole_proprietor_vs_llc","relationship":"related"}],
  "luca_flags": []
},

"assets_vs_supplies": {
  "id": "assets_vs_supplies", "knowledge_version": "2026.1", "topic": "Business Deductions",
  "title": "Business Assets vs. Supplies — When to Expense vs. Capitalize",
  "audience": ["sole_prop","single_member_llc","s_corp","partnership"], "applies_to": ["sole_prop","single_member_llc","s_corp","partnership"],
  "irs_source": {"publication":"Publication 946","section":"Chapter 1","url":"https://www.irs.gov/pub/irs-pdf/p946.pdf","last_verified":"2026-07-01","tax_year":2026},
  "jurisdiction": {"country":"US","federal":True,"state_specific":False},
  "confidence": "high", "review_status": "Approved — v1.0",
  "last_reviewed_by": ["Claude (Anthropic)","Grok (xAI)","ChatGPT (OpenAI)"],
  "summary": "Supplies (consumables) are expensed immediately. Assets (equipment, furniture) costing more than $2,500 may need to be capitalized and depreciated, though Section 179 often allows immediate expensing of qualifying items.",
  "content": "Understanding whether a purchase is a supply or an asset determines how you deduct it on your tax return. Supplies are items used and consumed in business operations within the year — paper, printer ink, postage, cleaning products, and similar consumable items. Supplies are fully deductible as a business expense in the year you buy them. Assets are items with a useful life of more than one year that retain value — computers, laptops, phones, cameras, furniture, machinery, and vehicles. Under the IRS de minimis safe harbor rule, items costing $2,500 or less per unit can be expensed immediately rather than capitalized. Items costing more than $2,500 may need to be capitalized — recorded as assets and deducted over time through depreciation — though elections, exceptions, and capitalization rules can affect this. Consult your CPA for purchases near or above this threshold. However, Section 179 allows you to immediately expense the full cost of qualifying business property in the year you place it in service, up to the annual limit. The practical result is that most small business equipment purchases can be fully deducted in the year of purchase through one of these methods.",
  "related_articles": [{"id":"section_179_expensing","relationship":"leads_to"},{"id":"depreciation_basics","relationship":"leads_to"},{"id":"home_office_deduction","relationship":"often_used_together"}],
  "luca_flags": ["expense_category_equipment"]
},

"bad_debt_deduction": {
  "id": "bad_debt_deduction", "knowledge_version": "2026.1", "topic": "Business Deductions",
  "title": "Bad Debt Deduction — When Unpaid Invoices Become Deductible",
  "audience": ["sole_prop","single_member_llc","s_corp","partnership"], "applies_to": ["sole_prop","single_member_llc","s_corp","partnership"],
  "irs_source": {"publication":"Publication 535","section":"Chapter 10","url":"https://www.irs.gov/pub/irs-pdf/p535.pdf","last_verified":"2026-07-01","tax_year":2026},
  "jurisdiction": {"country":"US","federal":True,"state_specific":False},
  "confidence": "high", "review_status": "Approved — v1.0",
  "last_reviewed_by": ["Claude (Anthropic)","Grok (xAI)","ChatGPT (OpenAI)"],
  "summary": "Cash basis businesses — the majority of sole proprietors — cannot deduct bad debts because they never reported the unpaid income. Only accrual basis businesses that already reported the income can write off uncollectible receivables.",
  "content": "A bad debt is money owed to your business that you have been unable to collect and have determined is uncollectible. Whether you can deduct a bad debt depends entirely on your accounting method. If you use the cash basis method (which most sole proprietors do), you report income only when you actually receive payment. This means if a client never pays your invoice, you never reported that income — so there is nothing to deduct. The uncollected invoice is simply removed from your records without a tax deduction. If you use the accrual method, you report income when earned regardless of when you receive payment. If you invoiced a client and reported that income on your return but never collected, you may be able to deduct the uncollectible amount as a bad debt in the year it becomes worthless. To claim a business bad debt deduction on the accrual method, you must show that the debt was related to your business, that you took reasonable steps to collect it, and that you have determined it is truly uncollectible. Discuss deductibility with your CPA based on your accounting method.",
  "related_articles": [{"id":"accounting_methods_cash_vs_accrual","relationship":"expands_on"},{"id":"schedule_c_basics","relationship":"related"},{"id":"irs_record_retention_rules","relationship":"related"}],
  "luca_flags": []
},

"sole_proprietor_vs_llc": {
  "id": "sole_proprietor_vs_llc", "knowledge_version": "2026.1", "topic": "Entity and Structure",
  "title": "Sole Proprietor vs. LLC — Tax Differences and What Changes",
  "audience": ["sole_prop","single_member_llc"], "applies_to": ["sole_prop","single_member_llc"],
  "irs_source": {"publication":"Publication 3402","section":"Chapter 1","url":"https://www.irs.gov/pub/irs-pdf/p3402.pdf","last_verified":"2026-07-01","tax_year":2026},
  "jurisdiction": {"country":"US","federal":True,"state_specific":False},
  "confidence": "high", "review_status": "Approved — v1.0",
  "last_reviewed_by": ["Claude (Anthropic)","Grok (xAI)","ChatGPT (OpenAI)"],
  "summary": "A single-member LLC is taxed identically to a sole proprietorship by default — both report income on Schedule C. The LLC provides legal liability protection but does not change your tax situation unless you elect corporate taxation.",
  "content": "For federal income tax purposes, a sole proprietorship and a single-member LLC are treated identically by default. Both report business income and expenses on Schedule C, both pay self-employment tax on net profit, and both file taxes through the owner's personal Form 1040. The IRS refers to the single-member LLC as a disregarded entity for tax purposes, meaning it does not file a separate federal tax return. The difference between a sole proprietorship and an LLC is primarily legal, not tax-related. An LLC provides personal liability protection — if your business is sued or cannot pay its debts, your personal assets are generally protected. A sole proprietorship offers no such protection. To maintain that liability protection, you must keep your business and personal finances completely separate. The tax situation changes if you elect to have your LLC taxed as an S-corporation or C-corporation — this requires filing Form 8832 or Form 2553 with the IRS. Consult with an attorney for guidance on whether an LLC is right for your specific situation.",
  "related_articles": [{"id":"s_corp_election","relationship":"leads_to"},{"id":"self_employment_tax","relationship":"related"},{"id":"business_bank_account_separation","relationship":"often_used_together"},{"id":"schedule_c_basics","relationship":"related"}],
  "luca_flags": []
},

"s_corp_election": {
  "id": "s_corp_election", "knowledge_version": "2026.1", "topic": "Entity and Structure",
  "title": "S-Corp Election — When It Makes Sense and What Changes",
  "audience": ["sole_prop","single_member_llc","s_corp"], "applies_to": ["sole_prop","single_member_llc","s_corp"],
  "irs_source": {"publication":"Publication 589","section":"Chapter 1","url":"https://www.irs.gov/pub/irs-pdf/p589.pdf","last_verified":"2026-07-01","tax_year":2026},
  "jurisdiction": {"country":"US","federal":True,"state_specific":False},
  "confidence": "high", "review_status": "Approved — v1.0",
  "last_reviewed_by": ["Claude (Anthropic)","Grok (xAI)","ChatGPT (OpenAI)"],
  "summary": "Electing S-corp status allows business owners to split income into salary and distributions, potentially saving self-employment taxes once net profit consistently exceeds roughly $40,000-$50,000 per year.",
  "content": "An S-corporation election allows your LLC or corporation to be taxed as a pass-through entity with a potential self-employment tax advantage. As a sole proprietor or single-member LLC, 100% of your net profit is subject to self-employment tax (15.3%). With an S-corp election, you split your business income into two parts: a reasonable salary you pay yourself as a W-2 employee (subject to payroll taxes) and distributions of remaining profit (not subject to self-employment tax). For example, if your business earns $100,000 net profit and you pay yourself a $60,000 reasonable salary, only the $60,000 salary is subject to payroll taxes — the remaining $40,000 in distributions avoids self-employment tax, potentially saving $6,000 or more. However, S-corp election adds complexity and cost: you must pay yourself a reasonable market-rate salary, run actual payroll with quarterly payroll tax filings, and file a separate S-corp tax return (Form 1120-S). The general rule of thumb is that S-corp election begins to make financial sense when your net profit consistently exceeds $40,000 to $50,000 per year. Consult a CPA before making this election.",
  "related_articles": [{"id":"sole_proprietor_vs_llc","relationship":"referenced_by"},{"id":"self_employment_tax","relationship":"compare_with"},{"id":"qbi_deduction_section_199a","relationship":"often_used_together"}],
  "luca_flags": []
},

"contractor_vs_employee": {
  "id": "contractor_vs_employee", "knowledge_version": "2026.1", "topic": "Entity and Structure",
  "title": "Contractor vs. Employee — The IRS Classification Test",
  "audience": ["sole_prop","single_member_llc","s_corp","partnership"], "applies_to": ["sole_prop","single_member_llc","s_corp","partnership"],
  "irs_source": {"publication":"Publication 15-A","section":"Chapter 2","url":"https://www.irs.gov/pub/irs-pdf/p15a.pdf","last_verified":"2026-07-01","tax_year":2026},
  "jurisdiction": {"country":"US","federal":True,"state_specific":False},
  "confidence": "high", "review_status": "Approved — v1.0",
  "last_reviewed_by": ["Claude (Anthropic)","Grok (xAI)","ChatGPT (OpenAI)"],
  "summary": "The IRS uses three categories — behavioral control, financial control, and type of relationship — to determine whether a worker is an employee or independent contractor. Misclassification carries significant penalties.",
  "content": "How you classify workers who perform services for your business has significant tax and legal consequences. Independent contractors receive a 1099-NEC and are responsible for their own taxes. Employees receive a W-2 and you must withhold and pay payroll taxes on their behalf. The IRS uses three categories of evidence to determine classification. Behavioral control examines whether you control how work is done — if you dictate when, where, and how someone works, that points to employee status. Financial control examines the business relationship — if the worker can profit or lose money, works for multiple clients, provides their own tools, and is paid by the project, that points to contractor status. Type of relationship examines written contracts, benefits provided, the permanency of the relationship, and whether the work is a core part of your business. No single factor is determinative. Misclassifying an employee as an independent contractor can result in back payroll taxes, interest, and substantial penalties. Many states have their own, often stricter, worker classification tests.",
  "related_articles": [{"id":"hiring_independent_contractors","relationship":"leads_to"},{"id":"1099_nec_basics","relationship":"leads_to"},{"id":"sole_proprietor_vs_llc","relationship":"related"}],
  "luca_flags": []
},

"hiring_independent_contractors": {
  "id": "hiring_independent_contractors", "knowledge_version": "2026.1", "topic": "Entity and Structure",
  "title": "Hiring Independent Contractors — W-9, 1099-NEC, and Recordkeeping",
  "audience": ["sole_prop","single_member_llc","s_corp","partnership"], "applies_to": ["sole_prop","single_member_llc","s_corp","partnership"],
  "irs_source": {"publication":"Publication 15-A","section":"Chapter 2","url":"https://www.irs.gov/pub/irs-pdf/p15a.pdf","last_verified":"2026-07-01","tax_year":2026},
  "jurisdiction": {"country":"US","federal":True,"state_specific":False},
  "confidence": "high", "review_status": "Approved — v1.0",
  "last_reviewed_by": ["Claude (Anthropic)","Grok (xAI)","ChatGPT (OpenAI)"],
  "summary": "When you pay an independent contractor $600 or more in a calendar year, you must collect a W-9 before payment and file a 1099-NEC with the IRS and contractor by January 31 of the following year.",
  "content": "If your business hires independent contractors, you have specific IRS reporting obligations. Before making any payment, collect a completed Form W-9 from each contractor — it provides their legal name, taxpayer identification number, and address. If you pay any individual contractor $600 or more during the calendar year for services, you must file Form 1099-NEC reporting the total amount paid. The $600 threshold is cumulative across the year. Payments made to corporations (except attorneys) are generally exempt from 1099 reporting requirements. Payments through credit cards or third-party payment networks like PayPal or Stripe are reported by the payment processor on Form 1099-K instead. The deadline for both sending a copy to the contractor and filing with the IRS is January 31 of the year following payment. Failure to file required 1099 forms results in penalties ranging from $60 to $310 per form depending on how late the filing is.",
  "related_articles": [{"id":"1099_nec_basics","relationship":"leads_to"},{"id":"contractor_vs_employee","relationship":"referenced_by"},{"id":"irs_record_retention_rules","relationship":"related"}],
  "luca_flags": ["expense_category_professional_services"]
},

"1099_nec_basics": {
  "id": "1099_nec_basics", "knowledge_version": "2026.1", "topic": "Entity and Structure",
  "title": "1099-NEC Basics — Who Gets One, When to File, and Penalties",
  "audience": ["sole_prop","single_member_llc","s_corp","partnership"], "applies_to": ["sole_prop","single_member_llc","s_corp","partnership"],
  "irs_source": {"publication":"Publication 1220","section":"General Instructions for Certain Information Returns","url":"https://www.irs.gov/pub/irs-pdf/i1099nec.pdf","last_verified":"2026-07-01","tax_year":2026},
  "jurisdiction": {"country":"US","federal":True,"state_specific":False},
  "confidence": "high", "review_status": "Approved — v1.0",
  "last_reviewed_by": ["Claude (Anthropic)","Grok (xAI)","ChatGPT (OpenAI)"],
  "summary": "Form 1099-NEC reports nonemployee compensation paid to contractors. File it when you pay a non-corporate contractor $600 or more in a year. Both the contractor copy and IRS copy are due January 31.",
  "content": "Form 1099-NEC (Nonemployee Compensation) replaced 1099-MISC Box 7 reporting for contractor payments starting in 2020. You must file a 1099-NEC for each person or unincorporated business to whom you paid $600 or more during the calendar year for services. You are not required to file for payments to C-corporations or S-corporations (except attorneys — attorney fees must always be reported regardless of corporate status). Payments made through credit cards or third-party payment networks like PayPal or Stripe are not reportable on 1099-NEC. The deadline for sending a copy to the contractor and filing with the IRS is January 31 of the year following payment. Penalties for failing to file a correct 1099-NEC range from $60 per form (if filed within 30 days of the deadline) to $310 per form (if not filed by August 1 or filed with incorrect information). Intentional disregard of the filing requirement carries a minimum penalty of $630 per form.",
  "related_articles": [{"id":"hiring_independent_contractors","relationship":"referenced_by"},{"id":"contractor_vs_employee","relationship":"referenced_by"},{"id":"irs_record_retention_rules","relationship":"related"}],
  "luca_flags": []
},

"hobby_vs_business": {
  "id": "hobby_vs_business", "knowledge_version": "2026.1", "topic": "Entity and Structure",
  "title": "Hobby vs. Business — The IRS Profit Test and Audit Risk",
  "audience": ["sole_prop","single_member_llc"], "applies_to": ["sole_prop","single_member_llc"],
  "irs_source": {"publication":"Publication 535","section":"Chapter 1","url":"https://www.irs.gov/pub/irs-pdf/p535.pdf","last_verified":"2026-07-01","tax_year":2026},
  "jurisdiction": {"country":"US","federal":True,"state_specific":False},
  "confidence": "high", "review_status": "Approved — v1.0",
  "last_reviewed_by": ["Claude (Anthropic)","Grok (xAI)","ChatGPT (OpenAI)"],
  "summary": "The IRS classifies an activity as a hobby if it lacks a genuine profit motive. Hobby income is taxable but hobby expenses are not deductible. The IRS presumes a business motive if you show profit in 3 of the last 5 years.",
  "content": "The IRS distinguishes between a business (operated with genuine intent to make a profit) and a hobby (an activity primarily pursued for personal enjoyment). Business losses can offset other income, but hobby losses cannot be deducted at all under current tax law following the Tax Cuts and Jobs Act of 2017. Hobby income, however, must still be reported as taxable income. The IRS uses a safe harbor rule: if your activity shows a profit in at least 3 of the last 5 consecutive tax years (2 of 7 years for horse breeding), it is presumed to be a business. If you do not meet the safe harbor, the IRS considers nine factors including whether you conduct the activity in a businesslike manner, the time and effort you put into it, whether you depend on income from it, your history of income or losses, and elements of personal pleasure or recreation. To protect yourself, operate your activity like a business: maintain a separate bank account, keep organized records, advertise or market your services, and document your efforts to improve profitability.",
  "related_articles": [{"id":"business_losses","relationship":"compare_with"},{"id":"schedule_c_basics","relationship":"related"},{"id":"irs_record_retention_rules","relationship":"related"}],
  "luca_flags": []
},

"sep_ira_basics": {
  "id": "sep_ira_basics", "knowledge_version": "2026.1", "topic": "Retirement and Benefits",
  "title": "SEP-IRA — Contribution Limits, Deadlines, and Who Can Contribute",
  "audience": ["sole_prop","single_member_llc","s_corp","partnership"], "applies_to": ["sole_prop","single_member_llc","s_corp","partnership"],
  "irs_source": {"publication":"Publication 560","section":"Chapter 2","url":"https://www.irs.gov/pub/irs-pdf/p560.pdf","last_verified":"2026-07-01","tax_year":2026},
  "jurisdiction": {"country":"US","federal":True,"state_specific":False},
  "confidence": "high", "review_status": "Approved — v1.0",
  "last_reviewed_by": ["Claude (Anthropic)","Grok (xAI)","ChatGPT (OpenAI)"],
  "summary": "A SEP-IRA allows self-employed individuals to contribute up to 25% of net self-employment income (up to the annual IRS limit) to a tax-deductible retirement account, with contributions allowed up to the tax filing deadline including extensions.",
  "content": "A Simplified Employee Pension IRA (SEP-IRA) is one of the most accessible and powerful retirement savings tools for self-employed individuals. Contributions are tax-deductible and the funds grow tax-deferred until withdrawal in retirement. For 2026, the contribution limit is the lesser of 25% of net self-employment income or the annual dollar limit set by the IRS (confirm the current 2026 limit at IRS.gov — the 2025 limit was $70,000). For sole proprietors and single-member LLCs, the actual contribution percentage works out to approximately 20% of net self-employment income after the self-employment tax deduction. You can make contributions up to your tax filing deadline including extensions — for sole proprietors that means until October 15 of the following year. This flexibility lets you decide how much to contribute after you know your final income for the year. If you have employees, you must also make contributions for eligible employees at the same percentage rate as you contribute for yourself.",
  "related_articles": [{"id":"solo_401k_basics","relationship":"compare_with"},{"id":"self_employed_health_insurance","relationship":"often_used_together"},{"id":"above_below_line_deductions","relationship":"expands_on"}],
  "luca_flags": ["expense_category_retirement"]
},

"solo_401k_basics": {
  "id": "solo_401k_basics", "knowledge_version": "2026.1", "topic": "Retirement and Benefits",
  "title": "Solo 401(k) — Higher Contribution Limits for the Self-Employed",
  "audience": ["sole_prop","single_member_llc","s_corp"], "applies_to": ["sole_prop","single_member_llc","s_corp"],
  "irs_source": {"publication":"Publication 560","section":"Chapter 4","url":"https://www.irs.gov/pub/irs-pdf/p560.pdf","last_verified":"2026-07-01","tax_year":2026},
  "jurisdiction": {"country":"US","federal":True,"state_specific":False},
  "confidence": "high", "review_status": "Approved — v1.0",
  "last_reviewed_by": ["Claude (Anthropic)","Grok (xAI)","ChatGPT (OpenAI)"],
  "summary": "A Solo 401(k) allows self-employed individuals with no full-time employees to contribute both as employee and employer, potentially allowing much higher total contributions than a SEP-IRA.",
  "content": "A Solo 401(k) is available to self-employed individuals and business owners with no full-time employees other than themselves and a spouse. You contribute in two capacities. As an employee of your own business, you can make elective deferrals up to the annual 401(k) limit (confirm the 2026 limit at IRS.gov — the 2025 limit was $23,500, with an additional $7,500 catch-up contribution if age 50 or older). As the employer, you can additionally contribute up to 25% of your net self-employment income. The combined employee and employer contributions cannot exceed the annual defined contribution limit. For high-earning self-employed individuals, the Solo 401(k) can allow significantly larger tax-deductible contributions than a SEP-IRA. Roth contributions are also available with Solo 401(k) plans at many providers. The plan must be established by December 31 of the year you want to make contributions — unlike a SEP-IRA, which can be opened up until your filing deadline.",
  "related_articles": [{"id":"sep_ira_basics","relationship":"compare_with"},{"id":"self_employment_tax","relationship":"related"},{"id":"s_corp_election","relationship":"related"}],
  "luca_flags": ["expense_category_retirement"]
},

"simple_ira_for_small_business": {
  "id": "simple_ira_for_small_business", "knowledge_version": "2026.1", "topic": "Retirement and Benefits",
  "title": "SIMPLE IRA — Retirement Plan for Small Businesses With Employees",
  "audience": ["sole_prop","single_member_llc","s_corp","partnership"], "applies_to": ["sole_prop","single_member_llc","s_corp","partnership"],
  "irs_source": {"publication":"Publication 560","section":"Chapter 3","url":"https://www.irs.gov/pub/irs-pdf/p560.pdf","last_verified":"2026-07-01","tax_year":2026},
  "jurisdiction": {"country":"US","federal":True,"state_specific":False},
  "confidence": "high", "review_status": "Approved — v1.0",
  "last_reviewed_by": ["Claude (Anthropic)","Grok (xAI)","ChatGPT (OpenAI)"],
  "summary": "A SIMPLE IRA is available to small businesses with 100 or fewer employees. It requires employer contributions and is easier to administer than a traditional 401(k).",
  "content": "A SIMPLE IRA (Savings Incentive Match Plan for Employees) is designed for small businesses with 100 or fewer employees who earned at least $5,000 in the prior year. Under a SIMPLE IRA, employees can make salary deferral contributions up to the annual limit (confirm the 2026 limit at IRS.gov — the 2025 limit was $16,500, with a $3,500 catch-up for employees age 50 or older). Employers are required to make contributions using one of two formulas: a dollar-for-dollar matching contribution up to 3% of each participating employee's compensation, or a flat 2% non-elective contribution for all eligible employees regardless of whether they contribute. Employer contributions are immediately 100% vested. You must establish a SIMPLE IRA plan by October 1 of the year you want it to take effect. A SIMPLE IRA is not available if you maintain any other qualified retirement plan at the same time. For solo business owners with no employees, a Solo 401(k) or SEP-IRA generally offers higher contribution limits and more flexibility.",
  "related_articles": [{"id":"sep_ira_basics","relationship":"compare_with"},{"id":"solo_401k_basics","relationship":"compare_with"},{"id":"contractor_vs_employee","relationship":"related"}],
  "luca_flags": ["expense_category_retirement"]
},

}

created = 0
for entry_id, entry in ENTRIES.items():
    path = ENTRIES_DIR / f"{entry_id}.json"
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(entry, f, indent=2, ensure_ascii=False)
    print(f"  OK  {entry_id}")
    created += 1

print(f"\nBatch 2 complete: {created} entries installed")
print("Run kb_install_batch3.py next")