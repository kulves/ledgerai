#!/usr/bin/env node
/**
 * check-python-embed.cjs — pre-build safety check
 * ================================================
 * Run automatically before every installer build (wired into `npm run dist`).
 *
 * Why this exists: electron-builder will happily bundle whatever is in
 * python-embed/ into the installer, even if it's missing python.exe
 * entirely or is missing packages the backend needs. That gap caused a
 * real "Failed to start Luca" error for a beta tester on a fresh install —
 * the build "succeeded" with no warning, but the shipped app couldn't
 * start. This script catches that BEFORE a build happens, not after
 * someone downloads it.
 *
 * How it checks: it actually imports backend.app.main using
 * python-embed's python.exe — the exact same import chain the real app
 * uses when it starts. This is more robust than checking a hardcoded
 * list of package names, because it automatically covers any new
 * package a future feature ends up needing, with no maintenance here.
 *
 * (Confirmed safe to import without side effects: main.py only calls
 * init_db() inside a FastAPI startup event, and only starts a server
 * under `if __name__ == "__main__"` — a plain import does neither.)
 */

const { execFileSync } = require('child_process')
const path = require('path')
const fs = require('fs')

// This script lives in frontend/scripts/ — project root is two levels up.
const projectRoot = path.resolve(__dirname, '..', '..')
const pythonExe = path.join(projectRoot, 'python-embed', 'python.exe')

console.log('Checking python-embed before build...')

if (!fs.existsSync(pythonExe)) {
  console.error(`\n❌ python-embed/python.exe not found at:\n   ${pythonExe}`)
  console.error('\nRun the python-embed setup steps from CLAUDE.md before building:')
  console.error('  1. Download + extract the embeddable Python zip')
  console.error('  2. Enable site-packages (sed the ._pth file)')
  console.error('  3. Install pip via get-pip.py')
  console.error('  4. pip install -r requirements.txt\n')
  process.exit(1)
}

try {
  // Embeddable Python's python3XX._pth file ignores PYTHONPATH entirely —
  // confirmed via Python's own docs and multiple real-world reports of this
  // exact behavior. So instead of relying on env vars, this mirrors exactly
  // what main.cjs's startBackend() actually does: explicitly insert
  // PROJECT_ROOT into sys.path at runtime (a plain list mutation, immune to
  // any startup-time path isolation) before importing anything.
  const bootstrap = `import sys; sys.path.insert(0, ${JSON.stringify(projectRoot)}); import backend.app.main`
  execFileSync(pythonExe, ['-c', bootstrap], {
    cwd: projectRoot,
    stdio: 'pipe',
  })
} catch (err) {
  console.error('\n❌ python-embed exists, but cannot import the backend.')
  console.error('This means a required package is missing or broken:\n')
  console.error((err.stderr || err.stdout || err.message || '').toString())
  console.error('Fix this before building — otherwise the installer will reproduce this')
  console.error('exact "Failed to start Luca" error for every person who installs it.\n')
  console.error('Likely fix: python-embed/python.exe -m pip install -r requirements.txt\n')
  process.exit(1)
}

console.log('✅ python-embed can import the backend successfully — safe to build.\n')
