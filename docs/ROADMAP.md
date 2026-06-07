# Roadmap — Tapila Inventory

## Phase 1 — MVP (current)
- [x] Single-file React app with all 6 modules
- [x] localStorage persistence
- [x] AI scan for indent forms (Claude vision)
- [x] Stock depletion tracking with progress bars
- [x] Dashboard KPIs

## Phase 2 — Modular Frontend
- [ ] Split into Vite project with proper file structure
- [ ] Extract `COLORS` to `styles/colors.js`
- [ ] Extract reusable components (Btn, Card, Input, Select, Table, Badge)
- [ ] Extract screens to `screens/<Module>/index.jsx`
- [ ] Move AI scan to backend proxy (`POST /api/scan/indent`)
- [ ] Fix missing `x-api-key` header bug in scan

## Phase 3 — Backend API
- [ ] Express server with routes for all 6 modules
- [ ] SQLite via `better-sqlite3`
- [ ] Input validation with Zod
- [ ] Replace localStorage with API calls (`useApi` hook)
- [ ] Claude service wrapper with retry logic

## Phase 4 — Auth & Multi-user
- [ ] Role definitions: Admin, Storekeeper, Department Head
- [ ] JWT auth with login screen
- [ ] Department Heads can only see their own indent/production screens
- [ ] Storekeeper sees issuance + full stock
- [ ] Admin sees everything + dashboard

## Phase 5 — Reports & Analytics
- [ ] Daily summary report (PDF export)
- [ ] Weekly waste report (leftover % per dept)
- [ ] Stock consumption trend chart
- [ ] Low-stock email/SMS alert

## Phase 6 — Advanced Features
- [ ] Supplier master (name, contact, items supplied)
- [ ] Purchase orders linked to stock entries
- [ ] Recipe module (ingredients per dish)
- [ ] Auto material calculation from production plan
- [ ] Mobile-responsive / PWA for storekeeper on phone

## Phase 7 — Production Deployment
- [ ] PostgreSQL on VPS
- [ ] nginx reverse proxy
- [ ] PM2 process manager
- [ ] SSL via Let's Encrypt
- [ ] Daily DB backup to S3 or local
