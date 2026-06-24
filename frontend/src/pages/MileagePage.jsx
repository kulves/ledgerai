/**
 * MileagePage.jsx — Mileage Tracking
 * =====================================
 * Purpose:
 *   Log business, medical, and charitable mileage trips.
 *   Automatically calculates the IRS standard mileage deduction
 *   (72.5¢/mile business, 20.5¢/mile medical, 14¢/mile charitable).
 *   The deduction amount is calculated by the backend using verified
 *   rates from the tax_rules/ database (Bible Section 10.20).
 *
 * Module 11 — what this adds:
 *   - Mileage trip form with automatic deduction calculation
 *   - Trip list with deduction amounts per trip
 *   - Summary card showing totals by trip type
 */

import { useState, useEffect } from 'react'
import { api } from '../services/api'

const TRIP_TYPE_COLORS = {
  business:   'bg-blue-100 text-blue-700',
  medical:    'bg-rose-100 text-rose-700',
  charitable: 'bg-purple-100 text-purple-700',
  personal:   'bg-gray-100 text-gray-500'
}

const TRIP_TYPE_LABELS = {
  business:   'Business',
  medical:    'Medical',
  charitable: 'Charitable',
  personal:   'Personal'
}

export default function MileagePage({ backendStatus }) {
  const [businesses, setBusinesses] = useState([])
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [trips, setTrips] = useState([])
  const [summary, setSummary] = useState({})
  const [loading, setLoading] = useState(false)

  // Form state
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    purpose: '',
    miles: '',
    trip_type: 'business'
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  useEffect(() => {
    loadBusinesses()
  }, [])

  useEffect(() => {
    if (selectedBusiness) {
      loadTrips(selectedBusiness.id)
      loadSummary(selectedBusiness.id)
    }
  }, [selectedBusiness])

  const loadBusinesses = async () => {
    const data = await api.getBusinesses()
    setBusinesses(data)
    if (data.length > 0) setSelectedBusiness(data[0])
  }

  const loadTrips = async (businessId) => {
    setLoading(true)
    const data = await api.getMileageTrips(businessId)
    setTrips(data)
    setLoading(false)
  }

  const loadSummary = async (businessId) => {
    const data = await api.getMileageSummary(businessId)
    setSummary(data)
  }

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setError('')
    setSaved(false)
  }

  // Live deduction preview — calculated client-side for instant feedback
  const rates = summary.rates || { business: 0.725, medical: 0.205, charitable: 0.14 }
  const previewDeduction = form.miles && form.trip_type !== 'personal'
    ? (parseFloat(form.miles) * (rates[form.trip_type] || 0)).toFixed(2)
    : null

  const handleSave = async () => {
    if (!form.purpose || !form.miles || !form.date) {
      setError('Please fill in date, purpose, and miles.')
      return
    }
    if (parseFloat(form.miles) <= 0) {
      setError('Miles must be greater than 0.')
      return
    }

    setSaving(true)
    setError('')

    const tripData = {
      business_id: selectedBusiness.id,
      date: form.date,
      purpose: form.purpose,
      miles: parseFloat(form.miles),
      trip_type: form.trip_type
    }

    const result = await api.createMileageTrip(tripData)
    setSaving(false)

    if (result) {
      setTrips(prev => [result, ...prev])
      setSaved(true)
      // Refresh summary totals
      loadSummary(selectedBusiness.id)
      // Reset form
      setForm({
        date: form.date,
        purpose: '',
        miles: '',
        trip_type: 'business'
      })
      setTimeout(() => setSaved(false), 3000)
    } else {
      setError('Failed to save trip. Please try again.')
    }
  }

  const handleDelete = async (tripId) => {
    await api.deleteMileageTrip(tripId)
    setTrips(prev => prev.filter(t => t.id !== tripId))
    setConfirmDelete(null)
    loadSummary(selectedBusiness.id)
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

        {/* Summary cards */}
        {selectedBusiness && Object.keys(summary).length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {['business', 'medical', 'charitable'].map(type => {
              const data = summary[type]
              if (!data) return (
                <div key={type} className="bg-white border border-gray-200 rounded-xl p-4">
                  <p className="text-xs font-medium text-gray-400 capitalize">{type}</p>
                  <p className="text-lg font-bold text-gray-300 mt-1">0 mi</p>
                  <p className="text-xs text-gray-300">$0.00 deduction</p>
                </div>
              )
              return (
                <div key={type} className="bg-white border border-gray-200 rounded-xl p-4">
                  <p className="text-xs font-medium text-gray-500 capitalize">{type}</p>
                  <p className="text-lg font-bold text-[#0C2340] mt-1">
                    {data.total_miles.toFixed(1)} mi
                  </p>
                  <p className="text-xs text-emerald-600 font-medium">
                    ${data.total_deduction.toFixed(2)} deduction
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {data.trip_count} trip{data.trip_count !== 1 ? 's' : ''}
                  </p>
                </div>
              )
            })}
          </div>
        )}

        {/* IRS rate note */}
        <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <span className="text-blue-500 text-xs mt-0.5">ℹ</span>
          <p className="text-xs text-blue-700">
            <strong>2026 IRS Standard Mileage Rates:</strong> Business 72.5¢/mi ·
            Medical 20.5¢/mi · Charitable 14¢/mi.
            Deductions are calculated automatically. Always confirm with your CPA.
          </p>
        </div>

        {/* Log trip form */}
        {selectedBusiness && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-[#0C2340] text-base">Log Mileage Trip</h2>
              <span className="text-xs text-gray-400">{selectedBusiness.name}</span>
            </div>

            {/* Trip type selector */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Trip Type</label>
              <div className="flex gap-2 flex-wrap">
                {['business', 'medical', 'charitable', 'personal'].map(type => (
                  <button
                    key={type}
                    onClick={() => handleChange('trip_type', type)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                      form.trip_type === type
                        ? 'bg-[#0C2340] text-white border-[#0C2340]'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {TRIP_TYPE_LABELS[type]}
                    {type !== 'personal' && (
                      <span className="ml-1 opacity-60">
                        {(rates[type] * 100).toFixed(1)}¢
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Date + Miles */}
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
              <div className="flex flex-col gap-1 w-32">
                <label className="text-xs font-medium text-gray-600">Miles</label>
                <input
                  type="number"
                  placeholder="0.0"
                  step="0.1"
                  min="0"
                  value={form.miles}
                  onChange={e => handleChange('miles', e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9962C]"
                />
              </div>
              {/* Live deduction preview */}
              {previewDeduction && (
                <div className="flex flex-col gap-1 justify-end">
                  <label className="text-xs font-medium text-gray-400">Deduction</label>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-sm font-bold text-emerald-700">
                    ${previewDeduction}
                  </div>
                </div>
              )}
            </div>

            {/* Purpose */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Business Purpose</label>
              <input
                type="text"
                placeholder="e.g. Client meeting at downtown office, supply run to Home Depot"
                value={form.purpose}
                onChange={e => handleChange('purpose', e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9962C]"
              />
              <p className="text-xs text-gray-400">
                IRS requires a specific business purpose for each trip.
              </p>
            </div>

            {error && (
              <p className="text-rose-600 text-xs bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              onClick={handleSave}
              disabled={saving || !form.purpose || !form.miles || backendStatus === 'disconnected'}
              className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${
                saved
                  ? 'bg-emerald-500 text-white'
                  : 'bg-[#C9962C] hover:bg-[#B88A24] disabled:opacity-40 text-white'
              }`}
            >
              {saved ? '✓ Trip Saved!' : saving ? 'Saving...' : 'Save Trip'}
            </button>
          </div>
        )}

        {/* Trip list */}
        <div className="flex flex-col gap-3">
          {loading && (
            <p className="text-center text-gray-400 text-sm py-6">Loading trips...</p>
          )}
          {!loading && trips.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-6">
              No mileage trips logged yet. Add your first one above.
            </p>
          )}
          {trips.map(trip => (
            <div
              key={trip.id}
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-start gap-3"
            >
              <div className="w-2 h-2 rounded-full bg-[#C9962C] mt-2 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-800 text-sm truncate">
                    {trip.purpose}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    TRIP_TYPE_COLORS[trip.trip_type] || 'bg-gray-100 text-gray-600'
                  }`}>
                    {TRIP_TYPE_LABELS[trip.trip_type]}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                  <span>{trip.date}</span>
                  <span>·</span>
                  <span>{trip.miles} miles</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                {trip.deduction_amount != null ? (
                  <span className="font-bold text-emerald-600 text-sm">
                    ${trip.deduction_amount.toFixed(2)}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">not deductible</span>
                )}
                {confirmDelete === trip.id ? (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleDelete(trip.id)}
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
                    onClick={() => setConfirmDelete(trip.id)}
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