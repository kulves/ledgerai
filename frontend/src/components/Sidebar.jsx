/**
 * Sidebar.jsx — Collapsible Left Navigation
 * Dark sidebar with Luca branding, business selector,
 * nav items, Ask Luca CTA, and user profile at bottom.
 */
import { useState } from 'react'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/>
      <rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>
    </svg>
  )},
  { id: 'expenses', label: 'Expenses', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
    </svg>
  )},
  { id: 'mileage', label: 'Mileage', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
    </svg>
  )},
  { id: 'documents', label: 'Documents', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  )},
  { id: 'reports', label: 'Reports', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  )},
]

const BOTTOM_ITEMS = [
  { id: 'banks', label: 'Connected Banks', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>
    </svg>
  )},
]

export default function Sidebar({ activeTab, setActiveTab, businesses, selectedBusiness, onSelectBusiness, theme, setTheme }) {
  const [showAddBusiness, setShowAddBusiness] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showBusinessMenu, setShowBusinessMenu] = useState(false)

  const w = collapsed ? 'w-[74px]' : 'w-[238px]'

  return (
    <aside
      className={`${w} flex-shrink-0 flex flex-col transition-all duration-300 overflow-hidden`}
      style={{
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--border-soft)',
        height: '100vh',
        position: 'sticky',
        top: 0,
      }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-6 flex-shrink-0">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
          style={{ boxShadow: '0 0 16px rgba(34,211,238,.35)' }}
        >
          <img
            src="/luca_logo.png"
            alt="Luca"
            className="w-full h-full object-cover"
            onError={e => {
              e.target.style.display = 'none'
              e.target.parentNode.innerHTML = '<span style="color:#22D3EE;font-weight:700;font-size:15px;">L</span>'
            }}
          />
        </div>
        {!collapsed && (
          <div className="leading-tight">
            <p className="font-bold text-base" style={{ color: 'var(--text-0)', fontFamily: 'var(--font-display)' }}>
              Luca
            </p>
            <p className="text-xs" style={{ color: 'var(--text-2)' }}>by Ledger AI</p>
          </div>
        )}
      </div>

      {/* Business selector */}
      {!collapsed && businesses?.length > 0 && (
        <div className="px-3 mb-4 relative">
          <button
            onClick={() => setShowBusinessMenu(v => !v)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: 'rgba(34,211,238,0.08)',
              border: '1px solid rgba(34,211,238,0.18)',
              color: 'var(--text-0)'
            }}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
            <span className="flex-1 text-left truncate">{selectedBusiness?.name || 'Select Business'}</span>
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          {showBusinessMenu && (
            <div
              className="absolute left-3 right-3 top-full mt-1 rounded-xl z-50 overflow-hidden"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              {businesses.map(b => (
                <button
                  key={b.id}
                  onClick={() => { onSelectBusiness(b); setShowBusinessMenu(false) }}
                  className="w-full text-left px-4 py-2.5 text-sm transition-all"
                  style={{
                    color: selectedBusiness?.id === b.id ? '#22D3EE' : 'var(--text-1)',
                    background: selectedBusiness?.id === b.id ? 'rgba(34,211,238,0.08)' : 'transparent'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = selectedBusiness?.id === b.id ? 'rgba(34,211,238,0.08)' : 'transparent'}
                >
                  {b.name}
                </button>
              ))}
            <div style={{ height: '1px', background: 'var(--border-soft)', margin: '4px 0' }} />
                <button
                  onClick={() => {
                    setShowBusinessMenu(false)
                    setShowAddBusiness(true)
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm transition-all flex items-center gap-2"
                  style={{ color: 'var(--accent)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span>
                  Add Business
                </button>
            </div>
          )}
        </div>
      )}

      {/* Main nav */}
      <nav className="flex flex-col gap-0.5 px-3 flex-1 overflow-y-auto">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full text-left"
            style={{
              color: activeTab === item.id ? '#22D3EE' : 'var(--text-1)',
              background: activeTab === item.id ? 'rgba(34,211,238,0.1)' : 'transparent',
              justifyContent: collapsed ? 'center' : 'flex-start',
            }}
            onMouseEnter={e => { if (activeTab !== item.id) e.currentTarget.style.background = 'var(--hover)' }}
            onMouseLeave={e => { if (activeTab !== item.id) e.currentTarget.style.background = 'transparent' }}
            title={collapsed ? item.label : ''}
          >
            <span className="w-[18px] h-[18px] flex-shrink-0" style={{ color: activeTab === item.id ? '#22D3EE' : 'var(--text-1)' }}>
              {item.icon}
            </span>
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}

        {/* Divider */}
        <div className="my-3 h-px" style={{ background: 'var(--border-soft)' }} />

        {/* Ask Luca — special AI item */}
        <button
          onClick={() => setActiveTab('chat')}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all w-full text-left"
          style={{
            background: activeTab === 'chat'
              ? 'linear-gradient(100deg,rgba(34,211,238,0.18),rgba(167,139,250,0.18))'
              : 'linear-gradient(100deg,rgba(34,211,238,0.08),rgba(167,139,250,0.08))',
            border: '1px solid rgba(34,211,238,0.18)',
            color: 'var(--text-0)',
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}
          title={collapsed ? 'Ask Luca' : ''}
        >
          <span className="w-[18px] h-[18px] flex-shrink-0" style={{ color: '#22D3EE' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
          </span>
          {!collapsed && (
            <>
              <span>Ask Luca</span>
              <span
                className="ml-auto text-xs font-bold px-1.5 py-0.5 rounded-md"
                style={{
                  background: 'linear-gradient(100deg,#22D3EE,#A78BFA)',
                  color: '#04141a',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '8px',
                  letterSpacing: '0.04em'
                }}
              >
                AI
              </span>
            </>
          )}
        </button>

        <div className="my-3 h-px" style={{ background: 'var(--border-soft)' }} />

        {/* Connected Banks */}
        {BOTTOM_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full text-left"
            style={{
              color: activeTab === item.id ? '#22D3EE' : 'var(--text-1)',
              background: activeTab === item.id ? 'rgba(34,211,238,0.1)' : 'transparent',
              justifyContent: collapsed ? 'center' : 'flex-start',
            }}
            onMouseEnter={e => { if (activeTab !== item.id) e.currentTarget.style.background = 'var(--hover)' }}
            onMouseLeave={e => { if (activeTab !== item.id) e.currentTarget.style.background = 'transparent' }}
            title={collapsed ? item.label : ''}
          >
            <span className="w-[18px] h-[18px] flex-shrink-0">{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Bottom: User + Collapse */}
      <div className="px-3 pb-5 flex-shrink-0 flex flex-col gap-2 mt-2">

        {/* User profile */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(v => !v)}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-xl transition-all"
            style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
              style={{
                background: 'linear-gradient(155deg,#A78BFA,#22D3EE)',
                color: '#04141a',
                fontFamily: 'var(--font-display)'
              }}
            >
              A
            </div>
            {!collapsed && (
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-0)' }}>Astrid</p>
                <p className="text-xs truncate" style={{ color: 'var(--text-2)' }}>Luca Account</p>
              </div>
            )}
          </button>

          {showUserMenu && (
            <div
              className="absolute bottom-full left-0 right-0 mb-2 rounded-xl overflow-hidden z-50"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              {[
                { label: 'Settings', tab: 'settings' },
                { label: 'Subscription', tab: 'subscription' },
              ].map(item => (
                <button
                  key={item.tab}
                  onClick={() => { setActiveTab(item.tab); setShowUserMenu(false) }}
                  className="w-full text-left px-4 py-2.5 text-sm transition-all"
                  style={{ color: 'var(--text-1)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {item.label}
                </button>
              ))}
              <div style={{ height: '1px', background: 'var(--border-soft)' }} />
              <button
                className="w-full text-left px-4 py-2.5 text-sm transition-all"
                style={{ color: '#FB7185' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(v => !v)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
          style={{
            border: '1px solid var(--border-soft)',
            color: 'var(--text-2)',
            justifyContent: collapsed ? 'center' : 'flex-start'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <svg
            className="w-4 h-4 flex-shrink-0 transition-transform duration-300"
            style={{ transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)' }}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  )
}