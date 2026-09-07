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
/**
 * MileagePage.jsx — Mileage Tracking (Dark theme redesign)
 * LedgerPro-style table with stat cards at top.
 */
import { useState, useEffect } from 'react'
import { api } from '../services/api'

const TRIP_COLORS = {
  business:   '#22D3EE',
  medical:    '#FB7185',
  charitable: '#A78BFA',
  personal:   '#64748B',
}
const TRIP_LABELS = {
  business: 'Business', medical: 'Medical',
  charitable: 'Charitable', personal: 'Personal'
}
const RATES = { business: 0.725, medical: 0.205, charitable: 0.14, personal: 0 }

const fmt = n => `$${(n || 0).toFixed(2)}`
const formatDate = d => {
  if (!d) return '—'
  try { return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
  catch { return d }
}

export default function MileagePage({ backendStatus, selectedBusiness: propBusiness, onSelectBusiness, businesses: propBusinesses }) {
  const [businesses, setBusinesses] = useState(propBusinesses || [])
  const [activeBusiness, setActiveBusiness] = useState(propBusiness || null)
  const [trips, setTrips] = useState([])
  const [summary, setSummary] = useState({})
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    purpose: '', miles: '', trip_type: 'business'
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  useEffect(() => {
    if (!propBusinesses?.length) api.getBusinesses().then(d => { if (d?.length) { setBusinesses(d); if (!activeBusiness) setActiveBusiness(d[0]) } })
  }, [])

  useEffect(() => {
    if (propBusiness) setActiveBusiness(propBusiness)
  }, [propBusiness])

  useEffect(() => {
    if (activeBusiness) { loadTrips(); loadSummary() }
  }, [activeBusiness])

  const loadTrips = async () => {
    const data = await api.getMileageTrips(activeBusiness.id)
    setTrips(data || [])
  }
  const loadSummary = async () => {
    const data = await api.getMileageSummary(activeBusiness.id)
    setSummary(data || {})
  }

  const showMsg = text => { setMessage(text); setTimeout(() => setMessage(''), 4000) }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.miles || !form.purpose || !activeBusiness) return
    setSaving(true)
    const result = await api.createMileageTrip({
      business_id: activeBusiness.id,
      date: form.date, purpose: form.purpose,
      miles: parseFloat(form.miles), trip_type: form.trip_type,
    })
    setSaving(false)
    if (result) {
      setForm({ date: new Date().toISOString().split('T')[0], purpose: '', miles: '', trip_type: 'business' })
      setShowForm(false)
      loadTrips(); loadSummary()
      showMsg(`✓ Trip logged: ${form.miles} miles`)
    }
  }

  const handleDelete = async id => {
    await api.deleteMileageTrip(id)
    setConfirmDelete(null)
    loadTrips(); loadSummary()
  }

  const totalMiles = trips.reduce((s, t) => s + (t.miles || 0), 0)
  const totalDeduction = trips.reduce((s, t) => s + (t.deduction || (t.miles * (RATES[t.trip_type] || 0))), 0)
  const businessMiles = trips.filter(t => t.trip_type === 'business').reduce((s, t) => s + (t.miles || 0), 0)
  const businessDeduction = businessMiles * RATES.business

  const filteredTrips = trips.filter(trip => {
    if (typeFilter !== 'all' && trip.trip_type !== typeFilter) return false
    if (!search) return true
    return trip.purpose?.toLowerCase().includes(search.toLowerCase())
  })
  const filteredMiles = filteredTrips.reduce((s, t) => s + (t.miles || 0), 0)
  const filteredDeduction = filteredTrips.reduce((s, t) => s + (t.deduction || (t.miles * (RATES[t.trip_type] || 0))), 0)

  const statCards = [
    { label: 'Total Miles', value: totalMiles.toFixed(1), sub: 'All trip types', color: '#22D3EE' },
    { label: 'Business Miles', value: businessMiles.toFixed(1), sub: `${RATES.business * 100}¢/mile`, color: '#34D399' },
    { label: 'Business Deduction', value: fmt(businessDeduction), sub: 'IRS standard rate', color: '#C9962C' },
    { label: 'Total Deduction', value: fmt(totalDeduction), sub: 'All deductible trips', color: '#A78BFA' },
  ]

  return (
    <div className="flex flex-col gap-6 p-6" style={{ minHeight: '100%' }}>

      {/* Flash */}
      {message && (
        <div className="rounded-xl px-4 py-3 text-sm font-medium"
          style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', color: '#34D399' }}>
          {message}
        </div>
      )}

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

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className="rounded-2xl p-5"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-2)' }}>{card.label}</p>
            <p className="text-2xl font-bold" style={{ color: card.color, letterSpacing: '-0.02em' }}>
              {card.value}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-2)' }}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Header + Add button */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold" style={{ color: 'var(--text-0)', fontSize: '15px' }}>
          Trips {activeBusiness ? `— ${activeBusiness.name}` : ''}
        </h2>
        <button onClick={() => setShowForm(v => !v)}
          className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
          {showForm ? 'Cancel' : '+ Log Trip'}
        </button>
      </div>

      {/* Log trip form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-2xl p-5 flex flex-col gap-4"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'date', label: 'Date *', type: 'date' },
              { key: 'miles', label: 'Miles *', type: 'number', placeholder: '0.0', step: '0.1' },
            ].map(({ key, label, type, placeholder, step }) => (
              <div key={key} className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>{label}</label>
                <input type={type} step={step} value={form[key]}
                  onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder} required
                  className="rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ background: 'var(--card-2)', border: '1px solid var(--border)', color: 'var(--text-0)' }}
                />
              </div>
            ))}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>Trip Type</label>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(TRIP_LABELS).map(([val, lbl]) => (
                  <button key={val} type="button" onClick={() => setForm(p => ({ ...p, trip_type: val }))}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: form.trip_type === val ? TRIP_COLORS[val] + '22' : 'var(--card-2)',
                      border: `1px solid ${form.trip_type === val ? TRIP_COLORS[val] : 'var(--border)'}`,
                      color: form.trip_type === val ? TRIP_COLORS[val] : 'var(--text-2)',
                    }}>
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>
                Est. Deduction
              </label>
              <p className="text-lg font-bold" style={{ color: 'var(--accent)' }}>
                {fmt((parseFloat(form.miles) || 0) * (RATES[form.trip_type] || 0))}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>Business Purpose *</label>
            <input type="text" value={form.purpose}
              onChange={e => setForm(p => ({ ...p, purpose: e.target.value }))}
              placeholder="e.g. Client meeting downtown" required
              className="rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: 'var(--card-2)', border: '1px solid var(--border)', color: 'var(--text-0)' }}
            />
          </div>
          <button type="submit" disabled={saving}
            className="py-2.5 rounded-xl font-bold text-sm"
            style={{ background: 'var(--accent)', color: '#04141a', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving...' : 'Log Trip'}
          </button>
        </form>
      )}

      {/* Search + type filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <input type="text" placeholder="Search trips by purpose..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg pl-3 pr-3 py-2 text-sm outline-none"
            style={{ background: 'var(--card-2)', border: '1px solid var(--border)', color: 'var(--text-0)' }} />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm outline-none"
          style={{ background: 'var(--card-2)', border: '1px solid var(--border)', color: 'var(--text-1)' }}>
          <option value="all">All trip types</option>
          {Object.entries(TRIP_LABELS).map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
        </select>
      </div>

      {/* Trips table */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>

        {/* Table header */}
        <div className="grid px-5 py-3 text-xs font-semibold"
          style={{
            gridTemplateColumns: '120px 1fr 100px 100px 110px 40px',
            borderBottom: '1px solid var(--border-soft)',
            color: 'var(--text-2)',
          }}>
          <span>Date</span>
          <span>Purpose</span>
          <span>Type</span>
          <span>Miles</span>
          <span className="text-right">Deduction</span>
          <span />
        </div>

        {filteredTrips.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-12">
            <span className="text-3xl">🚗</span>
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              {trips.length === 0 ? 'No trips logged yet' : 'No trips match your search'}
            </p>
          </div>
        )}

        {filteredTrips.map((trip, i) => {
          const color = TRIP_COLORS[trip.trip_type] || '#64748B'
          const deduction = trip.deduction || (trip.miles * (RATES[trip.trip_type] || 0))
          return (
            <div key={trip.id}
              className="grid items-center px-5 py-3.5 transition-all"
              style={{
                gridTemplateColumns: '120px 1fr 100px 100px 110px 40px',
                borderTop: i > 0 ? '1px solid var(--border-soft)' : 'none',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span className="text-sm" style={{ color: 'var(--text-2)' }}>{formatDate(trip.date)}</span>
              <span className="text-sm truncate pr-4" style={{ color: 'var(--text-0)' }}>{trip.purpose}</span>
              <span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{ background: color + '18', color }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                  {TRIP_LABELS[trip.trip_type] || trip.trip_type}
                </span>
              </span>
              <span className="text-sm font-semibold" style={{ color: 'var(--text-0)' }}>
                {(trip.miles || 0).toFixed(1)} mi
              </span>
              <span className="text-sm font-bold text-right" style={{ color: '#34D399' }}>
                {fmt(deduction)}
              </span>
              <div className="flex justify-end">
                {confirmDelete === trip.id ? (
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleDelete(trip.id)}
                      className="text-xs font-semibold" style={{ color: 'var(--red)' }}>Del</button>
                    <span style={{ color: 'var(--border)', fontSize: '10px' }}>|</span>
                    <button onClick={() => setConfirmDelete(null)}
                      className="text-xs" style={{ color: 'var(--text-2)' }}>×</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDelete(trip.id)}
                    className="text-base leading-none opacity-20 hover:opacity-80 transition-all"
                    style={{ color: 'var(--red)' }}>×</button>
                )}
              </div>
            </div>
          )
        })}

        {/* Footer */}
        {trips.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3"
            style={{ borderTop: '1px solid var(--border-soft)', background: 'var(--card-2)' }}>
            <span className="text-xs" style={{ color: 'var(--text-2)' }}>
              {filteredTrips.length} of {trips.length} trip{trips.length !== 1 ? 's' : ''} · {filteredMiles.toFixed(1)} miles shown
            </span>
            <span className="text-xs" style={{ color: 'var(--text-2)' }}>
              Deduction shown: <strong style={{ color: '#34D399' }}>{fmt(filteredDeduction)}</strong>
            </span>
          </div>
        )}
      </div>

    </div>
  )
}