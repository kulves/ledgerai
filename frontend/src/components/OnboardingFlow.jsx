/**
 * OnboardingFlow.jsx — First-Time User Onboarding
 * ==================================================
 * Purpose:
 *   Guides new users through Luca's 8-step onboarding sequence.
 *   Based on the locked Luca Onboarding Script (v1.0).
 *   Shows only on first launch — completion is stored in localStorage.
 *
 * Steps:
 *   1. Welcome — Luca introduces herself
 *   2. What Luca does (and doesn't do) — sets expectations
 *   3. Privacy commitment — local-first, no data sold
 *   4. Add first business — name, entity type, state
 *   5. How expenses work — category tour
 *   6. Mileage tracking — IRS rates explained
 *   7. User Agreement — must accept to continue
 *   8. Ready — go to dashboard
 *
 * Connections:
 *   - Called by: App.jsx (wraps entire app on first launch)
 *   - Uses: api.createBusiness() to set up first business in Step 4
 *   - On complete: sets localStorage 'luca_onboarded' = 'true'
 *                  calls onComplete() prop to show main app
 */

import { useState } from 'react'
import { api } from '../services/api'

// ── US states for the launch tier (Bible Section 10.21) ──────────────────────
const LAUNCH_STATES = [
  { code: 'CA', name: 'California' },
  { code: 'TX', name: 'Texas' },
  { code: 'FL', name: 'Florida' },
  { code: 'NY', name: 'New York' },
  { code: 'IL', name: 'Illinois' },
  { code: 'GA', name: 'Georgia' },
  { code: 'WA', name: 'Washington' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'NV', name: 'Nevada' },
  { code: 'CO', name: 'Colorado' },
  { code: 'OTHER', name: 'Other state' },
]

const ENTITY_TYPES = [
  { value: 'sole_prop',   label: 'Sole Proprietor',  desc: 'You operate as an individual' },
  { value: 'llc',         label: 'LLC',               desc: 'Single or multi-member LLC' },
  { value: 's_corp',      label: 'S-Corporation',     desc: 'Pass-through corporation' },
  { value: 'partnership', label: 'Partnership',        desc: 'Two or more partners' },
]

