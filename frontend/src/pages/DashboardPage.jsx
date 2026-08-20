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
 * DashboardPage.jsx — LedgerPro-style Dashboard
 * Batch 2: Stat cards, Cash Flow line chart, Expenses by Category donut,
 * Recent Transactions list. All colors use CSS variables for dark/light.
 */
import { useState, useEffect, useRef } from 'react'
import { api } from '../services/api'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  ArcElement, Tooltip, Legend, Filler
} from 'chart.js'
import { Line, Doughnut } from 'react-chartjs-2'
 
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler)
 
// ── Icons ────────────────────────────────────────────────────────────────────
const UpArrow = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
  </svg>
)
const DownArrow = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="7" y1="7" x2="17" y2="17"/><polyline points="17 7 17 17 7 17"/>
  </svg>
)
const DollarIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
  </svg>
)
const FileIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
  </svg>
)
const CarIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v9a2 2 0 01-2 2h-2"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="17.5" r="2.5"/>
  </svg>
)
const TrendIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
  </svg>
)
 
// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n || 0)
const fmtMono = (n) => fmt(n).replace('$', '')
 
const CATEGORY_COLORS = [
  '#22D3EE','#34D399','#A78BFA','#FBBF24','#FB7185',
  '#F97316','#60A5FA','#E879F9','#4ADE80','#FCD34D'
]
 
