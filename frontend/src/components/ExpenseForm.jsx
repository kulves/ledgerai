/**
 * ExpenseForm.jsx — Log a New Expense with Luca Auto-Categorization
 * ==================================================================
 * Purpose:
 *   The core expense logging form. When the user fills in vendor,
 *   amount, and description and clicks "Ask Luca", the AI engine
 *   automatically suggests the IRS category, confidence, and
 *   deductibility. The user can accept or override before saving.
 *
 * This is the bookkeeping assistant experience at its core —
 * the user describes what they spent and Luca does the accounting work.
 */

import { useState } from 'react'
import { api } from '../services/api'

// IRS categories — matches categorize.txt prompt
const CATEGORIES = [
  'Office Supplies', 'Travel & Mileage', 'Meals & Entertainment',
  'Professional Services', 'Software & Subscriptions', 'Marketing & Advertising',
  'Medical & Health', 'Home Office', 'Equipment & Assets',
  'Utilities & Facilities', 'Payroll & Labor', 'Insurance',
  'Banking & Finance', 'Education & Development', 'Retirement Contributions',
  'Personal (not deductible)', 'Uncategorized'
]

const CONFIDENCE_COLORS = {
  high:   'text-emerald-600 bg-emerald-50 border-emerald-200',
  medium: 'text-amber-600   bg-amber-50   border-amber-200',
  low:    'text-rose-600    bg-rose-50    border-rose-200'
}

