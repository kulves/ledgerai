/**
 * App.jsx — Luca Chat Interface
 * ================================
 * Purpose:
 *   The main application UI. Renders the Luca chat panel where users
 *   can ask tax education questions and receive verified answers.
 *   Also shows the persistent backend status indicator.
 *
 * What this module does (Module 8):
 *   - Accepts user questions via a text input
 *   - Calls api.askLuca() and displays Luca's response
 *   - Shows source citation and CPA disclaimer from the response
 *   - Maintains a conversation history in local state
 *   - Shows backend status (connected/disconnected) at all times
 *
 * Connections:
 *   - Uses: frontend/src/services/api.js
 *   - Talks to backend: POST /api/luca/ask, GET /health
 */

import { useState, useEffect, useRef } from 'react'
import { api } from './services/api'

// ── Message helpers ────────────────────────────────────────────────────────
// Each message in the conversation has a role (user or luca) and content.
// Luca messages also carry source and answered status for display logic.
function createUserMessage(text) {
  return { id: Date.now(), role: 'user', text }
}

function createLucaMessage(response) {
  return {
    id: Date.now() + 1,
    role: 'luca',
    text: response.answer,
    answered: response.answered,
    source: response.source,
    topic: response.topic
  }
}

function createLoadingMessage() {
  return { id: Date.now() + 1, role: 'luca', text: null, loading: true }
}

// ── Main App component ─────────────────────────────────────────────────────
export default function App() {
  // Backend status (checked on load and every 8 seconds)
  const [backendStatus, setBackendStatus] = useState('checking')
  const [backendInfo, setBackendInfo] = useState(null)

  // Chat state
  const [messages, setMessages] = useState([
    {
      id: 0,
      role: 'luca',
      text: "Hi! I'm Luca, your local-first AI bookkeeping and tax assistant. I can answer questions about tax concepts, deductions, and bookkeeping from my verified knowledge base. What would you like to know?",
      answered: true,
      source: null
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Auto-scroll to bottom when new messages arrive
  const bottomRef = useRef(null)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Backend health check — on load and every 8 seconds
  useEffect(() => {
    const checkBackend = async () => {
      const data = await api.getHealth()
      setBackendInfo(data)
      setBackendStatus(data.status === 'ok' ? 'connected' : 'disconnected')
    }
    checkBackend()
    const interval = setInterval(checkBackend, 8000)
    return () => clearInterval(interval)
  }, [])

  // ── Send a message ─────────────────────────────────────────────────────
  const handleSend = async () => {
    const question = input.trim()
    if (!question || isLoading) return

    // Add user message immediately
    const userMsg = createUserMessage(question)
    const loadingMsg = createLoadingMessage()
    setMessages(prev => [...prev, userMsg, loadingMsg])
    setInput('')
    setIsLoading(true)

    // Call the backend
    const response = await api.askLuca(question)

    // Replace loading message with real response
    const lucaMsg = createLucaMessage(response)
    setMessages(prev => [...prev.slice(0, -1), lucaMsg])
    setIsLoading(false)
  }

  // Allow Enter key to send (Shift+Enter for newline)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col">

      {/* ── Header ── */}
      <header className="bg-[#0C2340] text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Luca</h1>
          <p className="text-[#C9962C] text-sm font-medium">by Ledger AI</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              backendStatus === 'connected' ? 'bg-emerald-400' :
              backendStatus === 'checking'  ? 'bg-yellow-400' :
                                              'bg-rose-400'
            }`}
          />
          <span className="text-gray-300 capitalize">{backendStatus}</span>
        </div>
      </header>

      {/* ── Chat window ── */}
      <main className="flex-1 overflow-y-auto px-4 py-6 max-w-2xl w-full mx-auto">
        <div className="flex flex-col gap-4">
          {messages.map(msg => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          <div ref={bottomRef} />
        </div>
      </main>

      {/* ── Input bar ── */}
      <div className="border-t border-gray-200 bg-white px-4 py-4">
        <div className="max-w-2xl mx-auto flex gap-3">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Luca a tax or bookkeeping question..."
            rows={2}
            disabled={isLoading || backendStatus === 'disconnected'}
            className="flex-1 resize-none border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C9962C] focus:border-transparent disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim() || backendStatus === 'disconnected'}
            className="bg-[#C9962C] hover:bg-[#B88A24] disabled:opacity-40 text-white px-5 py-3 rounded-xl font-semibold text-sm transition-all active:scale-95 self-end"
          >
            {isLoading ? '...' : 'Ask'}
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>

    </div>
  )
}

// ── ChatMessage component ──────────────────────────────────────────────────
function ChatMessage({ message }) {

  if (message.loading) {
    return (
      <div className="flex gap-3 items-start">
        <Avatar role="luca" />
        <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3">
          <LoadingDots />
        </div>
      </div>
    )
  }

  if (message.role === 'user') {
    return (
      <div className="flex gap-3 items-start justify-end">
        <div className="bg-[#0C2340] text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-sm text-sm">
          {message.text}
        </div>
        <Avatar role="user" />
      </div>
    )
  }

  // Luca message
  return (
    <div className="flex gap-3 items-start">
      <Avatar role="luca" />
      <div className="flex flex-col gap-2 max-w-lg">
        <div className={`rounded-2xl rounded-tl-sm px-4 py-3 text-sm ${
          message.answered
            ? 'bg-white border border-gray-200 text-gray-800'
            : 'bg-amber-50 border border-amber-200 text-amber-900'
        }`}>
          {/* Render the answer — split on markdown-style --- for the disclaimer */}
          {message.text.split('\n\n---\n').map((part, i) => (
            <p key={i} className={`${i > 0 ? 'mt-3 text-xs text-gray-500 italic border-t border-gray-100 pt-3' : ''}`}>
              {part}
            </p>
          ))}
        </div>

        {/* Source badge — only shown when Luca answered from verified content */}
        {message.source && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 px-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
            <span>Source: {message.source}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Avatar component ───────────────────────────────────────────────────────
function Avatar({ role }) {
  if (role === 'luca') {
    return (
      <div className="w-8 h-8 rounded-full bg-[#0C2340] flex items-center justify-center flex-shrink-0 text-[#C9962C] font-bold text-sm">
        L
      </div>
    )
  }
  return (
    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 text-gray-600 font-bold text-sm">
      U
    </div>
  )
}

// ── Loading dots animation ────────────────────────────────────────────────
function LoadingDots() {
  return (
    <div className="flex gap-1 items-center h-5">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-[#C9962C] animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  )
}