export default function DashboardPage({ selectedBusiness, onSelectBusiness, businesses, onNavigate }) {
  const [stats, setStats] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('year')
 
  useEffect(() => {
    if (selectedBusiness) loadData()
  }, [selectedBusiness, period])
 
  const loadData = async () => {
    setLoading(true)
    try {
      const [dashData, expData] = await Promise.all([
        api.getDashboard(selectedBusiness?.id),
        api.getExpenses(selectedBusiness?.id),
      ])
      setStats(dashData)
      setExpenses(expData || [])
    } catch (e) {}
    setLoading(false)
  }
 
  // ── Build chart data from expenses ──────────────────────────────────────
  const buildCashFlowData = () => {
    const monthlyTotals = {}
    expenses.forEach(e => {
      const month = (e.date || '').slice(0, 7)
      if (month) monthlyTotals[month] = (monthlyTotals[month] || 0) + (e.amount || 0)
    })
    const sorted = Object.keys(monthlyTotals).sort()
    const last6 = sorted.slice(-7)
    return {
      labels: last6.length ? last6 : ['No data'],
      datasets: [{
        label: 'Expenses',
        data: last6.map(m => monthlyTotals[m]),
        borderColor: '#22D3EE',
        backgroundColor: 'rgba(34,211,238,0.08)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#22D3EE',
        pointRadius: 4,
        pointHoverRadius: 6,
      }]
    }
  }
 
  const buildCategoryData = () => {
    const cats = {}
    expenses.forEach(e => {
      const cat = e.category || 'Other'
      cats[cat] = (cats[cat] || 0) + (e.amount || 0)
    })
    const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 8)
    return {
      labels: sorted.map(([k]) => k),
      datasets: [{
        data: sorted.map(([, v]) => v),
        backgroundColor: CATEGORY_COLORS,
        borderWidth: 0,
        hoverOffset: 6,
      }]
    }
  }
 
  const chartDefaults = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(17,24,39,0.95)',
        titleColor: '#94A3B8',
        bodyColor: '#F1F5F9',
        borderColor: 'rgba(34,211,238,0.2)',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: ctx => ` $${Number(ctx.raw).toFixed(2)}`
        }
      }
    }
  }
 
  const lineOptions = {
    ...chartDefaults,
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
        ticks: { color: '#475569', font: { size: 11 } },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
        ticks: {
          color: '#475569', font: { size: 11 },
          callback: v => `$${v.toLocaleString()}`
        },
        beginAtZero: true,
      }
    }
  }
 
  const donutOptions = {
    ...chartDefaults,
    cutout: '72%',
    plugins: {
      ...chartDefaults.plugins,
      tooltip: {
        ...chartDefaults.plugins.tooltip,
        callbacks: { label: ctx => ` ${ctx.label}: $${Number(ctx.raw).toFixed(2)}` }
      }
    }
  }
 
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0)
  const totalDeductible = expenses.filter(e => e.deductible !== false).reduce((s, e) => s + (e.amount || 0), 0)
  const mileageDeduction = stats?.mileage_deduction || 0
  const totalDeductions = totalDeductible + mileageDeduction
 
  const statCards = [
    {
      label: 'Total Expenses', value: fmt(totalExpenses),
      sub: `${expenses.length} transactions`,
      icon: <DownArrow />, iconBg: 'rgba(251,113,133,0.15)', iconColor: '#FB7185',
    },
    {
      label: 'Total Deductible', value: fmt(totalDeductible),
      sub: 'Expense deductions',
      icon: <UpArrow />, iconBg: 'rgba(34,211,238,0.12)', iconColor: '#22D3EE',
    },
    {
      label: 'Mileage Deduction', value: fmt(mileageDeduction),
      sub: `${stats?.total_miles || 0} miles`,
      icon: <CarIcon />, iconBg: 'rgba(167,139,250,0.15)', iconColor: '#A78BFA',
    },
    {
      label: 'Total Deductions', value: fmt(totalDeductions),
      sub: 'Expenses + mileage',
      icon: <TrendIcon />, iconBg: 'rgba(201,150,44,0.15)', iconColor: '#C9962C',
      highlight: true,
    },
  ]
 
  const recentExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6)
  const hasCategoryData = expenses.length > 0
  const cashFlowData = buildCashFlowData()
  const categoryData = buildCategoryData()
 
  return (
    <div className="flex flex-col gap-6 p-6" style={{ minHeight: '100%' }}>
 
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1" style={{ color: 'var(--text-2)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em' }}>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/>
              <rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>
            </svg>
          
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-0)', fontFamily: 'var(--font-display)' }}>
            Welcome back, {selectedBusiness?.name?.split(' ')[0] || 'Astrid'} 
          </h1>
        </div>
 
        {/* Quick actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('expenses')}
            className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: 'var(--accent-muted)',
              border: '1px solid rgba(34,211,238,0.2)',
              color: 'var(--accent)'
            }}
          >
            + Log Expense
          </button>
          <button
            onClick={() => onNavigate('reports')}
            className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              color: 'var(--text-1)'
            }}
          >
            View Reports
          </button>
        </div>
      </div>
 
      {/* Business selector */}
      {businesses?.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>Business:</span>
          {businesses.map(b => (
            <button
              key={b.id}
              onClick={() => onSelectBusiness(b)}
              className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{
                background: selectedBusiness?.id === b.id ? 'var(--accent)' : 'var(--card)',
                border: `1px solid ${selectedBusiness?.id === b.id ? 'var(--accent)' : 'var(--border)'}`,
                color: selectedBusiness?.id === b.id ? '#04141a' : 'var(--text-1)',
              }}
            >
              {b.name}
            </button>
          ))}
        </div>
      )}
 
      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div
            key={i}
            className="rounded-2xl p-5 flex flex-col gap-3 transition-all"
            style={{
              background: 'var(--card)',
              border: card.highlight
                ? '1px solid rgba(201,150,44,0.3)'
                : '1px solid var(--border)',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>
                {card.label}
              </span>
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: card.iconBg, color: card.iconColor }}
              >
                {card.icon}
              </div>
            </div>
            <div>
              <p
                className="text-2xl font-bold tracking-tight"
                style={{
                  color: card.highlight ? '#C9962C' : 'var(--text-0)',
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '-0.02em'
                }}
              >
                ${fmtMono(
                  i === 0 ? totalExpenses :
                  i === 1 ? totalDeductible :
                  i === 2 ? mileageDeduction :
                  totalDeductions
                )}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-2)' }}>{card.sub}</p>
            </div>
          </div>
        ))}
      </div>
 
      {/* Charts row */}
      <div className="grid grid-cols-3 gap-4">
 
        {/* Cash Flow — 2/3 width */}
        <div
          className="col-span-2 rounded-2xl p-5"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-0)' }}>
              Expense Trend
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}>
              Monthly
            </span>
          </div>
          <div style={{ height: '220px' }}>
            {expenses.length > 0
              ? <Line data={cashFlowData} options={lineOptions} />
              : <EmptyChart label="No expense data yet" />
            }
          </div>
        </div>
 
        {/* Expenses by Category — 1/3 width */}
        <div
          className="rounded-2xl p-5"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-0)' }}>
            By Category
          </h3>
          <div style={{ height: '140px' }}>
            {hasCategoryData
              ? <Doughnut data={categoryData} options={donutOptions} />
              : <EmptyChart label="No categories yet" />
            }
          </div>
          {hasCategoryData && (
            <div className="flex flex-col gap-1.5 mt-4">
              {categoryData.labels.slice(0, 4).map((label, i) => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CATEGORY_COLORS[i] }} />
                    <span className="text-xs truncate" style={{ color: 'var(--text-1)', maxWidth: '90px' }}>{label}</span>
                  </div>
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-0)' }}>
                    ${categoryData.datasets[0].data[i]?.toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
 
      {/* Recent Transactions */}
      <div
        className="rounded-2xl"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border-soft)' }}>
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text-0)' }}>
            Recent Transactions
          </h3>
          <button
            onClick={() => onNavigate('expenses')}
            className="text-xs font-semibold transition-all"
            style={{ color: 'var(--accent)' }}
          >
            View all →
          </button>
        </div>
 
        {recentExpenses.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10">
            <span className="text-3xl">🧾</span>
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>No transactions yet</p>
            <button
              onClick={() => onNavigate('expenses')}
              className="text-xs font-semibold mt-1"
              style={{ color: 'var(--accent)' }}
            >
              Log your first expense →
            </button>
          </div>
        ) : (
          <div className="divide-y" style={{ '--tw-divide-opacity': 1 }}>
            {recentExpenses.map((e, i) => (
              <div
                key={e.id || i}
                className="flex items-center gap-4 px-5 py-3.5 transition-all"
                style={{ borderColor: 'var(--border-soft)' }}
                onMouseEnter={el => el.currentTarget.style.background = 'var(--hover)'}
                onMouseLeave={el => el.currentTarget.style.background = 'transparent'}
              >
                {/* Category dot */}
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold"
                  style={{
                    background: `${CATEGORY_COLORS[i % CATEGORY_COLORS.length]}18`,
                    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
                    fontFamily: 'var(--font-display)'
                  }}
                >
                  {(e.vendor || 'E')[0].toUpperCase()}
                </div>
 
                {/* Vendor + category */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-0)' }}>
                    {e.vendor || 'Unknown Vendor'}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-2)' }}>
                    {e.date} · {e.category || 'Uncategorized'}
                  </p>
                </div>
 
                {/* Amount */}
                <p
                  className="text-sm font-bold flex-shrink-0"
                  style={{ color: '#FB7185', fontFamily: 'var(--font-display)' }}
                >
                  -{fmt(e.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
 
    </div>
  )
}
 
function EmptyChart({ label }) {
  return (
    <div className="flex items-center justify-center h-full">
      <p className="text-xs" style={{ color: 'var(--text-2)' }}>{label}</p>
    </div>
  )
}