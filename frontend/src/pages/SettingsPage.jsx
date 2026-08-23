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

/**
 * SettingsPage.jsx — App Settings & Data Management (Dark theme redesign)
 */
import { useState, useEffect } from 'react'
import { api } from '../services/api'

const ENTITY_TYPES = [
  { value: 'sole_prop',   label: 'Sole Proprietor' },
  { value: 'llc',         label: 'LLC' },
  { value: 's_corp',      label: 'S-Corporation' },
  { value: 'partnership', label: 'Partnership' },
]
const STATES = ['CA','TX','FL','NY','IL','GA','WA','AZ','NV','CO','OTHER']

function Section({ title, children }) {
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-soft)' }}>
        <h3 className="font-semibold text-sm" style={{ color: 'var(--text-0)' }}>{title}</h3>
      </div>
      <div className="px-5 py-4 flex flex-col gap-4">{children}</div>
    </div>
  )
}

function Row({ label, value, sub }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{label}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>{sub}</p>}
      </div>
      <span className="text-sm font-semibold" style={{ color: 'var(--text-0)', fontFamily: 'var(--font-mono)' }}>
        {value ?? '—'}
      </span>
    </div>
  )
}

export default function SettingsPage({ backendStatus, onResetOnboarding }) {
  const [appInfo, setAppInfo]       = useState(null)
  const [stats, setStats]           = useState(null)
  const [businesses, setBusinesses] = useState([])
  const [editingBiz, setEditingBiz] = useState(null)
  const [editForm, setEditForm]     = useState({})
  const [saving, setSaving]         = useState(false)
  const [clearInput, setClearInput] = useState('')
  const [clearing, setClearing]     = useState(false)
  const [showClear, setShowClear]   = useState(false)
  const [message, setMessage]       = useState({ text: '', type: 'success' })
  const [showAddBiz, setShowAddBiz] = useState(false)
  const [newBiz, setNewBiz]         = useState({ name: '', entity_type: 'sole_prop', state: 'CA' })

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    const [info, statsData, bizList] = await Promise.all([
      api.getAppInfo(), api.getStats(), api.getBusinesses(),
    ])
    setAppInfo(info); setStats(statsData); setBusinesses(bizList || [])
  }

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type })
    setTimeout(() => setMessage({ text: '', type: 'success' }), 4000)
  }

  const handleSaveBiz = async () => {
    if (!editingBiz || !editForm.name?.trim()) return
    setSaving(true)
    await api.updateBusiness(editingBiz.id, editForm)
    setSaving(false)
    setEditingBiz(null)
    loadAll()
    showMsg('Business updated successfully.')
  }

  const handleAddBiz = async () => {
    if (!newBiz.name.trim()) return
    setSaving(true)
    await api.createBusiness(newBiz.name, newBiz.entity_type, newBiz.state)
    setSaving(false)
    setShowAddBiz(false)
    setNewBiz({ name: '', entity_type: 'sole_prop', state: 'CA' })
    loadAll()
    showMsg('Business added.')
  }

  const handleClearData = async () => {
    if (clearInput !== 'DELETE') return
    setClearing(true)
    await api.clearAllData()
    setClearing(false)
    setShowClear(false)
    setClearInput('')
    loadAll()
    showMsg('All data cleared.', 'error')
  }

  const inputStyle = {
    background: 'var(--card-2)', border: '1px solid var(--border)',
    color: 'var(--text-0)', borderRadius: '10px', padding: '8px 12px',
    fontSize: '13px', outline: 'none', width: '100%',
  }
  const selectStyle = { ...inputStyle }

  return (
    <div className="flex flex-col gap-6 p-6" style={{ minHeight: '100%', maxWidth: '720px' }}>

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

      {/* App Info */}
      <Section title="App Info">
        <Row label="Version" value={appInfo?.version || '0.1.0'} />
        <Row label="Chat Model" value={appInfo?.ollama_model || 'llama3.2:1b'} sub="Used for conversation and categorization" />
        <Row label="Vision Model" value={appInfo?.ollama_vision_model || 'llama3.2-vision'} sub="Used for receipt OCR" />
        <Row label="Backend Status"
          value={<span style={{ color: backendStatus === 'connected' ? '#34D399' : '#FB7185' }}>
            {backendStatus === 'connected' ? '● Connected' : '● Disconnected'}
          </span>}
        />
        <Row label="Knowledge Base" value={`${stats?.knowledge_base_entries || 46} entries`} sub="IRS-verified tax and bookkeeping entries" />
      </Section>

      {/* Business Management */}
      <Section title="Businesses">
        {businesses.map(biz => (
          <div key={biz.id}>
            {editingBiz?.id === biz.id ? (
              <div className="flex flex-col gap-3 p-4 rounded-xl"
                style={{ background: 'var(--card-2)', border: '1px solid var(--border)' }}>
                <input value={editForm.name || ''} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Business name" style={inputStyle} />
                <div className="grid grid-cols-2 gap-3">
                  <select value={editForm.entity_type || 'sole_prop'}
                    onChange={e => setEditForm(p => ({ ...p, entity_type: e.target.value }))}
                    style={selectStyle}>
                    {ENTITY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <select value={editForm.state || 'CA'}
                    onChange={e => setEditForm(p => ({ ...p, state: e.target.value }))}
                    style={selectStyle}>
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSaveBiz} disabled={saving}
                    className="px-4 py-2 rounded-lg text-xs font-bold transition-all"
                    style={{ background: 'var(--accent)', color: '#04141a', opacity: saving ? 0.6 : 1 }}>
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={() => setEditingBiz(null)}
                    className="px-4 py-2 rounded-lg text-xs font-medium transition-all"
                    style={{ background: 'var(--border)', color: 'var(--text-1)' }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-0)' }}>{biz.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>
                    {ENTITY_TYPES.find(t => t.value === biz.entity_type)?.label || biz.entity_type} · {biz.state}
                  </p>
                </div>
                <button onClick={() => { setEditingBiz(biz); setEditForm({ name: biz.name, entity_type: biz.entity_type, state: biz.state }) }}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                  style={{ background: 'var(--card-2)', border: '1px solid var(--border)', color: 'var(--text-1)' }}>
                  Edit
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Add Business */}
        {showAddBiz ? (
          <div className="flex flex-col gap-3 p-4 rounded-xl"
            style={{ background: 'var(--card-2)', border: '1px solid var(--border)' }}>
            <input value={newBiz.name} onChange={e => setNewBiz(p => ({ ...p, name: e.target.value }))}
              placeholder="Business name" style={inputStyle} />
            <div className="grid grid-cols-2 gap-3">
              <select value={newBiz.entity_type} onChange={e => setNewBiz(p => ({ ...p, entity_type: e.target.value }))}
                style={selectStyle}>
                {ENTITY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <select value={newBiz.state} onChange={e => setNewBiz(p => ({ ...p, state: e.target.value }))}
                style={selectStyle}>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={handleAddBiz} disabled={saving || !newBiz.name.trim()}
                className="px-4 py-2 rounded-lg text-xs font-bold"
                style={{ background: 'var(--accent)', color: '#04141a', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Adding...' : 'Add Business'}
              </button>
              <button onClick={() => setShowAddBiz(false)}
                className="px-4 py-2 rounded-lg text-xs"
                style={{ background: 'var(--border)', color: 'var(--text-1)' }}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowAddBiz(true)}
            className="flex items-center gap-2 text-sm font-semibold transition-all"
            style={{ color: 'var(--accent)' }}>
            <span>+</span> Add Business
          </button>
        )}
      </Section>

      {/* Data Stats */}
      <Section title="Data Statistics">
        <Row label="Expenses" value={stats?.expense_count ?? '—'} />
        <Row label="Mileage Trips" value={stats?.mileage_count ?? '—'} />
        <Row label="Documents" value={stats?.document_count ?? '—'} />
        <Row label="Businesses" value={businesses.length} />
      </Section>

      {/* Danger Zone */}
      <Section title="Danger Zone">
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>Reset Onboarding</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>
              Re-run the setup wizard on next launch
            </p>
          </div>
          <button onClick={onResetOnboarding}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
            style={{ background: 'rgba(251,187,36,0.1)', border: '1px solid rgba(251,187,36,0.3)', color: '#FBBF24' }}>
            Reset
          </button>
        </div>

        <div style={{ height: '1px', background: 'var(--border-soft)' }} />

        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-sm font-medium" style={{ color: '#FB7185' }}>Clear All Data</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>
              Permanently delete all expenses, trips, and documents
            </p>
          </div>
          <button onClick={() => setShowClear(v => !v)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
            style={{ background: 'rgba(251,113,133,0.1)', border: '1px solid rgba(251,113,133,0.3)', color: '#FB7185' }}>
            {showClear ? 'Cancel' : 'Clear Data'}
          </button>
        </div>

        {showClear && (
          <div className="flex flex-col gap-3 p-4 rounded-xl"
            style={{ background: 'rgba(251,113,133,0.05)', border: '1px solid rgba(251,113,133,0.2)' }}>
            <p className="text-xs" style={{ color: '#FB7185' }}>
              Type <strong>DELETE</strong> to confirm. This cannot be undone.
            </p>
            <input value={clearInput} onChange={e => setClearInput(e.target.value)}
              placeholder="Type DELETE to confirm" style={{ ...inputStyle, borderColor: 'rgba(251,113,133,0.3)' }}
            />
            <button onClick={handleClearData}
              disabled={clearInput !== 'DELETE' || clearing}
              className="py-2 rounded-lg text-xs font-bold transition-all"
              style={{
                background: clearInput === 'DELETE' ? '#FB7185' : 'var(--border)',
                color: clearInput === 'DELETE' ? '#fff' : 'var(--text-2)',
                opacity: clearing ? 0.6 : 1,
              }}>
              {clearing ? 'Clearing...' : 'Clear All Data'}
            </button>
          </div>
        )}
      </Section>

    </div>
  )
}