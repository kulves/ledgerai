/**
 * ExpenseList.jsx — Display Logged Expenses
 * ==========================================
 * Shows all expenses for the selected business in a clean list.
 * Supports deletion with confirmation.
 */

import { useState } from 'react'
import { api } from '../services/api'

const CATEGORY_COLORS = {
  'Advertising & Marketing':        '#22D3EE',
  'Banking & Financial Fees':       '#60A5FA',
  'Business Insurance':             '#A78BFA',
  'Business Meals (50% deductible)':'#34D399',
  'Business Travel':                '#F97316',
  'Contract Labor / Freelancers':   '#E879F9',
  'Education & Training':           '#FBBF24',
  'Equipment & Hardware':           '#FB923C',
  'Home Office':                    '#4ADE80',
  'Legal & Professional Services':  '#818CF8',
  'Mileage & Vehicle':              '#A78BFA',
  'Office Supplies':                '#38BDF8',
  'Phone & Internet':               '#34D399',
  'Rent & Lease':                   '#F43F5E',
  'Repairs & Maintenance':          '#FBBF24',
  'Software & Subscriptions':       '#22D3EE',
  'Taxes & Licenses':               '#FB7185',
  'Utilities':                      '#94A3B8',
  'Other Business Expense':         '#64748B',
  'Uncategorized':                  '#475569',
}

const fmt = (n) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', minimumFractionDigits: 2
}).format(n || 0)

const formatDate = (d) => {
  if (!d) return '—'
  try {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    })
  } catch { return d }
}

