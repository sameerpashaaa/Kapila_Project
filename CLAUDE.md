# Tapila Inventory System — Claude Instructions

## Project Identity
- **Project:** Hotel Tapila Inventory Management System
- **Stack:** React (Vite), Node.js/Express backend (planned), SQLite or PostgreSQL
- **Current state:** Single-file MVP (`tapila_inventory.jsx`) — expanding into full modular architecture
- **Style:** Dark theme UI, DM Serif Display + DM Sans fonts, gold accent `#e8a838`

## Architecture (Target)
```
tapila/
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
└── CLAUDE.md          # ← you are here
```

## Modules
1. **Stock** — Incoming purchases from suppliers
2. **Indent** — Department nightly material requests
3. **Issuance** — Storekeeper issues goods, AI scan of paper forms
4. **Production** — Plates/portions logged per department
5. **Leftovers** — Unsold food carried forward
6. **Dashboard** — Cross-module KPIs and alerts

## Departments (fixed list)
`South Indian | North Indian | Continental | Juices | Bakery | Chinese`

## Coding Rules
- Never add features beyond what the current task requires
- No comments unless the WHY is non-obvious
- No backwards-compat shims — just change the code
- All monetary/qty values are `float`, dates are `YYYY-MM-DD` strings
- `localStorage` keys are namespaced: `tapila_*`
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
