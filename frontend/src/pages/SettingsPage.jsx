/**
 * SettingsPage.jsx — App Settings & Data Management
 * ===================================================
 * Purpose:
 *   Manage businesses, view app info, and handle data management.
 *   Three sections:
 *   1. App Info — version, AI model, database location
 *   2. Business Management — edit/deactivate businesses
 *   3. Data Management — stats, reset onboarding, clear data
 *
 * Module 16 — what this adds:
 *   - App version and AI model display
 *   - Business editor (rename, change entity type/state)
 *   - Database statistics
 *   - Reset onboarding (for testing or new device setup)
 *   - Clear all data (with strong confirmation requirement)
 */

import { useState, useEffect } from 'react'
import { api } from '../services/api'

const ENTITY_TYPES = [
  { value: 'sole_prop',   label: 'Sole Proprietor' },
  { value: 'llc',         label: 'LLC' },
  { value: 's_corp',      label: 'S-Corporation' },
  { value: 'partnership', label: 'Partnership' },
]

const STATES = [
  'CA','TX','FL','NY','IL','GA','WA','AZ','NV','CO','OTHER'
]

export default function SettingsPage({ backendStatus, onResetOnboarding }) {
  const [appInfo, setAppInfo]         = useState(null)
  const [stats, setStats]             = useState(null)
  const [businesses, setBusinesses]   = useState([])
  const [editingBiz, setEditingBiz]   = useState(null)
  const [editForm, setEditForm]       = useState({})
  const [saving, setSaving]           = useState(false)
  const [clearInput, setClearInput]   = useState('')
  const [clearing, setClearing]       = useState(false)
  const [clearDone, setClearDone]     = useState(false)
  const [showClear, setShowClear]     = useState(false)
  const [message, setMessage]         = useState('')

  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    const [info, statsData, bizList] = await Promise.all([
      api.getAppInfo(),
      api.getStats(),
      api.getBusinesses(),
    ])
    setAppInfo(info)
    setStats(statsData)
    setBusinesses(bizList || [])
  }

  const startEdit = (biz) => {
    setEditingBiz(biz.id)
    setEditForm({ name: biz.name, entity_type: biz.entity_type, state: biz.state })
  }

  const handleSave = async () => {
    if (!editForm.name?.trim()) return
    setSaving(true)
    const result = await api.updateBusiness(editingBiz, editForm)
    setSaving(false)
    if (result) {
      setBusinesses(prev => prev.map(b => b.id === editingBiz ? result : b))
      setEditingBiz(null)
      showMsg('Business updated successfully.')
    }
  }

  const handleDeactivate = async (bizId, bizName) => {
    if (!window.confirm(`Deactivate "${bizName}"? All data is preserved but the business will be hidden. You can reactivate it later.`)) return
    const result = await api.deactivateBusiness(bizId)
    if (result?.success) {
      setBusinesses(prev => prev.filter(b => b.id !== bizId))
      showMsg('Business deactivated. All data preserved.')
    }
  }

  const handleClearData = async () => {
    if (clearInput !== 'DELETE ALL MY DATA') {
      showMsg('Please type the exact confirmation phrase.', true)
      return
    }
    setClearing(true)
    const result = await api.clearAllData(clearInput)
    setClearing(false)
    if (result?.success) {
      setClearDone(true)
      setClearInput('')
      localStorage.removeItem('luca_onboarded')
      showMsg('All data cleared. Restarting onboarding...')
      setTimeout(() => {
        onResetOnboarding()
      }, 2000)
    }
  }

  const showMsg = (text, isError = false) => {
    setMessage(text)
    setTimeout(() => setMessage(''), 4000)
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="max-w-2xl w-full mx-auto px-4 py-6 flex flex-col gap-8">

        {/* Flash message */}
        {message && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-800 font-medium">
            {message}
          </div>
        )}

        {/* ── Section 1: App Info ── */}
        <Section title="About Luca">
          {appInfo ? (
            <div className="flex flex-col gap-3">
              <InfoRow label="Application" value={appInfo.app_name} />
              <InfoRow label="Version"     value={appInfo.app_version} />
              <InfoRow label="AI Model"    value={appInfo.ai_model} />
              <InfoRow label="Ollama URL"  value={appInfo.ollama_url} />
              <InfoRow label="Database"    value={appInfo.database_path} mono />
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Loading...</p>
          )}

          {/* Quick stats */}
          {appInfo?.stats && (
            <div className="grid grid-cols-4 gap-3 mt-4">
              {[
                { label: 'Businesses', value: appInfo.stats.businesses },
                { label: 'Expenses',   value: appInfo.stats.expenses   },
                { label: 'Trips',      value: appInfo.stats.mileage    },
                { label: 'Documents',  value: appInfo.stats.documents  },
              ].map(s => (
                <div key={s.label} className="bg-[#F5F4F0] rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-[#0C2340]">{s.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ── Section 2: Businesses ── */}
        <Section title="Businesses">
          {businesses.length === 0 && (
            <p className="text-gray-400 text-sm">No active businesses.</p>
          )}
          {businesses.map(biz => (
            <div key={biz.id} className="border border-gray-200 rounded-xl overflow-hidden mb-3">

              {/* Business header */}
              <div className="px-4 py-3 flex items-center justify-between bg-white">
                <div>
                  <p className="font-semibold text-[#0C2340] text-sm">{biz.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {biz.entity_type.replace('_', ' ')} · {biz.state}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => editingBiz === biz.id ? setEditingBiz(null) : startEdit(biz)}
                    className="text-xs text-[#C9962C] hover:text-[#B88A24] font-medium"
                  >
                    {editingBiz === biz.id ? 'Cancel' : 'Edit'}
                  </button>
                  <button
                    onClick={() => handleDeactivate(biz.id, biz.name)}
                    className="text-xs text-gray-400 hover:text-rose-500 font-medium"
                  >
                    Deactivate
                  </button>
                </div>
              </div>

              {/* Edit form */}
              {editingBiz === biz.id && (
                <div className="px-4 py-4 bg-[#FAFAF8] border-t border-gray-200 flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500">Business Name</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9962C]"
                    />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex flex-col gap-1 flex-1">
                      <label className="text-xs font-medium text-gray-500">Entity Type</label>
                      <select
                        value={editForm.entity_type}
                        onChange={e => setEditForm(p => ({ ...p, entity_type: e.target.value }))}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9962C] bg-white"
                      >
                        {ENTITY_TYPES.map(et => (
                          <option key={et.value} value={et.value}>{et.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1 flex-1">
                      <label className="text-xs font-medium text-gray-500">State</label>
                      <select
                        value={editForm.state}
                        onChange={e => setEditForm(p => ({ ...p, state: e.target.value }))}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9962C] bg-white"
                      >
                        {STATES.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={saving || !editForm.name?.trim()}
                    className="bg-[#0C2340] hover:bg-[#0a1d38] disabled:opacity-40 text-white py-2 rounded-lg text-sm font-semibold transition-all"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </Section>

        {/* ── Section 3: Data Stats ── */}
        {stats && stats.by_category.length > 0 && (
          <Section title="Data Overview">
            <p className="text-xs text-gray-400 mb-3">
              Total logged: ${(stats.totals.total_logged || 0).toFixed(2)} across {stats.totals.expenses} expenses
            </p>
            <div className="flex flex-col gap-1">
              {stats.by_category.slice(0, 5).map(cat => (
                <div key={cat.category} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 w-40 truncate">{cat.category}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-[#C9962C] h-1.5 rounded-full"
                      style={{
                        width: `${Math.min(100, (cat.total / stats.totals.total_logged) * 100)}%`
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-700 w-16 text-right">
                    ${(cat.total || 0).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── Section 4: Data Management ── */}
        <Section title="Data Management">
          {/* Reset onboarding */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-700">Reset Onboarding</p>
              <p className="text-xs text-gray-400 mt-0.5">
                See the welcome flow again — useful for testing or a new device setup.
              </p>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('luca_onboarded')
                onResetOnboarding()
              }}
              className="text-xs text-[#C9962C] hover:text-[#B88A24] font-medium flex-shrink-0 ml-4"
            >
              Reset
            </button>
          </div>

          {/* Clear all data */}
          <div className="py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-rose-600">Clear All Data</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Permanently delete all expenses, mileage, and documents.
                  This cannot be undone.
                </p>
              </div>
              <button
                onClick={() => setShowClear(!showClear)}
                className="text-xs text-rose-500 hover:text-rose-700 font-medium flex-shrink-0 ml-4"
              >
                {showClear ? 'Cancel' : 'Clear Data'}
              </button>
            </div>

            {showClear && (
              <div className="mt-4 bg-rose-50 border border-rose-200 rounded-xl p-4 flex flex-col gap-3">
                <p className="text-xs text-rose-700 font-medium">
                  This will permanently delete all businesses, expenses, mileage trips,
                  and documents. This action cannot be undone.
                </p>
                <p className="text-xs text-rose-600">
                  Type <strong>DELETE ALL MY DATA</strong> below to confirm:
                </p>
                <input
                  type="text"
                  placeholder="DELETE ALL MY DATA"
                  value={clearInput}
                  onChange={e => setClearInput(e.target.value)}
                  className="border border-rose-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
                />
                <button
                  onClick={handleClearData}
                  disabled={clearing || clearInput !== 'DELETE ALL MY DATA'}
                  className="bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white py-2 rounded-lg text-sm font-bold transition-all"
                >
                  {clearing ? 'Deleting...' : 'Permanently Delete All Data'}
                </button>
              </div>
            )}
          </div>
        </Section>

        {/* Legal */}
        <div className="text-center pb-4">
          <p className="text-xs text-gray-400">
            Ledger AI · Luca v{appInfo?.app_version || '0.1.0'} · Local-first, privacy-first
          </p>
          <p className="text-xs text-gray-300 mt-1">
            Your data never leaves your device without your explicit action.
          </p>
        </div>

      </div>
    </div>
  )
}

// ── Helper components ──────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <h3 className="font-bold text-[#0C2340] text-base">{title}</h3>
        <div className="flex-1 h-px bg-gray-200" />
      </div>
      <div>{children}</div>
    </div>
  )
}

function InfoRow({ label, value, mono }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-gray-100 last:border-0">
      <span className="text-xs font-medium text-gray-500 flex-shrink-0 w-28">{label}</span>
      <span className={`text-xs text-right ${mono ? 'font-mono text-gray-500' : 'text-gray-700 font-medium'}`}>
        {value}
      </span>
    </div>
  )
}