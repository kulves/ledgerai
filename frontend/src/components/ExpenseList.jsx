/**
 * ExpenseList.jsx — Display Logged Expenses
 * ==========================================
 * Shows all expenses for the selected business in a clean list.
 * Supports deletion with confirmation.
 */

import { useState } from 'react'
import { api } from '../services/api'

const CATEGORY_COLORS = {
  'Office Supplies':          'bg-blue-100 text-blue-700',
  'Travel & Mileage':         'bg-purple-100 text-purple-700',
  'Meals & Entertainment':    'bg-orange-100 text-orange-700',
  'Professional Services':    'bg-indigo-100 text-indigo-700',
  'Software & Subscriptions': 'bg-cyan-100 text-cyan-700',
  'Marketing & Advertising':  'bg-pink-100 text-pink-700',
  'Equipment & Assets':       'bg-yellow-100 text-yellow-700',
  'Home Office':              'bg-teal-100 text-teal-700',
  'Personal (not deductible)':'bg-gray-100 text-gray-500',
  'Uncategorized':            'bg-rose-100 text-rose-700',
}

export default function ExpenseList({ expenses, loading, onDeleted }) {
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async (expenseId) => {
    setDeleting(true)
    await api.deleteExpense(expenseId)
    onDeleted(expenseId)
    setConfirmDelete(null)
    setDeleting(false)
  }

  const totalDeductible = expenses
    .filter(e => e.deductible)
    .reduce((sum, e) => sum + e.amount, 0)

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        Loading expenses...
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">

      {/* Summary bar */}
      {expenses.length > 0 && (
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3">
          <span className="text-sm text-gray-600">
            {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
          </span>
          <div className="text-right">
            <span className="text-xs text-gray-400">Deductible total</span>
            <p className="text-base font-bold text-[#0C2340]">
              ${totalDeductible.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {expenses.length === 0 && (
        <div className="text-center py-10 text-gray-400 text-sm">
          No expenses logged yet. Add your first one above.
        </div>
      )}

      {/* Expense rows */}
      {expenses.map(expense => (
        <div
          key={expense.id}
          className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-start gap-3"
        >
          {/* Left: category dot */}
          <div className="w-2 h-2 rounded-full bg-[#C9962C] mt-2 flex-shrink-0" />

          {/* Middle: details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-800 text-sm">{expense.vendor}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                CATEGORY_COLORS[expense.category] || 'bg-gray-100 text-gray-600'
              }`}>
                {expense.category}
              </span>
              {!expense.deductible && (
                <span className="text-xs text-gray-400">not deductible</span>
              )}
              {expense.needs_review && (
                <span className="text-xs text-amber-600 font-medium">⚠ review</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
              <span>{expense.date}</span>
              {expense.description && <><span>·</span><span className="truncate">{expense.description}</span></>}
            </div>
          </div>

          {/* Right: amount + delete */}
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <span className="font-bold text-[#0C2340] text-sm">
              ${expense.amount.toFixed(2)}
            </span>
            {confirmDelete === expense.id ? (
              <div className="flex gap-1">
                <button
                  onClick={() => handleDelete(expense.id)}
                  disabled={deleting}
                  className="text-xs text-rose-600 hover:text-rose-800 font-medium"
                >
                  {deleting ? '...' : 'Delete'}
                </button>
                <span className="text-xs text-gray-300">|</span>
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(expense.id)}
                className="text-xs text-gray-300 hover:text-rose-400 transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      ))}

    </div>
  )
}