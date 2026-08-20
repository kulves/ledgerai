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

import { useState, useEffect } from 'react'
import { api } from '../services/api'
 
export default function DocumentsPage({ backendStatus, selectedBusiness }) {
  const [businesses, setBusinesses] = useState([])
  const [activeBusiness, setActiveBusiness] = useState(null)
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(false)
 
  useEffect(() => { loadBusinesses() }, [])
 
  useEffect(() => {
    if (selectedBusiness) setActiveBusiness(selectedBusiness)
  }, [selectedBusiness])
 
  useEffect(() => {
    if (activeBusiness) loadDocuments()
  }, [activeBusiness])
 
  const loadBusinesses = async () => {
    const data = await api.getBusinesses()
    if (data?.length) {
      setBusinesses(data)
      if (!activeBusiness) setActiveBusiness(selectedBusiness || data[0])
    }
  }
 
  const loadDocuments = async () => {
    if (!activeBusiness) return
    setLoading(true)
    const data = await api.getDocuments(activeBusiness.id)
    setDocuments(data || [])
    setLoading(false)
  }
 
  const handleDelete = async (docId) => {
    if (!window.confirm('Delete this document? This cannot be undone.')) return
    await fetch(`http://127.0.0.1:8000/api/documents/${docId}`, { method: 'DELETE' })
    loadDocuments()
  }
 
  const confidenceBadge = (conf) => {
    const map = {
      high:   'bg-emerald-100 text-emerald-700',
      medium: 'bg-blue-100 text-blue-700',
      low:    'bg-amber-100 text-amber-700',
    }
    return map[conf] || map.low
  }
 
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="max-w-3xl w-full mx-auto px-4 py-6 flex flex-col gap-6">
 
        {/* Business selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-500">Business:</span>
          {businesses.map(b => (
            <button
              key={b.id}
              onClick={() => setActiveBusiness(b)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                activeBusiness?.id === b.id
                  ? 'bg-[#0C2340] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {b.name}
            </button>
          ))}
        </div>
 
        {/* Info banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
          📎 To upload a new receipt, go to the <strong>Expenses</strong> tab and drop it on the receipt zone — Luca will extract and log it automatically.
        </div>
 
        {/* Document list */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[#0C2340]">
              Uploaded Documents
              {documents.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-400">{documents.length}</span>
              )}
            </h2>
          </div>
 
          {loading && (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-[#C9962C] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
 
          {!loading && documents.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-3">📄</div>
              <p className="font-medium">No documents uploaded yet</p>
              <p className="text-sm mt-1">Drop a receipt on the Expenses tab to get started</p>
            </div>
          )}
 
          <div className="flex flex-col gap-3">
            {documents.map(doc => {
              const ext = doc.extracted_data || {}
              return (
                <div key={doc.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex items-start gap-4">
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 text-xl">
                    {doc.filename?.endsWith('.pdf') ? '📄' : '🖼️'}
                  </div>
 
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm text-gray-800 truncate">{doc.filename}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {doc.doc_type?.toUpperCase()} · {doc.created_at?.slice(0,10)}
                        </p>
                      </div>
                      {ext.confidence && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${confidenceBadge(ext.confidence)}`}>
                          {ext.confidence}
                        </span>
                      )}
                    </div>
 
                    {/* Extracted data */}
                    {(ext.vendor || ext.amount || ext.date) && (
                      <div className="grid grid-cols-3 gap-3 mt-3">
                        {ext.vendor && (
                          <div>
                            <p className="text-xs text-gray-400">Vendor</p>
                            <p className="text-sm font-medium text-gray-700 truncate">{ext.vendor}</p>
                          </div>
                        )}
                        {ext.amount && (
                          <div>
                            <p className="text-xs text-gray-400">Amount</p>
                            <p className="text-sm font-medium text-gray-700">${ext.amount}</p>
                          </div>
                        )}
                        {ext.date && (
                          <div>
                            <p className="text-xs text-gray-400">Date</p>
                            <p className="text-sm font-medium text-gray-700">{ext.date}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
 
                  {/* Delete button */}
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 text-lg leading-none"
                    title="Delete document"
                  >
                    ×
                  </button>
                </div>
              )
            })}
          </div>
        </div>
 
      </div>
    </div>
  )
}