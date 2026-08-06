# CLAUDE.md — Luca by Ledger AI
> Read this first. Every session starts here.

## Project Overview
- **Product:** Luca — local-first AI bookkeeping & tax assistant for small business owners
- **Company:** Ledger AI (parent) / Luca (first product)
- **Founder:** Astrid
- **Repo:** https://github.com/kulves/ledgerai.git (private)
- **Local path:** ~/Documents/ledgerai (Windows, user: karla)
- **Status:** Phase 1 complete (18 modules). Mid-redesign (Phase 2).
- **Three-AI dev team:** Claude (lead), Grok (xAI), ChatGPT/Gemini (verification)

---

## Core Stack
- **Backend:** Python 3.12.7, FastAPI + uvicorn, SQLite (pysqlite3), ChromaDB + sentence-transformers RAG
- **Frontend:** React + Vite + Tailwind v4, Electron desktop packaging
- **AI:** Ollama (pinned v0.24.0), llama3.2:1b (chat), llama3.2-vision (OCR/documents)
- **Python embed:** ledgerai/python-embed/ (embeddable Python for installer, NOT venv)
- **Shell:** Git Bash + PowerShell on Windows 11

---

## Startup Commands
```bash
# Terminal 1 — backend
cd ~/Documents/ledgerai && source venv/Scripts/activate && python -m backend.app.main

# Terminal 2 — frontend
cd ~/Documents/ledgerai/frontend && npm run dev

# Ollama (must be running v0.24.0)
# Check system tray. If not running: ollama serve
# CRITICAL: set $env:OLLAMA_NEW_ENGINE="false" before serving

# Rebuild knowledge base (after any KB entry changes)
python -m backend.app.luca.build_kb

# Build installer
cd frontend && npm run build && npx electron-builder
```

---

## File Structure (current)
```
ledgerai/
├── backend/app/
│   ├── config.py          # Settings class — uses .version not .app_version
│   ├── database.py        # SQLite init — 5 tables: businesses, expenses, mileage_trips, documents, license
│   ├── main.py            # FastAPI app, all routers included
│   ├── luca/
│   │   ├── engine.py      # LucaEngine — chat() and read_document()
│   │   ├── rag_engine.py  # RAG search — MAX_DISTANCE_THRESHOLD=0.52, query aliases
│   │   ├── build_kb.py    # Builds ChromaDB embeddings from knowledge_base/entries/
│   │   └── prompts/       # base.txt, categorize.txt, knowledge.txt
│   ├── models/            # business.py, expense.py, mileage.py, license.py
│   └── routes/
│       ├── businesses.py, dashboard.py, documents.py, expenses.py
│       ├── license.py, luca.py, mileage.py, reports.py, settings.py, setup.py
├── frontend/src/
│   ├── App.jsx            # Root — sidebar layout, lifted selectedBusiness state, dark/light/system theme
│   ├── index.css          # CSS variables for dark/light theme, Tailwind v4
│   ├── components/
│   │   ├── Sidebar.jsx         # Collapsible left nav, business selector, user profile
│   │   ├── ParticlesHeader.jsx # LedgerPro-style header, particles canvas, theme switcher
│   │   ├── ExpenseForm.jsx, ExpenseList.jsx, OnboardingFlow.jsx, OllamaSetup.jsx
│   ├── pages/
│   │   ├── DashboardPage.jsx   # Stat cards + Line chart + Donut chart + Recent transactions
│   │   ├── ExpensesPage.jsx    # Receipt drop zone + auto-categorize + expense list
│   │   ├── ChatPage.jsx        # Luca AI chat with conversation history
│   │   ├── MileagePage.jsx, DocumentsPage.jsx, ReportsPage.jsx
│   │   ├── SettingsPage.jsx, SubscriptionPage.jsx
│   └── services/api.js
├── knowledge_base/
│   ├── entries/           # 46 JSON entries (2 original + 44 new, three-AI verified)
│   └── embeddings/        # ChromaDB persistent storage
├── python-embed/          # Embeddable Python for installer (NOT in git)
├── dist-installer/        # Built installer (NOT in git)
├── poppler/               # PDF→image conversion (poppler-24.08.0)
└── CLAUDE.md              # This file
```

