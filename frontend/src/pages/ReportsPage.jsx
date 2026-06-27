import { useState, useEffect } from 'react'
import { api } from '../services/api'

const PERIODS = [
  { label: 'This Year', start: `${new Date().getFullYear()}-01-01`, end: `${new Date().getFullYear()}-12-31` },
  { label: 'Q1', start: `${new Date().getFullYear()}-01-01`, end: `${new Date().getFullYear()}-03-31` },
  { label: 'Q2', start: `${new Date().getFullYear()}-04-01`, end: `${new Date().getFullYear()}-06-30` },
  { label: 'Q3', start: `${new Date().getFullYear()}-07-01`, end: `${new Date().getFullYear()}-09-30` },
  { label: 'Q4', start: `${new Date().getFullYear()}-10-01`, end: `${new Date().getFullYear()}-12-31` },
]

export default function ReportsPage({ backendStatus }) {
  const [businesses, setBusinesses] = useState([])
  const [bizId, setBizId]           = useState(null)
  const [period, setPeriod]         = useState(PERIODS[0])
  const [report, setReport]         = useState(null)
  const [loading, setLoading]       = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [done, setDone]             = useState(false)

  // Step 1: load businesses
  useEffect(() => {
    api.getBusinesses().then(data => {
      if (data && data.length > 0) {
        setBusinesses(data)
        setBizId(data[0].id)
      }
    })
  }, [])

  // Step 2: load report whenever bizId or period changes
  useEffect(() => {
    if (!bizId) return
    setLoading(true)
    setReport(null)
    api.getReportSummary(bizId, period.start, period.end).then(data => {
      setReport(data)
      setLoading(false)
    })
  }, [bizId, period])

  const handleDownload = () => {
    if (!bizId) return
    setDownloading(true)
    api.downloadReportPdf(bizId, period.start, period.end, true).then(() => {
      setDownloading(false)
      setDone(true)
      setTimeout(() => setDone(false), 3000)
    })
  }

  if (businesses.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    )
  }

  return (
    <div className="overflow-y-auto h-full">
      <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-5">

        {/* Business selector */}
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-sm text-gray-500 font-medium">Business:</span>
          {businesses.map(b => (
            <button key={b.id} onClick={() => setBizId(b.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                bizId === b.id ? 'bg-[#0C2340] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}>
              {b.name}
            </button>
          ))}
        </div>

        {/* Period selector */}
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-sm text-gray-500 font-medium">Period:</span>
          {PERIODS.map(p => (
            <button key={p.label} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                period.label === p.label
                  ? 'bg-[#0C2340] text-white border-[#0C2340]'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
              }`}>
              {p.label}
            </button>
          ))}
        </div>

        {loading && <p className="text-gray-400 text-sm text-center py-8">Generating report...</p>}

        {!loading && report && (
          <>
            {/* Summary */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total Expenses',     value: `$${(report.summary?.total_expenses || 0).toFixed(2)}`,          sub: `${report.summary?.expense_count || 0} transactions` },
                { label: 'Total Deductible',   value: `$${(report.summary?.total_deductible || 0).toFixed(2)}`,        sub: 'Expense deductions' },
                { label: 'Mileage Deduction',  value: `$${(report.summary?.total_mileage_deduction || 0).toFixed(2)}`, sub: `${(report.summary?.total_miles || 0).toFixed(1)} miles` },
                { label: 'Total Deductions',   value: `$${(report.summary?.total_deductions || 0).toFixed(2)}`,        sub: 'Expenses + mileage', gold: true },
              ].map(card => (
                <div key={card.label} className={`bg-white rounded-xl p-4 border ${card.gold ? 'border-[#C9962C]' : 'border-gray-200'}`}>
                  <p className="text-xs text-gray-500">{card.label}</p>
                  <p className="text-xl font-bold text-[#0C2340] mt-1">{card.value}</p>
                  <p className="text-xs text-gray-400">{card.sub}</p>
                </div>
              ))}
            </div>

            {/* Category breakdown */}
            {report.category_totals?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h3 className="font-semibold text-[#0C2340] text-sm">By Category</h3>
                </div>
                <table className="w-full">
                  <thead className="bg-[#F5F4F0]">
                    <tr>
                      <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Category</th>
                      <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">Count</th>
                      <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">Deductible</th>
                      <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.category_totals.map((cat, i) => (
                      <tr key={cat.category} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]'}>
                        <td className="px-4 py-2.5 text-sm text-gray-700">{cat.category}</td>
                        <td className="px-4 py-2.5 text-sm text-gray-500 text-right">{cat.count}</td>
                        <td className="px-4 py-2.5 text-sm text-emerald-600 font-medium text-right">${(cat.deductible_total || 0).toFixed(2)}</td>
                        <td className="px-4 py-2.5 text-sm font-bold text-[#0C2340] text-right">${(cat.total || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Mileage breakdown */}
            {report.mileage_totals?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h3 className="font-semibold text-[#0C2340] text-sm">Mileage by Type</h3>
                </div>
                <table className="w-full">
                  <thead className="bg-[#F5F4F0]">
                    <tr>
                      <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Type</th>
                      <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">Trips</th>
                      <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">Miles</th>
                      <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">Deduction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.mileage_totals.map((m, i) => (
                      <tr key={m.trip_type} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]'}>
                        <td className="px-4 py-2.5 text-sm text-gray-700 capitalize">{m.trip_type}</td>
                        <td className="px-4 py-2.5 text-sm text-gray-500 text-right">{m.trip_count}</td>
                        <td className="px-4 py-2.5 text-sm text-gray-700 text-right">{(m.total_miles || 0).toFixed(1)}</td>
                        <td className="px-4 py-2.5 text-sm text-emerald-600 font-medium text-right">
                          {m.total_deduction ? `$${m.total_deduction.toFixed(2)}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Disclaimer */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="text-xs text-amber-800">
                <strong>Disclaimer:</strong> This report is for organizational purposes only.
                Not tax, financial, or legal advice. Review with your CPA before filing.
              </p>
            </div>

            {/* Download */}
            <button onClick={handleDownload}
              disabled={downloading || backendStatus === 'disconnected'}
              className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all ${
                done ? 'bg-emerald-500 text-white' : 'bg-[#0C2340] hover:bg-[#0a1d38] disabled:opacity-40 text-white'
              }`}>
              {done ? '✓ PDF Downloaded!' : downloading ? 'Generating PDF...' : '↓ Download PDF Report (Free — watermarked)'}
            </button>
          </>
        )}

        {!loading && report && report.summary?.expense_count === 0 && report.summary?.mileage_trip_count === 0 && (
          <p className="text-center text-gray-400 text-sm py-6">No data for this period.</p>
        )}

      </div>
    </div>
  )
}