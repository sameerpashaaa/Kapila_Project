# Frontend Documentation — Tapila Inventory

## Stack
- React 18 (Vite)
- No CSS framework — inline styles + global `css` string injected via `<style>`
- No TypeScript yet (add when team grows)
- State: React useState + localStorage via `useStorage` hook
- Router: React Router v6 (or screen-state pattern used in MVP)

## File Structure
```
frontend/src/
├── main.jsx              # entry point
├── App.jsx               # root, nav, screen router
├── styles/
│   └── colors.js         # COLORS constant — single source of truth
├── components/           # stateless reusable UI
│   ├── Btn.jsx
│   ├── Card.jsx
│   ├── Input.jsx
│   ├── Select.jsx
│   ├── Section.jsx
│   ├── Table.jsx
│   └── Badge.jsx
├── hooks/
│   ├── useStorage.js     # localStorage persistence
│   └── useApi.js         # fetch wrapper with error handling
├── api/
│   └── claude.js         # Anthropic API proxy calls (→ backend)
├── context/
│   └── AppContext.jsx    # global state (stock, indents, etc.)
└── screens/
    ├── Dashboard/
    │   └── index.jsx
    ├── Stock/
    │   └── index.jsx
    ├── Indent/
    │   └── index.jsx
    ├── Issuance/
    │   ├── index.jsx
    │   └── ScanPanel.jsx
    ├── Production/
    │   └── index.jsx
    └── Leftovers/
        └── index.jsx
```

## Component Conventions
- All reusable UI components accept `style` prop for overrides
- Never hardcode `#hex` values — import from `styles/colors.js`
- No prop drilling past 2 levels — use context
- Form state is local to the screen component

## COLORS Reference
```js
export const COLORS = {
  bg:        "#0f1117",
  surface:   "#181c27",
  card:      "#1e2333",
  border:    "#2a3050",
  accent:    "#e8a838",   // gold — primary CTA, active nav
  accentDim: "#b07a1a",
  teal:      "#2dd4bf",   // positive metrics
  coral:     "#f87171",   // warnings / danger
  purple:    "#a78bfa",   // secondary metrics
  text:      "#e8e9f0",
  muted:     "#7a8098",
  success:   "#4ade80",
};
```

## Navigation
Nav items are defined in `App.jsx` as `NAV` array:
```js
{ id: "dashboard" | "stock" | "indent" | "issuance" | "production" | "leftover",
  label: string,
  icon: emoji }
```
Active screen stored in `useState("dashboard")`.

## Data Storage (MVP — localStorage)
| Key                  | Contains              |
|----------------------|-----------------------|
| `tapila_stock`       | stock[]               |
| `tapila_indents`     | indent[]              |
| `tapila_issuances`   | issuance[]            |
| `tapila_production`  | production[]          |
| `tapila_leftovers`   | leftover[]            |

When backend is ready, replace `useStorage` calls with `useApi` + server state.

## AI Scan Feature (Issuance screen)
- User uploads image → `ScanPanel.jsx`
- Frontend POSTs to `POST /api/scan/indent` (backend handles Claude API call)
- Never call `https://api.anthropic.com` directly from browser
- Show loading state during scan; surface errors clearly

## Responsive / Mobile
- Sidebar collapses to bottom nav on mobile (to be implemented)
- Grid layouts switch to single column below 768px
- Touch targets minimum 44px height
