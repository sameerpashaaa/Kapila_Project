# Kapila Inventory System — Codex Instructions

## Project Identity
- **Project:** Hotel Kapila Inventory Management System
- **Stack:** React (Vite), Node.js/Express backend (planned), SQLite or PostgreSQL
- **Current state:** Single-file MVP (`kapila_inventory.jsx`) — expanding into full modular architecture
- **Style:** Dark theme UI, DM Serif Display + DM Sans fonts, gold accent `#e8a838`

## Architecture (Target)
```
kapila/
├── frontend/          # React + Vite app
│   ├── src/
│   │   ├── components/    # Reusable UI (Btn, Card, Table, Input…)
│   │   ├── screens/       # One folder per module
│   │   ├── hooks/         # useStorage, useApi, useAuth…
│   │   ├── context/       # AppContext, AuthContext
│   │   ├── api/           # API client functions
│   │   └── styles/        # COLORS, CSS constants
│   └── public/
├── backend/           # Express API server
│   ├── routes/        # One file per domain
│   ├── controllers/
│   ├── models/        # DB models / queries
│   ├── middleware/    # auth, validation, error handling
│   └── db/            # migrations, seeds
├── docs/              # All .md documentation
└── AGENTS.md          # ← you are here
```

## Modules
1. **Stock** — Incoming purchases from suppliers
   - *Voice Capturing & OCR*: Multi-language speech recognition (Telugu `te-IN`, Hindi `hi-IN`, English `en-IN`, Tamil, Kannada, etc.) & receipt scans (Codex 3.5 Sonnet).
   - *Alerts & POs*: WhatsApp PO generation (`https://wa.me/?text=...`) and clipboard copying for low stock items.
   - *Supplier Comparisons*: Auto-ranking active supplier rates under item input to recommend the cheapest.
   - *Expiry tracking*: Spoilage warning widget displaying items expiring in under 3 days.
2. **Indent** — Department nightly material requests
3. **Issuance** — Storekeeper issues goods, AI scan of paper forms
4. **Production** — Plates/portions logged per department
5. **Leftovers** — Unsold food carried forward
6. **Dashboard** — Cross-module KPIs and alerts

## Departments (fixed list)
`TIFFINS | STAFF | SI-MEALS | NORTH INDIAN | CHAT & SOFTY | CHINESE & DOSA | MOCKTAILS & CONTINENTAL | RESTAURANT | ROOM SERVICE`

## Coding Rules
- Never add features beyond what the current task requires
- No comments unless the WHY is non-obvious
- No backwards-compat shims — just change the code
- All monetary/qty values are `float`, dates are `YYYY-MM-DD` strings
- `localStorage` keys are namespaced: `kapila_*`
- API calls must include `x-api-key` header for Anthropic endpoints
- Prefer editing existing files over creating new ones

## Known Bugs
- `handleScan` in IssuanceScreen (line 292) is missing `x-api-key` header → 401

## Commands
```bash
# Frontend
cd frontend && npm run dev
cd frontend && npm run build

# Backend (when scaffolded)
cd backend && npm run dev
```

## Agents
- See `AGENT.md` for agent roles and responsibilities
- See `docs/` for module-specific documentation
