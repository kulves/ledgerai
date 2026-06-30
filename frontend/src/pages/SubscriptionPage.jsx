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

import { useState, useEffect } from 'react'
import { api } from '../services/api'

const TIER_FEATURES = {
  free: [
    '25 transactions/month',
    '5 receipt OCR uploads/month',
    '1 business',
    'Full Luca AI assistant',
    'Quarterly watermarked PDF reports',
  ],
  growth: [
    'Unlimited transactions',
    'Unlimited OCR uploads',
    'Up to 2 businesses',
    'Full Luca AI assistant',
    'Clean, unwatermarked reports',
    'Bank & brokerage connection (Phase 2)',
  ],
  professional: [
    'Everything in Growth',
    'Up to 5 businesses, multi-state',
    'Depreciation scheduler',
    'Quarterly tax worksheet',
    'Accountant-share PDF',
    'QBI deduction flagging',
  ],
}

export default function SubscriptionPage({ backendStatus }) {
  const [status, setStatus]         = useState(null)
  const [loading, setLoading]       = useState(true)
  const [licenseKey, setLicenseKey] = useState('')
  const [activating, setActivating] = useState(false)
  const [message, setMessage]       = useState('')
  const [messageType, setMessageType] = useState('success')
  const [checkingOut, setCheckingOut] = useState(null)

  useEffect(() => { loadStatus() }, [])

  const loadStatus = async () => {
    setLoading(true)
    const data = await api.getLicenseStatus()
    setStatus(data)
    setLoading(false)
  }

  const showMessage = (text, type = 'success') => {
    setMessage(text)
    setMessageType(type)
    setTimeout(() => setMessage(''), 5000)
  }

  const handleActivate = async () => {
    if (!licenseKey.trim()) return
    setActivating(true)
    const result = await api.activateLicense(licenseKey.trim())
    setActivating(false)
    if (result.success) {
      showMessage(result.message, 'success')
      setLicenseKey('')
      loadStatus()
    } else {
      showMessage(result.message || 'Could not activate license key.', 'error')
    }
  }

  const handleCheckout = async (tier) => {
    setCheckingOut(tier)
    const result = await api.createCheckout(tier)
    setCheckingOut(null)
    if (result.success && result.checkout_url) {
      window.open(result.checkout_url, '_blank')
    } else {
      showMessage(result.message || 'Checkout is not available yet.', 'error')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400 text-sm">Loading subscription status...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="max-w-2xl w-full mx-auto px-4 py-6 flex flex-col gap-6">

        {message && (
          <div className={`rounded-xl px-4 py-3 text-sm font-medium border ${
            messageType === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}>
            {message}
          </div>
        )}

        {/* ── Current tier card ── */}
        <div className="bg-[#0C2340] rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#C9962C] text-xs font-semibold uppercase tracking-wide">
                Current Plan
              </p>
              <p className="text-3xl font-bold text-white mt-1">
                {status?.tier_label || 'Free'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-[#C9962C] text-xl font-bold">
              L
            </div>
          </div>

          {/* Usage bars — only meaningful on Free tier */}
          {status?.tier === 'free' && (
            <div className="mt-5 flex flex-col gap-3">
              <UsageBar
                label="Transactions this month"
                used={status.monthly_tx_used}
                limit={status.monthly_tx_limit}
                atLimit={status.is_at_tx_limit}
              />
              <UsageBar
                label="OCR uploads this month"
                used={status.monthly_ocr_used}
                limit={status.monthly_ocr_limit}
                atLimit={status.is_at_ocr_limit}
              />
              <UsageBar
                label="Businesses"
                used={status.businesses_used}
                limit={status.max_businesses}
                atLimit={status.is_at_business_limit}
              />
            </div>
          )}

          {status?.tier !== 'free' && (
            <p className="text-white/60 text-sm mt-3">
              Unlimited transactions and OCR uploads · {status?.businesses_used}/{status?.max_businesses} businesses used
            </p>
          )}
        </div>

        {/* ── At-limit warning ── */}
        {status?.is_at_tx_limit && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <p className="text-sm text-amber-800 font-medium">
              You've reached your monthly transaction limit.
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              Upgrade below for unlimited transactions, or wait until next month.
            </p>
          </div>
        )}

        {/* ── Upgrade tiers ── */}
        {status?.tier === 'free' && (
          <div className="grid grid-cols-2 gap-4">
            <TierCard
              tier="growth"
              label="Growth"
              price="$19.99"
              period="/month"
              features={TIER_FEATURES.growth}
              onUpgrade={() => handleCheckout('growth')}
              loading={checkingOut === 'growth'}
            />
            <TierCard
              tier="professional"
              label="Professional"
              price="$49.99"
              period="/month"
              features={TIER_FEATURES.professional}
              highlight
              onUpgrade={() => handleCheckout('professional')}
              loading={checkingOut === 'professional'}
            />
          </div>
        )}

        {/* ── License key activation ── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h3 className="font-semibold text-[#0C2340] text-sm mb-1">
            Have a License Key?
          </h3>
          <p className="text-xs text-gray-400 mb-3">
            If you purchased a license separately or received a key, activate it here.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="LEDGERAI-GROWTH-XXXXXXXX"
              value={licenseKey}
              onChange={e => setLicenseKey(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#C9962C]"
            />
            <button
              onClick={handleActivate}
              disabled={activating || !licenseKey.trim() || backendStatus === 'disconnected'}
              className="bg-[#0C2340] hover:bg-[#0a1d38] disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            >
              {activating ? 'Activating...' : 'Activate'}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400">
          No auto-renewal without your explicit, signed consent.
          Cancel anytime — your data is always yours.
        </p>

      </div>
    </div>
  )
}

// ── Usage bar component ────────────────────────────────────────────────────────
function UsageBar({ label, used, limit, atLimit }) {
  const pct = limit ? Math.min(100, (used / limit) * 100) : 0
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-white/60">{label}</span>
        <span className={`text-xs font-medium ${atLimit ? 'text-rose-300' : 'text-white/80'}`}>
          {used}{limit ? `/${limit}` : ''}
        </span>
      </div>
      <div className="bg-white/10 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all ${atLimit ? 'bg-rose-400' : 'bg-[#C9962C]'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ── Tier upgrade card ──────────────────────────────────────────────────────────
function TierCard({ label, price, period, features, highlight, onUpgrade, loading }) {
  return (
    <div className={`rounded-2xl p-5 border-2 flex flex-col gap-3 ${
      highlight ? 'border-[#C9962C] bg-white' : 'border-gray-200 bg-white'
    }`}>
      {highlight && (
        <span className="text-xs font-bold text-[#C9962C] uppercase tracking-wide">
          Most Popular
        </span>
      )}
      <div>
        <p className="font-bold text-[#0C2340] text-lg">{label}</p>
        <p className="text-2xl font-bold text-[#0C2340] mt-1">
          {price}<span className="text-xs font-normal text-gray-400">{period}</span>
        </p>
      </div>
      <ul className="flex flex-col gap-1.5 flex-1">
        {features.map((f, i) => (
          <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
            <span className="text-emerald-500 flex-shrink-0">✓</span>
            {f}
          </li>
        ))}
      </ul>
      <button
        onClick={onUpgrade}
        disabled={loading}
        className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all ${
          highlight
            ? 'bg-[#C9962C] hover:bg-[#B88A24] text-white'
            : 'bg-[#0C2340] hover:bg-[#0a1d38] text-white'
        }`}
      >
        {loading ? 'Loading...' : 'Upgrade'}
      </button>
    </div>
  )
}