export default function ExpenseForm({ business, onSaved, backendStatus }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],  // Today's date as default
    vendor: '',
    amount: '',
    description: '',
    notes: '',
    category: '',
    deductible: true,
    confidence: '',
    needs_review: false
  })
  const [lucaSuggestion, setLucaSuggestion] = useState(null)
  const [categorizing, setCategorizing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    // Clear Luca's suggestion if vendor/amount/description changes
    if (['vendor', 'amount', 'description'].includes(field)) {
      setLucaSuggestion(null)
    }
    setError('')
    setSaved(false)
  }

  // ── Ask Luca to categorize ──────────────────────────────────────────────
  const handleCategorize = async () => {
    if (!form.vendor || !form.amount) {
      setError('Please enter a vendor and amount before asking Luca to categorize.')
      return
    }

    setCategorizing(true)
    setLucaSuggestion(null)

    const result = await api.categorizeExpense(
      form.vendor,
      parseFloat(form.amount),
      form.description
    )

    setCategorizing(false)
    setLucaSuggestion(result)

    // Auto-fill the form with Luca's suggestion
    setForm(prev => ({
      ...prev,
      category: result.category,
      deductible: result.deductible,
      confidence: result.confidence,
      needs_review: result.needs_review
    }))
  }

  // ── Save the expense ────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.vendor || !form.amount || !form.category || !form.date) {
      setError('Please fill in date, vendor, amount, and category.')
      return
    }

    setSaving(true)
    setError('')

    const expenseData = {
      business_id: business.id,
      date: form.date,
      vendor: form.vendor,
      amount: parseFloat(form.amount),
      category: form.category,
      description: form.description || null,
      notes: form.notes || null,
      deductible: form.deductible,
      confidence: form.confidence || 'high',
      needs_review: form.needs_review,
      receipt_path: null
    }

    const saved = await api.createExpense(expenseData)
    setSaving(false)

    if (saved) {
      onSaved(saved)
      setSaved(true)
      // Reset form for next entry, keep date and business
      setForm({
        date: form.date,
        vendor: '',
        amount: '',
        description: '',
        notes: '',
        category: '',
        deductible: true,
        confidence: '',
        needs_review: false
      })
      setLucaSuggestion(null)
      setTimeout(() => setSaved(false), 3000)
    } else {
      setError('Failed to save expense. Please try again.')
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-[#0C2340] text-base">Log Expense</h2>
        <span className="text-xs text-gray-400">{business.name} · {business.state}</span>
      </div>

      {/* Row 1: Date + Vendor */}
      <div className="flex gap-3">
        <div className="flex flex-col gap-1 w-36">
          <label className="text-xs font-medium text-gray-600">Date</label>
          <input
            type="date"
            value={form.date}
            onChange={e => handleChange('date', e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9962C]"
          />
        </div>
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-xs font-medium text-gray-600">Vendor / Payee</label>
          <input
            type="text"
            placeholder="e.g. Office Depot, Amazon, United Airlines"
            value={form.vendor}
            onChange={e => handleChange('vendor', e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9962C]"
          />
        </div>
      </div>

      {/* Row 2: Amount + Description */}
      <div className="flex gap-3">
        <div className="flex flex-col gap-1 w-36">
          <label className="text-xs font-medium text-gray-600">Amount ($)</label>
          <input
            type="number"
            placeholder="0.00"
            step="0.01"
            min="0"
            value={form.amount}
            onChange={e => handleChange('amount', e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9962C]"
          />
        </div>
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-xs font-medium text-gray-600">Description (optional)</label>
          <input
            type="text"
            placeholder="What was this for?"
            value={form.description}
            onChange={e => handleChange('description', e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9962C]"
          />
        </div>
      </div>

      {/* Notes (freeform, not sent to Luca for categorization) */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">Notes (optional)</label>
        <textarea
          rows={2}
          placeholder="Any extra context — reimbursed by client, split with partner, etc."
          value={form.notes}
          onChange={e => handleChange('notes', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#C9962C]"
        />
      </div>

      {/* Ask Luca button */}
      <button
        onClick={handleCategorize}
        disabled={categorizing || !form.vendor || !form.amount || backendStatus === 'disconnected'}
        className="w-full bg-[#0C2340] hover:bg-[#0a1d38] disabled:opacity-40 text-white py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
      >
        {categorizing ? (
          <>
            <span className="animate-spin">⟳</span>
            Luca is categorizing...
          </>
        ) : (
          <>
            <span className="text-[#C9962C]">L</span>
            Ask Luca to Categorize
          </>
        )}
      </button>

      {/* Luca's suggestion */}
      {lucaSuggestion && (
        <div className={`border rounded-xl p-3 text-xs flex flex-col gap-1 ${
          lucaSuggestion.success
            ? 'bg-emerald-50 border-emerald-200'
            : 'bg-amber-50 border-amber-200'
        }`}>
          <div className="flex items-center gap-2 font-medium text-gray-700">
            <span className="w-5 h-5 rounded-full bg-[#0C2340] text-[#C9962C] flex items-center justify-center text-xs font-bold">L</span>
            {lucaSuggestion.success ? "Luca's suggestion:" : "Luca couldn't categorize:"}
          </div>
          {lucaSuggestion.notes && (
            <p className="text-gray-600 pl-7">{lucaSuggestion.notes}</p>
          )}
          {lucaSuggestion.needs_review && (
            <p className="text-amber-700 pl-7 font-medium">⚠ Flagged for review</p>
          )}
        </div>
      )}

      {/* Category + Deductible */}
      <div className="flex gap-3 items-end">
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-xs font-medium text-gray-600">
            Category
            {form.confidence && (
              <span className={`ml-2 px-1.5 py-0.5 rounded text-xs border ${CONFIDENCE_COLORS[form.confidence] || ''}`}>
                {form.confidence} confidence
              </span>
            )}
          </label>
          <select
            value={form.category}
            onChange={e => handleChange('category', e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9962C]"
          >
            <option value="">Select a category...</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1 items-center pb-0.5">
          <label className="text-xs font-medium text-gray-600">Deductible</label>
          <button
            onClick={() => handleChange('deductible', !form.deductible)}
            className={`w-12 h-6 rounded-full transition-all relative ${
              form.deductible ? 'bg-emerald-500' : 'bg-gray-300'
            }`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
              form.deductible ? 'left-6' : 'left-0.5'
            }`} />
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-rose-600 text-xs bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving || !form.category || !form.vendor || !form.amount}
        className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${
          saved
            ? 'bg-emerald-500 text-white'
            : 'bg-[#C9962C] hover:bg-[#B88A24] disabled:opacity-40 text-white'
        }`}
      >
        {saved ? '✓ Expense Saved!' : saving ? 'Saving...' : 'Save Expense'}
      </button>

    </div>
  )
}