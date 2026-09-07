/**
 * OllamaSetup.jsx — First-Run Ollama Setup Wizard
 * ==================================================
 * Purpose:
 *   Shown to users who don't have Ollama installed or whose models
 *   aren't downloaded yet. Guides them through setup with buttons
 *   only — no terminal required.
 *
 * Flow:
 *   1. Check if Ollama is installed (ping localhost:11434)
 *   2. If not → show Download Ollama button (opens browser)
 *      Poll every 3 seconds for Ollama to come online
 *   3. Once Ollama detected → auto-download llama3.2:1b (chat model)
 *      Show progress bar — this happens automatically
 *   4. Optional checkbox: also download llama3.2-vision (OCR/receipts, ~7GB)
 *   5. When done → call onComplete() to launch the main app
 *
 * Props:
 *   onComplete: () => void  — called when setup is finished
 */

import { useState, useEffect, useRef, useCallback } from 'react'

const OLLAMA_URL   = 'http://127.0.0.1:11434'
const CHAT_MODEL   = 'llama3.2:1b'
const VISION_MODEL = 'llama3.2-vision'
const BACKEND_URL  = 'http://127.0.0.1:8000'

// Ollama 0.30.x+ breaks llama3.2-vision (Receipt Scanner) — see CLAUDE.md Critical Rule #3.
// The generic ollama.com download always serves the latest release, so we point fresh
// installs at this specific known-good tag instead.
const PINNED_OLLAMA_VERSION = '0.24.0'
const PINNED_OLLAMA_INSTALLER = `https://github.com/ollama/ollama/releases/download/v${PINNED_OLLAMA_VERSION}/OllamaSetup.exe`
// First version known to break vision — used to warn users who already had a newer
// Ollama installed before ever launching Luca (that path never hits the download button above).
const FIRST_BROKEN_VISION_VERSION = '0.30.0'

// Setup stages
const STAGE = {
  CHECKING:        'checking',       // Initial check
  NEED_OLLAMA:     'need_ollama',    // Ollama not installed
  WAITING_OLLAMA:  'waiting_ollama', // Waiting for user to install Ollama
  OLLAMA_READY:    'ollama_ready',   // Ollama installed, ready to pull models
  PULLING_CHAT:    'pulling_chat',   // Downloading llama3.2:1b
  PULLING_VISION:  'pulling_vision', // Downloading llama3.2-vision (optional)
  DONE:            'done',           // All done
}

// Compares dotted version strings, e.g. isVersionAtLeast('0.30.4', '0.30.0') → true
function isVersionAtLeast(version, threshold) {
  const v = version.split('.').map(n => parseInt(n, 10) || 0)
  const t = threshold.split('.').map(n => parseInt(n, 10) || 0)
  for (let i = 0; i < Math.max(v.length, t.length); i++) {
    const a = v[i] || 0, b = t[i] || 0
    if (a !== b) return a > b
  }
  return true
}

