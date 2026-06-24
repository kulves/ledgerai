/**
 * ChatPage.jsx — Luca Chat Interface
 * =====================================
 * The existing chat UI moved to its own page component.
 * Receives backendStatus as a prop from App.jsx.
 */

import { useState, useEffect, useRef } from 'react'
import { api } from '../services/api'

function createUserMessage(text) {
  return { id: Date.now(), role: 'user', text }
}
function createLucaMessage(response) {
  return {
    id: Date.now() + 1, role: 'luca',
    text: response.answer, answered: response.answered,
    source: response.source, topic: response.topic
  }
}
function createLoadingMessage() {
  return { id: Date.now() + 1, role: 'luca', text: null, loading: true }
}

export default function ChatPage({ backendStatus }) {
  const [messages, setMessages] = useState([{
    id: 0, role: 'luca', answered: true, source: null,
    text: "Hi! I'm Luca, your local-first AI bookkeeping and tax assistant. I can answer questions about tax concepts, deductions, and bookkeeping from my verified knowledge base. What would you like to know?"
  }])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const question = input.trim()
    if (!question || isLoading) return
    const userMsg = createUserMessage(question)
    const loadingMsg = createLoadingMessage()
    setMessages(prev => [...prev, userMsg, loadingMsg])
    setInput('')
    setIsLoading(true)
    const response = await api.askLuca(question)
    const lucaMsg = createLucaMessage(response)
    setMessages(prev => [...prev.slice(0, -1), lucaMsg])
    setIsLoading(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="flex flex-col gap-4 max-w-2xl mx-auto">
          {messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
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
  return (
    <div className="flex gap-3 items-start">
      <Avatar role="luca" />
      <div className="flex flex-col gap-2 max-w-lg">
        <div className={`rounded-2xl rounded-tl-sm px-4 py-3 text-sm ${
          message.answered
            ? 'bg-white border border-gray-200 text-gray-800'
            : 'bg-amber-50 border border-amber-200 text-amber-900'
        }`}>
          {message.text.split('\n\n---\n').map((part, i) => (
            <p key={i} className={i > 0 ? 'mt-3 text-xs text-gray-500 italic border-t border-gray-100 pt-3' : ''}>
              {part}
            </p>
          ))}
        </div>
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

function Avatar({ role }) {
  if (role === 'luca') {
    return (
      <div className="w-8 h-8 rounded-full bg-[#0C2340] flex items-center justify-center flex-shrink-0 text-[#C9962C] font-bold text-sm">L</div>
    )
  }
  return (
    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 text-gray-600 font-bold text-sm">U</div>
  )
}

function LoadingDots() {
  return (
    <div className="flex gap-1 items-center h-5">
      {[0, 1, 2].map(i => (
        <span key={i} className="w-2 h-2 rounded-full bg-[#C9962C] animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </div>
  )
}