---

## Critical Rules (never break these)
1. **Never recreate** `frontend/tailwind.config.js` or `frontend/postcss.config.js` — deleted intentionally for Tailwind v4
2. **Never commit** `dist-installer/`, `python-embed/`, `frontend/dist/` — in .gitignore, too large for GitHub
3. **Ollama version** must be 0.24.0 — 0.30.x breaks llama3.2-vision (mllama architecture)
4. **num_ctx:512** required in all Ollama API calls — RAM management on 16GB machines
5. **config.py** uses `config.version` not `config.app_version`
6. **license_signing_key** field must exist in config.py Settings class
7. **python-embed/python.exe** must exist before building installer — re-extract from zip if missing
8. **build_kb.py** supports both old flat schema (entry["source"]) and new nested (entry["irs_source"]["publication"])
9. **ChromaDB** pinned to chromadb==1.5.9, sentence-transformers==5.5.1

---

## Git Workflow
```bash
# Normal push
git add . && git commit -m "message" && git push origin main

# If push fails due to large files (happens when dist-installer/ gets staged):
git filter-repo --invert-paths --path dist-installer/ --path python-embed/ --path frontend/dist/ --force
git remote add origin https://github.com/kulves/ledgerai.git
git push origin main --force
```

---

## Theme System (CSS Variables)
`frontend/src/index.css` has three blocks — order matters:
```css
:root {
  --font-display: ...;
  --font-mono: ...;
}
:root, [data-theme="dark"] {
  --topbar-bg: linear-gradient(135deg, #060F1E 0%, #0A1628 45%, #0C2340 100%);
  --bg: #0a0e16; --sidebar-bg: #0c1018; --card: #111827; --card-2: #0f1623;
  --border: rgba(255,255,255,0.08); --border-soft: rgba(255,255,255,0.05);
  --hover: rgba(255,255,255,0.06); --text-0: #F1F5F9; --text-1: #94A3B8;
  --text-2: #475569; --accent: #22D3EE; --accent-muted: rgba(34,211,238,0.12);
  --gold: #C9962C; --green: #34D399; --red: #FB7185;
}
[data-theme="light"] {
  --topbar-bg: #FFFFFF; --bg: #F8FAFC; --sidebar-bg: #0C2340;
  --card: #FFFFFF; --card-2: #F1F5F9; --border: rgba(0,0,0,0.08);
  --text-0: #0F172A; --text-1: #475569; --text-2: #94A3B8; --accent: #0891B2;
}
```
Theme stored in localStorage as `luca_theme` (dark/light/system).
Applied via `document.documentElement.setAttribute('data-theme', resolved)` in App.jsx.

---

## App Layout (current — post redesign)
```
App.jsx
├── OllamaSetup (first run only — checks Ollama + downloads models)
├── OnboardingFlow (first run only — 8 steps)
└── Main layout:
    ├── <Sidebar> — collapsible left nav, business dropdown, Ask Luca, Connected Banks, theme, user profile
    └── Right side:
        ├── <ParticlesHeader> — LedgerPro style, particles canvas, title, theme switcher, Online dot, avatar
        └── <main> — active page content
```

State lifted to App.jsx:
- `activeTab` — current page
- `selectedBusiness` — shared across all pages
- `businesses` — loaded once on startup
- `theme` — dark/light/system
- `onboarded` — localStorage `luca_onboarded`
- `ollamaSetupDone` — localStorage `luca_ollama_setup_done`

---

## Knowledge Base
- **46 entries** in `knowledge_base/entries/`
- **Schema:** id, knowledge_version, topic, title, audience, applies_to, irs_source, jurisdiction, confidence, review_status, last_reviewed_by, summary, content, related_articles, luca_flags
- **RAG threshold:** MAX_DISTANCE_THRESHOLD = 0.52 (raised from 0.50 to catch mileage queries)
- **Query aliases:** in rag_engine.py — maps "mileage rate" → expanded vehicle expenses query
- **Categories:** Business Income (7), Business Deductions (10), Entity & Structure (6), Retirement (3), Tax Credits (5), Record Keeping (7), Deductions Often Missed (4), Luca App Help (2)
- **Rebuild command:** `python -m backend.app.luca.build_kb`
- **Three-AI verified:** Claude + Grok + ChatGPT (see LedgerAI_KnowledgeBase_v1_APPROVED.pdf)

