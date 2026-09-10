// Single source of truth for expense categories across the whole app.
//
// Previously ExpenseForm.jsx, ExpenseList.jsx, DashboardPage.jsx, and
// ExpensesPage.jsx each had their own copy-pasted category list, and they'd
// drifted apart (different names for the same category, some categories
// missing entirely from some lists — e.g. "Meals & Entertainment" existed
// in ExpenseForm's list but not ExpenseList's, so it silently vanished from
// anything built off ExpenseList's list, like the split-expense dropdown).
//
// Names here match backend/app/luca/prompts/categorize.txt exactly, since
// that's what Luca's AI categorization actually returns and saves.

export const EXPENSE_CATEGORIES = [
  'Office Supplies',
  'Travel & Mileage',
  'Meals & Entertainment',
  'Professional Services',
  'Software & Subscriptions',
  'Marketing & Advertising',
  'Medical & Health',
  'Home Office',
  'Equipment & Assets',
  'Utilities & Facilities',
  'Payroll & Labor',
  'Insurance',
  'Banking & Finance',
  'Education & Development',
  'Retirement Contributions',
  'Personal (not deductible)',
  'Uncategorized',
]

export const CATEGORY_COLORS = {
  'Office Supplies':            '#38BDF8',
  'Travel & Mileage':           '#F97316',
  'Meals & Entertainment':      '#34D399',
  'Professional Services':      '#818CF8',
  'Software & Subscriptions':   '#22D3EE',
  'Marketing & Advertising':    '#2DD4BF',
  'Medical & Health':           '#FB7185',
  'Home Office':                '#4ADE80',
  'Equipment & Assets':         '#FB923C',
  'Utilities & Facilities':     '#94A3B8',
  'Payroll & Labor':            '#E879F9',
  'Insurance':                  '#A78BFA',
  'Banking & Finance':          '#60A5FA',
  'Education & Development':    '#FBBF24',
  'Retirement Contributions':   '#C084FC',
  'Personal (not deductible)':  '#F43F5E',
  'Uncategorized':              '#64748B',
}

// Deterministic fallback so an unmapped/custom category still gets a
// distinct, stable color instead of every unmapped category collapsing
// to the same flat grey (which is what made the dashboard pie chart look
// broken — most categories fell back to identical grey).
const FALLBACK_PALETTE = ['#38BDF8', '#F97316', '#34D399', '#818CF8', '#FB7185', '#FBBF24', '#A78BFA', '#4ADE80']
function fallbackColor(category) {
  let hash = 0
  for (let i = 0; i < category.length; i++) hash = (hash * 31 + category.charCodeAt(i)) >>> 0
  return FALLBACK_PALETTE[hash % FALLBACK_PALETTE.length]
}

export const categoryColor = (category) => CATEGORY_COLORS[category] || fallbackColor(category || 'Uncategorized')