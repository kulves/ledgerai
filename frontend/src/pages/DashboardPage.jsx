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
 /**
 * DashboardPage.jsx — LedgerPro-style Dashboard
 * Updated: correct API keys, cashflow chart, fixed card layout,
 * unique category colors, light mode grid lines fix.
 */
import { useState, useEffect } from 'react'
import { api } from '../services/api'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, ArcElement, Tooltip, Legend, Filler
} from 'chart.js'
import { Line, Doughnut } from 'react-chartjs-2'
import { CATEGORY_COLORS, categoryColor } from '../constants/categories'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler)

const COLOR_LIST = Object.values(CATEGORY_COLORS)

const fmt = n => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n || 0)
const fmtMono = n => fmt(n).replace('$', '')

export default function DashboardPage({ selectedBusiness, onSelectBusiness, businesses, onNavigate }) {
  const [dashData, setDashData]   = useState(null)
  const [expenses, setExpenses]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [chartView, setChartView] = useState('Monthly')

  useEffect(() => {
    if (selectedBusiness) loadData()
  }, [selectedBusiness])

  const loadData = async () => {
    setLoading(true)
    try {
      const [dash, expData] = await Promise.all([
        api.getDashboard(selectedBusiness?.id),
        api.getExpenses(selectedBusiness?.id),
      ])
      setDashData(dash)
      setExpenses(expData || [])
    } catch (e) {}
    setLoading(false)
  }

  // ── Chart data ────────────────────────────────────────────────────────────
  const buildCashFlowData = () => {
  const chart = dashData?.monthly_chart
  if (!chart || !chart.months?.length) {
    return { labels: ['No data'], datasets: [] }
  }

  // YTD = running cumulative sum
  const cumulate = (arr) => arr.reduce((acc, val) => {
    acc.push((acc[acc.length - 1] || 0) + val)
    return acc
  }, [])

    const expenses   = chartView === 'YTD' ? cumulate(chart.expenses)   : chart.expenses
    const deductions = chartView === 'YTD' ? cumulate(chart.deductions) : chart.deductions
    const income     = chartView === 'YTD' ? cumulate(chart.income)     : chart.income
    const cashflow   = chartView === 'YTD' ? cumulate(chart.cashflow)   : chart.cashflow

    return {
      labels: chart.months,
      datasets: [
        {
          label: 'Expenses',
          data: expenses,
          borderColor: '#FB7185',
          backgroundColor: 'rgba(251,113,133,0.08)',
          fill: true, tension: 0.4,
          pointBackgroundColor: '#FB7185',
          pointRadius: 4, pointHoverRadius: 6,
          pointStyle: 'circle',
        },
        {
          label: 'Total Deductions',
          data: deductions,
          borderColor: '#22D3EE',
          backgroundColor: 'transparent',
          fill: false, tension: 0.4,
          borderDash: [4, 4],
          pointBackgroundColor: '#22D3EE',
          pointRadius: 3, pointHoverRadius: 5,
          pointStyle: 'circle',
        },
        {
          label: 'Income',
          data: income,
          borderColor: '#34D399',
          backgroundColor: 'rgba(52,211,153,0.08)',
          fill: true, tension: 0.4,
          pointBackgroundColor: '#34D399',
          pointRadius: 4, pointHoverRadius: 6,
          pointStyle: 'circle',
        },
        {
          label: 'Cash Flow',
          data: cashflow,
          borderColor: '#C9962C',
          backgroundColor: 'transparent',
          fill: false, tension: 0.4,
          borderDash: [6, 3],
          pointBackgroundColor: '#C9962C',
          pointRadius: 3, pointHoverRadius: 5,
          pointStyle: 'circle',
        },
      ]
    }
  }

    const buildCategoryData = () => {
      const cats = {}
      expenses.forEach(e => {
        const cat = e.category || 'Uncategorized'
        cats[cat] = (cats[cat] || 0) + (e.amount || 0)
      })
      const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 8)
      return {
        labels: sorted.map(([k]) => k),
        datasets: [{
          data: sorted.map(([, v]) => v),
          backgroundColor: sorted.map(([k]) => categoryColor(k)),
          borderWidth: 0, hoverOffset: 6,
        }]
      }
    }

  // Chart options — respects dark/light mode for grid lines
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light'
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'
  const tickColor = isDark ? '#475569' : '#94A3B8'

  const lineOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: { color: isDark ? '#94A3B8': '#475569', boxWidth: 6, boxHeight: 6, borderRadius: 3, usePointStyle: true, pointStyle: 'circle', font: { size: 11 } }
      },
      tooltip: {
        backgroundColor: isDark ? 'rgba(17,24,39,0.95)' : 'rgba(255,255,255,0.98)',
        titleColor: isDark ? '#94A3B8' : '#475569',
        bodyColor: isDark ? '#F1F5F9' : '#0F172A',
        borderColor: 'rgba(34,211,238,0.2)', borderWidth: 1, padding: 12,
        callbacks: { label: ctx => ` $${Number(ctx.raw).toFixed(2)}` }
      }
    },
    scales: {
      x: {
        grid: { color: gridColor, drawBorder: false },
        ticks: { color: tickColor, font: { size: 11 } },
      },
      y: {
        grid: { color: gridColor, drawBorder: false },
        ticks: { color: tickColor, font: { size: 11 }, callback: v => `$${v.toLocaleString()}` },
        beginAtZero: true,
      }
    }
  }

  const donutOptions = {
    responsive: true, maintainAspectRatio: false, cutout: '72%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isDark ? 'rgba(17,24,39,0.95)' : 'rgba(255,255,255,0.98)',
        titleColor: isDark ? '#94A3B8' : '#475569',
        bodyColor: isDark ? '#F1F5F9' : '#0F172A',
        borderColor: 'rgba(34,211,238,0.2)', borderWidth: 1, padding: 12,
        callbacks: { label: ctx => ` ${ctx.label}: $${Number(ctx.raw).toFixed(2)}` }
      }
    }
  }

  // ── Computed values ───────────────────────────────────────────────────────
  const totalExpenses    = dashData?.ytd?.total_expenses    || 0
  const totalDeductions  = dashData?.ytd?.total_deductions  || 0
  const mileageDeduction = dashData?.mileage?.total_deduction || 0
  const totalMiles       = dashData?.mileage?.total_miles   || 0
  // Cashflow = income - expenses (income coming in Phase 2 income feature)
  const totalIncome  = dashData?.ytd?.total_income || 0
  const netProfit    = dashData?.ytd?.net_profit   || 0
  const cashFlow     = totalIncome > 0 ? totalIncome - totalExpenses : netProfit

  const statCards = [
    {
      label: 'Cash Flow',
      value: fmtMono(Math.abs(cashFlow)),
      prefix: cashFlow >= 0 ? '+$' : '-$',
      sub: totalIncome > 0 ? `Income ${fmt(totalIncome)} · Expenses ${fmt(totalExpenses)}` : 'Log income to see cash flow',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
        </svg>
      ),
      iconBg: cashFlow >= 0 ? 'rgba(52,211,153,0.15)' : 'rgba(251,113,133,0.15)',
      iconColor: cashFlow >= 0 ? '#34D399' : '#FB7185',
      valueColor: cashFlow >= 0 ? '#34D399' : '#FB7185',
    },
    {
      label: 'Total Expenses',
      value: fmtMono(totalExpenses),
      prefix: '$',
      sub: `${dashData?.ytd?.expense_count || 0} transactions`,
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
        </svg>
      ),
      iconBg: 'rgba(251,113,133,0.15)', iconColor: '#FB7185', valueColor: 'var(--text-0)',
    },
    {
      label: 'Mileage Deduction',
      value: fmtMono(mileageDeduction),
      prefix: '$',
      sub: `${totalMiles.toFixed(1)} business miles`,
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v9a2 2 0 01-2 2h-2"/>
          <circle cx="7.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="17.5" r="2.5"/>
        </svg>
      ),
      iconBg: 'rgba(167,139,250,0.15)', iconColor: '#A78BFA', valueColor: 'var(--text-0)',
    },
    {
      label: 'Total Deductions',
      value: fmtMono(totalDeductions),
      prefix: '$',
      sub: 'Expenses + mileage',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="20 12 20 22 4 22 4 12"/>
          <rect x="2" y="7" width="20" height="5"/>
          <line x1="12" y1="22" x2="12" y2="7"/>
          <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/>
          <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
        </svg>
      ),
      iconBg: 'rgba(201,150,44,0.15)', iconColor: '#C9962C', valueColor: '#C9962C',
    },
  ]

  const cashFlowData = buildCashFlowData()
  const categoryData = buildCategoryData()
  const recentExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6)

  return (
    <div className="flex flex-col gap-6 p-6" style={{ minHeight: '100%' }}>

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1"
            style={{ color: 'var(--text-2)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em' }}>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/>
              <rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>
            </svg>
            DASHBOARD
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-0)', letterSpacing: '-0.02em' }}>
            Welcome back, {selectedBusiness?.name?.split(' ')[0] || 'Astrid'} 👋
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-2)' }}>
            Here's what's happening with your books today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onNavigate('expenses')}
            className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{ background: 'var(--accent-muted)', border: '1px solid rgba(34,211,238,0.2)', color: 'var(--accent)' }}>
            + Log Expense
          </button>
          <button onClick={() => onNavigate('reports')}
            className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text-1)' }}>
            View Reports
          </button>
        </div>
      </div>

      {/* Business selector */}
      {businesses?.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>Business:</span>
          {businesses.map(b => (
            <button key={b.id} onClick={() => onSelectBusiness(b)}
              className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{
                background: selectedBusiness?.id === b.id ? 'var(--accent)' : 'var(--card)',
                border: `1px solid ${selectedBusiness?.id === b.id ? 'var(--accent)' : 'var(--border)'}`,
                color: selectedBusiness?.id === b.id ? '#04141a' : 'var(--text-1)',
              }}>
              {b.name}
            </button>
          ))}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className="rounded-2xl p-5 flex flex-col gap-3 transition-all"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>{card.label}</span>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: card.iconBg, color: card.iconColor }}>
                {card.icon}
              </div>
            </div>
            <div>
              {loading ? (
                <div className="h-8 rounded-lg animate-pulse" style={{ background: 'var(--border)' }} />
              ) : (
                <>
                  <p className="text-2xl font-bold tracking-tight"
                    style={{ color: card.valueColor || card.color || 'var(--text-0)', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
                    {card.prefix}{card.value}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-2)' }}>{card.sub}</p>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-3 gap-4">

        {/* Live Trend — 2/3 width */}
        <div className="col-span-2 rounded-2xl p-5"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-0)' }}>Live Trend</h3>
            <div className="flex items-center gap-1 p-1 rounded-lg"
              style={{ background: 'var(--card-2)', border: '1px solid var(--border)' }}>
              {['Monthly', 'YTD'].map(v => (
                <button key={v} onClick={() => setChartView(v)}
                  className="px-3 py-1 rounded-md text-xs font-semibold transition-all"
                  style={{
                    background: chartView === v ? 'var(--accent)' : 'transparent',
                    color: chartView === v ? '#04141a' : 'var(--text-2)',
                  }}>
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div style={{ height: '220px' }}>
            {dashData?.monthly_chart?.months?.length > 0
              ? <Line data={cashFlowData} options={lineOptions} />
              : <EmptyChart label="No data yet" />}
          </div>
        </div>

        {/* By Category — 1/3 width */}
        <div className="rounded-2xl p-5"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-0)' }}>By Category</h3>
          <div style={{ height: '140px' }}>
            {expenses.length > 0
              ? <Doughnut data={categoryData} options={donutOptions} />
              : <EmptyChart label="No categories yet" />}
          </div>
          {expenses.length > 0 && (
            <div className="flex flex-col gap-1.5 mt-4">
              {categoryData.labels.slice(0, 4).map((label, i) => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: categoryData.datasets[0].backgroundColor[i] }} />
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
      <div className="rounded-2xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border-soft)' }}>
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text-0)' }}>Recent Transactions</h3>
          <button onClick={() => onNavigate('expenses')}
            className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>
            View all →
          </button>
        </div>

        {recentExpenses.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10">
            <span className="text-3xl">🧾</span>
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>No transactions yet</p>
            <button onClick={() => onNavigate('expenses')}
              className="text-xs font-semibold mt-1" style={{ color: 'var(--accent)' }}>
              Log your first expense →
            </button>
          </div>
        ) : (
          recentExpenses.map((e, i) => {
            const color = categoryColor(e.category)
            return (
              <div key={e.id || i}
                className="flex items-center gap-4 px-5 py-3.5 transition-all"
                style={{ borderTop: i > 0 ? '1px solid var(--border-soft)' : 'none' }}
                onMouseEnter={el => el.currentTarget.style.background = 'var(--hover)'}
                onMouseLeave={el => el.currentTarget.style.background = 'transparent'}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold"
                  style={{ background: color + '18', color }}>
                  {(e.vendor || 'E')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-0)' }}>
                    {e.vendor || 'Unknown Vendor'}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-2)' }}>
                    {e.date} · {e.category || 'Uncategorized'}
                  </p>
                </div>
                <p className="text-sm font-bold flex-shrink-0" style={{ color: '#FB7185' }}>
                  -{fmt(e.amount)}
                </p>
              </div>
            )
          })
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