export default function OllamaSetup({ onComplete }) {
  const [stage, setStage]                 = useState(STAGE.CHECKING)
  const [chatProgress, setChatProgress]   = useState(0)
  const [visionProgress, setVisionProgress] = useState(0)
  const [includeVision, setIncludeVision] = useState(false)
  const [error, setError]                 = useState(null)
  const [chatModelReady, setChatModelReady]     = useState(false)
  const [visionModelReady, setVisionModelReady] = useState(false)
  const [versionWarning, setVersionWarning]     = useState(null)  // set if installed Ollama is too new for vision
  const pollRef = useRef(null)
  const pullingRef = useRef(false)

  // ── Check Ollama and model status on mount ─────────────────────────────────
  useEffect(() => {
    checkStatus()
    return () => clearInterval(pollRef.current)
  }, [])

  const checkStatus = async () => {
    setStage(STAGE.CHECKING)
    setError(null)

    try {
      // Check if Ollama is running
      const tagsRes = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(3000) })
      if (!tagsRes.ok) throw new Error('Ollama not responding')

      const tags = await tagsRes.json()
      const installedModels = (tags.models || []).map(m => m.name)

      const hasChatModel   = installedModels.some(n => n.startsWith('llama3.2:1b'))
      const hasVisionModel = installedModels.some(n => n.startsWith('llama3.2-vision'))

      setChatModelReady(hasChatModel)
      setVisionModelReady(hasVisionModel)

      // Someone may already have Ollama installed (any version) before ever
      // launching Luca — check it here since the pinned-installer download
      // button below never runs in that case.
      try {
        const versionRes = await fetch(`${OLLAMA_URL}/api/version`, { signal: AbortSignal.timeout(2000) })
        if (versionRes.ok) {
          const { version } = await versionRes.json()
          if (version && isVersionAtLeast(version, FIRST_BROKEN_VISION_VERSION)) {
            setVersionWarning(version)
          } else {
            setVersionWarning(null)
          }
        }
      } catch {
        // Version check is best-effort — older Ollama builds may not expose this endpoint
      }

      if (hasChatModel) {
        // Chat model ready — go straight to done (vision is optional)
        setStage(STAGE.DONE)
      } else {
        // Ollama is running but models not downloaded
        setStage(STAGE.OLLAMA_READY)
      }

    } catch {
      // Ollama not running or not installed
      setStage(STAGE.NEED_OLLAMA)
    }
  }

  // ── Poll for Ollama to come online after user installs it ──────────────────
  const startPollingForOllama = useCallback(() => {
    setStage(STAGE.WAITING_OLLAMA)
    clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(2000) })
        if (res.ok) {
          clearInterval(pollRef.current)
          setStage(STAGE.OLLAMA_READY)
        }
      } catch {}
    }, 3000)
  }, [])

  // ── Pull a model via backend streaming endpoint ────────────────────────────
  const pullModel = useCallback(async (model, onProgress, onDone, onError) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/setup/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model })
      })

      if (!response.ok) throw new Error(`Pull failed: ${response.status}`)

      // Stream the progress
      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value)
        const lines = text.split('\n').filter(l => l.trim())

        for (const line of lines) {
          try {
            const data = JSON.parse(line)
            if (data.total && data.completed) {
              const pct = Math.round((data.completed / data.total) * 100)
              onProgress(pct)
            }
            if (data.status === 'success' || data.done) {
              onProgress(100)
            }
          } catch {}
        }
      }
      onDone()
    } catch (err) {
      onError(err.message)
    }
  }, [])

  // ── Start downloading models ───────────────────────────────────────────────
  const startDownload = useCallback(async () => {
    if (pullingRef.current) return
    pullingRef.current = true
    setError(null)
    setStage(STAGE.PULLING_CHAT)

    await pullModel(
      CHAT_MODEL,
      (pct) => setChatProgress(pct),
      async () => {
        setChatProgress(100)
        setChatModelReady(true)

        if (includeVision) {
          setStage(STAGE.PULLING_VISION)
          await pullModel(
            VISION_MODEL,
            (pct) => setVisionProgress(pct),
            () => {
              setVisionProgress(100)
              setVisionModelReady(true)
              setStage(STAGE.DONE)
              pullingRef.current = false
            },
            (err) => {
              setError(`Vision model download failed: ${err}. You can enable OCR later from Settings.`)
              setStage(STAGE.DONE)
              pullingRef.current = false
            }
          )
        } else {
          setStage(STAGE.DONE)
          pullingRef.current = false
        }
      },
      (err) => {
        setError(`Download failed: ${err}. Please check your internet connection and try again.`)
        setStage(STAGE.OLLAMA_READY)
        pullingRef.current = false
      }
    )
  }, [includeVision, pullModel])

  // ── Open Ollama download page in browser ───────────────────────────────────
  const openOllamaDownload = () => {
    window.open(PINNED_OLLAMA_INSTALLER, '_blank')
    startPollingForOllama()
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'linear-gradient(135deg, #0C2340 0%, #0a1d38 100%)' }}
    >
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img
            src="/luca_logo.png"
            alt="Luca"
            className="w-20 h-20 rounded-2xl object-cover mb-4 shadow-2xl"
            style={{ filter: 'drop-shadow(0 0 16px rgba(201,150,44,0.4))' }}
            onError={(e) => { e.target.style.display = 'none' }}
          />
          <h1 className="text-white text-3xl font-bold tracking-wide">Luca</h1>
          <p className="text-[#C9962C] text-sm font-medium mt-1">by Ledger AI</p>
        </div>

        {/* Setup card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">

          {/* Card header */}
          <div className="px-6 pt-6 pb-4 border-b border-gray-100">
            <h2 className="text-[#0C2340] font-bold text-lg">
              {stage === STAGE.CHECKING       && 'Checking your setup...'}
              {stage === STAGE.NEED_OLLAMA    && 'One-time setup required'}
              {stage === STAGE.WAITING_OLLAMA && 'Waiting for Ollama...'}
              {stage === STAGE.OLLAMA_READY   && 'Ready to download AI models'}
              {stage === STAGE.PULLING_CHAT   && 'Downloading AI engine...'}
              {stage === STAGE.PULLING_VISION && 'Downloading receipt scanner...'}
              {stage === STAGE.DONE           && 'Luca is ready!'}
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              {stage === STAGE.CHECKING       && 'Checking if Ollama and AI models are installed...'}
              {stage === STAGE.NEED_OLLAMA    && "Luca uses a local AI engine to power your assistant — it's free, secure, and sets up in under 2 minutes."}
              {stage === STAGE.WAITING_OLLAMA && 'Install Ollama from the download that just started, then come back here.'}
              {stage === STAGE.OLLAMA_READY   && "Ollama is ready. Now Luca needs to download its AI model (~800MB)."}
              {stage === STAGE.PULLING_CHAT   && 'Downloading the AI chat engine. This takes 2–5 minutes depending on your connection.'}
              {stage === STAGE.PULLING_VISION && 'Downloading the receipt scanner model (~7GB). This may take a while.'}
              {stage === STAGE.DONE           && 'All AI models are installed. Your financial data stays on your device — always.'}
            </p>
          </div>

          <div className="px-6 py-6 flex flex-col gap-5">

            {/* STAGE: Checking */}
            {stage === STAGE.CHECKING && (
              <div className="flex justify-center py-4">
                <Spinner />
              </div>
            )}

            {/* STAGE: Need Ollama */}
            {stage === STAGE.NEED_OLLAMA && (
              <>
                <InfoBox>
                  Luca runs powerful AI models directly on your computer, ensuring your
                  financial data stays completely private and never leaves your device.
                </InfoBox>
                <button
                  onClick={openOllamaDownload}
                  className="w-full bg-[#0C2340] hover:bg-[#0a1d38] text-white py-3 rounded-xl font-bold text-sm transition-all active:scale-95"
                >
                  Download & Install Ollama →
                </button>
                <p className="text-center text-xs text-gray-400">
                  After installing, Luca will detect it automatically.
                </p>
              </>
            )}

            {/* STAGE: Waiting for Ollama */}
            {stage === STAGE.WAITING_OLLAMA && (
              <>
                <div className="flex flex-col items-center gap-3 py-2">
                  <Spinner />
                  <p className="text-sm text-gray-500 text-center">
                    Waiting for Ollama to finish installing...
                    <br />
                    This checks automatically every few seconds.
                  </p>
                </div>
                <Steps steps={[
                  { done: true,  text: 'Download started' },
                  { done: false, text: 'Run the Ollama installer' },
                  { done: false, text: 'Click through the setup wizard' },
                  { done: false, text: 'Come back here — Luca will continue automatically' },
                ]} />
              </>
            )}

            {/* STAGE: Ollama ready — download models */}
            {stage === STAGE.OLLAMA_READY && (
              <>
                <SuccessRow text="Ollama is installed and running" />
                {versionWarning && <VersionWarningBox version={versionWarning} />}

                {/* Optional vision model checkbox */}
                <div
                  className={`rounded-xl border-2 p-4 cursor-pointer transition-all ${
                    includeVision
                      ? 'border-[#C9962C] bg-amber-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                  onClick={() => setIncludeVision(v => !v)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded flex-shrink-0 mt-0.5 flex items-center justify-center border-2 transition-all ${
                      includeVision ? 'bg-[#C9962C] border-[#C9962C]' : 'border-gray-300'
                    }`}>
                      {includeVision && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#0C2340]">
                        Also download Receipt Scanner (~7GB)
                        <span className="ml-2 text-xs font-normal text-gray-400">Optional</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Enables Luca to read and extract data from receipt photos and documents.
                        You can enable this later from Settings if you skip it now.
                      </p>
                    </div>
                  </div>
                </div>

                {error && <ErrorBox text={error} />}

                <button
                  onClick={startDownload}
                  className="w-full bg-[#C9962C] hover:bg-[#B88A24] text-white py-3 rounded-xl font-bold text-sm transition-all active:scale-95"
                >
                  {includeVision
                    ? 'Download AI Engine + Receipt Scanner →'
                    : 'Download AI Engine (~800MB) →'}
                </button>
                <p className="text-center text-xs text-gray-400">
                  Downloads run in the background. Keep Luca open.
                </p>
              </>
            )}

            {/* STAGE: Pulling chat model */}
            {stage === STAGE.PULLING_CHAT && (
              <>
                <ProgressBar
                  label="AI Chat Engine (llama3.2:1b)"
                  progress={chatProgress}
                  color="#0C2340"
                />

                {includeVision && (
                  <ProgressBar
                    label="Receipt Scanner (llama3.2-vision)"
                    progress={0}
                    color="#C9962C"
                    pending
                  />
                )}

                <p className="text-xs text-gray-400 text-center">
                  Please keep Luca open while downloading.
                </p>
              </>
            )}

            {/* STAGE: Pulling vision model */}
            {stage === STAGE.PULLING_VISION && (
              <>
                <SuccessRow text="AI Chat Engine downloaded" />
                <ProgressBar
                  label="Receipt Scanner (llama3.2-vision)"
                  progress={visionProgress}
                  color="#C9962C"
                />
                <p className="text-xs text-gray-400 text-center">
                  Large download (~7GB). Please keep Luca open.
                </p>
              </>
            )}

            {/* STAGE: Done */}
            {stage === STAGE.DONE && (
              <>
                <SuccessRow text={`AI Chat Engine ready (${CHAT_MODEL})`} />
                {visionModelReady && (
                  <SuccessRow text={`Receipt Scanner ready (${VISION_MODEL})`} />
                )}
                {!visionModelReady && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span className="w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center text-xs">○</span>
                    <span>Receipt Scanner — not installed (enable later in Settings)</span>
                  </div>
                )}

                {error && <ErrorBox text={error} />}
                {versionWarning && <VersionWarningBox version={versionWarning} />}

                <button
                  onClick={onComplete}
                  className="w-full bg-[#C9962C] hover:bg-[#B88A24] text-white py-3.5 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-lg"
                >
                  Launch Luca →
                </button>
              </>
            )}

          </div>

          {/* Footer */}
          <div className="px-6 pb-4 text-center">
            <p className="text-xs text-gray-400">
              Luca is local-first — your data never leaves your device.
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}

