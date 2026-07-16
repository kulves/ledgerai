"""
kb_install_batch1.py — Knowledge Base Installer Batch 1 of 3
==============================================================
Run from: ~/Documents/ledgerai (project root, with venv active)
Command:  python kb_install_batch1.py
 
Creates 15 entries: Business Income (7) + Business Deductions (8)
"""

import json
from pathlib import Path
 
ENTRIES_DIR = Path("knowledge_base/entries")
ENTRIES_DIR.mkdir(parents=True, exist_ok=True)
 
ENTRIES = {
 
"schedule_c_basics": {
  "id": "schedule_c_basics", "knowledge_version": "2026.1", "topic": "Business Income",
  "title": "Schedule C Basics — Profit or Loss From Business",
  "audience": ["sole_prop","single_member_llc"], "applies_to": ["sole_prop","single_member_llc"],
  "irs_source": {"publication":"Publication 334","section":"Chapter 1 and Chapter 10","url":"https://www.irs.gov/pub/irs-pdf/p334.pdf","last_verified":"2026-07-01","tax_year":2026},
  "jurisdiction": {"country":"US","federal":True,"state_specific":False},
  "confidence": "high", "review_status": "Approved — v1.0",
  "last_reviewed_by": ["Claude (Anthropic)","Grok (xAI)","ChatGPT (OpenAI)"],
  "summary": "Schedule C is the IRS form sole proprietors and single-member LLCs use to report business income and expenses, with the net profit flowing to their personal tax return.",
  "content": "Schedule C (Form 1040), titled Profit or Loss From Business, is the tax form used by sole proprietors and single-member LLCs to report all business income and deductible business expenses. The net profit or net loss calculated on Schedule C flows directly to your personal Form 1040 and is subject to both income tax and self-employment tax. You file one Schedule C per business. If you operate two separate businesses, you file two Schedule C forms. On Schedule C, you report your gross business income at the top, then subtract your allowable business expenses to arrive at net profit or net loss. Common expense categories on Schedule C include advertising, car and truck expenses, commissions, contract labor, depreciation, insurance, legal and professional services, office expenses, rent or lease payments, repairs and maintenance, supplies, taxes and licenses, travel, meals, utilities, and wages paid to employees. The form also has a Part III section for calculating Cost of Goods Sold if your business sells physical products. Schedule C is due with your personal tax return, typically April 15, with extensions available until October 15.",
  "related_articles": [{"id":"self_employment_tax","relationship":"leads_to"},{"id":"estimated_quarterly_taxes","relationship":"leads_to"},{"id":"gross_profit_vs_net_profit","relationship":"expands_on"},{"id":"business_income_vs_personal","relationship":"compare_with"}],
  "luca_flags": ["expense_logged"]
},
 
"business_income_vs_personal": {
  "id": "business_income_vs_personal", "knowledge_version": "2026.1", "topic": "Business Income",
  "title": "Business Income vs. Personal Income — Keeping Them Separate",
  "audience": ["sole_prop","single_member_llc","s_corp","partnership"], "applies_to": ["sole_prop","single_member_llc","s_corp","partnership"],
  "irs_source": {"publication":"Publication 334","section":"Chapter 1","url":"https://www.irs.gov/pub/irs-pdf/p334.pdf","last_verified":"2026-07-01","tax_year":2026},
  "jurisdiction": {"country":"US","federal":True,"state_specific":False},
  "confidence": "high", "review_status": "Approved — v1.0",
  "last_reviewed_by": ["Claude (Anthropic)","Grok (xAI)","ChatGPT (OpenAI)"],
  "summary": "Business income is money earned from your business activities. Keeping it separate from personal income protects you legally, simplifies taxes, and is required for accurate bookkeeping.",
  "content": "Business income is any payment you receive in exchange for goods or services provided through your business — client payments, sales revenue, freelance fees, commissions, and similar receipts. Personal income includes wages from a job, investment returns, rental income from personal property, and other non-business sources. The IRS requires you to report business income accurately on Schedule C. Mixing business and personal finances is one of the most common bookkeeping mistakes and creates serious problems: it makes it nearly impossible to calculate accurate deductions, it can trigger IRS scrutiny, and for LLCs it can compromise the liability protection your business structure is supposed to provide — a concept called piercing the corporate veil. The practical rule is simple: all business income should be received into a dedicated business bank account, and all business expenses should be paid from that same account. Never pay personal bills from your business account or deposit client payments into your personal account. Even for sole proprietors who are not legally required to maintain a separate account, doing so makes bookkeeping dramatically simpler and provides a clean paper trail if you are ever audited.",
  "related_articles": [{"id":"business_bank_account_separation","relationship":"leads_to"},{"id":"schedule_c_basics","relationship":"compare_with"},{"id":"irs_record_retention_rules","relationship":"related"}],
  "luca_flags": []
},
 
"gross_profit_vs_net_profit": {
  "id": "gross_profit_vs_net_profit", "knowledge_version": "2026.1", "topic": "Business Income",
  "title": "Gross Profit vs. Net Profit — What Self-Employed Owners Actually Pay Tax On",
  "audience": ["sole_prop","single_member_llc","s_corp","partnership"], "applies_to": ["sole_prop","single_member_llc","s_corp","partnership"],
  "irs_source": {"publication":"Publication 334","section":"Chapter 10","url":"https://www.irs.gov/pub/irs-pdf/p334.pdf","last_verified":"2026-07-01","tax_year":2026},
  "jurisdiction": {"country":"US","federal":True,"state_specific":False},
  "confidence": "high", "review_status": "Approved — v1.0",
  "last_reviewed_by": ["Claude (Anthropic)","Grok (xAI)","ChatGPT (OpenAI)"],
  "summary": "Gross profit is total revenue minus cost of goods sold. Net profit is what remains after all business expenses are deducted — and it is the number you pay income tax and self-employment tax on.",
  "content": "Understanding the difference between gross profit and net profit is fundamental to managing your business taxes. Gross revenue is the total amount your business received from clients or customers before any deductions. Gross profit is gross revenue minus your Cost of Goods Sold (COGS) — relevant if you sell physical products. For service businesses with no inventory, gross profit and gross revenue are often the same number. Net profit (also called net income) is what remains after you subtract all allowable business expenses from gross profit. This is the number that flows to your personal tax return on Schedule C, and it is the number you pay self-employment tax and income tax on. For example, if you earned $80,000 in gross revenue and had $30,000 in deductible business expenses, your net profit is $50,000. You pay taxes on $50,000, not $80,000. This is why accurate expense tracking is so important — every legitimate deductible expense directly reduces the amount of tax you owe.",
  "related_articles": [{"id":"schedule_c_basics","relationship":"referenced_by"},{"id":"self_employment_tax","relationship":"related"},{"id":"above_below_line_deductions","relationship":"expands_on"},{"id":"inventory_and_cogs","relationship":"related"}],
  "luca_flags": []
},
 
"estimated_quarterly_taxes": {
  "id": "estimated_quarterly_taxes", "knowledge_version": "2026.1", "topic": "Business Income",
  "title": "Estimated Quarterly Taxes — Who Pays, When, and How Much",
  "audience": ["sole_prop","single_member_llc","s_corp","partnership"], "applies_to": ["sole_prop","single_member_llc","s_corp","partnership"],
  "irs_source": {"publication":"Publication 505","section":"Chapter 2","url":"https://www.irs.gov/pub/irs-pdf/p505.pdf","last_verified":"2026-07-01","tax_year":2026},
  "jurisdiction": {"country":"US","federal":True,"state_specific":False},
  "confidence": "high", "review_status": "Approved — v1.0",
  "last_reviewed_by": ["Claude (Anthropic)","Grok (xAI)","ChatGPT (OpenAI)"],
  "summary": "Self-employed individuals generally must pay estimated taxes four times per year rather than waiting until April. Missing payments can result in penalties even if you pay in full by the filing deadline.",
  "content": "If you are self-employed and expect to owe at least $1,000 in federal taxes for the year, you are generally required to pay estimated taxes on a quarterly basis using IRS Form 1040-ES. This is because, unlike employees who have taxes withheld from each paycheck, self-employed individuals receive their income without any withholding. The four estimated tax payment due dates for 2026 are: April 15 (for income earned January 1 through March 31), June 16 (for income earned April 1 through May 31), September 15 (for income earned June 1 through August 31), and January 15, 2027 (for income earned September 1 through December 31). To avoid underpayment penalties, you can use the Safe Harbor rule: pay either 100% of last year's total tax liability spread across four equal payments, or 90% of your current year's expected tax liability — whichever is smaller. Many self-employed individuals set aside 25 to 30 percent of each payment they receive into a separate savings account designated for taxes, then make their quarterly payments from that account. Estimated taxes cover both your income tax and your self-employment tax obligations.",
  "related_articles": [{"id":"self_employment_tax","relationship":"often_used_together"},{"id":"estimated_tax_penalties","relationship":"leads_to"},{"id":"schedule_c_basics","relationship":"related"}],
  "luca_flags": []
},
 
"self_employment_tax": {
  "id": "self_employment_tax", "knowledge_version": "2026.1", "topic": "Business Income",
  "title": "Self-Employment Tax — What It Is, What It Funds, and the Deduction",
  "audience": ["sole_prop","single_member_llc"], "applies_to": ["sole_prop","single_member_llc"],
  "irs_source": {"publication":"Publication 334","section":"Chapter 10","url":"https://www.irs.gov/pub/irs-pdf/p334.pdf","last_verified":"2026-07-01","tax_year":2026},
  "jurisdiction": {"country":"US","federal":True,"state_specific":False},
  "confidence": "high", "review_status": "Approved — v1.0",
  "last_reviewed_by": ["Claude (Anthropic)","Grok (xAI)","ChatGPT (OpenAI)"],
  "summary": "Self-employment tax is the Social Security and Medicare tax paid by self-employed individuals at 15.3% on net earnings, with a valuable above-the-line deduction for half the amount paid.",
  "content": "Self-employment (SE) tax is how self-employed individuals contribute to Social Security and Medicare. When you are employed by someone else, your employer pays half of these taxes (7.65%) and withholds the other half from your paycheck. When you are self-employed, you pay both halves — which is why the rate is 15.3%. For 2026, the 15.3% rate applies to net self-employment earnings up to the Social Security wage base limit (verify the current 2026 threshold at IRS.gov, as it adjusts annually for inflation). Earnings above that threshold are subject only to the 2.9% Medicare portion, with an additional 0.9% Medicare surtax applying to earnings over $200,000 single or $250,000 married filing jointly. The good news is that you can deduct half of your self-employment tax as an above-the-line deduction on Form 1040, which reduces your adjusted gross income before calculating income tax. This deduction does not reduce your SE tax itself, but it does reduce your income tax. Self-employment tax is calculated on Schedule SE and filed with your annual tax return.",
  "related_articles": [{"id":"estimated_quarterly_taxes","relationship":"often_used_together"},{"id":"above_below_line_deductions","relationship":"expands_on"},{"id":"schedule_c_basics","relationship":"related"},{"id":"s_corp_election","relationship":"compare_with"}],
  "luca_flags": []
},
 
"estimated_tax_penalties": {
  "id": "estimated_tax_penalties", "knowledge_version": "2026.1", "topic": "Business Income",
  "title": "Estimated Tax Penalties — What Happens If You Don't Pay Quarterly",
  "audience": ["sole_prop","single_member_llc","s_corp","partnership"], "applies_to": ["sole_prop","single_member_llc","s_corp","partnership"],
  "irs_source": {"publication":"Publication 505","section":"Chapter 4","url":"https://www.irs.gov/pub/irs-pdf/p505.pdf","last_verified":"2026-07-01","tax_year":2026},
  "jurisdiction": {"country":"US","federal":True,"state_specific":False},
  "confidence": "high", "review_status": "Approved — v1.0",
  "last_reviewed_by": ["Claude (Anthropic)","Grok (xAI)","ChatGPT (OpenAI)"],
  "summary": "Missing or underpaying estimated quarterly taxes results in an IRS underpayment penalty calculated per quarter, even if you pay the full amount by April 15.",
  "content": "Many self-employed individuals are surprised to learn that paying all their taxes by April 15 is not enough to avoid penalties — the IRS expects quarterly payments throughout the year. If you underpay or skip estimated tax payments, the IRS charges an underpayment penalty for each quarter you fell short. For 2026, the underpayment penalty rate is the federal short-term interest rate plus 3 percentage points, calculated on the amount that should have been paid for each quarter. The penalty is assessed per quarter, so missing Q1 starts accruing a penalty from April 15 even if you pay everything by June. You will not owe a penalty if your total tax liability for the year is less than $1,000, or if you satisfy the Safe Harbor rule — paying either 100% of your prior year's tax liability or 90% of your current year's liability, whichever is smaller. For taxpayers whose prior year adjusted gross income exceeded $150,000, the Safe Harbor threshold increases to 110% of prior year tax. The underpayment penalty is calculated on IRS Form 2210 and functions more like interest on a short-term loan than a criminal penalty.",
  "related_articles": [{"id":"estimated_quarterly_taxes","relationship":"referenced_by"},{"id":"self_employment_tax","relationship":"related"}],
  "luca_flags": []
},
 
"business_losses": {
  "id": "business_losses", "knowledge_version": "2026.1", "topic": "Business Income",
  "title": "Business Losses — Can They Offset Income, and What Are the Rules?",
  "audience": ["sole_prop","single_member_llc","s_corp","partnership"], "applies_to": ["sole_prop","single_member_llc","s_corp","partnership"],
  "irs_source": {"publication":"Publication 334","section":"Chapter 1","url":"https://www.irs.gov/pub/irs-pdf/p334.pdf","last_verified":"2026-07-01","tax_year":2026},
  "jurisdiction": {"country":"US","federal":True,"state_specific":False},
  "confidence": "high", "review_status": "Approved — v1.0",
  "last_reviewed_by": ["Claude (Anthropic)","Grok (xAI)","ChatGPT (OpenAI)"],
  "summary": "A business loss occurs when deductible expenses exceed business income. For sole proprietors and single-member LLCs, losses can offset other income on your personal return, subject to at-risk and passive activity rules.",
  "content": "A business loss occurs when your total deductible business expenses exceed your total business income for the year, resulting in a negative net profit on Schedule C. For sole proprietors and single-member LLCs taxed as sole proprietors, a business loss is reported on your personal Form 1040 and can offset other income sources such as a spouse's wages, investment income, or income from a second job. However, there are important limitations. The at-risk rules (IRC Section 465) limit your deductible losses to the amount you have actually invested in the business or borrowed personally with liability. The passive activity loss rules (IRC Section 469) apply if you do not materially participate in the business. Additionally, if your losses exceed your income in a given year, you may have a Net Operating Loss (NOL) that can be carried forward to future tax years to offset future profits. Yes, you are still required to file even if your business lost money. Luca can help you organize your records, but loss deduction eligibility depends on your specific circumstances and should be reviewed with your CPA.",
  "related_articles": [{"id":"schedule_c_basics","relationship":"related"},{"id":"hobby_vs_business","relationship":"compare_with"},{"id":"gross_profit_vs_net_profit","relationship":"referenced_by"}],
  "luca_flags": []
},
 
"above_below_line_deductions": {
  "id": "above_below_line_deductions", "knowledge_version": "2026.1", "topic": "Business Deductions",
  "title": "Above-the-Line vs. Below-the-Line Deductions",
  "audience": ["sole_prop","single_member_llc","s_corp","partnership"], "applies_to": ["sole_prop","single_member_llc","s_corp","partnership"],
  "irs_source": {"publication":"Publication 505, Publication 535","section":"Chapter 1","url":"https://www.irs.gov/pub/irs-pdf/p505.pdf","last_verified":"2026-07-01","tax_year":2026},
  "jurisdiction": {"country":"US","federal":True,"state_specific":False},
  "confidence": "high", "review_status": "Approved — v1.0",
  "last_reviewed_by": ["Claude (Anthropic)","Grok (xAI)","ChatGPT (OpenAI)"],
  "summary": "Above-the-line deductions reduce your Adjusted Gross Income directly and are more powerful because they apply whether you itemize or not. Below-the-line deductions only help if your itemized deductions exceed the standard deduction.",
  "content": "Above-the-line deductions reduce your Adjusted Gross Income (AGI) directly. They are subtracted before your tax rate is applied, which makes them more powerful. Examples for self-employed business owners include business expenses on Schedule C, self-employed health insurance premiums, retirement contributions (SEP-IRA, Solo 401k), and the self-employment tax deduction. These apply whether you itemize or take the standard deduction. Below-the-line deductions are itemized deductions on Schedule A. They only help you if your total itemized deductions exceed the standard deduction for your filing status. Examples include medical expenses over 7.5% of AGI, state and local taxes (SALT, capped at $10,000), mortgage interest, and charitable contributions.",
  "related_articles": [{"id":"qbi_deduction_section_199a","relationship":"referenced_by"},{"id":"self_employed_health_insurance","relationship":"often_used_together"},{"id":"sep_ira_basics","relationship":"often_used_together"}],
  "luca_flags": []
},
 
"home_office_deduction": {
  "id": "home_office_deduction", "knowledge_version": "2026.1", "topic": "Business Deductions",
  "title": "Home Office Deduction — Simplified vs. Actual Expense Method",
  "audience": ["sole_prop","single_member_llc","s_corp"], "applies_to": ["sole_prop","single_member_llc"],
  "irs_source": {"publication":"Publication 587","section":"Chapter 1 and Chapter 2","url":"https://www.irs.gov/pub/irs-pdf/p587.pdf","last_verified":"2026-07-01","tax_year":2026},
  "jurisdiction": {"country":"US","federal":True,"state_specific":False},
  "confidence": "high", "review_status": "Approved — v1.0",
  "last_reviewed_by": ["Claude (Anthropic)","Grok (xAI)","ChatGPT (OpenAI)"],
  "summary": "The home office deduction allows self-employed individuals to deduct a portion of home expenses for a space used regularly and exclusively for business. Two methods: simplified ($5/sq ft, max 300 sq ft) or actual expenses.",
  "content": "The home office deduction allows self-employed individuals to deduct expenses related to the portion of their home used for business. To qualify, the space must meet two requirements: regular use (you use it consistently for business, not occasionally) and exclusive use (the space is used only for business and not for personal activities). A dedicated room that is your office qualifies. A kitchen table where you sometimes work does not. The Simplified Method allows you to deduct $5 per square foot of your home office space, up to a maximum of 300 square feet, for a maximum deduction of $1,500. It requires no complex calculations and no depreciation recapture when you sell your home. The Actual Expense Method calculates the percentage of your home used for business and applies that percentage to actual home expenses including rent or mortgage interest, utilities, insurance, repairs, and depreciation. The actual method generally produces a larger deduction but requires more detailed recordkeeping and may trigger depreciation recapture if you sell your home. Important note: employees who work from home cannot claim this deduction — it is available only to self-employed individuals. For S-corp owners who work from home, a different approach involving an accountable plan applies — consult your CPA.",
  "related_articles": [{"id":"phone_and_internet_mixed_use","relationship":"often_used_together"},{"id":"above_below_line_deductions","relationship":"expands_on"},{"id":"assets_vs_supplies","relationship":"often_used_together"}],
  "luca_flags": ["expense_category_home_office"]
},
 
"self_employed_health_insurance": {
  "id": "self_employed_health_insurance", "knowledge_version": "2026.1", "topic": "Business Deductions",
  "title": "Self-Employed Health Insurance Deduction",
  "audience": ["sole_prop","single_member_llc","s_corp","partnership"], "applies_to": ["sole_prop","single_member_llc","partnership"],
  "irs_source": {"publication":"Publication 535","section":"Chapter 6","url":"https://www.irs.gov/pub/irs-pdf/p535.pdf","last_verified":"2026-07-01","tax_year":2026},
  "jurisdiction": {"country":"US","federal":True,"state_specific":False},
  "confidence": "high", "review_status": "Approved — v1.0",
  "last_reviewed_by": ["Claude (Anthropic)","Grok (xAI)","ChatGPT (OpenAI)"],
  "summary": "Self-employed individuals can deduct 100% of health, dental, and vision insurance premiums paid for themselves and their family as an above-the-line deduction, reducing adjusted gross income directly.",
  "content": "If you are self-employed and not eligible for employer-sponsored health insurance through a spouse's job or your own W-2 employment, you can deduct 100% of premiums you pay for health, dental, and vision insurance for yourself, your spouse, your dependents, and children under age 27. This is an above-the-line deduction — it reduces your adjusted gross income directly on Form 1040, regardless of whether you itemize or take the standard deduction. However, it does not reduce your self-employment tax, only your income tax. The deduction cannot exceed your net profit from the business. If you had a loss for the year, you cannot claim this deduction for that period. You also cannot deduct premiums for any month in which you were eligible for coverage through an employer including a spouse's employer. Premiums paid through a Marketplace plan qualify. Long-term care insurance premiums also qualify up to age-based limits. For S-corp owner-employees, the deduction works differently — your corporation must pay or reimburse the premiums and include the amount in your W-2 wages, then you deduct it on your personal return.",
  "related_articles": [{"id":"above_below_line_deductions","relationship":"expands_on"},{"id":"self_employment_tax","relationship":"often_used_together"},{"id":"sep_ira_basics","relationship":"often_used_together"}],
  "luca_flags": ["expense_category_medical"]
},
 
"business_meals_50_percent": {
  "id": "business_meals_50_percent", "knowledge_version": "2026.1", "topic": "Business Deductions",
  "title": "Business Meals — The 50% Rule and Documentation Requirements",
  "audience": ["sole_prop","single_member_llc","s_corp","partnership"], "applies_to": ["sole_prop","single_member_llc","s_corp","partnership"],
  "irs_source": {"publication":"Publication 463","section":"Chapter 2","url":"https://www.irs.gov/pub/irs-pdf/p463.pdf","last_verified":"2026-07-01","tax_year":2026},
  "jurisdiction": {"country":"US","federal":True,"state_specific":False},
  "confidence": "high", "review_status": "Approved — v1.0",
  "last_reviewed_by": ["Claude (Anthropic)","Grok (xAI)","ChatGPT (OpenAI)"],
  "summary": "Business meals are generally 50% deductible when they have a clear business purpose and you document who attended, what was discussed, and the business relationship. Entertainment expenses remain non-deductible.",
  "content": "Business meals are 50% deductible when they meet IRS requirements. The meal must have a clear and ordinary business purpose — discussing a project with a client, meeting a potential business partner, or working through a business matter with an employee. The business owner or an employee must be present at the meal. Entertainment expenses such as sporting events, concerts, or shows have been non-deductible since the Tax Cuts and Jobs Act of 2017. For a meal to be deductible, you must document four things: the amount spent (keep the receipt), the date and location, the business purpose of the meal, and the name and business relationship of everyone who attended. Meals while traveling overnight on business are also 50% deductible. When in doubt about a specific meal situation, consult your CPA — meal deduction rules have changed multiple times in recent years.",
  "related_articles": [{"id":"business_travel_vs_commuting","relationship":"often_used_together"},{"id":"irs_record_retention_rules","relationship":"related"},{"id":"digital_receipts_and_electronic_records","relationship":"related"}],
  "luca_flags": ["expense_category_meals"]
},
 
"business_travel_vs_commuting": {
  "id": "business_travel_vs_commuting", "knowledge_version": "2026.1", "topic": "Business Deductions",
  "title": "Business Travel vs. Commuting — What's Deductible and What Isn't",
  "audience": ["sole_prop","single_member_llc","s_corp","partnership"], "applies_to": ["sole_prop","single_member_llc","s_corp","partnership"],
  "irs_source": {"publication":"Publication 463","section":"Chapter 1","url":"https://www.irs.gov/pub/irs-pdf/p463.pdf","last_verified":"2026-07-01","tax_year":2026},
  "jurisdiction": {"country":"US","federal":True,"state_specific":False},
  "confidence": "high", "review_status": "Approved — v1.0",
  "last_reviewed_by": ["Claude (Anthropic)","Grok (xAI)","ChatGPT (OpenAI)"],
  "summary": "Business travel away from your tax home overnight is deductible. Daily commuting between your home and your regular place of business is never deductible, even if you work from home part-time.",
  "content": "The IRS draws a clear line between deductible business travel and non-deductible commuting. Business travel is travel away from your tax home that requires you to be away overnight or long enough that you need rest before continuing work. All ordinary and necessary expenses for business travel are deductible, including airfare, hotels, taxis, rental cars, 50% of meal costs while traveling, and baggage fees. Commuting is the daily trip between your home and your regular place of business — it is never deductible, regardless of how far you travel. If you have a qualifying home office that is your principal place of business, trips from your home office to meet clients or visit other business locations may qualify as deductible business travel rather than commuting. For mixed personal and business trips, you can deduct the business portion of transportation costs. Keep receipts and a log for all travel expenses, noting the business purpose of each trip.",
  "related_articles": [{"id":"vehicle_expenses_mileage_vs_actual","relationship":"often_used_together"},{"id":"business_meals_50_percent","relationship":"often_used_together"},{"id":"irs_record_retention_rules","relationship":"related"}],
  "luca_flags": ["expense_category_travel"]
},
 
"vehicle_expenses_mileage_vs_actual": {
  "id": "vehicle_expenses_mileage_vs_actual", "knowledge_version": "2026.1", "topic": "Business Deductions",
  "title": "Vehicle Expenses — Standard Mileage Rate vs. Actual Expense Method",
  "audience": ["sole_prop","single_member_llc","s_corp","partnership"], "applies_to": ["sole_prop","single_member_llc","s_corp","partnership"],
  "irs_source": {"publication":"Publication 463","section":"Chapter 4","url":"https://www.irs.gov/pub/irs-pdf/p463.pdf","last_verified":"2026-07-01","tax_year":2026},
  "jurisdiction": {"country":"US","federal":True,"state_specific":False},
  "confidence": "high", "review_status": "Approved — v1.0",
  "last_reviewed_by": ["Claude (Anthropic)","Grok (xAI)","ChatGPT (OpenAI)"],
  "summary": "You can deduct business vehicle costs using the standard mileage rate (72.5 cents per mile for 2026) or actual expenses. You must choose your method in the first year you use the vehicle for business.",
  "content": "If you use a vehicle for business purposes, you can deduct those costs using one of two methods. The Standard Mileage Rate method for 2026 is 72.5 cents per business mile driven. This rate covers gas, depreciation, insurance, repairs, and all other vehicle costs — you cannot separately deduct those items if you use this method. You can still separately deduct parking fees and tolls paid for business purposes. The Actual Expense Method allows you to deduct the actual costs of operating your vehicle for business, including gas, oil, repairs, insurance, registration fees, and depreciation, multiplied by the percentage of miles driven for business versus total miles. You must choose your method in the first year you place the vehicle in service for business. Once you use the actual expense method for a vehicle, you generally cannot switch to standard mileage for that vehicle in future years. Regardless of which method you use, you must maintain a mileage log documenting the date, destination, business purpose, and miles driven for each business trip. Luca's mileage tracker is designed to capture exactly this information.",
  "related_articles": [{"id":"business_travel_vs_commuting","relationship":"often_used_together"},{"id":"section_179_expensing","relationship":"compare_with"},{"id":"depreciation_basics","relationship":"expands_on"},{"id":"irs_record_retention_rules","relationship":"related"}],
  "luca_flags": ["mileage_logged","expense_category_vehicle"]
},
 
"phone_and_internet_mixed_use": {
  "id": "phone_and_internet_mixed_use", "knowledge_version": "2026.1", "topic": "Business Deductions",
  "title": "Phone and Internet — Deducting Mixed-Use Expenses",
  "audience": ["sole_prop","single_member_llc","s_corp","partnership"], "applies_to": ["sole_prop","single_member_llc","s_corp","partnership"],
  "irs_source": {"publication":"Publication 535","section":"Chapter 11","url":"https://www.irs.gov/pub/irs-pdf/p535.pdf","last_verified":"2026-07-01","tax_year":2026},
  "jurisdiction": {"country":"US","federal":True,"state_specific":False},
  "confidence": "high", "review_status": "Approved — v1.0",
  "last_reviewed_by": ["Claude (Anthropic)","Grok (xAI)","ChatGPT (OpenAI)"],
  "summary": "You can deduct the business-use percentage of your phone and internet bills. If you use your phone 70% for business, you deduct 70% of the monthly cost. A phone used exclusively for business is 100% deductible.",
  "content": "Your cell phone and internet service are deductible to the extent you use them for business. Because most people use their personal phone and home internet for both business and personal purposes, the IRS requires you to calculate and deduct only the business-use percentage. To determine your business-use percentage for a phone, track your calls or usage for a representative period such as one month and calculate what percentage was for business versus personal use. Apply that percentage to your annual phone bill. For example, if your annual phone bill is $1,200 and you use your phone 70% for business, your deduction is $840. A phone used exclusively for business is 100% deductible. Home internet service follows the same percentage approach. If you work from home and use your internet primarily for business, you may be able to deduct 50 to 80 percent or more of your monthly internet bill. If you claim a home office deduction using the actual expense method, do not double-count your internet costs — they may already be included in your home office calculation.",
  "related_articles": [{"id":"home_office_deduction","relationship":"often_used_together"},{"id":"assets_vs_supplies","relationship":"related"},{"id":"irs_record_retention_rules","relationship":"related"}],
  "luca_flags": ["expense_category_software_subscriptions","expense_category_utilities"]
},
 
}
 
created = 0
for entry_id, entry in ENTRIES.items():
    path = ENTRIES_DIR / f"{entry_id}.json"
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(entry, f, indent=2, ensure_ascii=False)
    print(f"  OK  {entry_id}")
    created += 1
 
print(f"\nBatch 1 complete: {created} entries installed")
print("Run kb_install_batch2.py next")