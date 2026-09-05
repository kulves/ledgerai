/**
 * DocumentsPage.jsx — Receipt & Document Upload with Vision Extraction
 * =====================================================================
 * Purpose:
 *   Upload receipts and documents. Luca's vision engine reads them
 *   and extracts vendor, amount, date, and type automatically.
 *   The extracted data can be used to create an expense with one click.
 *
 * Bible Section 10.19 — OCR feature:
 *   Free tier: 5 uploads/month
 *   Growth/Professional: unlimited
 *   (Limit enforcement comes in a later module — UI is built now)
 * Read-only archive of all uploaded receipts and documents,
 * linked to their associated expenses.
 * Receipt uploading has moved to the Expenses tab.
 */
/**
 * DocumentsPage.jsx — Receipt Archive (Dark theme redesign)
 * Read-only archive of uploaded receipts linked to expenses.
 * Receipt uploading lives in the Expenses tab.
 */

import { useState, useEffect } from 'react'
import { api } from '../services/api'
 
const CONFIDENCE_STYLE = {
  high:   { bg: 'rgba(52,211,153,0.1)',  color: '#34D399', label: 'High' },
  medium: { bg: 'rgba(34,211,238,0.1)',  color: '#22D3EE', label: 'Medium' },
  low:    { bg: 'rgba(251,187,36,0.1)',  color: '#FBBF24', label: 'Low' },
}
 
const formatDate = d => {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
  catch { return d }
}
 
const fmt = n => n ? `$${Number(n).toFixed(2)}` : '—'
 