export default function OnboardingFlow({ onComplete }) {
  const [step, setStep]             = useState(1)
  const [bizName, setBizName]       = useState('')
  const [bizEntity, setBizEntity]   = useState('sole_prop')
  const [bizState, setBizState]     = useState('CA')
  const [agreed, setAgreed]         = useState(false)
  const [creating, setCreating]     = useState(false)
  const [error, setError]           = useState('')

  const TOTAL_STEPS = 8

  const next = () => {
    setError('')
    setStep(s => s + 1)
  }

  const handleCreateBusiness = async () => {
    if (!bizName.trim()) {
      setError('Please enter your business name.')
      return
    }
    setCreating(true)
    setError('')
    const state = bizState === 'OTHER' ? 'CA' : bizState
    const result = await api.createBusiness(bizName.trim(), bizEntity, state)
    setCreating(false)
    if (result) {
      next()
    } else {
      setError('Could not create your business. Please try again.')
    }
  }

  const handleComplete = () => {
    localStorage.setItem('luca_onboarded', 'true')
    onComplete()
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col">

      {/* ── Header ── */}
      <header className="bg-[#0C2340] px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-white text-xl font-bold tracking-tight">Luca</h1>
          <p className="text-[#C9962C] text-xs font-medium">by Ledger AI</p>
        </div>
        {/* Progress indicator */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i + 1 < step  ? 'bg-[#C9962C] w-4' :
                i + 1 === step ? 'bg-white w-6' :
                                  'bg-white/30 w-4'
              }`}
            />
          ))}
        </div>
      </header>

      {/* ── Step content ── */}
      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="max-w-md w-full">

          {/* STEP 1 — Welcome */}
          {step === 1 && (
            <Step
              icon="L"
              title="Hi, I'm Luca."
              onNext={next}
              nextLabel="Nice to meet you, Luca →"
            >
              <p className="text-gray-600 text-sm leading-relaxed">
                I'm your personal AI bookkeeping and tax assistant, made by Ledger AI.
              </p>
              <p className="text-gray-600 text-sm leading-relaxed mt-3">
                I live entirely on your computer. I help you track expenses,
                log mileage, organize receipts, and prepare your records for
                tax time — all without sending your financial data anywhere.
              </p>
              <p className="text-gray-600 text-sm leading-relaxed mt-3">
                Let me take two minutes to show you how I work.
              </p>
            </Step>
          )}

          {/* STEP 2 — What Luca does and doesn't do */}
          {step === 2 && (
            <Step
              icon="📋"
              title="Here's what I can do for you."
              onNext={next}
              nextLabel="Got it →"
            >
              <div className="flex flex-col gap-3">
                {[
                  { can: true,  text: 'Log and categorize business expenses' },
                  { can: true,  text: 'Track mileage and calculate IRS deductions' },
                  { can: true,  text: 'Read receipts and extract financial data' },
                  { can: true,  text: 'Answer tax education questions from verified IRS sources' },
                  { can: true,  text: 'Generate reports and summaries for your CPA' },
                  { can: false, text: 'File your taxes — I\'m an organizer, not a tax preparer' },
                  { can: false, text: 'Give you legal or financial advice' },
                  { can: false, text: 'Replace your CPA or tax professional' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className={`text-sm font-bold flex-shrink-0 mt-0.5 ${item.can ? 'text-emerald-500' : 'text-rose-400'}`}>
                      {item.can ? '✓' : '✗'}
                    </span>
                    <span className={`text-sm ${item.can ? 'text-gray-700' : 'text-gray-400'}`}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <p className="text-xs text-amber-800 italic">
                  "Ledger AI organizes your financial data and flags potential tax
                  opportunities. It does not file taxes, provide financial, or legal advice.
                  Always consult a licensed CPA, CFP, or tax advisor before making
                  tax or financial decisions."
                </p>
              </div>
            </Step>
          )}

          {/* STEP 3 — Privacy */}
          {step === 3 && (
            <Step
              icon="🔒"
              title="Your data stays on your computer."
              onNext={next}
              nextLabel="I appreciate that →"
            >
              <div className="flex flex-col gap-4">
                {[
                  { icon: '💻', title: 'Runs locally', desc: 'Luca runs on your machine. Your financial data is stored on your hard drive, not on any cloud server.' },
                  { icon: '🚫', title: 'No data selling', desc: 'Ledger AI will never sell, share, or monetize your financial information. Ever.' },
                  { icon: '🤖', title: 'AI stays local', desc: 'The AI models run on your computer. Your questions and documents never leave your machine.' },
                  { icon: '📤', title: 'You control exports', desc: 'Your data leaves your machine only when you explicitly export a report or backup — your choice, your timing.' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-xl flex-shrink-0">{item.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-[#0C2340]">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Step>
          )}

          {/* STEP 4 — Create first business */}
          {step === 4 && (
            <Step
              icon="🏢"
              title="Tell me about your business."
              onNext={handleCreateBusiness}
              nextLabel={creating ? 'Setting up...' : 'Create My Business →'}
              nextDisabled={!bizName.trim() || creating}
              error={error}
            >
              <p className="text-gray-500 text-sm mb-4">
                I'll use this to apply the right tax rules and keep your
                records organized. You can add more businesses later.
              </p>

              {/* Business name */}
              <div className="flex flex-col gap-1 mb-4">
                <label className="text-xs font-semibold text-gray-600">
                  Business Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Astrid Creative LLC, Main Street Consulting"
                  value={bizName}
                  onChange={e => setBizName(e.target.value)}
                  className="border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9962C]"
                  autoFocus
                />
              </div>

              {/* Entity type */}
              <div className="flex flex-col gap-1 mb-4">
                <label className="text-xs font-semibold text-gray-600">
                  Entity Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ENTITY_TYPES.map(et => (
                    <button
                      key={et.value}
                      onClick={() => setBizEntity(et.value)}
                      className={`text-left px-3 py-2 rounded-xl border text-xs transition-all ${
                        bizEntity === et.value
                          ? 'border-[#0C2340] bg-[#0C2340] text-white'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      <p className="font-semibold">{et.label}</p>
                      <p className={`text-xs mt-0.5 ${bizEntity === et.value ? 'text-white/60' : 'text-gray-400'}`}>
                        {et.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* State */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">
                  State of Registration
                </label>
                <select
                  value={bizState}
                  onChange={e => setBizState(e.target.value)}
                  className="border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9962C] bg-white"
                >
                  {LAUNCH_STATES.map(s => (
                    <option key={s.code} value={s.code}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Luca applies your state's specific tax rules automatically.
                </p>
              </div>
            </Step>
          )}

          {/* STEP 5 — How expenses work */}
          {step === 5 && (
            <Step
              icon="💰"
              title="Logging expenses is easy."
              onNext={next}
              nextLabel="Makes sense →"
            >
              <p className="text-gray-500 text-sm mb-4">
                When you log an expense, just tell me the vendor, amount,
                and what it was for. I'll handle the rest.
              </p>
              <div className="flex flex-col gap-3">
                {[
                  { icon: '🤖', title: 'Auto-categorization', desc: 'I categorize your expense into the correct IRS category automatically. You can always override.' },
                  { icon: '📸', title: 'Receipt scanning', desc: 'Upload a photo of any receipt. I\'ll extract the vendor, amount, and date for you.' },
                  { icon: '🏷', title: 'IRS categories', desc: 'I use standard IRS categories so your reports are CPA-ready: Office Supplies, Professional Services, Meals & Entertainment, and more.' },
                  { icon: '⚠', title: 'Review flags', desc: 'If I\'m not confident about a categorization, I flag it for your review instead of guessing.' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3">
                    <span className="text-lg flex-shrink-0">{item.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-[#0C2340]">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Step>
          )}

          {/* STEP 6 — Mileage */}
          {step === 6 && (
            <Step
              icon="🚗"
              title="I track mileage automatically."
              onNext={next}
              nextLabel="Good to know →"
            >
              <p className="text-gray-500 text-sm mb-4">
                Business mileage is one of the most commonly missed deductions
                for small business owners. I make it simple.
              </p>
              <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  2026 IRS Standard Mileage Rates
                </p>
                {[
                  { type: 'Business',    rate: '72.5¢', color: 'text-[#0C2340]' },
                  { type: 'Medical',     rate: '20.5¢', color: 'text-rose-500' },
                  { type: 'Charitable',  rate: '14.0¢', color: 'text-purple-500' },
                ].map(r => (
                  <div key={r.type} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <span className="text-sm text-gray-700">{r.type}</span>
                    <span className={`text-sm font-bold ${r.color}`}>{r.rate} per mile</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 text-center">
                Just log your miles and business purpose. I calculate the
                deduction automatically using verified IRS rates.
              </p>
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <p className="text-xs text-amber-800">
                  The IRS requires you to record the business purpose of each trip.
                  Luca reminds you to add this with every mileage entry.
                </p>
              </div>
            </Step>
          )}

          {/* STEP 7 — User Agreement */}
          {step === 7 && (
            <Step
              icon="📄"
              title="One last thing."
              onNext={agreed ? next : undefined}
              nextLabel="I Agree & Continue →"
              nextDisabled={!agreed}
            >
              <p className="text-gray-500 text-sm mb-4">
                Before we get started, please review and accept the
                Ledger AI User Agreement.
              </p>
              <div className="bg-white border border-gray-200 rounded-2xl p-4 text-xs text-gray-600 leading-relaxed max-h-48 overflow-y-auto mb-4">
                <p className="font-semibold text-[#0C2340] mb-2">Ledger AI User Agreement — Summary</p>
                <p className="mb-2">
                  <strong>Organizational tool only.</strong> Ledger AI and Luca are bookkeeping
                  organization tools. They do not provide tax, financial, legal, or accounting
                  advice. Always consult a licensed professional before making financial decisions.
                </p>
                <p className="mb-2">
                  <strong>Your data belongs to you.</strong> Ledger AI will never sell, share,
                  or transmit your financial data to third parties. All data is stored locally
                  on your device.
                </p>
                <p className="mb-2">
                  <strong>AI limitations.</strong> Luca uses AI models that may produce
                  inaccurate information. Always verify important information with a qualified
                  professional. Ledger AI is not liable for decisions made based on Luca's output.
                </p>
                <p className="mb-2">
                  <strong>No warranty.</strong> This software is provided as-is. Ledger AI
                  makes no guarantees about accuracy, completeness, or fitness for any
                  particular purpose.
                </p>
                <p>
                  <strong>Governing law.</strong> This agreement is governed by the laws of
                  the United States. By using Ledger AI, you agree to these terms.
                </p>
              </div>
              <button
                onClick={() => setAgreed(!agreed)}
                className="flex items-start gap-3 w-full text-left"
              >
                <div className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                  agreed
                    ? 'bg-[#0C2340] border-[#0C2340]'
                    : 'border-gray-300 bg-white hover:border-[#C9962C]'
                }`}>
                  {agreed && <span className="text-white text-xs font-bold">✓</span>}
                </div>
                <span className="text-sm text-gray-700">
                  I have read and agree to the Ledger AI User Agreement.
                  I understand that Luca is an organizational tool and not
                  a licensed tax or financial advisor.
                </span>
              </button>
            </Step>
          )}

          {/* STEP 8 — Ready */}
          {step === 8 && (
            <div className="text-center flex flex-col items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-[#0C2340] flex items-center justify-center text-[#C9962C] text-4xl font-bold animate-pulse">
                L
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#0C2340] mb-2">
                  You're all set!
                </h2>
                <p className="text-gray-500 text-sm max-w-sm mx-auto leading-relaxed">
                  Your business is set up and Luca is ready to help.
                  Start by logging your first expense, or ask me a
                  tax question — I'm here whenever you need me.
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full max-w-xs">
                <button
                  onClick={handleComplete}
                  className="w-full bg-[#C9962C] hover:bg-[#B88A24] text-white py-4 rounded-xl font-bold text-base transition-all active:scale-95 shadow-lg"
                >
                  Go to My Dashboard →
                </button>
                <p className="text-xs text-gray-400 text-center">
                  You can always access settings and help from the menu.
                </p>
              </div>
            </div>
          )}

        </div>
      </main>

    </div>
  )
}

// ── Reusable step wrapper ──────────────────────────────────────────────────────
function Step({ icon, title, children, onNext, nextLabel, nextDisabled, error }) {
  return (
    <div className="flex flex-col gap-5">
      {/* Icon + title */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#0C2340] flex items-center justify-center flex-shrink-0 text-[#C9962C] font-bold text-xl">
          {icon}
        </div>
        <h2 className="text-xl font-bold text-[#0C2340] leading-tight">{title}</h2>
      </div>

      {/* Content */}
      <div>{children}</div>

      {/* Error */}
      {error && (
        <p className="text-rose-600 text-sm bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      {/* Next button */}
      {onNext && (
        <button
          onClick={onNext}
          disabled={nextDisabled}
          className="w-full bg-[#0C2340] hover:bg-[#0a1d38] disabled:opacity-40 text-white py-3.5 rounded-xl font-semibold text-sm transition-all active:scale-95"
        >
          {nextLabel || 'Continue →'}
        </button>
      )}
    </div>
  )
}