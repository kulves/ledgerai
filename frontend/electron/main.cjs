/**
 * main.cjs — Electron Main Process
 * ===================================
 * Launches the Luca desktop application.
 * - Development: uses venv Python + Vite dev server
 * - Production:  uses bundled embeddable Python + built dist/
 */

const { app, BrowserWindow, dialog } = require('electron')
const path = require('path')
const { spawn, exec } = require('child_process')
const http = require('http')

let backendProcess = null
let mainWindow = null
let loadingWindow = null

const isDev = !app.isPackaged

// ── Paths ──────────────────────────────────────────────────────────────────
const PROJECT_ROOT = isDev
  ? path.join(__dirname, '../../')
  : path.join(process.resourcesPath, 'app')

// Development: use venv (Scripts/python.exe on Windows)
// Production:  use embeddable Python (python.exe at root, no Scripts subfolder)
const PYTHON_PATH = isDev
  ? path.join(__dirname, '../../venv/Scripts/python.exe')
  : path.join(process.resourcesPath, 'python', 'python.exe')

const APP_ICON = isDev
  ? path.join(__dirname, '../public/Luca.ico')
  : path.join(__dirname, '../dist/Luca.ico')

// ── Loading screen ─────────────────────────────────────────────────────────
function createLoadingWindow() {
  loadingWindow = new BrowserWindow({
    width: 420,
    height: 320,
    icon: APP_ICON,
    frame: false,
    resizable: false,
    backgroundColor: '#0C2340',
    webPreferences: { nodeIntegration: false },
  })

  loadingWindow.loadURL(`data:text/html,
    <html>
      <body style="margin:0;background:%230C2340;display:flex;flex-direction:column;
        align-items:center;justify-content:center;height:100vh;
        font-family:-apple-system,Segoe UI,sans-serif;">
        <div style="width:64px;height:64px;border-radius:50%;
          border:3px solid %23C9962C;display:flex;align-items:center;
          justify-content:center;color:%23C9962C;font-size:28px;font-weight:bold;">L</div>
        <h2 style="color:white;margin-top:20px;font-size:18px;margin-bottom:6px;">
          Starting Luca...</h2>
        <p style="color:rgba(255,255,255,0.5);font-size:12px;margin:0;">
          Loading your local AI assistant</p>
      </body>
    </html>
  `)
}

// ── Main app window ────────────────────────────────────────────────────────
function createMainWindow() {
  mainWindow = new BrowserWindow({
    title: 'Luca',
    width: 1280,
    height: 800,
    icon: APP_ICON,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#FAFAF8',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(
      path.join(__dirname, '../dist/index.html')
    )
  }

  // Loaded pages can overwrite BrowserWindow title (e.g. stale dist/index.html).
  mainWindow.on('page-title-updated', (event) => {
    event.preventDefault()
    mainWindow.setTitle('Luca')
  })

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.setTitle('Luca')
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow.setTitle('Luca')
    if (loadingWindow) {
      loadingWindow.close()
      loadingWindow = null
    }
    mainWindow.show()
  })

  mainWindow.on('closed', () => { mainWindow = null })
}

// ── Wait for backend to be ready ───────────────────────────────────────────
function waitForBackend(retriesLeft = 40) {
  http.get('http://127.0.0.1:8000/health', (res) => {
    if (res.statusCode === 200) {
      createMainWindow()
    } else {
      retryOrFail(retriesLeft)
    }
  }).on('error', () => retryOrFail(retriesLeft))
}

function retryOrFail(retriesLeft) {
  if (retriesLeft <= 0) {
    if (loadingWindow) loadingWindow.close()
    dialog.showErrorBox(
      'Luca Failed to Start',
      'The backend service did not respond in time.\n\n' +
      'Please restart Luca. If this keeps happening, make sure ' +
      'no other application is using port 8000.'
    )
    app.quit()
    return
  }
  setTimeout(() => waitForBackend(retriesLeft - 1), 500)
}

// ── Check Ollama ───────────────────────────────────────────────────────────
function checkOllama() {
  http.get('http://127.0.0.1:11434/api/tags', () => {
    // Ollama is running — good
  }).on('error', () => {
    dialog.showMessageBox({
      type: 'warning',
      title: 'Ollama Not Running',
      message: 'Luca needs Ollama to answer questions and read receipts.',
      detail:
        'You can still log expenses and mileage without it.\n\n' +
        'To enable AI features: start Ollama, then restart Luca.',
      buttons: ['Continue Anyway'],
    })
  })
}

// ── Start Python backend ───────────────────────────────────────────────────
function startBackend() {
  console.log('Starting backend with Python:', PYTHON_PATH)
  console.log('Working directory:', PROJECT_ROOT)
  const { DEBUG: _ignoredDebug, ...backendEnv } = process.env

  backendProcess = spawn(
    PYTHON_PATH,
    ['-m', 'backend.app.main'],
    {
      cwd: PROJECT_ROOT,
      shell: false,
      env: {
        ...backendEnv,
        PYTHONPATH: PROJECT_ROOT,
      }
    }
  )

  backendProcess.stdout.on('data', (d) => console.log(`[Backend] ${d}`))
  backendProcess.stderr.on('data', (d) => console.error(`[Backend ERR] ${d}`))

  backendProcess.on('error', (err) => {
    console.error('Backend spawn error:', err)
    dialog.showErrorBox(
      'Luca Failed to Start',
      `Could not start the backend service:\n${err.message}\n\n` +
      `Python path: ${PYTHON_PATH}`
    )
    app.quit()
  })
}

// ── Cleanup helper ─────────────────────────────────────────────────────────
function killBackend() {
  if (!backendProcess) return
  try {
    if (process.platform === 'win32') {
      exec(`taskkill /pid ${backendProcess.pid} /T /F`)
    } else {
      backendProcess.kill()
    }
  } catch (e) {
    console.error('Error killing backend:', e)
  }
}

// ── App lifecycle ──────────────────────────────────────────────────────────
app.setName('Luca')

app.whenReady().then(() => {
  createLoadingWindow()
  checkOllama()
  startBackend()
  // Give the backend 1 second head start before polling
  setTimeout(() => waitForBackend(40), 1000)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

app.on('window-all-closed', () => {
  killBackend()
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', killBackend)
