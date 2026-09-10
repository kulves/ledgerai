/**
 * ExpensesPage.jsx — Expense Logging & Management
 * =================================================
 * Purpose:
 *   The main expense management screen. Users log new expenses here,
 *   Luca automatically categorizes them using the AI engine, and
 *   all saved expenses are shown in a list below the form.
 *
 * Module 10 — what this adds:
 *   - Business selector (which business is this expense for?)
 *   - Expense form with Luca auto-categorization
 *   - Expense list showing all logged entries
 * * New flow:
 *   1. User drops receipt (PDF/image) onto the drop zone
 *   2. Luca extracts vendor, amount, date automatically
 *   3. Luca auto-categorizes the expense
 *   4. Expense is created and appears in the list immediately
 *   5. User can edit any field inline if needed
 *
 * No more "Ask Luca to Categorize" button — everything is automatic.
 * Receipts are stored in Documents and linked to their expense.
 * 
 * ExpensesPage.jsx — Expenses with Integrated Receipt Drop Zone
 * Editable extraction result — user can fix any field before logging.
 */

import { useState, useEffect, useRef } from 'react'
import { api } from '../services/api'
import ExpenseList from '../components/ExpenseList'
import { EXPENSE_CATEGORIES as CATEGORIES, CATEGORY_COLORS, categoryColor } from '../constants/categories'
 
function today() {
  return new Date().toISOString().split('T')[0]
}
 
