/**
 * SubscriptionPage.jsx — Tier Status & Upgrade
 * ===============================================
 * Purpose:
 *   Shows the user's current subscription tier, real-time usage
 *   against Free tier limits, and upgrade options to Growth/Professional.
 *   Also supports license key activation for manual/testing activation.
 *
 * Module 17 — what this adds:
 *   - Current tier badge with usage bars (transactions, OCR)
 *   - Upgrade cards for Growth and Professional
 *   - License key activation field
 *   - Stripe checkout trigger (when configured)
 */
/**
 * SubscriptionPage.jsx — Tier Status & Upgrade (Dark theme redesign)
 */
import { useState, useEffect } from 'react'
import { api } from '../services/api'

const TIERS = {
  free: {
    name: 'Free', price: '$0', color: '#94A3B8',
    features: [
      '25 transactions/month',
      '5 receipt OCR uploads/month',
      '1 business',
      'Full Luca AI assistant',
      'Watermarked PDF reports',
    ]
  },
  growth: {
    name: 'Growth', price: '$19.99/mo', color: '#22D3EE',
    features: [
      'Unlimited transactions',
      'Unlimited OCR uploads',
      'Up to 2 businesses',
      'Full Luca AI assistant',
      'Clean unwatermarked reports',
      'Bank connection (Phase 2)',
    ]
  },
  professional: {
    name: 'Professional', price: '$49.99/mo', color: '#C9962C',
    features: [
      'Everything in Growth',
      'Up to 5 businesses, multi-state',
      'Depreciation scheduler',
      'Quarterly tax worksheet',
      'Accountant-share PDF',
      'QBI deduction flagging',
    ]
  },
}

function UsageBar({ label, used, limit, color }) {
  const pct = limit ? Math.min((used / limit) * 100, 100) : 0
  const near = pct >= 80
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-xs">
        <span style={{ color: 'var(--text-1)' }}>{label}</span>
        <span style={{ color: near ? '#FBBF24' : 'var(--text-2)' }}>
          {used} / {limit === 999999 ? '∞' : limit}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
        <div className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: near ? '#FBBF24' : color }} />
      </div>
    </div>
  )
}

