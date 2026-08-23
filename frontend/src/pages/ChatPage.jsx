/**
 * ChatPage.jsx — Luca Chat Interface
 * =====================================
 * Changes in this version:
 *   - Sends full conversation history with every request so Luca
 *     maintains context across the session
 *   - Luca only greets once — the initial welcome message is shown
 *     in state but NOT sent as history (so the backend knows it's
 *     the first real user message)
 *   - Business name from localStorage is sent with every message
 *     so Luca can reference it naturally
 *   - Markdown bold (**text**) is rendered properly
 */

/**
 * ChatPage.jsx — Perplexity-style Luca Chat
 * ============================================
 * Dark centered layout with:
 *   - Welcome screen with suggested prompts when no messages
 *   - "Ask Luca anything" input bar at bottom
 *   - Messages rendered above the input
 *   - Source citations and CPA disclaimer styled cleanly
 *   - Conversation history sent with every message
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { api } from '../services/api'

const SUGGESTIONS = [
  { icon: '🏠', text: 'How do I deduct my home office?' },
  { icon: '🚗', text: 'What is the mileage rate for 2026?' },
  { icon: '💼', text: 'What\'s the difference between a sole proprietor and LLC?' },
  { icon: '📊', text: 'How does a SEP-IRA work for self-employed?' },
  { icon: '🧾', text: 'Are business meals 100% deductible?' },
  { icon: '📅', text: 'When are quarterly estimated taxes due?' },
]

const INITIAL_GREETING = {
  id: 0, role: 'luca', answered: true, isGreeting: true,
  text: "Hi! I'm Luca, your local-first AI bookkeeping and tax assistant. I can answer questions about tax concepts, deductions, and bookkeeping from my verified knowledge base. What would you like to know?"
}

function createUserMsg(text) {
  return { id: Date.now(), role: 'user', text }
}
function createLucaMsg(response) {
  return {
    id: Date.now() + 1, role: 'luca',
    text: response.answer, answered: response.answered,
    source: response.source, topic: response.topic,
    confidenceNote: response.confidence_note,
  }
}
function createLoadingMsg() {
  return { id: Date.now() + 1, role: 'luca', text: null, loading: true }
}

export default function ChatPage({ backendStatus, selectedBusiness }) {
  const [messages, setMessages] = useState([INITIAL_GREETING])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const hasMessages = messages.filter(m => !m.isGreeting).length > 0

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!isLoading) inputRef.current?.focus()
  }, [isLoading])

  const getBusinessName = () => {
    try {
      return selectedBusiness?.name || null
    } catch { return null }
  }

  const buildHistory = (currentMessages) =>
    currentMessages
      .filter(m => !m.loading && !m.isGreeting && m.text)
      .map(m => ({ role: m.role, text: m.text }))

  const handleSend = async (questionOverride) => {
    const question = (questionOverride || input).trim()
    if (!question || isLoading) return

    const userMsg = createUserMsg(question)
    const loadingMsg = createLoadingMsg()
    const historyBeforeThis = buildHistory(messages)

    setMessages(prev => [...prev, userMsg, loadingMsg])
    setInput('')
    setIsLoading(true)

    const response = await api.askLuca(question, historyBeforeThis, getBusinessName())
    const lucaMsg = createLucaMsg(response)
    setMessages(prev => [...prev.slice(0, -1), lucaMsg])
    setIsLoading(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg)' }}>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {!hasMessages ? (
          /* ── Welcome screen ── */
          <div className="flex flex-col items-center justify-center min-h-full px-6 py-12">
            <div className="w-full max-w-2xl flex flex-col items-center gap-8">

              {/* Luca avatar + greeting */}
              <div className="flex flex-col items-center gap-4 text-center">
                <div
                  className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #0C2340, #0E3A6B)',
                    border: '1px solid rgba(34,211,238,0.3)',
                    boxShadow: '0 0 24px rgba(34,211,238,0.15)',
                  }}
                >
                  <img src="/luca_logo.png" alt="Luca" className="w-full h-full object-cover"
                    onError={e => {
                      e.target.style.display = 'none'
                      e.target.parentNode.innerHTML = '<span style="color:#22D3EE;font-weight:700;font-size:24px;">L</span>'
                    }}
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: 'var(--text-0)', letterSpacing: '-0.02em' }}>
                    What's on your mind today?
                  </h2>
                  <p className="text-sm mt-1.5" style={{ color: 'var(--text-2)' }}>
                    Ask me anything about taxes, deductions, or bookkeeping.
                  </p>
                </div>
              </div>

              {/* Suggested prompts */}
              <div className="grid grid-cols-2 gap-3 w-full">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(s.text)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all text-sm"
                    style={{
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-1)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'rgba(34,211,238,0.4)'
                      e.currentTarget.style.background = 'var(--hover)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--border)'
                      e.currentTarget.style.background = 'var(--card)'
                    }}
                  >
                    <span className="text-lg flex-shrink-0">{s.icon}</span>
                    <span style={{ color: 'var(--text-0)' }}>{s.text}</span>
                  </button>
                ))}
              </div>

            </div>
          </div>
        ) : (
          /* ── Message thread ── */
          <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">
            {messages.filter(m => !m.isGreeting).map(msg => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ── Input bar ── */}
      <div
        className="flex-shrink-0 px-4 pb-6 pt-3"
        style={{ borderTop: hasMessages ? '1px solid var(--border-soft)' : 'none' }}
      >
        <div className="max-w-2xl mx-auto">
          <div
            className="flex items-end gap-3 px-4 py-3 rounded-2xl transition-all"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
            }}
            onFocus={e => e.currentTarget.style.borderColor = 'rgba(34,211,238,0.4)'}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            {/* Luca icon */}
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mb-0.5"
              style={{ background: 'rgba(34,211,238,0.12)', color: '#22D3EE' }}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
            </div>

            {/* Textarea */}
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Luca a tax or bookkeeping question..."
              rows={1}
              disabled={isLoading || backendStatus === 'disconnected'}
              className="flex-1 resize-none bg-transparent outline-none text-sm leading-relaxed"
              style={{
                color: 'var(--text-0)',
                maxHeight: '120px',
                minHeight: '24px',
              }}
              onInput={e => {
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
              }}
            />

            {/* Send button */}
            <button
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim() || backendStatus === 'disconnected'}
              className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all mb-0.5"
              style={{
                background: isLoading || !input.trim() ? 'var(--border)' : '#22D3EE',
                color: isLoading || !input.trim() ? 'var(--text-2)' : '#04141a',
              }}
            >
              {isLoading ? (
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity="0.2"/>
                  <path d="M21 12a9 9 0 00-9-9"/>
                </svg>
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              )}
            </button>
          </div>

          <p className="text-center text-xs mt-2" style={{ color: 'var(--text-2)' }}>
            Press Enter to send · Shift+Enter for new line · Luca only answers from verified IRS sources
          </p>
        </div>
      </div>
    </div>
  )
}

