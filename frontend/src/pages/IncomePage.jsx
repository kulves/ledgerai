/**
 * IncomePage.jsx — Income Tracking
 * Manual income entry + income from 1099/invoice uploads.
 * Shows income list with category breakdown.
 */
import { useState, useEffect, useRef } from 'react'
import { api } from '../services/api'

const INCOME_CATEGORIES = [
  'Consulting / Freelance Income',
  'Product Sales',
  'Service Revenue',
  '1099-NEC Income',
  '1099-MISC Income',
  'Rental Income',
  'Commission Income',
  'Investment Income',
  'Royalty Income',
  'Grant / Award Income',
  'Refunds / Reimbursements',
  'Other Income',
]

const CATEGORY_COLORS = {
  'Consulting / Freelance Income': '#22D3EE',
  'Product Sales':                 '#34D399',
  'Service Revenue':               '#A78BFA',
  '1099-NEC Income':               '#FBBF24',
  '1099-MISC Income':              '#F97316',
  'Rental Income':                 '#60A5FA',
  'Commission Income':             '#E879F9',
  'Investment Income':             '#4ADE80',
  'Royalty Income':                '#FCD34D',
  'Grant / Award Income':          '#38BDF8',
  'Refunds / Reimbursements':      '#86EFAC',
  'Other Income':                  '#94A3B8',
}

