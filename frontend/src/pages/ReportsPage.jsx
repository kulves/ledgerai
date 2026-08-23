/**
 * ReportsPage.jsx — Financial Reports (Dark theme redesign)
 * LedgerPro-style with stat cards, category breakdown table, PDF download.
 */
import { useState, useEffect } from 'react'
import { api } from '../services/api'
 
const YEAR = new Date().getFullYear()
const PERIODS = [
  { label: 'This Year', start: `${YEAR}-01-01`, end: `${YEAR}-12-31` },
  { label: 'Q1', start: `${YEAR}-01-01`, end: `${YEAR}-03-31` },
  { label: 'Q2', start: `${YEAR}-04-01`, end: `${YEAR}-06-30` },
  { label: 'Q3', start: `${YEAR}-07-01`, end: `${YEAR}-09-30` },
  { label: 'Q4', start: `${YEAR}-10-01`, end: `${YEAR}-12-31` },
]
 
const CATEGORY_COLORS = [
  '#22D3EE','#34D399','#A78BFA','#FBBF24','#FB7185',
  '#F97316','#60A5FA','#E879F9','#4ADE80','#FCD34D'
]
 
const fmt = n => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)
 
export default function ReportsPage({ backendStatus, selectedBusiness: propBusiness, onSelectBusiness, businesses: propBusinesses }) {
  const [businesses, setBusinesses] = useState(propBusinesses || [])
  const [activeBusiness, setActiveBusiness] = useState(propBusiness || null)
  const [period, setPeriod] = useState(PERIODS[0])
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
 
  useEffect(() => {
    if (!propBusinesses?.length) {
      api.getBusinesses().then(d => {
        if (d?.length) { setBusinesses(d); if (!activeBusiness) setActiveBusiness(d[0]) }
      })
    }
  }, [])
 
  useEffect(() => { if (propBusiness) setActiveBusiness(propBusiness) }, [propBusiness])
 
  useEffect(() => {
    if (!activeBusiness) return
    setLoading(true)
    setReport(null)
    api.getReportSummary(activeBusiness.id, period.start, period.end).then(data => {
      setReport(data)
      setLoading(false)
    })
  }, [activeBusiness, period])
 
  const handleDownload = async () => {
    if (!activeBusiness) return
    setDownloading(true)
    await api.downloadReportPdf(activeBusiness.id, period.start, period.end, true)
    setDownloading(false)
    setDownloaded(true)
    setTimeout(() => setDownloaded(false), 3000)
  }
 
  const categories = report?.by_category || {}
  const catEntries = Object.entries(categories).sort((a, b) => b[1] - a[1])
  const totalExpenses = report?.total_expenses || 0
  const totalDeductible = report?.total_deductible || 0
  const mileageDeduction = report?.mileage_deduction || 0
  const totalDeductions = totalDeductible + mileageDeduction
  const totalMiles = report?.total_miles || 0
 
  const statCards = [
    { label: 'Total Expenses', value: fmt(totalExpenses), sub: `${report?.transaction_count || 0} transactions`, color: '#FB7185' },
    { label: 'Total Deductible', value: fmt(totalDeductible), sub: 'Expense deductions', color: '#22D3EE' },
    { label: 'Mileage Deduction', value: fmt(mileageDeduction), sub: `${totalMiles.toFixed(1)} miles`, color: '#A78BFA' },
    { label: 'Total Deductions', value: fmt(totalDeductions), sub: 'Expenses + mileage', color: '#C9962C' },
  ]
 
  return (
    <div className="flex flex-col gap-6 p-6" style={{ minHeight: '100%' }}>
 
      {/* Business + Period selectors */}
      <div className="flex items-center gap-4 flex-wrap">
        {businesses.length > 1 && (
          <div className="flex items-center gap-2">
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
 
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>Period:</span>
          {PERIODS.map(p => (
            <button key={p.label} onClick={() => setPeriod(p)}
              className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{
                background: period.label === p.label ? 'var(--accent)' : 'var(--card)',
                border: `1px solid ${period.label === p.label ? 'var(--accent)' : 'var(--border)'}`,
                color: period.label === p.label ? '#04141a' : 'var(--text-1)',
              }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>
 
      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className="rounded-2xl p-5"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>{card.label}</p>
            </div>
            {loading ? (
              <div className="h-8 rounded-lg animate-pulse" style={{ background: 'var(--border)' }} />
            ) : (
              <>
                <p className="text-2xl font-bold" style={{ color: card.color, letterSpacing: '-0.02em' }}>
                  {card.value}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-2)' }}>{card.sub}</p>
              </>
            )}
          </div>
        ))}
      </div>
 
      {/* Category breakdown */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
 
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border-soft)' }}>
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text-0)' }}>
            Expenses by Category
          </h3>
          <span className="text-xs" style={{ color: 'var(--text-2)' }}>
            {period.label} · {period.start} → {period.end}
          </span>
        </div>
 
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"
              style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
          </div>
        )}
 
        {!loading && catEntries.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-12">
            <span className="text-3xl">📊</span>
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>No data for this period</p>
          </div>
        )}
 
        {!loading && catEntries.map(([cat, amount], i) => {
          const pct = totalExpenses > 0 ? (amount / totalExpenses * 100) : 0
          const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length]
          return (
            <div key={cat}
              className="flex items-center gap-4 px-5 py-3.5 transition-all"
              style={{ borderTop: i > 0 ? '1px solid var(--border-soft)' : 'none' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {/* Color dot */}
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
 
              {/* Category name */}
              <span className="text-sm flex-1 font-medium" style={{ color: 'var(--text-0)' }}>{cat}</span>
 
              {/* Progress bar */}
              <div className="w-32 h-1.5 rounded-full overflow-hidden flex-shrink-0"
                style={{ background: 'var(--border)' }}>
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, background: color }} />
              </div>
 
              {/* Percentage */}
              <span className="text-xs w-10 text-right flex-shrink-0" style={{ color: 'var(--text-2)' }}>
                {pct.toFixed(1)}%
              </span>
 
              {/* Amount */}
              <span className="text-sm font-bold w-24 text-right flex-shrink-0"
                style={{ color: 'var(--text-0)' }}>
                {fmt(amount)}
              </span>
            </div>
          )
        })}
 
        {/* Footer totals */}
        {!loading && catEntries.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3"
            style={{ borderTop: '1px solid var(--border-soft)', background: 'var(--card-2)' }}>
            <span className="text-xs" style={{ color: 'var(--text-2)' }}>
              {catEntries.length} categories
            </span>
            <span className="text-xs" style={{ color: 'var(--text-2)' }}>
              Total: <strong style={{ color: 'var(--text-0)' }}>{fmt(totalExpenses)}</strong>
            </span>
          </div>
        )}
      </div>
 
      {/* Disclaimer */}
      <div className="rounded-xl px-4 py-3 text-xs"
        style={{ background: 'rgba(251,187,36,0.06)', border: '1px solid rgba(251,187,36,0.2)', color: 'var(--amber)' }}>
        <strong>Disclaimer:</strong> This report is for organizational purposes only. Not tax, financial, or legal advice. Review with your CPA before filing.
      </div>
 
      {/* Download button */}
      <button
        onClick={handleDownload}
        disabled={downloading || !report}
        className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all"
        style={{
          background: downloaded ? 'rgba(52,211,153,0.15)' : 'var(--card)',
          border: `1px solid ${downloaded ? 'rgba(52,211,153,0.4)' : 'var(--border)'}`,
          color: downloaded ? '#34D399' : 'var(--text-0)',
          opacity: downloading || !report ? 0.5 : 1,
        }}
      >
        {downloading ? 'Generating PDF...' : downloaded ? '✓ PDF Downloaded!' : '↓ Download PDF Report (Free — watermarked)'}
      </button>
 
    </div>
  )
}