export default function SubscriptionPage({ backendStatus }) {
  const [status, setStatus]     = useState(null)
  const [loading, setLoading]   = useState(true)
  const [licenseKey, setLicenseKey] = useState('')
  const [activating, setActivating] = useState(false)
  const [message, setMessage]   = useState({ text: '', type: 'success' })
  const [checkingOut, setCheckingOut] = useState(null)

  useEffect(() => { loadStatus() }, [])

  const loadStatus = async () => {
    setLoading(true)
    const data = await api.getLicenseStatus()
    setStatus(data)
    setLoading(false)
  }

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type })
    setTimeout(() => setMessage({ text: '', type: 'success' }), 5000)
  }

  const handleActivate = async () => {
    if (!licenseKey.trim()) return
    setActivating(true)
    const result = await api.activateLicense(licenseKey.trim())
    setActivating(false)
    if (result?.success) {
      showMsg('License activated successfully!')
      setLicenseKey('')
      loadStatus()
    } else {
      showMsg(result?.message || 'Invalid license key.', 'error')
    }
  }

  const handleCheckout = async (tier) => {
    setCheckingOut(tier)
    const result = await api.createCheckoutSession(tier)
    setCheckingOut(null)
    if (result?.url) window.open(result.url, '_blank')
    else showMsg('Stripe not configured yet — coming soon!', 'error')
  }

  const currentTier = status?.tier || 'free'
  const tierInfo = TIERS[currentTier] || TIERS.free

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6" style={{ minHeight: '100%', maxWidth: '800px' }}>

      {/* Flash message */}
      {message.text && (
        <div className="rounded-xl px-4 py-3 text-sm font-medium"
          style={{
            background: message.type === 'error' ? 'rgba(251,113,133,0.1)' : 'rgba(52,211,153,0.1)',
            border: `1px solid ${message.type === 'error' ? 'rgba(251,113,133,0.3)' : 'rgba(52,211,153,0.3)'}`,
            color: message.type === 'error' ? '#FB7185' : '#34D399',
          }}>
          {message.text}
        </div>
      )}

      {/* Current plan */}
      <div className="rounded-2xl p-6"
        style={{ background: 'var(--card)', border: `1px solid ${tierInfo.color}33` }}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-2)' }}>CURRENT PLAN</p>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold" style={{ color: tierInfo.color }}>
                {tierInfo.name}
              </h2>
              <span className="text-sm px-2.5 py-1 rounded-full font-semibold"
                style={{ background: tierInfo.color + '18', color: tierInfo.color }}>
                {tierInfo.price}
              </span>
            </div>
            {status?.expires_at && (
              <p className="text-xs mt-2" style={{ color: 'var(--text-2)' }}>
                Expires: {new Date(status.expires_at).toLocaleDateString()}
              </p>
            )}
          </div>
          {currentTier === 'free' && (
            <span className="text-xs px-3 py-1.5 rounded-full font-semibold"
              style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)', color: '#22D3EE' }}>
              Upgrade Available
            </span>
          )}
        </div>

        {/* Usage bars */}
        {currentTier === 'free' && status?.usage && (
          <div className="flex flex-col gap-3 mt-5 pt-5" style={{ borderTop: '1px solid var(--border-soft)' }}>
            <p className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>THIS MONTH'S USAGE</p>
            <UsageBar
              label="Transactions"
              used={status.usage.transactions || 0}
              limit={25}
              color="#22D3EE"
            />
            <UsageBar
              label="OCR Uploads"
              used={status.usage.ocr_uploads || 0}
              limit={5}
              color="#A78BFA"
            />
          </div>
        )}
      </div>

      {/* Upgrade cards */}
      {currentTier === 'free' && (
        <div className="grid grid-cols-2 gap-4">
          {['growth', 'professional'].map(tier => {
            const t = TIERS[tier]
            return (
              <div key={tier} className="rounded-2xl p-5 flex flex-col gap-4"
                style={{
                  background: 'var(--card)',
                  border: `1px solid ${t.color}33`,
                }}>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-base" style={{ color: t.color }}>{t.name}</h3>
                    {tier === 'growth' && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: 'rgba(34,211,238,0.1)', color: '#22D3EE' }}>
                        Popular
                      </span>
                    )}
                  </div>
                  <p className="text-xl font-bold" style={{ color: 'var(--text-0)' }}>{t.price}</p>
                </div>

                <div className="flex flex-col gap-2 flex-1">
                  {t.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: t.color + '22', color: t.color, fontSize: '10px' }}>✓</span>
                      <span className="text-xs" style={{ color: 'var(--text-1)' }}>{f}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleCheckout(tier)}
                  disabled={checkingOut === tier}
                  className="w-full py-2.5 rounded-xl text-sm font-bold transition-all"
                  style={{
                    background: t.color,
                    color: '#04141a',
                    opacity: checkingOut === tier ? 0.7 : 1,
                  }}>
                  {checkingOut === tier ? 'Loading...' : `Upgrade to ${t.name}`}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* License key activation */}
      <div className="rounded-2xl p-5"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-0)' }}>
          Activate License Key
        </h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={licenseKey}
            onChange={e => setLicenseKey(e.target.value)}
            placeholder="LEDGERAI-GROWTH-XXXXXXXX"
            className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
            style={{
              background: 'var(--card-2)', border: '1px solid var(--border)',
              color: 'var(--text-0)', fontFamily: 'var(--font-mono)',
            }}
            onKeyDown={e => e.key === 'Enter' && handleActivate()}
          />
          <button
            onClick={handleActivate}
            disabled={activating || !licenseKey.trim()}
            className="px-5 py-2 rounded-xl text-sm font-bold transition-all"
            style={{
              background: 'var(--accent)', color: '#04141a',
              opacity: activating || !licenseKey.trim() ? 0.5 : 1,
            }}>
            {activating ? 'Activating...' : 'Activate'}
          </button>
        </div>
        <p className="text-xs mt-2" style={{ color: 'var(--text-2)' }}>
          Have a license key from your Ledger AI purchase? Enter it here.
        </p>
      </div>

      {/* Privacy note */}
      <div className="text-center">
        <p className="text-xs" style={{ color: 'var(--text-2)' }}>
          🔒 Luca is local-first — your financial data never leaves your device.
          Payments are processed securely by Stripe.
        </p>
      </div>

    </div>
  )
}