export default function ExpenseList({ expenses = [], loading, onDeleted, onRefresh }) {
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [sortBy, setSortBy] = useState('date')
  const [sortDir, setSortDir] = useState('desc')
  const [search, setSearch] = useState('')

  const handleDelete = async (id) => {
    setDeleting(true)
    await api.deleteExpense(id)
    onDeleted?.(id)
    onRefresh?.()
    setConfirmDelete(null)
    setDeleting(false)
  }

  const handleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir('desc') }
  }

  const filtered = expenses
    .filter(e => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        e.vendor?.toLowerCase().includes(q) ||
        e.category?.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      let va, vb
      if (sortBy === 'date')   { va = a.date || ''; vb = b.date || '' }
      if (sortBy === 'vendor') { va = a.vendor || ''; vb = b.vendor || '' }
      if (sortBy === 'amount') { va = a.amount || 0; vb = b.amount || 0 }
      if (sortBy === 'category') { va = a.category || ''; vb = b.category || '' }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })

  const total = expenses.reduce((s, e) => s + (e.amount || 0), 0)
  const deductible = expenses.filter(e => e.deductible !== false).reduce((s, e) => s + (e.amount || 0), 0)

  const SortIcon = ({ col }) => (
    <svg className="w-3 h-3 inline ml-1 opacity-40" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5"
      style={{ opacity: sortBy === col ? 1 : 0.3, color: sortBy === col ? 'var(--accent)' : 'inherit' }}>
      {sortBy === col && sortDir === 'asc'
        ? <polyline points="18 15 12 9 6 15"/>
        : <polyline points="6 9 12 15 18 9"/>}
    </svg>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Summary + Search bar */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-2)' }}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search expenses..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-sm outline-none"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              color: 'var(--text-0)',
            }}
          />
        </div>

        {/* Totals */}
        <div className="flex items-center gap-4 text-sm flex-shrink-0">
          <div className="text-right">
            <p className="text-xs" style={{ color: 'var(--text-2)' }}>Total</p>
            <p className="font-bold" style={{ color: 'var(--red)' }}>{fmt(total)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs" style={{ color: 'var(--text-2)' }}>Deductible</p>
            <p className="font-bold" style={{ color: 'var(--green)' }}>{fmt(deductible)}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>

        {/* Header */}
        <div className="grid text-xs font-semibold px-5 py-3"
          style={{
            gridTemplateColumns: '120px 1fr 180px 100px 120px 40px',
            borderBottom: '1px solid var(--border-soft)',
            color: 'var(--text-2)',
          }}>
          <button className="text-left hover:opacity-80" onClick={() => handleSort('date')}>
            Date <SortIcon col="date" />
          </button>
          <button className="text-left hover:opacity-80" onClick={() => handleSort('vendor')}>
            Description <SortIcon col="vendor" />
          </button>
          <button className="text-left hover:opacity-80" onClick={() => handleSort('category')}>
            Category <SortIcon col="category" />
          </button>
          <span>Type</span>
          <button className="text-right hover:opacity-80" onClick={() => handleSort('amount')}>
            Amount <SortIcon col="amount" />
          </button>
          <span />
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-12">
            <span className="text-3xl">🧾</span>
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              {search ? 'No expenses match your search' : 'No expenses logged yet'}
            </p>
          </div>
        )}

        {/* Rows */}
        {filtered.map((expense, i) => {
          const catColor = CATEGORY_COLORS[expense.category] || '#64748B'
          const isDeductible = expense.deductible !== false

          return (
            <div
              key={expense.id}
              className="grid items-center px-5 py-3.5 transition-all"
              style={{
                gridTemplateColumns: '120px 1fr 180px 100px 120px 40px',
                borderTop: i > 0 ? '1px solid var(--border-soft)' : 'none',
                cursor: 'default',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {/* Date */}
              <span className="text-sm" style={{ color: 'var(--text-2)' }}>
                {formatDate(expense.date)}
              </span>

              {/* Description + vendor */}
              <div className="min-w-0 pr-4">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-0)' }}>
                  {expense.description || expense.vendor || 'Unnamed expense'}
                </p>
                {expense.description && expense.vendor && (
                  <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-2)' }}>
                    {expense.vendor}
                  </p>
                )}
              </div>

              {/* Category pill */}
              <div>
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{
                    background: catColor + '18',
                    color: catColor,
                    maxWidth: '168px',
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: catColor }} />
                  <span className="truncate">{expense.category || 'Uncategorized'}</span>
                </span>
              </div>

              {/* Type badge */}
              <div>
                <span
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold"
                  style={{
                    background: isDeductible ? 'rgba(52,211,153,0.12)' : 'rgba(251,113,133,0.12)',
                    color: isDeductible ? '#34D399' : '#FB7185',
                  }}
                >
                  {isDeductible ? 'Deductible' : 'Personal'}
                </span>
                {expense.needs_review && (
                  <span className="ml-1 text-xs" style={{ color: 'var(--amber)' }}>⚠</span>
                )}
              </div>

              {/* Amount */}
              <div className="text-right">
                <span
                  className="text-sm font-bold"
                  style={{
                    color: 'var(--red)',
                    fontFamily: 'var(--font-display)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  -{fmt(expense.amount)}
                </span>
              </div>

              {/* Delete */}
              <div className="flex justify-end">
                {confirmDelete === expense.id ? (
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleDelete(expense.id)} disabled={deleting}
                      className="text-xs font-semibold transition-all"
                      style={{ color: 'var(--red)' }}>
                      {deleting ? '...' : 'Del'}
                    </button>
                    <span style={{ color: 'var(--border)', fontSize: '10px' }}>|</span>
                    <button onClick={() => setConfirmDelete(null)}
                      className="text-xs" style={{ color: 'var(--text-2)' }}>×</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDelete(expense.id)}
                    className="text-base leading-none transition-all opacity-20 hover:opacity-80"
                    style={{ color: 'var(--red)' }}>×</button>
                )}
              </div>
            </div>
          )
        })}

        {/* Footer totals */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3"
            style={{ borderTop: '1px solid var(--border-soft)', background: 'var(--card-2)' }}>
            <span className="text-xs" style={{ color: 'var(--text-2)' }}>
              {filtered.length} of {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-6 text-xs">
              <span style={{ color: 'var(--text-2)' }}>
                Deductible: <strong style={{ color: 'var(--green)' }}>{fmt(deductible)}</strong>
              </span>
              <span style={{ color: 'var(--text-2)' }}>
                Total: <strong style={{ color: 'var(--red)' }}>{fmt(total)}</strong>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}