const fmt = n => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)
const formatDate = d => {
  if (!d) return '—'
  try { return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
  catch { return d }
}
const API = 'http://127.0.0.1:8000'

export default function IncomePage({ backendStatus, selectedBusiness, onSelectBusiness, businesses }) {
  const [activeBusiness, setActiveBusiness] = useState(selectedBusiness || null)
  const [income, setIncome]   = useState([])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [message, setMessage] = useState({ text: '', type: 'success' })
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [categorizing, setCategorizing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [extracted, setExtracted] = useState(null)   // { success, confidence, document_id, filename }
  const [editFields, setEditFields] = useState({ source: '', amount: '', date: '', category: '', description: '' })
  const [editingField, setEditingField] = useState(null)
  const fileInputRef = useRef(null)
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    source: '', amount: '', category: 'Other Income', description: ''
  })

  useEffect(() => {
    if (selectedBusiness) setActiveBusiness(selectedBusiness)
    else if (businesses?.length) setActiveBusiness(businesses[0])
  }, [selectedBusiness, businesses])

  useEffect(() => { if (activeBusiness) loadIncome() }, [activeBusiness])

  const loadIncome = async () => {
    try {
      const res = await fetch(`${API}/api/income/?business_id=${activeBusiness.id}`)
      const data = await res.json()
      setIncome(data || [])
    } catch (e) {}
  }

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type })
    setTimeout(() => setMessage({ text: '', type: 'success' }), 4000)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.source.trim() || !form.amount || !activeBusiness) return
    setSaving(true)
    try {
      const res = await fetch(`${API}/api/income/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: activeBusiness.id,
          date: form.date,
          source: form.source,
          amount: parseFloat(form.amount),
          category: form.category,
          description: form.description,
          doc_type: 'manual',
        })
      })
      if (res.ok) {
        setForm({ date: new Date().toISOString().split('T')[0], source: '', amount: '', category: 'Other Income', description: '' })
        setShowForm(false)
        loadIncome()
        showMsg(`✓ Income logged: ${form.source} ${fmt(form.amount)}`)
      }
    } catch (e) {
      showMsg('Failed to save income.', 'error')
    }
    setSaving(false)
  }

  const handleDelete = async id => {
    await fetch(`${API}/api/income/${id}`, { method: 'DELETE' })
    setConfirmDelete(null)
    loadIncome()
  }

  // ── Ask Luca to guess an income category ─────────────────────────────────
  const autoCategorizeLuca = async (source, description, amount) => {
    setCategorizing(true)
    try {
      const result = await api.categorizeIncome(source, parseFloat(amount) || 0, description)
      if (result?.category && result.category !== 'Other Income') return result.category
    } catch (e) {}
    finally { setCategorizing(false) }
    return null
  }

  // ── File drop handler — upload + extract + auto-categorize ──────────────
  const handleFileDrop = async (file) => {
    if (!activeBusiness) { showMsg('Please select a business first.', 'error'); return }
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
    if (!allowed.includes(file.type)) { showMsg('Please drop a JPG, PNG, or PDF.', 'error'); return }

    setUploading(true)
    setExtracted(null)

    const docResult = await api.uploadDocument(file, activeBusiness.id)
    setUploading(false)

    if (!docResult?.success) { showMsg('Upload failed. Please try again.', 'error'); return }

    const ext = docResult.extracted || {}
    const source = ext.vendor || file.name.replace(/\.[^/.]+$/, '')
    const amount = ext.amount ? String(ext.amount) : ''
    const date = ext.date || new Date().toISOString().split('T')[0]
    const description = ext.description || ''
    const category = await autoCategorizeLuca(source, description, ext.amount) || ''

    setExtracted({
      success: docResult.extraction_success,
      confidence: ext.confidence || 'low',
      document_id: docResult.document_id,
      filename: file.name,
    })
    setEditFields({ source, amount, date, category, description })
  }

  const onDrop = (e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFileDrop(f) }
  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true) }
  const onDragLeave = () => setIsDragging(false)

  // ── Confirm and log the extracted income entry ───────────────────────────
  const handleConfirmIncome = async () => {
    if (!editFields.source || !editFields.amount || !activeBusiness) {
      showMsg('Please fill in source and amount.', 'error')
      return
    }
    setConfirming(true)
    let category = editFields.category
    if (!category) category = await autoCategorizeLuca(editFields.source, editFields.description, editFields.amount) || 'Other Income'
    try {
      const res = await fetch(`${API}/api/income/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: activeBusiness.id,
          date: editFields.date || new Date().toISOString().split('T')[0],
          source: editFields.source,
          amount: parseFloat(editFields.amount),
          category,
          description: editFields.description,
          doc_type: 'upload',
          document_id: extracted?.document_id || null,
        })
      })
      if (res.ok) {
        setExtracted(null)
        loadIncome()
        showMsg(`✓ Income logged: ${editFields.source} ${fmt(editFields.amount)}`)
      } else {
        showMsg('Failed to save income.', 'error')
      }
    } catch (e) {
      showMsg('Failed to save income.', 'error')
    }
    setConfirming(false)
  }

  const totalIncome = income.reduce((s, i) => s + (i.amount || 0), 0)

  // Group by category for summary
  const byCategory = {}
  income.forEach(i => {
    byCategory[i.category] = (byCategory[i.category] || 0) + (i.amount || 0)
  })
  const topCategories = Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 5)

  const filteredIncome = income.filter(item => {
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false
    if (!search) return true
    const q = search.toLowerCase()
    return (
      item.source?.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q)
    )
  })
  const filteredTotal = filteredIncome.reduce((s, i) => s + (i.amount || 0), 0)

  const inputStyle = {
    background: 'var(--card-2)', border: '1px solid var(--border)',
    color: 'var(--text-0)', borderRadius: '10px',
    padding: '8px 12px', fontSize: '13px', outline: 'none', width: '100%',
  }

  return (
    <div className="flex flex-col gap-6 p-6" style={{ minHeight: '100%' }}>

      {/* Flash */}
      {message.text && (
        <div className="rounded-xl px-4 py-3 text-sm font-medium"
          style={{
            background: message.type === 'error' ? 'rgba(251,113,133,0.1)' : 'rgba(52,211,153,0.1)',
            border: `1px solid ${message.type === 'error' ? 'rgba(251,113,133,0.3)' : 'rgba(52,211,153,0.3)'}`,
            color: message.type === 'error' ? '#FB7185' : '#34D399',
          }}>
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
                background: activeBusiness?.id === b.id ? '#34D399' : 'var(--card)',
                border: `1px solid ${activeBusiness?.id === b.id ? '#34D399' : 'var(--border)'}`,
                color: activeBusiness?.id === b.id ? '#04141a' : 'var(--text-1)',
              }}>
              {b.name}
            </button>
          ))}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-2)' }}>Total Income YTD</p>
          <p className="text-2xl font-bold" style={{ color: '#34D399', letterSpacing: '-0.02em' }}>
            {fmt(totalIncome)}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-2)' }}>{income.length} entries</p>
        </div>

        {/* Top categories */}
        <div className="col-span-2 rounded-2xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-2)' }}>BY CATEGORY</p>
          <div className="flex flex-col gap-2">
            {topCategories.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--text-2)' }}>No income logged yet</p>
            ) : topCategories.map(([cat, amt]) => {
              const pct = totalIncome > 0 ? (amt / totalIncome * 100) : 0
              const color = CATEGORY_COLORS[cat] || '#94A3B8'
              return (
                <div key={cat} className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                  <span className="text-xs flex-1 truncate" style={{ color: 'var(--text-1)' }}>{cat}</span>
                  <div className="w-20 h-1.5 rounded-full overflow-hidden flex-shrink-0" style={{ background: 'var(--border)' }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <span className="text-xs font-semibold w-20 text-right" style={{ color: 'var(--text-0)' }}>{fmt(amt)}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Upload Drop Zone */}
      <div
        onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className="rounded-2xl p-8 text-center cursor-pointer transition-all"
        style={{
          border: `2px dashed ${isDragging ? '#34D399' : 'var(--border)'}`,
          background: isDragging ? 'rgba(52,211,153,0.08)' : 'var(--card)',
        }}
      >
        <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.pdf"
          className="hidden" onChange={e => e.target.files[0] && handleFileDrop(e.target.files[0])} />

        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
              style={{ borderColor: '#34D399', borderTopColor: 'transparent' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>
              Reading document with Luca...
            </p>
            <p className="text-xs" style={{ color: 'var(--text-2)' }}>
              This may take 20–30 seconds for scanned documents
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="text-3xl mb-1">💰</div>
            <p className="font-semibold text-sm" style={{ color: 'var(--text-0)' }}>
              Drop a 1099, invoice, or payment record here to auto-log it
            </p>
            <p className="text-xs" style={{ color: 'var(--text-2)' }}>
              or click to browse · JPG, PNG, PDF up to 10MB
            </p>
            <p className="text-xs font-medium mt-1" style={{ color: '#34D399' }}>
              Luca extracts and categorizes automatically
            </p>
          </div>
        )}
      </div>

      {/* Editable extraction result */}
      {extracted && (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid var(--border-soft)' }}>
            <div className="w-7 h-7 rounded-full bg-[#0C2340] flex items-center justify-center text-xs font-bold" style={{ color: '#34D399' }}>L</div>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-0)' }}>
                {extracted.success ? "Luca extracted the document data" : "Partial extraction — please fill in missing fields"}
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
              {categorizing ? 'categorizing…' : `${extracted.confidence} confidence`}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-0">
            {[
              { key: 'source',      label: 'Source / Payer', type: 'text',   placeholder: 'e.g. Acme Corp' },
              { key: 'amount',      label: 'Amount ($)',      type: 'number', placeholder: '0.00' },
              { key: 'date',        label: 'Date',            type: 'date',   placeholder: '' },
              { key: 'description', label: 'Description',     type: 'text',   placeholder: 'Invoice #, project, etc.' },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key}
                className="px-5 py-4 cursor-pointer transition-all"
                style={{
                  borderBottom: '1px solid var(--border-soft)',
                  borderRight: key === 'source' || key === 'date' ? '1px solid var(--border-soft)' : 'none',
                  background: editingField === key ? 'var(--hover)' : 'transparent',
                }}
                onClick={() => setEditingField(key)}
              >
                <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>{label}</p>
                {editingField === key ? (
                  <input type={type} step={type === 'number' ? '0.01' : undefined}
                    value={editFields[key]}
                    onChange={e => setEditFields(p => ({ ...p, [key]: e.target.value }))}
                    onBlur={() => setEditingField(null)}
                    onKeyDown={e => e.key === 'Enter' && setEditingField(null)}
                    autoFocus
                    className="w-full text-sm font-semibold bg-transparent border-b outline-none"
                    style={{ color: 'var(--text-0)', borderColor: '#34D399' }}
                    placeholder={placeholder} />
                ) : (
                  <p className="text-sm font-semibold" style={{ color: editFields[key] ? 'var(--text-0)' : 'var(--text-2)' }}>
                    {editFields[key] || <span style={{ color: 'var(--red)', fontSize: '12px' }}>not detected — click to add</span>}
                  </p>
                )}
              </div>
            ))}

            {/* Category — full width */}
            <div className="col-span-2 px-5 py-4" style={{ borderBottom: '1px solid var(--border-soft)' }}>
              <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>Category</p>
              <div className="flex items-center gap-2 flex-wrap">
                {INCOME_CATEGORIES.map(cat => {
                  const color = CATEGORY_COLORS[cat] || '#94A3B8'
                  return (
                    <button key={cat} onClick={() => setEditFields(p => ({ ...p, category: cat }))}
                      className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                      style={{
                        background: editFields.category === cat ? color + '22' : 'var(--card-2)',
                        border: `1px solid ${editFields.category === cat ? color : 'var(--border)'}`,
                        color: editFields.category === cat ? color : 'var(--text-2)',
                      }}>
                      {cat}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 px-5 py-4">
            <button onClick={handleConfirmIncome}
              disabled={confirming || !editFields.source || !editFields.amount}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{
                background: confirming || !editFields.source || !editFields.amount ? 'var(--border)' : '#34D399',
                color: confirming || !editFields.source || !editFields.amount ? 'var(--text-2)' : '#04141a',
              }}>
              {confirming ? 'Logging...' : '✓ Confirm & Log Income'}
            </button>
            <button onClick={() => setExtracted(null)}
              className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{ background: 'var(--card-2)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Header + add button */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold" style={{ color: 'var(--text-0)', fontSize: '15px' }}>
          Income {activeBusiness ? `— ${activeBusiness.name}` : ''}
        </h2>
        <button onClick={() => setShowForm(v => !v)}
          className="text-sm font-semibold" style={{ color: '#34D399' }}>
          {showForm ? 'Cancel' : '+ Log Income'}
        </button>
      </div>

      {/* Income form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-2xl p-5 flex flex-col gap-4"
          style={{ background: 'var(--card)', border: '1px solid rgba(52,211,153,0.2)' }}>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>Source / Payer *</label>
              <input type="text" value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))}
                placeholder="e.g. Acme Corp, Amazon" required style={inputStyle} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>Amount *</label>
              <input type="number" step="0.01" min="0" value={form.amount}
                onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                placeholder="0.00" required style={inputStyle} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>Date *</label>
              <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                required style={inputStyle} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>Category</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                style={inputStyle}>
                {INCOME_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>Description / Notes</label>
            <input type="text" value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Invoice #, project name, etc." style={inputStyle} />
          </div>
          <button type="submit" disabled={saving}
            className="py-2.5 rounded-xl font-bold text-sm transition-all"
            style={{ background: '#34D399', color: '#04141a', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving...' : 'Log Income'}
          </button>
        </form>
      )}

      {/* Search + category filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <input type="text" placeholder="Search income..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg pl-3 pr-3 py-2 text-sm outline-none"
            style={{ background: 'var(--card-2)', border: '1px solid var(--border)', color: 'var(--text-0)' }} />
        </div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm outline-none"
          style={{ background: 'var(--card-2)', border: '1px solid var(--border)', color: 'var(--text-1)' }}>
          <option value="all">All categories</option>
          {INCOME_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Income table */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>

        <div className="grid px-5 py-3 text-xs font-semibold"
          style={{ gridTemplateColumns: '120px 1fr 180px 120px 40px', borderBottom: '1px solid var(--border-soft)', color: 'var(--text-2)' }}>
          <span>Date</span><span>Source</span><span>Category</span>
          <span className="text-right">Amount</span><span />
        </div>

        {filteredIncome.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-12">
            <span className="text-3xl">💰</span>
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              {income.length === 0 ? 'No income logged yet' : 'No income matches your search'}
            </p>
          </div>
        )}

        {filteredIncome.map((item, i) => {
          const color = CATEGORY_COLORS[item.category] || '#94A3B8'
          return (
            <div key={item.id}
              className="grid items-center px-5 py-3.5 transition-all"
              style={{ gridTemplateColumns: '120px 1fr 180px 120px 40px', borderTop: i > 0 ? '1px solid var(--border-soft)' : 'none' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span className="text-sm" style={{ color: 'var(--text-2)' }}>{formatDate(item.date)}</span>
              <div className="min-w-0 pr-4">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-0)' }}>{item.source}</p>
                {item.description && <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-2)' }}>{item.description}</p>}
              </div>
              <span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{ background: color + '18', color }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                  <span className="truncate" style={{ maxWidth: '130px' }}>{item.category}</span>
                </span>
              </span>
              <span className="text-sm font-bold text-right" style={{ color: '#34D399' }}>+{fmt(item.amount)}</span>
              <div className="flex justify-end">
                {confirmDelete === item.id ? (
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleDelete(item.id)} className="text-xs font-semibold" style={{ color: 'var(--red)' }}>Del</button>
                    <span style={{ color: 'var(--border)', fontSize: '10px' }}>|</span>
                    <button onClick={() => setConfirmDelete(null)} className="text-xs" style={{ color: 'var(--text-2)' }}>×</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDelete(item.id)}
                    className="text-base leading-none opacity-20 hover:opacity-80 transition-all"
                    style={{ color: 'var(--red)' }}>×</button>
                )}
              </div>
            </div>
          )
        })}

        {income.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3"
            style={{ borderTop: '1px solid var(--border-soft)', background: 'var(--card-2)' }}>
            <span className="text-xs" style={{ color: 'var(--text-2)' }}>
              {filteredIncome.length} of {income.length} income entries
            </span>
            <span className="text-xs" style={{ color: 'var(--text-2)' }}>
              Total: <strong style={{ color: '#34D399' }}>{fmt(filteredTotal)}</strong>
            </span>
          </div>
        )}
      </div>

    </div>
  )
}