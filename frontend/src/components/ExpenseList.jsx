/**
 * ExpenseList.jsx — Display Logged Expenses
 * ==========================================
 * Shows all expenses for the selected business in a clean list.
 * Supports deletion with confirmation.
 */

import { useState } from 'react'
import { api } from '../services/api'
import { CATEGORY_COLORS, EXPENSE_CATEGORIES, categoryColor } from '../constants/categories'

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
  const [activeDoc, setActiveDoc] = useState(null)   // linked document open in preview/edit modal
  const [activeExpenseId, setActiveExpenseId] = useState(null)  // expense that owns activeDoc — kept in sync on save
  const [editForm, setEditForm] = useState(null)
  const [docSaving, setDocSaving] = useState(false)
  const [docLoadingFor, setDocLoadingFor] = useState(null)  // expense id currently fetching its receipt
  const [splitTarget, setSplitTarget] = useState(null)   // expense being split
  const [splitRows, setSplitRows] = useState([])          // [{ category, amount, description, deductible }]
  const [splitSaving, setSplitSaving] = useState(false)
  const [splitError, setSplitError] = useState('')
  const [splitGroupView, setSplitGroupView] = useState(null)   // split_group id currently open in the group modal
  const [groupRowSaving, setGroupRowSaving] = useState(null)   // id of the row currently being saved
  const [newGroupLine, setNewGroupLine] = useState(null)       // { category, amount, description } while adding a line
  const [addingLine, setAddingLine] = useState(false)
  const [groupEdits, setGroupEdits] = useState({})   // { [expenseId]: { category, amount, description } } — local buffer while editing
  // Manual entries (no receipt, not split) have no other edit path —
  // receipted ones edit via the receipt preview, split ones via the split-group view.
  const [editTarget, setEditTarget] = useState(null)
  const [editExpenseForm, setEditExpenseForm] = useState(null)
  const [editExpenseSaving, setEditExpenseSaving] = useState(false)

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

  const openReceipt = async (expense) => {
    setDocLoadingFor(expense.id)
    const doc = await api.getExpenseDocument(expense.id)
    setDocLoadingFor(null)
    if (!doc) return   // no document actually linked — nothing to show
    const ext = doc.extracted_data || {}
    setActiveDoc(doc)
    setActiveExpenseId(expense.id)
    setEditForm({
      vendor: ext.vendor || expense.vendor || '',
      amount: ext.amount ?? expense.amount ?? '',
      date: ext.date || expense.date || '',
      category: expense.category || '',
      description: ext.description || expense.description || '',
      doc_type: doc.doc_type || 'receipt',
    })
  }

  const closeDoc = () => { setActiveDoc(null); setEditForm(null); setActiveExpenseId(null) }

  const saveDoc = async () => {
    if (!activeDoc) return
    setDocSaving(true)
    const [docResult, expenseResult] = await Promise.all([
      api.updateDocument(activeDoc.id, {
        vendor: editForm.vendor || null,
        amount: editForm.amount === '' ? null : Number(editForm.amount),
        date: editForm.date || null,
        description: editForm.description || null,
        doc_type: editForm.doc_type,
        reviewed: true,
      }),
      activeExpenseId ? api.updateExpense(activeExpenseId, {
        vendor: editForm.vendor || null,
        amount: editForm.amount === '' ? null : Number(editForm.amount),
        date: editForm.date || null,
        category: editForm.category || null,
        description: editForm.description || null,
      }) : Promise.resolve(true),
    ])
    setDocSaving(false)
    if (docResult && expenseResult) {
      closeDoc()
      onRefresh?.()
    }
  }

  const closeSplitGroupView = () => {
    setSplitGroupView(null)
    setGroupEdits({})
    setNewGroupLine(null)
  }

  const getRowEdit = (row) => groupEdits[row.id] || {
    category: row.category || '',
    amount: String(row.amount ?? ''),
    description: row.description || '',
  }

  const setRowEdit = (row, patch) => {
    setGroupEdits(prev => ({ ...prev, [row.id]: { ...getRowEdit(row), ...patch } }))
  }

  const commitGroupRow = async (row) => {
    const edit = groupEdits[row.id]
    if (!edit) return
    setGroupRowSaving(row.id)
    await api.updateExpense(row.id, {
      category: edit.category || null,
      amount: edit.amount === '' ? null : Number(edit.amount),
      description: edit.description || null,
    })
    setGroupRowSaving(null)
    setGroupEdits(prev => { const next = { ...prev }; delete next[row.id]; return next })
    onRefresh?.()
  }

  const saveNewGroupLine = async () => {
    if (!newGroupLine?.category || !newGroupLine?.amount || Number(newGroupLine.amount) <= 0) return
    setAddingLine(true)
    const result = await api.addSplitLine(splitGroupView, {
      category: newGroupLine.category,
      amount: Number(newGroupLine.amount),
      description: newGroupLine.description || null,
      deductible: true,
    })
    setAddingLine(false)
    if (!result?.error) {
      setNewGroupLine(null)
      onRefresh?.()
    }
  }

  const openEditExpense = (expense) => {
    setEditTarget(expense)
    setEditExpenseForm({
      vendor: expense.vendor || '',
      amount: String(expense.amount ?? ''),
      category: expense.category || '',
      date: expense.date || '',
      description: expense.description || '',
    })
  }

  const closeEditExpense = () => { setEditTarget(null); setEditExpenseForm(null) }

  const saveEditExpense = async () => {
    if (!editTarget) return
    setEditExpenseSaving(true)
    const updated = await api.updateExpense(editTarget.id, {
      vendor: editExpenseForm.vendor || null,
      amount: editExpenseForm.amount === '' ? null : Number(editExpenseForm.amount),
      category: editExpenseForm.category || null,
      date: editExpenseForm.date || null,
      description: editExpenseForm.description || null,
    })
    setEditExpenseSaving(false)
    if (updated) {
      closeEditExpense()
      onRefresh?.()
    }
  }

  const openSplit = (expense) => {
    setSplitTarget(expense)
    setSplitError('')
    // Start with two rows: half the category/description carried over, remainder blank
    setSplitRows([
      { category: expense.category || '', amount: '', description: expense.description || '', deductible: expense.deductible !== false },
      { category: '', amount: '', description: '', deductible: expense.deductible !== false },
    ])
  }

  const closeSplit = () => { setSplitTarget(null); setSplitRows([]); setSplitError('') }

  const addSplitRow = () => setSplitRows(rows => [...rows, { category: '', amount: '', description: '', deductible: true }])
  const removeSplitRow = (idx) => setSplitRows(rows => rows.filter((_, i) => i !== idx))
  const updateSplitRow = (idx, patch) => setSplitRows(rows => rows.map((r, i) => i === idx ? { ...r, ...patch } : r))

  const splitRowsTotal = splitRows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0)
  const splitRemaining = splitTarget ? Math.round((splitTarget.amount - splitRowsTotal) * 100) / 100 : 0

  const saveSplit = async () => {
    setSplitError('')
    if (splitRows.length < 2) { setSplitError('Need at least 2 line items to split.'); return }
    if (splitRows.some(r => !r.category || !r.amount || parseFloat(r.amount) <= 0)) {
      setSplitError('Every line item needs a category and a positive amount.')
      return
    }
    if (Math.abs(splitRemaining) > 0.01) {
      setSplitError(`Amounts must add up to ${fmt(splitTarget.amount)} — currently ${splitRemaining > 0 ? 'short' : 'over'} by ${fmt(Math.abs(splitRemaining))}.`)
      return
    }
    setSplitSaving(true)
    const result = await api.splitExpense(splitTarget.id, splitRows.map(r => ({
      category: r.category,
      amount: parseFloat(r.amount),
      description: r.description || null,
      deductible: r.deductible,
    })))
    setSplitSaving(false)
    if (result?.error) {
      setSplitError(result.error)
      return
    }
    closeSplit()
    onRefresh?.()
  }

  const filtered = expenses
    .filter(e => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        e.vendor?.toLowerCase().includes(q) ||
        e.category?.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q) ||
        e.notes?.toLowerCase().includes(q)
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
          const catColor = categoryColor(expense.category)
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
                <div className="flex items-center gap-1.5">
                  {(!expense.receipt_path && !expense.split_group) ? (
                    <button
                      title="Edit this expense"
                      onClick={() => openEditExpense(expense)}
                      className="text-sm font-semibold truncate text-left hover:underline"
                      style={{ color: 'var(--text-0)' }}
                    >
                      {expense.description || expense.vendor || 'Unnamed expense'}
                    </button>
                  ) : (
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-0)' }}>
                      {expense.description || expense.vendor || 'Unnamed expense'}
                    </p>
                  )}
                  {expense.notes && (
                    <span
                      title={expense.notes}
                      className="flex-shrink-0 text-xs cursor-help opacity-60 hover:opacity-100"
                      style={{ color: 'var(--text-2)' }}
                    >
                      📝
                    </span>
                  )}
                  {expense.receipt_path && (
                    <button
                      title="View receipt"
                      onClick={() => openReceipt(expense)}
                      disabled={docLoadingFor === expense.id}
                      className="flex-shrink-0 text-xs opacity-60 hover:opacity-100"
                      style={{ color: 'var(--text-2)' }}
                    >
                      {docLoadingFor === expense.id ? '…' : '🧾'}
                    </button>
                  )}
                  {expense.split_group ? (
                    <button
                      title="View and edit all parts of this split"
                      onClick={() => setSplitGroupView(expense.split_group)}
                      className="flex-shrink-0 text-xs font-semibold px-1.5 py-0.5 rounded hover:opacity-80"
                      style={{ background: 'rgba(167,139,250,0.15)', color: '#A78BFA' }}
                    >
                      split
                    </button>
                  ) : (
                    <button
                      title="Split this expense across categories"
                      onClick={() => openSplit(expense)}
                      className="flex-shrink-0 text-xs opacity-40 hover:opacity-90"
                      style={{ color: 'var(--text-2)' }}
                    >
                      ✂️
                    </button>
                  )}
                </div>
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
                <button onClick={() => setConfirmDelete(expense.id)}
                  title="Delete expense"
                  className="text-base leading-none transition-all opacity-30 hover:opacity-90 p-2 -m-2"
                  style={{ color: 'var(--red)' }}>×</button>
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

      {/* Receipt preview / edit modal */}
      {activeDoc && editForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={closeDoc}
        >
          <div
            className="w-full max-w-4xl max-h-[85vh] rounded-2xl overflow-hidden flex flex-col md:flex-row"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Preview pane */}
            <div className="flex-1 min-w-0 flex items-center justify-center p-4 overflow-auto"
              style={{ background: 'var(--card-2)', borderRight: '1px solid var(--border)' }}>
              {activeDoc.filename?.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={api.getDocumentFileUrl(activeDoc.id)}
                  title={activeDoc.filename}
                  className="w-full h-full rounded-lg"
                  style={{ minHeight: '60vh', border: 'none' }}
                />
              ) : (
                <img
                  src={api.getDocumentFileUrl(activeDoc.id)}
                  alt={activeDoc.filename}
                  className="max-w-full max-h-[70vh] rounded-lg object-contain"
                />
              )}
            </div>

            {/* Edit pane */}
            <div className="w-full md:w-80 flex-shrink-0 flex flex-col p-5 gap-4 overflow-y-auto">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-0)' }}>
                    {activeDoc.filename}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>
                    Receipt for this expense
                  </p>
                </div>
                <button onClick={closeDoc} className="text-lg leading-none opacity-50 hover:opacity-100 flex-shrink-0"
                  style={{ color: 'var(--text-1)' }}>×</button>
              </div>

              <label className="flex flex-col gap-1 text-xs font-medium" style={{ color: 'var(--text-2)' }}>
                Vendor
                <input value={editForm.vendor}
                  onChange={e => setEditForm({ ...editForm, vendor: e.target.value })}
                  className="px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: 'var(--card-2)', border: '1px solid var(--border)', color: 'var(--text-0)' }} />
              </label>

              <label className="flex flex-col gap-1 text-xs font-medium" style={{ color: 'var(--text-2)' }}>
                Amount
                <input type="number" step="0.01" value={editForm.amount}
                  onChange={e => setEditForm({ ...editForm, amount: e.target.value })}
                  className="px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: 'var(--card-2)', border: '1px solid var(--border)', color: 'var(--text-0)' }} />
              </label>

              <label className="flex flex-col gap-1 text-xs font-medium" style={{ color: 'var(--text-2)' }}>
                Date
                <input type="date" value={editForm.date}
                  onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                  className="px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: 'var(--card-2)', border: '1px solid var(--border)', color: 'var(--text-0)' }} />
              </label>

              <label className="flex flex-col gap-1 text-xs font-medium" style={{ color: 'var(--text-2)' }}>
                Category
                <select value={editForm.category}
                  onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                  className="px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: 'var(--card-2)', border: '1px solid var(--border)', color: 'var(--text-0)' }}>
                  <option value="">No category</option>
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-xs font-medium" style={{ color: 'var(--text-2)' }}>
                Type
                <select value={editForm.doc_type}
                  onChange={e => setEditForm({ ...editForm, doc_type: e.target.value })}
                  className="px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: 'var(--card-2)', border: '1px solid var(--border)', color: 'var(--text-0)' }}>
                  <option value="receipt">Receipt</option>
                  <option value="invoice">Invoice</option>
                  <option value="bank_statement">Bank statement</option>
                  <option value="1099">1099</option>
                  <option value="W2">W2</option>
                  <option value="other">Other</option>
                </select>
              </label>

              <label className="flex flex-col gap-1 text-xs font-medium" style={{ color: 'var(--text-2)' }}>
                Description
                <textarea rows={2} value={editForm.description}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  className="px-3 py-2 rounded-lg text-sm outline-none resize-none"
                  style={{ background: 'var(--card-2)', border: '1px solid var(--border)', color: 'var(--text-0)' }} />
              </label>

              <p className="text-xs -mt-1" style={{ color: 'var(--text-2)' }}>
                Saves to this expense and its receipt together, so they stay in sync.
              </p>

              <div className="flex gap-2 mt-auto pt-2">
                <button onClick={closeDoc}
                  className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold"
                  style={{ background: 'var(--card-2)', border: '1px solid var(--border)', color: 'var(--text-1)' }}>
                  Cancel
                </button>
                <button onClick={saveDoc} disabled={docSaving}
                  className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold"
                  style={{ background: 'var(--accent)', color: '#04141a', opacity: docSaving ? 0.6 : 1 }}>
                  {docSaving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Split expense modal */}
      {splitTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={closeSplit}
        >
          <div
            className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col max-h-[85vh]"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2 px-5 py-4" style={{ borderBottom: '1px solid var(--border-soft)' }}>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-0)' }}>
                  Split {splitTarget.description || splitTarget.vendor}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>
                  Total: {fmt(splitTarget.amount)} · divide across categories
                </p>
              </div>
              <button onClick={closeSplit} className="text-lg leading-none opacity-50 hover:opacity-100 flex-shrink-0"
                style={{ color: 'var(--text-1)' }}>×</button>
            </div>

            <div className="flex flex-col gap-3 px-5 py-4 overflow-y-auto">
              {splitRows.map((row, idx) => (
                <div key={idx} className="rounded-xl p-3 flex flex-col gap-2"
                  style={{ background: 'var(--card-2)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-2">
                    <select value={row.category}
                      onChange={e => updateSplitRow(idx, { category: e.target.value })}
                      className="flex-1 min-w-0 rounded-lg px-2 py-1.5 text-xs outline-none"
                      style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text-0)' }}>
                      <option value="">Category…</option>
                      {Object.keys(CATEGORY_COLORS).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input type="number" step="0.01" placeholder="0.00" value={row.amount}
                      onChange={e => updateSplitRow(idx, { amount: e.target.value })}
                      className="w-24 rounded-lg px-2 py-1.5 text-xs outline-none text-right"
                      style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text-0)' }} />
                    {splitRows.length > 2 && (
                      <button onClick={() => removeSplitRow(idx)}
                        className="text-base leading-none opacity-40 hover:opacity-90 flex-shrink-0"
                        style={{ color: 'var(--red)' }}>×</button>
                    )}
                  </div>
                  <input type="text" placeholder="Description (optional)" value={row.description}
                    onChange={e => updateSplitRow(idx, { description: e.target.value })}
                    className="rounded-lg px-2 py-1.5 text-xs outline-none"
                    style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text-0)' }} />
                </div>
              ))}

              <button onClick={addSplitRow}
                className="text-xs font-semibold text-left py-1"
                style={{ color: 'var(--accent)' }}>
                + Add another line item
              </button>

              <div className="flex items-center justify-between text-xs pt-1" style={{ borderTop: '1px solid var(--border-soft)' }}>
                <span style={{ color: 'var(--text-2)' }}>Assigned: {fmt(splitRowsTotal)}</span>
                <span style={{ color: Math.abs(splitRemaining) < 0.01 ? '#34D399' : 'var(--red)' }}>
                  {Math.abs(splitRemaining) < 0.01 ? '✓ Matches total' : `Remaining: ${fmt(splitRemaining)}`}
                </span>
              </div>

              {splitError && (
                <p className="text-xs" style={{ color: 'var(--red)' }}>{splitError}</p>
              )}
            </div>

            <div className="flex gap-2 px-5 py-4" style={{ borderTop: '1px solid var(--border-soft)' }}>
              <button onClick={closeSplit}
                className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold"
                style={{ background: 'var(--card-2)', border: '1px solid var(--border)', color: 'var(--text-1)' }}>
                Cancel
              </button>
              <button onClick={saveSplit} disabled={splitSaving}
                className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold"
                style={{ background: 'var(--accent)', color: '#04141a', opacity: splitSaving ? 0.6 : 1 }}>
                {splitSaving ? 'Splitting…' : 'Split Expense'}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Edit expense modal — only reachable for manual entries with no receipt and not split */}
      {editTarget && editExpenseForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={closeEditExpense}
        >
          <div
            className="w-full max-w-sm rounded-2xl overflow-hidden flex flex-col max-h-[85vh]"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2 px-5 py-4" style={{ borderBottom: '1px solid var(--border-soft)' }}>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-0)' }}>Edit expense</p>
              <button onClick={closeEditExpense} className="text-lg leading-none opacity-50 hover:opacity-100 flex-shrink-0"
                style={{ color: 'var(--text-1)' }}>×</button>
            </div>

            <div className="flex flex-col gap-3 px-5 py-4 overflow-y-auto">
              <label className="flex flex-col gap-1 text-xs font-medium" style={{ color: 'var(--text-2)' }}>
                Vendor
                <input value={editExpenseForm.vendor}
                  onChange={e => setEditExpenseForm({ ...editExpenseForm, vendor: e.target.value })}
                  className="px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: 'var(--card-2)', border: '1px solid var(--border)', color: 'var(--text-0)' }} />
              </label>

              <label className="flex flex-col gap-1 text-xs font-medium" style={{ color: 'var(--text-2)' }}>
                Amount
                <input type="number" step="0.01" value={editExpenseForm.amount}
                  onChange={e => setEditExpenseForm({ ...editExpenseForm, amount: e.target.value })}
                  className="px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: 'var(--card-2)', border: '1px solid var(--border)', color: 'var(--text-0)' }} />
              </label>

              <label className="flex flex-col gap-1 text-xs font-medium" style={{ color: 'var(--text-2)' }}>
                Category
                <select value={editExpenseForm.category}
                  onChange={e => setEditExpenseForm({ ...editExpenseForm, category: e.target.value })}
                  className="px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: 'var(--card-2)', border: '1px solid var(--border)', color: 'var(--text-0)' }}>
                  <option value="">No category</option>
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-xs font-medium" style={{ color: 'var(--text-2)' }}>
                Date
                <input type="date" value={editExpenseForm.date}
                  onChange={e => setEditExpenseForm({ ...editExpenseForm, date: e.target.value })}
                  className="px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: 'var(--card-2)', border: '1px solid var(--border)', color: 'var(--text-0)' }} />
              </label>

              <label className="flex flex-col gap-1 text-xs font-medium" style={{ color: 'var(--text-2)' }}>
                Description
                <textarea rows={2} value={editExpenseForm.description}
                  onChange={e => setEditExpenseForm({ ...editExpenseForm, description: e.target.value })}
                  className="px-3 py-2 rounded-lg text-sm outline-none resize-none"
                  style={{ background: 'var(--card-2)', border: '1px solid var(--border)', color: 'var(--text-0)' }} />
              </label>
            </div>

            <div className="flex gap-2 px-5 py-4" style={{ borderTop: '1px solid var(--border-soft)' }}>
              <button onClick={closeEditExpense}
                className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold"
                style={{ background: 'var(--card-2)', border: '1px solid var(--border)', color: 'var(--text-1)' }}>
                Cancel
              </button>
              <button onClick={saveEditExpense} disabled={editExpenseSaving}
                className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold"
                style={{ background: 'var(--accent)', color: '#04141a', opacity: editExpenseSaving ? 0.6 : 1 }}>
                {editExpenseSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Split group modal — view/edit every line item in a split, add more lines */}
      {splitGroupView && (() => {
        const groupRows = expenses.filter(e => e.split_group === splitGroupView)
        const groupTotal = groupRows.reduce((s, r) => s + (r.amount || 0), 0)
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            onClick={closeSplitGroupView}
          >
            <div
              className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col max-h-[85vh]"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-2 px-5 py-4" style={{ borderBottom: '1px solid var(--border-soft)' }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-0)' }}>
                    Split transaction — {groupRows[0]?.vendor || groupRows[0]?.description}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>
                    {groupRows.length} part{groupRows.length !== 1 ? 's' : ''} · total {fmt(groupTotal)}
                  </p>
                </div>
                <button onClick={closeSplitGroupView} className="text-lg leading-none opacity-50 hover:opacity-100 flex-shrink-0"
                  style={{ color: 'var(--text-1)' }}>×</button>
              </div>

              <div className="flex flex-col gap-3 px-5 py-4 overflow-y-auto">
                {groupRows.map(row => {
                  const edit = getRowEdit(row)
                  return (
                    <div key={row.id} className="rounded-xl p-3 flex flex-col gap-2"
                      style={{ background: 'var(--card-2)', border: '1px solid var(--border)' }}>
                      <div className="flex items-center gap-2">
                        <select value={edit.category}
                          onChange={e => setRowEdit(row, { category: e.target.value })}
                          onBlur={() => commitGroupRow(row)}
                          className="flex-1 min-w-0 rounded-lg px-2 py-1.5 text-xs outline-none"
                          style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text-0)' }}>
                          <option value="">Category…</option>
                          {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <input type="number" step="0.01" value={edit.amount}
                          onChange={e => setRowEdit(row, { amount: e.target.value })}
                          onBlur={() => commitGroupRow(row)}
                          className="w-24 rounded-lg px-2 py-1.5 text-xs outline-none text-right"
                          style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text-0)' }} />
                        <button onClick={() => setConfirmDelete(row.id)}
                          title="Delete this line"
                          className="text-base leading-none opacity-40 hover:opacity-90 flex-shrink-0"
                          style={{ color: 'var(--red)' }}>×</button>
                      </div>
                      <input type="text" placeholder="Description (optional)" value={edit.description}
                        onChange={e => setRowEdit(row, { description: e.target.value })}
                        onBlur={() => commitGroupRow(row)}
                        className="rounded-lg px-2 py-1.5 text-xs outline-none"
                        style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text-0)' }} />
                      {groupRowSaving === row.id && (
                        <p className="text-xs" style={{ color: 'var(--text-2)' }}>Saving…</p>
                      )}
                    </div>
                  )
                })}

                {newGroupLine ? (
                  <div className="rounded-xl p-3 flex flex-col gap-2"
                    style={{ background: 'var(--card-2)', border: '1px dashed var(--accent)' }}>
                    <div className="flex items-center gap-2">
                      <select value={newGroupLine.category}
                        onChange={e => setNewGroupLine({ ...newGroupLine, category: e.target.value })}
                        className="flex-1 min-w-0 rounded-lg px-2 py-1.5 text-xs outline-none"
                        style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text-0)' }}>
                        <option value="">Category…</option>
                        {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <input type="number" step="0.01" placeholder="0.00" value={newGroupLine.amount}
                        onChange={e => setNewGroupLine({ ...newGroupLine, amount: e.target.value })}
                        className="w-24 rounded-lg px-2 py-1.5 text-xs outline-none text-right"
                        style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text-0)' }} />
                    </div>
                    <input type="text" placeholder="Description (optional)" value={newGroupLine.description}
                      onChange={e => setNewGroupLine({ ...newGroupLine, description: e.target.value })}
                      className="rounded-lg px-2 py-1.5 text-xs outline-none"
                      style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text-0)' }} />
                    <div className="flex gap-2">
                      <button onClick={() => setNewGroupLine(null)}
                        className="flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold"
                        style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text-1)' }}>
                        Cancel
                      </button>
                      <button onClick={saveNewGroupLine} disabled={addingLine || !newGroupLine.category || !newGroupLine.amount}
                        className="flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold"
                        style={{ background: 'var(--accent)', color: '#04141a', opacity: (addingLine || !newGroupLine.category || !newGroupLine.amount) ? 0.6 : 1 }}>
                        {addingLine ? 'Adding…' : 'Add line'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setNewGroupLine({ category: '', amount: '', description: '' })}
                    className="text-xs font-semibold text-left py-1"
                    style={{ color: 'var(--accent)' }}>
                    + Add another line item
                  </button>
                )}
              </div>

              <div className="flex px-5 py-4" style={{ borderTop: '1px solid var(--border-soft)' }}>
                <button onClick={closeSplitGroupView}
                  className="w-full px-3 py-2 rounded-lg text-sm font-semibold"
                  style={{ background: 'var(--card-2)', border: '1px solid var(--border)', color: 'var(--text-1)' }}>
                  Done
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Delete confirmation modal */}
      {confirmDelete && (() => {
        const target = expenses.find(e => e.id === confirmDelete)
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            onClick={() => setConfirmDelete(null)}
          >
            <div
              className="w-full max-w-sm rounded-2xl p-5 flex flex-col gap-4"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              onClick={e => e.stopPropagation()}
            >
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-0)' }}>
                  Delete this expense?
                </p>
                {target && (
                  <p className="text-xs mt-1" style={{ color: 'var(--text-2)' }}>
                    {target.description || target.vendor} · {fmt(target.amount)}
                  </p>
                )}
                <p className="text-xs mt-2" style={{ color: 'var(--text-2)' }}>
                  This can't be undone.
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setConfirmDelete(null)}
                  className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold"
                  style={{ background: 'var(--card-2)', border: '1px solid var(--border)', color: 'var(--text-1)' }}>
                  Cancel
                </button>
                <button onClick={() => handleDelete(confirmDelete)} disabled={deleting}
                  className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold"
                  style={{ background: 'var(--red)', color: '#fff', opacity: deleting ? 0.6 : 1 }}>
                  {deleting ? 'Deleting…' : 'Yes, delete'}
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}