// ── Helper components ─────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="w-8 h-8 border-3 border-[#C9962C] border-t-transparent rounded-full animate-spin"
      style={{ borderWidth: '3px' }}
    />
  )
}

function InfoBox({ children }) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
      {children}
    </div>
  )
}

function ErrorBox({ text }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
      {text}
    </div>
  )
}

function VersionWarningBox({ version }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 flex flex-col gap-2">
      <p>
        <strong>Ollama {version} is installed, but Receipt Scanner (OCR) needs an older version.</strong>{' '}
        Versions {FIRST_BROKEN_VISION_VERSION}+ break receipt reading — chat still works fine.
      </p>
      <a
        href={PINNED_OLLAMA_INSTALLER}
        target="_blank"
        rel="noreferrer"
        className="font-semibold underline"
      >
        Download the compatible version ({PINNED_OLLAMA_VERSION}) →
      </a>
      <p className="text-xs text-amber-700">
        Quit Ollama first (right-click the tray icon → Quit), then run this installer over the existing one. Your models are kept.
      </p>
    </div>
  )
}

function SuccessRow({ text }) {
  return (
    <div className="flex items-center gap-2 text-sm text-emerald-700">
      <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
        <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </span>
      {text}
    </div>
  )
}

function ProgressBar({ label, progress, color, pending }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-xs font-bold" style={{ color }}>
          {pending ? 'Waiting...' : `${progress}%`}
        </span>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${pending ? 0 : progress}%`,
            background: color,
            opacity: pending ? 0.3 : 1
          }}
        />
      </div>
    </div>
  )
}

function Steps({ steps }) {
  return (
    <div className="flex flex-col gap-2">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-2.5">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
            step.done ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'
          }`}>
            {step.done ? '✓' : i + 1}
          </div>
          <span className={`text-sm ${step.done ? 'text-emerald-700 line-through' : 'text-gray-600'}`}>
            {step.text}
          </span>
        </div>
      ))}
    </div>
  )
}