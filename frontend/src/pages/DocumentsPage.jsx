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
 */

import { useState, useEffect, useRef } from 'react'
import { api } from '../services/api'

const DOC_TYPE_LABELS = {
  receipt:         'Receipt',
  invoice:         'Invoice',
  bank_statement:  'Bank Statement',
  '1099':          '1099',
  W2:              'W-2',
  pdf:             'PDF',
  other:           'Other'
}

const CONFIDENCE_STYLES = {
  high:   'text-emerald-600 bg-emerald-50 border-emerald-200',
  medium: 'text-amber-600 bg-amber-50 border-amber-200',
  low:    'text-rose-600 bg-rose-50 border-rose-200'
}

export default function DocumentsPage({ backendStatus }) {
  const [businesses, setBusinesses] = useState([])
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [documents, setDocuments] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => { loadBusinesses() }, [])

  useEffect(() => {
    if (selectedBusiness) loadDocuments(selectedBusiness.id)
  }, [selectedBusiness])

  const loadBusinesses = async () => {
    const data = await api.getBusinesses()
    setBusinesses(data)
    if (data.length > 0) setSelectedBusiness(data[0])
  }

  const loadDocuments = async (businessId) => {
    const data = await api.getDocuments(businessId)
    setDocuments(data)
  }

  // ── File upload handler ─────────────────────────────────────────────────
  const handleUpload = async (file) => {
    if (!file || !selectedBusiness) return
    if (backendStatus === 'disconnected') return

    setUploading(true)
    setUploadResult(null)

    const result = await api.uploadDocument(file, selectedBusiness.id)
    setUploadResult(result)
    setUploading(false)

    if (result.success) {
      // Refresh document list
      loadDocuments(selectedBusiness.id)
    }
  }

  const handleFileInput = (e) => {
    const file = e.target.files[0]
    if (file) handleUpload(file)
    e.target.value = ''  // Reset so same file can be re-uploaded
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }

  const handleDelete = async (docId) => {
    await api.deleteDocument(docId)
    setDocuments(prev => prev.filter(d => d.id !== docId))
    setConfirmDelete(null)
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="max-w-3xl w-full mx-auto px-4 py-6 flex flex-col gap-6">

        {/* Business selector */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-gray-600">Business:</span>
          <div className="flex gap-2 flex-wrap">
            {businesses.map(biz => (
              <button
                key={biz.id}
                onClick={() => setSelectedBusiness(biz)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedBusiness?.id === biz.id
                    ? 'bg-[#0C2340] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {biz.name}
              </button>
            ))}
          </div>
        </div>

        {/* Upload zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
            dragOver
              ? 'border-[#C9962C] bg-amber-50'
              : uploading
              ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
              : 'border-gray-300 bg-white hover:border-[#C9962C] hover:bg-amber-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.gif,.webp,.pdf"
            onChange={handleFileInput}
            className="hidden"
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#0C2340] flex items-center justify-center text-[#C9962C] font-bold text-lg animate-pulse">
                L
              </div>
              <p className="text-sm font-medium text-gray-700">
                Luca is reading your document...
              </p>
              <p className="text-xs text-gray-400">
                Extracting vendor, amount, date, and type
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="text-4xl">📄</div>
              <p className="text-sm font-semibold text-gray-700">
                Drop a receipt or document here
              </p>
              <p className="text-xs text-gray-400">
                or click to browse · JPG, PNG, PDF up to 10MB
              </p>
              <p className="text-xs text-gray-400">
                Luca will automatically extract the financial details
              </p>
            </div>
          )}
        </div>

        {/* Upload result */}
        {uploadResult && (
          <div className={`rounded-2xl border p-5 flex flex-col gap-3 ${
            uploadResult.success
              ? 'bg-white border-gray-200'
              : 'bg-rose-50 border-rose-200'
          }`}>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#0C2340] flex items-center justify-center text-[#C9962C] font-bold text-xs">L</div>
              <span className="font-semibold text-sm text-gray-800">
                {uploadResult.success ? "Luca's extraction:" : "Upload failed"}
              </span>
              {uploadResult.extracted?.confidence && (
                <span className={`text-xs px-2 py-0.5 rounded border ${
                  CONFIDENCE_STYLES[uploadResult.extracted.confidence] || ''
                }`}>
                  {uploadResult.extracted.confidence} confidence
                </span>
              )}
            </div>

            <p className="text-xs text-gray-500">{uploadResult.message}</p>

            {uploadResult.success && uploadResult.extracted && (
              <div className="grid grid-cols-2 gap-3">
                <ExtractedField
                  label="Vendor"
                  value={uploadResult.extracted.vendor}
                />
                <ExtractedField
                  label="Amount"
                  value={uploadResult.extracted.amount
                    ? `$${parseFloat(uploadResult.extracted.amount).toFixed(2)}`
                    : null}
                />
                <ExtractedField
                  label="Date"
                  value={uploadResult.extracted.date}
                />
                <ExtractedField
                  label="Type"
                  value={DOC_TYPE_LABELS[uploadResult.extracted.doc_type] || uploadResult.extracted.doc_type}
                />
                {uploadResult.extracted.description && (
                  <div className="col-span-2">
                    <ExtractedField
                      label="Description"
                      value={uploadResult.extracted.description}
                    />
                  </div>
                )}
              </div>
            )}

            {uploadResult.success && (
              <p className="text-xs text-gray-400 italic">
                Go to the Expenses tab to log this as an expense using the extracted data above.
              </p>
            )}
          </div>
        )}

        {/* OCR limit note */}
        <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <span className="text-blue-500 text-xs mt-0.5">ℹ</span>
          <p className="text-xs text-blue-700">
            <strong>Free tier:</strong> 5 receipt uploads per month.
            Growth and Professional tiers get unlimited uploads.
            All processing happens locally on your device — your documents
            are never sent to any server.
          </p>
        </div>

        {/* Document list */}
        <div className="flex flex-col gap-3">
          <h3 className="font-semibold text-[#0C2340] text-sm">
            Uploaded Documents
            {documents.length > 0 && (
              <span className="ml-2 text-gray-400 font-normal">{documents.length}</span>
            )}
          </h3>

          {documents.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-6">
              No documents uploaded yet.
            </p>
          )}

          {documents.map(doc => (
            <div
              key={doc.id}
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-start gap-3"
            >
              <div className="text-lg flex-shrink-0">
                {doc.doc_type === 'pdf' ? '📑' : '🧾'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {doc.filename}
                </p>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400 flex-wrap">
                  <span>{DOC_TYPE_LABELS[doc.doc_type] || doc.doc_type}</span>
                  {doc.extracted_data?.vendor && (
                    <><span>·</span><span>{doc.extracted_data.vendor}</span></>
                  )}
                  {doc.extracted_data?.amount && (
                    <><span>·</span>
                    <span className="text-emerald-600 font-medium">
                      ${parseFloat(doc.extracted_data.amount).toFixed(2)}
                    </span></>
                  )}
                  <span>·</span>
                  <span>{doc.created_at?.split('T')[0]}</span>
                </div>
              </div>
              <div className="flex-shrink-0">
                {confirmDelete === doc.id ? (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="text-xs text-rose-600 hover:text-rose-800 font-medium"
                    >Delete</button>
                    <span className="text-xs text-gray-300">|</span>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >Cancel</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(doc.id)}
                    className="text-xs text-gray-300 hover:text-rose-400 transition-colors"
                  >✕</button>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

// ── Helper component ───────────────────────────────────────────────────────
function ExtractedField({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-400">{label}</span>
      <span className={`text-sm font-medium ${value ? 'text-gray-800' : 'text-gray-300 italic'}`}>
        {value || 'not detected'}
      </span>
    </div>
  )
}