export default function DocumentsPage({ backendStatus, selectedBusiness: propBusiness, onSelectBusiness, businesses: propBusinesses }) {
  const [businesses, setBusinesses] = useState(propBusinesses || [])
  const [activeBusiness, setActiveBusiness] = useState(propBusiness || null)
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [activeDoc, setActiveDoc] = useState(null)     // doc currently open in the preview/edit modal
  const [editForm, setEditForm] = useState(null)        // editable copy of activeDoc.extracted_data
  const [saving, setSaving] = useState(false)
 
  useEffect(() => {
    if (!propBusinesses?.length) {
      api.getBusinesses().then(d => {
        if (d?.length) { setBusinesses(d); if (!activeBusiness) setActiveBusiness(d[0]) }
      })
    }
  }, [])
 
  useEffect(() => { if (propBusiness) setActiveBusiness(propBusiness) }, [propBusiness])
  useEffect(() => { if (activeBusiness) loadDocuments() }, [activeBusiness])
 
  const loadDocuments = async () => {
    setLoading(true)
    const data = await api.getDocuments(activeBusiness.id)
    setDocuments(data || [])
    setLoading(false)
  }
 
  const handleDelete = async id => {
    await fetch(`http://127.0.0.1:8000/api/documents/${id}`, { method: 'DELETE' })
    setConfirmDelete(null)
    loadDocuments()
  }
 
  const openDoc = doc => {
    const ext = doc.extracted_data || {}
    setActiveDoc(doc)
    setEditForm({
      vendor: ext.vendor || '',
      amount: ext.amount ?? '',
      date: ext.date || '',
      description: ext.description || '',
      doc_type: doc.doc_type || 'receipt',
    })
  }
 
  const closeDoc = () => { setActiveDoc(null); setEditForm(null) }
 
  const saveDoc = async () => {
    if (!activeDoc) return
    setSaving(true)
    const payload = {
      vendor: editForm.vendor || null,
      amount: editForm.amount === '' ? null : Number(editForm.amount),
      date: editForm.date || null,
      description: editForm.description || null,
      doc_type: editForm.doc_type,
      reviewed: true,
    }
    const updated = await api.updateDocument(activeDoc.id, payload)
    setSaving(false)
    if (updated) {
      closeDoc()
      loadDocuments()
    }
  }
 
  const filtered = documents.filter(doc => {
    if (!search) return true
    const q = search.toLowerCase()
    const ext = doc.extracted_data || {}
    return (
      doc.filename?.toLowerCase().includes(q) ||
      ext.vendor?.toLowerCase().includes(q) ||
      doc.doc_type?.toLowerCase().includes(q)
    )
  })
 
  return (
    <div className="flex flex-col gap-6 p-6" style={{ minHeight: '100%' }}>
 
      {/* Business selector */}
      {businesses.length > 1 && (
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
 
      {/* Info banner */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
        style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.15)', color: 'var(--text-1)' }}>
        <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--accent)' }}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        To upload a new receipt, go to <strong className="mx-1" style={{ color: 'var(--accent)' }}>Expenses</strong>
        and drop it on the receipt zone — Luca will extract and log it automatically.
      </div>
 
      {/* Search + count */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-2)' }}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" placeholder="Search documents..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-sm outline-none"
            style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text-0)' }}
          />
        </div>
        <span className="text-sm flex-shrink-0" style={{ color: 'var(--text-2)' }}>
          {filtered.length} document{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>
 
      {/* Documents table */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
 
        {/* Header */}
        <div className="grid px-5 py-3 text-xs font-semibold"
          style={{
            gridTemplateColumns: '40px 1fr 120px 100px 100px 120px 40px',
            borderBottom: '1px solid var(--border-soft)',
            color: 'var(--text-2)',
          }}>
          <span />
          <span>File</span>
          <span>Vendor</span>
          <span>Amount</span>
          <span>Date</span>
          <span>Confidence</span>
          <span />
        </div>
 
        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"
              style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
          </div>
        )}
 
        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-12">
            <span className="text-3xl">📄</span>
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              {search ? 'No documents match your search' : 'No documents uploaded yet'}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-2)' }}>
              Drop a receipt on the Expenses tab to get started
            </p>
          </div>
        )}
 
        {/* Rows */}
        {filtered.map((doc, i) => {
          const ext = doc.extracted_data || {}
          const conf = CONFIDENCE_STYLE[ext.confidence] || CONFIDENCE_STYLE.low
          const isPdf = doc.filename?.toLowerCase().endsWith('.pdf')
 
          return (
            <div key={doc.id}
              onClick={() => openDoc(doc)}
              className="grid items-center px-5 py-3.5 transition-all cursor-pointer"
              style={{
                gridTemplateColumns: '40px 1fr 120px 100px 100px 120px 40px',
                borderTop: i > 0 ? '1px solid var(--border-soft)' : 'none',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {/* File icon */}
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                style={{ background: 'var(--card-2)', border: '1px solid var(--border)' }}>
                {isPdf ? '📄' : '🖼️'}
              </div>
 
              {/* Filename + date uploaded */}
              <div className="min-w-0 pr-4">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-0)' }}>
                  {doc.filename}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>
                  {doc.doc_type?.toUpperCase()} · {formatDate(doc.created_at)}
                </p>
              </div>
 
              {/* Vendor */}
              <span className="text-sm truncate" style={{ color: ext.vendor ? 'var(--text-0)' : 'var(--text-2)' }}>
                {ext.vendor || '—'}
              </span>
 
              {/* Amount */}
              <span className="text-sm font-semibold"
                style={{ color: ext.amount ? '#34D399' : 'var(--text-2)' }}>
                {fmt(ext.amount)}
              </span>
 
              {/* Date */}
              <span className="text-sm" style={{ color: 'var(--text-2)' }}>
                {ext.date || '—'}
              </span>
 
              {/* Confidence badge */}
              <span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{ background: conf.bg, color: conf.color }}>
                  {conf.label}
                </span>
              </span>
 
              {/* Delete */}
              <div className="flex justify-end" onClick={e => e.stopPropagation()}>
                {confirmDelete === doc.id ? (
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleDelete(doc.id)}
                      className="text-xs font-semibold" style={{ color: 'var(--red)' }}>Del</button>
                    <span style={{ color: 'var(--border)', fontSize: '10px' }}>|</span>
                    <button onClick={() => setConfirmDelete(null)}
                      className="text-xs" style={{ color: 'var(--text-2)' }}>×</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDelete(doc.id)}
                    className="text-base leading-none opacity-20 hover:opacity-80 transition-all"
                    style={{ color: 'var(--red)' }}>×</button>
                )}
              </div>
            </div>
          )
        })}
 
        {/* Footer */}
        {filtered.length > 0 && (
          <div className="px-5 py-3 text-xs"
            style={{ borderTop: '1px solid var(--border-soft)', background: 'var(--card-2)', color: 'var(--text-2)' }}>
            {documents.filter(d => (d.extracted_data?.confidence === 'high')).length} high confidence
            · {documents.filter(d => !d.extracted_data?.amount).length} missing amount
          </div>
        )}
      </div>
 
      {/* Preview / Edit modal */}
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
                    Uploaded {formatDate(activeDoc.created_at)}
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
 
              <div className="flex gap-2 mt-auto pt-2">
                <button onClick={closeDoc}
                  className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold"
                  style={{ background: 'var(--card-2)', border: '1px solid var(--border)', color: 'var(--text-1)' }}>
                  Cancel
                </button>
                <button onClick={saveDoc} disabled={saving}
                  className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold"
                  style={{ background: 'var(--accent)', color: '#04141a', opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
 
    </div>
  )
}