---

## License System
- **Tiers:** Free (25 tx/month, 5 OCR, 1 business), Growth ($19.99), Professional ($49.99)
- **Key format:** `LEDGERAI-{TIER}-{SIGNATURE}`
- **Generate test key:**
```bash
python -c "import hashlib; k='change-me-in-production'; t='growth'; print(f'LEDGERAI-{t.upper()}-{hashlib.sha256((t+k).encode()).hexdigest()[:8].upper()}')"
```
- **Signing key** in config.py: `license_signing_key: str = "change-me-in-production"`

---

## PDF Receipt Extraction (documents.py)
Three-path extraction:
1. **Text-based PDFs** (Amazon, bank) — pdfplumber extracts text → regex first, then LLM
2. **Scanned PDFs** (photographed receipts) — pdf2image + poppler converts to PNG → llama3.2-vision
3. **Images** (jpg/png) — sent directly to llama3.2-vision

**Known issue:** Scanned PDFs fail because llama3.2-vision can't load when llama3.2:1b is in memory.
**Fix needed:** Unload chat model before vision OCR, reload after.

Poppler path: `ledgerai/poppler/poppler-24.08.0/Library/bin/`

---

## Pending Work (Phase 2 — in progress)
### Batch A (next):
- [ ] Sidebar: Add Business button in business dropdown
- [ ] documents.py: Unload llama3.2:1b before vision OCR, reload after (fixes scanned receipts)

### Batch B:
- [ ] ExpensesPage: LedgerPro table design (Date/Description/Category pill/Type badge/Amount)

### Batch C:
- [ ] ChatPage: Perplexity-style redesign (centered prompt, "Ask anything" bar)

### Batch D:
- [ ] MileagePage, DocumentsPage, ReportsPage: uniform dark theme design
- [ ] SettingsPage, SubscriptionPage: consistent styling

### Later:
- [ ] Notes field on transactions
- [ ] Search/filter expenses
- [ ] Split transactions
- [ ] Drag images onto Luca Chat for receipt categorization
- [ ] Expanded IRS expense categories (24 complete list)
- [ ] Phase 2 monitoring script for annual KB updates (tools/check_knowledge_base.py)
- [ ] CLAUDE.md: Write it (done — this file)

---

## Known Issues & Fixes
| Issue | Fix |
|---|---|
| Ollama mllama error | Pin to v0.24.0 |
| Ollama memory error | num_ctx:512 in all engine.py calls |
| config.app_version error | Use config.version |
| license_signing_key missing | Add to config.py Settings class |
| Tailwind breaks | Never recreate tailwind.config.js or postcss.config.js |
| Electron python.exe ENOENT | Re-extract python-embed zip, pip install all packages |
| Git large file push rejected | Use git filter-repo to scrub dist-installer/ python-embed/ |
| ChromaDB API changes | Pinned chromadb==1.5.9 |
| Dark theme showing white header | Check :root block — remove duplicate --topbar-bg, keep only in theme blocks |
| Scanned PDF extraction fails | Vision model out of memory — need to unload chat model first |

---

## Documents (locked, in outputs folder)
- LedgerAI_Product_Bible_v18_LOCKED.pdf
- LedgerAI_Developer_Guide_v3_7_LOCKED.pdf
- LedgerAI_KnowledgeBase_v1_APPROVED.pdf (44 entries, three-AI verified)
- LedgerAI_Maintenance_and_Troubleshooting_Guide.pdf
- LedgerAI_Luca_Onboarding_Script.pdf
- LedgerAI_User_Agreement_Draft.md

---

## Installer Notes
- Output: `dist-installer/Luca-Setup-0.1.0.exe`
- Uses `python-embed/` (embeddable Python, NOT venv)
- `python-embed/python.exe` must exist — re-extract zip if missing
- `electron-builder.yml` has `filter: ["**/*"]` on python-embed extraResources
- Rebuild: `cd frontend && npm run build && npx electron-builder`
- After build, verify: `ls dist-installer/win-unpacked/resources/python/*.exe`