/* ── Message components ── */
function ChatMessage({ message }) {
  if (message.loading) {
    return (
      <div className="flex gap-3 items-start">
        <LucaAvatar />
        <div className="rounded-2xl px-4 py-3"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <LoadingDots />
        </div>
      </div>
    )
  }

  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-sm rounded-2xl rounded-tr-sm px-4 py-3 text-sm"
          style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)', color: 'var(--text-0)' }}
        >
          {message.text}
        </div>
      </div>
    )
  }

  /* Luca message */
  const parts = (message.text || '').split('\n\n---\n')
  const mainText = parts[0] || ''
  const disclaimer = parts[1] || ''

  return (
    <div className="flex gap-3 items-start">
      <LucaAvatar />
      <div className="flex-1 min-w-0 flex flex-col gap-2">

        {/* Answer */}
        <div
          className="rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed"
          style={{
            background: message.answered ? 'var(--card)' : 'rgba(251,187,36,0.06)',
            border: `1px solid ${message.answered ? 'var(--border)' : 'rgba(251,187,36,0.2)'}`,
            color: 'var(--text-0)',
          }}
        >
          <BoldText text={mainText} />
        </div>

        {/* Source citation */}
        {message.source && (
          <div className="flex items-center gap-2 px-1">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#34D399' }} />
            <span className="text-xs" style={{ color: 'var(--text-2)' }}>
              Source: {message.source}
            </span>
          </div>
        )}

        {/* Disclaimer */}
        {disclaimer && (
          <p className="text-xs italic px-1" style={{ color: 'var(--text-2)' }}>
            {disclaimer}
          </p>
        )}

        {/* No match note */}
        {!message.answered && message.confidenceNote && (
          <p className="text-xs px-1" style={{ color: 'var(--amber)' }}>
            {message.confidenceNote}
          </p>
        )}
      </div>
    </div>
  )
}

function LucaAvatar() {
  return (
    <div
      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg,#0C2340,#0E3A6B)',
        border: '1px solid rgba(34,211,238,0.3)',
        boxShadow: '0 0 8px rgba(34,211,238,0.1)',
      }}
    >
      <img src="/luca_logo.png" alt="L" className="w-full h-full object-cover"
        onError={e => {
          e.target.style.display = 'none'
          e.target.parentNode.innerHTML = '<span style="color:#22D3EE;font-weight:700;font-size:11px;">L</span>'
        }}
      />
    </div>
  )
}

function BoldText({ text }) {
  if (!text) return null
  return (
    <>
      {text.split('\n').map((line, i) => (
        <p key={i} className={i > 0 ? 'mt-2' : ''}>
          {line.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
            part.startsWith('**') && part.endsWith('**')
              ? <strong key={j} style={{ color: 'var(--text-0)' }}>{part.slice(2,-2)}</strong>
              : <span key={j}>{part}</span>
          )}
        </p>
      ))}
    </>
  )
}

function LoadingDots() {
  return (
    <div className="flex gap-1 items-center" style={{ height: '20px' }}>
      {[0,1,2].map(i => (
        <span key={i} className="w-2 h-2 rounded-full animate-bounce"
          style={{ background: '#22D3EE', animationDelay: `${i*0.15}s` }} />
      ))}
    </div>
  )
}