export default function ExpensesPage({ backendStatus, selectedBusiness, onSelectBusiness, businesses }) {
  const [activeBusiness, setActiveBusiness] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
 
  // Editable extraction result
  const [extracted, setExtracted] = useState(null) // raw result from Luca
  const [editFields, setEditFields] = useState({   // editable fields
    vendor: '', amount: '', date: '', category: '', description: ''
  })
  const [editingField, setEditingField] = useState(null) // which field is being edited
  const [confirming, setConfirming] = useState(false)
 
  const [form, setForm] = useState({ vendor: '', amount: '', date: today(), category: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [categorizing, setCategorizing] = useState(false)
  const [message, setMessage] = useState({ text: '', type: 'success' })
  const fileInputRef = useRef(null)
 
  useEffect(() => {
    if (selectedBusiness) setActiveBusiness(selectedBusiness)
    else if (businesses?.length) setActiveBusiness(businesses[0])
  }, [selectedBusiness, businesses])
 
  useEffect(() => {
    if (activeBusiness) loadExpenses()
  }, [activeBusiness])
 
  const loadExpenses = async () => {
    if (!activeBusiness) return
    const data = await api.getExpenses(activeBusiness.id)
    setExpenses(data || [])
  }
 
  const showMsg = (text, type = 'success') => {
    setMessage({ text, type })
    setTimeout(() => setMessage({ text: '', type: 'success' }), 5000)
  }
 
  const autoCategorizeLuca = async (vendor, description, amount) => {
    if (!vendor && !description) return null
    setCategorizing(true)
    try {
      const result = await api.categorizeExpense(vendor || '', amount || 0, description || '')
      if (result?.category && result.category !== 'Uncategorized') return result.category
    } catch (e) {}
    finally { setCategorizing(false) }
    return null
  }
 
  // ── Confirm and log the extracted expense ───────────────────────────────
  const handleConfirmExpense = async () => {
    if (!editFields.vendor || !editFields.amount || !activeBusiness) {
      showMsg('Please fill in vendor and amount.', 'error')
      return
    }
    setConfirming(true)
    let category = editFields.category
    if (!category) {
      category = await autoCategorizeLuca(editFields.vendor, editFields.description, editFields.amount)
        || 'Other Business Expense'
    }
    const expense = await api.createExpense({
      business_id: activeBusiness.id,
      vendor: editFields.vendor,
      amount: parseFloat(editFields.amount),
      date: editFields.date || today(),
      category,
      description: editFields.description,
      document_id: extracted?.document_id || null,
    })
    setConfirming(false)
    if (expense) {
      setExtracted(null)
      loadExpenses()
      showMsg(`✓ Expense logged: ${editFields.vendor} $${editFields.amount}`)
    }
  }
 
  // ── File drop handler ────────────────────────────────────────────────────
  const handleFileDrop = async (file) => {
    if (!activeBusiness) { showMsg('Please select a business first.', 'error'); return }
    const allowed = ['image/jpeg','image/png','image/gif','image/webp','application/pdf']
    if (!allowed.includes(file.type)) { showMsg('Please drop a JPG, PNG, or PDF.', 'error'); return }
 
    setUploading(true)
    setExtracted(null)
 
    const formData = new FormData()
    formData.append('file', file)
    formData.append('business_id', activeBusiness.id)
 
    try {
      const response = await fetch('http://127.0.0.1:8000/api/documents/upload', {
        method: 'POST', body: formData,
      })
      const docResult = await response.json()
      if (!docResult.success) { showMsg('Upload failed. Please try again.', 'error'); setUploading(false); return }
 
      const ext = docResult.extracted || {}
      const vendor = ext.vendor || file.name.replace(/\.[^/.]+$/, '')
      const amount = ext.amount ? String(ext.amount) : ''
      const date = ext.date || today()
      const description = ext.description || ''
      const category = await autoCategorizeLuca(vendor, description, ext.amount) || ''
 
      setExtracted({
        success: docResult.extraction_success,
        method: docResult.extraction_method,
        confidence: ext.confidence || 'low',
        document_id: docResult.document_id,
        filename: file.name,
      })
      setEditFields({ vendor, amount, date, category, description })
 
    } catch (err) {
      showMsg('Upload error. Check the backend is running.', 'error')
    } finally {
      setUploading(false)
    }
  }
 
  const onDrop = (e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFileDrop(f) }
  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true) }
  const onDragLeave = () => setIsDragging(false)
 
  // ── Manual form submit ───────────────────────────────────────────────────
  const handleManualSubmit = async (e) => {
    e.preventDefault()
    if (!form.vendor.trim() || !form.amount || !activeBusiness) return
    setSaving(true)
    let category = form.category
    if (!category) category = await autoCategorizeLuca(form.vendor, form.description, form.amount) || 'Other Business Expense'
    const result = await api.createExpense({
      business_id: activeBusiness.id,
      vendor: form.vendor, amount: parseFloat(form.amount),
      date: form.date, category, description: form.description, document_id: null,
    })
    setSaving(false)
    if (result) {
      setForm({ vendor: '', amount: '', date: today(), category: '', description: '' })
      setShowForm(false)
      loadExpenses()
      showMsg(`✓ Expense logged: ${form.vendor}`)
    }
  }
 
  const catColor = (cat) => categoryColor(cat)
 
  return (
    <div className="flex flex-col gap-6 p-6" style={{ minHeight: '100%' }}>
 
      {/* Flash message */}
      {message.text && (
        <div
          className="rounded-xl px-4 py-3 text-sm font-medium"
          style={{
            background: message.type === 'error' ? 'rgba(251,113,133,0.1)' : 'rgba(52,211,153,0.1)',
            border: `1px solid ${message.type === 'error' ? 'rgba(251,113,133,0.3)' : 'rgba(52,211,153,0.3)'}`,
            color: message.type === 'error' ? '#FB7185' : '#34D399',
          }}
        >
          {message.text}
        </div>
      )}
 
      {/* Business selector */}
      {businesses?.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>Business:</span>
          {businesses.map(b => (
            <button key={b.id} onClick={() => { setActiveBusiness(b); onSelectBusiness?.(b) }}
              className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{
                background: activeBusiness?.id === b.id ? 'var(--accent)' : 'var(--card)',
                border: `1px solid ${activeBusiness?.id === b.id ? 'var(--accent)' : 'var(--border)'}`,
                color: activeBusiness?.id === b.id ? '#04141a' : 'var(--text-1)',
              }}>
              {b.name}
            </button>
          ))}
        </div>
      )}
 
      {/* Receipt Drop Zone */}
      <div
        onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className="rounded-2xl p-8 text-center cursor-pointer transition-all"
        style={{
          border: `2px dashed ${isDragging ? 'var(--accent)' : 'var(--border)'}`,
          background: isDragging ? 'var(--accent-muted)' : 'var(--card)',
        }}
      >
        <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.pdf"
          className="hidden" onChange={e => e.target.files[0] && handleFileDrop(e.target.files[0])} />
 
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
              style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>
              Reading receipt with Luca...
            </p>
            <p className="text-xs" style={{ color: 'var(--text-2)' }}>
              This may take 20–30 seconds for scanned receipts
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="text-3xl mb-1">🧾</div>
            <p className="font-semibold text-sm" style={{ color: 'var(--text-0)' }}>
              Drop a receipt here to auto-log it
            </p>
            <p className="text-xs" style={{ color: 'var(--text-2)' }}>
              or click to browse · JPG, PNG, PDF up to 10MB
            </p>
            <p className="text-xs font-medium mt-1" style={{ color: 'var(--accent)' }}>
              Luca extracts and categorizes automatically
            </p>
          </div>
        )}
      </div>
 
      {/* ── Editable Extraction Result ─────────────────────────────────────── */}
      {extracted && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4"
            style={{ borderBottom: '1px solid var(--border-soft)' }}>
            <div className="w-7 h-7 rounded-full bg-[#0C2340] flex items-center justify-center text-xs font-bold"
              style={{ color: 'var(--accent)' }}>L</div>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-0)' }}>
                {extracted.success ? "Luca extracted the receipt data" : "Partial extraction — please fill in missing fields"}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>
                {extracted.filename} · Click any field to edit
              </p>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{
                background: extracted.confidence === 'high' ? 'rgba(52,211,153,0.1)' :
                             extracted.confidence === 'medium' ? 'rgba(34,211,238,0.1)' : 'rgba(251,187,36,0.1)',
                color: extracted.confidence === 'high' ? '#34D399' :
                       extracted.confidence === 'medium' ? '#22D3EE' : '#FBBF24',
              }}>
              {extracted.confidence} confidence
            </span>
          </div>
 
          {/* Editable fields grid */}
          <div className="grid grid-cols-2 gap-0">
            {[
              { key: 'vendor',      label: 'Vendor',      type: 'text',   placeholder: 'e.g. Z Cafe' },
              { key: 'amount',      label: 'Amount ($)',   type: 'number', placeholder: '0.00' },
              { key: 'date',        label: 'Date',         type: 'date',   placeholder: '' },
              { key: 'description', label: 'Description',  type: 'text',   placeholder: 'What was purchased?' },
            ].map(({ key, label, type, placeholder }) => (
              <div
                key={key}
                className="px-5 py-4 cursor-pointer transition-all"
                style={{
                  borderBottom: '1px solid var(--border-soft)',
                  borderRight: key === 'vendor' || key === 'date' ? '1px solid var(--border-soft)' : 'none',
                  background: editingField === key ? 'var(--hover)' : 'transparent',
                }}
                onClick={() => setEditingField(key)}
              >
                <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>{label}</p>
                {editingField === key ? (
                  <input
                    type={type}
                    step={type === 'number' ? '0.01' : undefined}
                    value={editFields[key]}
                    onChange={e => setEditFields(p => ({ ...p, [key]: e.target.value }))}
                    onBlur={() => setEditingField(null)}
                    onKeyDown={e => e.key === 'Enter' && setEditingField(null)}
                    autoFocus
                    className="w-full text-sm font-semibold bg-transparent border-b outline-none"
                    style={{ color: 'var(--text-0)', borderColor: 'var(--accent)' }}
                    placeholder={placeholder}
                  />
                ) : (
                  <p className="text-sm font-semibold flex items-center gap-2"
                    style={{ color: editFields[key] ? 'var(--text-0)' : 'var(--text-2)' }}>
                    {editFields[key] || <span style={{ color: 'var(--red)', fontSize: '12px' }}>not detected — click to add</span>}
                    <svg className="w-3 h-3 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </p>
                )}
              </div>
            ))}
 
            {/* Category — full width */}
            <div
              className="col-span-2 px-5 py-4"
              style={{ borderBottom: '1px solid var(--border-soft)' }}
            >
              <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>Category</p>
              <div className="flex items-center gap-2 flex-wrap">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setEditFields(p => ({ ...p, category: cat }))}
                    className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                    style={{
                      background: editFields.category === cat ? catColor(cat) + '22' : 'var(--card-2)',
                      border: `1px solid ${editFields.category === cat ? catColor(cat) : 'var(--border)'}`,
                      color: editFields.category === cat ? catColor(cat) : 'var(--text-2)',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
 
          {/* Actions */}
          <div className="flex items-center gap-3 px-5 py-4">
            <button
              onClick={handleConfirmExpense}
              disabled={confirming || !editFields.vendor || !editFields.amount}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{
                background: confirming || !editFields.vendor || !editFields.amount
                  ? 'var(--border)' : 'var(--accent)',
                color: confirming || !editFields.vendor || !editFields.amount
                  ? 'var(--text-2)' : '#04141a',
              }}
            >
              {confirming ? 'Logging...' : '✓ Confirm & Log Expense'}
            </button>
            <button
              onClick={() => setExtracted(null)}
              className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{ background: 'var(--card-2)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
            >
              Discard
            </button>
          </div>
        </div>
      )}
 
      {/* Manual form toggle */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold" style={{ color: 'var(--text-0)', fontSize: '15px' }}>
          Expenses {activeBusiness ? `— ${activeBusiness.name}` : ''}
        </h2>
        <button onClick={() => setShowForm(v => !v)}
          className="text-sm font-semibold transition-all"
          style={{ color: 'var(--accent)' }}>
          {showForm ? 'Cancel' : '+ Add Manually'}
        </button>
      </div>
 
      {/* Manual form */}
      {showForm && (
        <form onSubmit={handleManualSubmit}
          className="rounded-2xl p-5 flex flex-col gap-4"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'vendor', label: 'Vendor *', type: 'text', placeholder: 'e.g. Office Depot' },
              { key: 'amount', label: 'Amount *', type: 'number', placeholder: '0.00' },
              { key: 'date',   label: 'Date *',   type: 'date',   placeholder: '' },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key} className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>{label}</label>
                <input type={type} step={type === 'number' ? '0.01' : undefined}
                  value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder} required={key !== 'description'}
                  className="rounded-lg px-3 py-2 text-sm outline-none transition-all"
                  style={{ background: 'var(--card-2)', border: '1px solid var(--border)', color: 'var(--text-0)' }}
                />
              </div>
            ))}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>Category</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: 'var(--card-2)', border: '1px solid var(--border)', color: 'var(--text-0)' }}>
                <option value="">Auto-categorize</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>Description / Notes</label>
            <input type="text" value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="What was this for?"
              className="rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: 'var(--card-2)', border: '1px solid var(--border)', color: 'var(--text-0)' }}
            />
          </div>
          <button type="submit" disabled={saving || categorizing}
            className="py-2.5 rounded-xl font-bold text-sm transition-all"
            style={{ background: 'var(--accent)', color: '#04141a', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving...' : categorizing ? 'Categorizing...' : 'Log Expense'}
          </button>
        </form>
      )}
 
      {/* Expense list */}
      {activeBusiness && (
        <ExpenseList
          businessId={activeBusiness.id}
          expenses={expenses}
          onRefresh={loadExpenses}
        />
      )}
 
    </div>
  )
}