/**
 * DashboardPage.jsx — Home Dashboard
 * =====================================
 * Purpose:
 *   The first screen users see when they open Luca.
 *   Shows key financial numbers at a glance and recent activity,
 *   with quick-action buttons to the most common tasks.
 *
 * Module 14 — what this adds:
 *   - YTD total deductions (the number your CPA cares about most)
 *   - This month's spending
 *   - Mileage summary
 *   - Expenses needing review
 *   - Recent activity feed
 *   - Quick action buttons
 */

import { useState, useEffect } from 'react'
import { api } from '../services/api'

export default function DashboardPage({ backendStatus, onNavigate }) {
  const [businesses, setBusinesses]             = useState([])
  const [selectedBiz, setSelectedBiz]           = useState(null)
  const [data, setData]                         = useState(null)
  const [loading, setLoading]                   = useState(true)

  // Load businesses then dashboard data
  useEffect(() => {
    api.getBusinesses().then(bizList => {
      if (bizList && bizList.length > 0) {
        setBusinesses(bizList)
        setSelectedBiz(bizList[0])
      } else {
        setLoading(false)
      }
    })
  }, [])

  useEffect(() => {
    if (!selectedBiz) return
    setLoading(true)
    api.getDashboard(selectedBiz.id).then(d => {
      setData(d)
      setLoading(false)
    })
  }, [selectedBiz])

  // ── Empty state — no businesses yet ──────────────────────────────────────
  if (!loading && businesses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 px-8 text-center">
        <div className="w-20 h-20 rounded-full bg-[#0C2340] flex items-center justify-center text-[#C9962C] text-4xl font-bold">
          L
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#0C2340] mb-2">Welcome to Luca</h2>
          <p className="text-gray-500 text-sm max-w-sm">
            Your local-first AI bookkeeping assistant. Start by adding
            your first business in the Expenses tab.
          </p>
        </div>
        <button
          onClick={() => onNavigate('expenses')}
          className="bg-[#C9962C] hover:bg-[#B88A24] text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all"
        >
          Add Your First Business
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="max-w-3xl w-full mx-auto px-4 py-6 flex flex-col gap-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-bold text-[#0C2340]">
              {loading ? '...' : `Good to see you`}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {data ? `${data.period.year_start} — ${data.period.today}` : 'Loading...'}
            </p>
          </div>

          {/* Business selector */}
          <div className="flex gap-2 flex-wrap">
            {businesses.map(b => (
              <button key={b.id} onClick={() => setSelectedBiz(b)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedBiz?.id === b.id
                    ? 'bg-[#0C2340] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}>
                {b.name}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="text-center py-12 text-gray-400 text-sm">
            Loading dashboard...
          </div>
        )}

        {!loading && data && (
          <>
            {/* ── Key numbers ── */}
            <div className="grid grid-cols-2 gap-3">

              {/* Total deductions — most important number */}
              <div className="col-span-2 bg-[#0C2340] rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <p className="text-[#C9962C] text-xs font-semibold uppercase tracking-wide">
                    Total Deductions YTD
                  </p>
                  <p className="text-4xl font-bold text-white mt-1">
                    ${data.ytd.total_deductions.toFixed(2)}
                  </p>
                  <p className="text-white/50 text-xs mt-1">
                    Expenses + mileage · {data.period.year_start} to today
                  </p>
                </div>
                <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-[#C9962C] text-2xl font-bold flex-shrink-0">
                  L
                </div>
              </div>

              {/* This month */}
              <StatCard
                label={`${data.month.label}`}
                value={`$${data.month.total_expenses.toFixed(2)}`}
                sub="Spent this month"
                icon="📅"
              />

              {/* Deductible expenses */}
              <StatCard
                label="Deductible Expenses"
                value={`$${data.ytd.total_deductible.toFixed(2)}`}
                sub={`${data.ytd.expense_count} transactions`}
                icon="✓"
                green
              />

              {/* Mileage */}
              <StatCard
                label="Business Mileage"
                value={`${data.mileage.total_miles.toFixed(1)} mi`}
                sub={`$${data.mileage.total_deduction.toFixed(2)} deduction · ${data.mileage.trip_count} trips`}
                icon="🚗"
              />

              {/* Documents */}
              <StatCard
                label="Documents"
                value={String(data.document_count)}
                sub="Receipts & files uploaded"
                icon="📄"
              />

            </div>

            {/* ── Needs review alert ── */}
            {data.ytd.needs_review_count > 0 && (
              <button
                onClick={() => onNavigate('expenses')}
                className="w-full bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3 text-left hover:bg-amber-100 transition-all"
              >
                <span className="text-amber-500 text-lg">⚠</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-800">
                    {data.ytd.needs_review_count} expense{data.ytd.needs_review_count !== 1 ? 's' : ''} need review
                  </p>
                  <p className="text-xs text-amber-600">
                    Luca flagged these for your attention — tap to review
                  </p>
                </div>
                <span className="text-amber-400">→</span>
              </button>
            )}

            {/* ── Quick actions ── */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Log Expense',  icon: '＋', tab: 'expenses',  desc: 'Add a transaction' },
                { label: 'Log Mileage',  icon: '🚗', tab: 'mileage',   desc: 'Record a trip' },
                { label: 'Ask Luca',     icon: 'L',  tab: 'chat',      desc: 'Tax question?' },
              ].map(action => (
                <button
                  key={action.tab}
                  onClick={() => onNavigate(action.tab)}
                  className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center gap-2 hover:border-[#C9962C] hover:shadow-sm transition-all text-center"
                >
                  <span className={`text-xl font-bold ${action.icon === 'L' ? 'text-[#C9962C]' : ''}`}>
                    {action.icon}
                  </span>
                  <span className="text-xs font-semibold text-[#0C2340]">{action.label}</span>
                  <span className="text-xs text-gray-400">{action.desc}</span>
                </button>
              ))}
            </div>

            {/* ── Recent activity ── */}
            {(data.recent_expenses.length > 0 || data.recent_mileage.length > 0) && (
              <div className="flex flex-col gap-3">
                <h3 className="font-semibold text-[#0C2340] text-sm">Recent Activity</h3>

                {/* Recent expenses */}
                {data.recent_expenses.map(exp => (
                  <div key={`exp-${exp.id}`}
                    className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#F5F4F0] flex items-center justify-center text-xs">
                      🧾
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{exp.vendor}</p>
                      <p className="text-xs text-gray-400">{exp.date} · {exp.category}</p>
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0">
                      <span className="text-sm font-bold text-[#0C2340]">
                        ${exp.amount.toFixed(2)}
                      </span>
                      {exp.needs_review ? (
                        <span className="text-xs text-amber-500">⚠ review</span>
                      ) : exp.deductible ? (
                        <span className="text-xs text-emerald-500">deductible</span>
                      ) : (
                        <span className="text-xs text-gray-400">personal</span>
                      )}
                    </div>
                  </div>
                ))}

                {/* Recent mileage */}
                {data.recent_mileage.map(trip => (
                  <div key={`mil-${trip.id}`}
                    className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#F5F4F0] flex items-center justify-center text-xs">
                      🚗
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{trip.purpose}</p>
                      <p className="text-xs text-gray-400">{trip.date} · {trip.miles} miles</p>
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0">
                      {trip.deduction_amount ? (
                        <span className="text-sm font-bold text-emerald-600">
                          ${trip.deduction_amount.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">personal</span>
                      )}
                      <span className="text-xs text-gray-400 capitalize">{trip.trip_type}</span>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => onNavigate('expenses')}
                  className="text-xs text-[#C9962C] hover:text-[#B88A24] font-medium text-center py-1 transition-all"
                >
                  View all expenses →
                </button>
              </div>
            )}

            {/* ── Download report shortcut ── */}
            <button
              onClick={() => onNavigate('reports')}
              className="w-full bg-white border border-gray-200 hover:border-[#0C2340] rounded-xl py-3 text-sm font-medium text-[#0C2340] transition-all flex items-center justify-center gap-2"
            >
              <span>📊</span>
              View Full Report & Download PDF
            </button>

          </>
        )}

      </div>
    </div>
  )
}

// ── Stat card component ────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon, green }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="text-sm">{icon}</span>
        <span className="text-xs font-medium text-gray-500">{label}</span>
      </div>
      <p className={`text-xl font-bold mt-0.5 ${green ? 'text-emerald-600' : 'text-[#0C2340]'}`}>
        {value}
      </p>
      <p className="text-xs text-gray-400">{sub}</p>
    </div>
  )
}