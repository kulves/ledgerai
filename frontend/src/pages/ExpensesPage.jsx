/**
 * ExpensesPage.jsx — Expense Logging & Management
 * =================================================
 * Purpose:
 *   The main expense management screen. Users log new expenses here,
 *   Luca automatically categorizes them using the AI engine, and
 *   all saved expenses are shown in a list below the form.
 *
 * Module 10 — what this adds:
 *   - Business selector (which business is this expense for?)
 *   - Expense form with Luca auto-categorization
 *   - Expense list showing all logged entries
 */

import { useState, useEffect } from 'react'
import { api } from '../services/api'
import ExpenseForm from '../components/ExpenseForm'
import ExpenseList from '../components/ExpenseList'

export default function ExpensesPage({ backendStatus }) {
  const [businesses, setBusinesses] = useState([])
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [loadingExpenses, setLoadingExpenses] = useState(false)
  const [showNewBusiness, setShowNewBusiness] = useState(false)
  const [newBizName, setNewBizName] = useState('')
  const [newBizState, setNewBizState] = useState('CA')

  // Load businesses on mount
  useEffect(() => {
    loadBusinesses()
  }, [])

  // Reload expenses when business changes
  useEffect(() => {
    if (selectedBusiness) loadExpenses(selectedBusiness.id)
  }, [selectedBusiness])

  const loadBusinesses = async () => {
    const data = await api.getBusinesses()
    setBusinesses(data)
    if (data.length > 0 && !selectedBusiness) {
      setSelectedBusiness(data[0])
    }
  }

  const loadExpenses = async (businessId) => {
    setLoadingExpenses(true)
    const data = await api.getExpenses(businessId)
    setExpenses(data)
    setLoadingExpenses(false)
  }

  const handleExpenseSaved = (newExpense) => {
    // Add to top of list immediately — no need to reload from server
    setExpenses(prev => [newExpense, ...prev])
  }

  const handleExpenseDeleted = (expenseId) => {
    setExpenses(prev => prev.filter(e => e.id !== expenseId))
  }

  const handleCreateBusiness = async () => {
    if (!newBizName.trim()) return
    const biz = await api.createBusiness(newBizName.trim(), 'sole_prop', newBizState)
    if (biz) {
      setBusinesses(prev => [...prev, biz])
      setSelectedBusiness(biz)
      setShowNewBusiness(false)
      setNewBizName('')
    }
  }

  // ── No businesses yet ───────────────────────────────────────────────────
  if (businesses.length === 0 && !showNewBusiness) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
        <div className="w-16 h-16 rounded-full bg-[#0C2340] flex items-center justify-center text-[#C9962C] text-2xl font-bold">
          L
        </div>
        <h2 className="text-xl font-bold text-[#0C2340]">Set up your first business</h2>
        <p className="text-gray-600 text-sm max-w-sm">
          Before logging expenses, Luca needs to know which business they belong to.
          Add your first business to get started.
        </p>
        <button
          onClick={() => setShowNewBusiness(true)}
          className="bg-[#C9962C] hover:bg-[#B88A24] text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all"
        >
          Add Business
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="max-w-3xl w-full mx-auto px-4 py-6 flex flex-col gap-6">

        {/* ── Business selector ── */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-gray-600">Business:</span>
          <div className="flex gap-2 flex-wrap">
            {businesses.map(biz => (
              <button
                key={biz.id}
                onClick={() => setSelectedBusiness(biz)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedBusiness?.id === biz.id
                    ? 'bg-[#0C2340] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {biz.name}
              </button>
            ))}
            <button
              onClick={() => setShowNewBusiness(true)}
              className="px-4 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all"
            >
              + Add
            </button>
          </div>
        </div>

        {/* ── New business form (inline) ── */}
        {showNewBusiness && (
          <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-3">
            <h3 className="font-semibold text-[#0C2340] text-sm">New Business</h3>
            <input
              type="text"
              placeholder="Business name"
              value={newBizName}
              onChange={e => setNewBizName(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9962C]"
            />
            <select
              value={newBizState}
              onChange={e => setNewBizState(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9962C]"
            >
              {['CA','TX','FL','NY','IL','GA','WA','AZ','NV','CO'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={handleCreateBusiness}
                disabled={!newBizName.trim()}
                className="bg-[#C9962C] hover:bg-[#B88A24] disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              >
                Create
              </button>
              <button
                onClick={() => setShowNewBusiness(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── Expense form ── */}
        {selectedBusiness && (
          <ExpenseForm
            business={selectedBusiness}
            onSaved={handleExpenseSaved}
            backendStatus={backendStatus}
          />
        )}

        {/* ── Expense list ── */}
        {selectedBusiness && (
          <ExpenseList
            expenses={expenses}
            loading={loadingExpenses}
            onDeleted={handleExpenseDeleted}
          />
        )}

      </div>
    </div>
  )
}