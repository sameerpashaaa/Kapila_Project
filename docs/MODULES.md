# Module Reference — Tapila Inventory

## 1. Stock (Purchase & Store)
**Owner screen:** `screens/Stock/index.jsx`
**API routes:** `routes/stock.js`

### Business Rules
- Each stock entry tracks `qty` (original) and `remaining` (decremented on issuance)
- `remaining` can never go below 0
- Low-stock alert threshold: `remaining / qty < 0.25`
- Deleting a stock item does not retroactively adjust issuance history

### Fields
```
name, qty (float), unit, date (received), remaining (float)
```

---

## 2. Indent (Department Requisition)
**Owner screen:** `screens/Indent/index.jsx`
**API routes:** `routes/indents.js`

### Business Rules
- Indents are submitted by department heads nightly for next-day needs
- One indent per department per date (soft rule — not enforced in MVP)
- Status lifecycle: `pending → issued` (or `cancelled`)
- Items have no unit on indent — unit is resolved from stock at issuance time
- Indent items autocomplete from current stock names

### Fields
```
dept, date (needed), items[]{name, qty}, status
```

---

## 3. Issuance (Store Issue)
**Owner screen:** `screens/Issuance/index.jsx`
**Owner component:** `screens/Issuance/ScanPanel.jsx`
**API routes:** `routes/issuances.js`, `routes/scan.js`

### Business Rules
- Storekeeper can issue from a pending indent (manual) or from a scanned form (AI)
- Issued quantities can differ from requested quantities
- On issue: stock `remaining` is decremented for each matched item (name match, case-insensitive)
- Indent status set to `issued` after manual issuance
- Scanned issuances have `scanned: true`, `indent_id: null`
- Items not found in stock still get recorded (no blocking constraint)

### AI Scan Rules
- Image sent to backend → Claude API
- Claude extracts `{dept, date, items[]{name, qty}}`
- If Claude cannot parse, error is surfaced to user — no silent failure
- Parsed result shown for user confirmation before saving (future enhancement)

### Fields
```
indentId (nullable), dept, date, scanned (bool), items[]{name, qty, issued}
```

---

## 4. Production Tracking
**Owner screen:** `screens/Production/index.jsx`
**API routes:** `routes/production.js`

### Business Rules
- One entry per department per date (soft rule)
- `plates` is the count of portions/plates prepared that day
- Cross-references issuances on same dept+date to show material-to-plate correlation
- No automatic calculation — manual entry only in MVP

### Fields
```
dept, date, plates (int), notes (optional text)
```

---

## 5. Leftover Tracking
**Owner screen:** `screens/Leftovers/index.jsx`
**API routes:** `routes/leftovers.js`

### Business Rules
- Records unsold prepared food at end of day
- `carried_forward` flag indicates it was counted and noted (not re-stocked to raw store)
- Summary cards show total plates produced vs total leftover per department
- Leftover rate = `leftover qty / production plates` (future metric)

### Fields
```
dept, date, item (dish name), qty (float), unit, carried_forward (bool)
```

---

## 6. Dashboard
**Owner screen:** `screens/Dashboard/index.jsx`
**API routes:** `routes/dashboard.js`

### KPI Cards
| Metric            | Calculation                                |
|-------------------|--------------------------------------------|
| Stock items       | COUNT(stock)                               |
| Low stock         | COUNT where remaining/qty < 0.25           |
| Pending indents   | COUNT(indents) where status = pending      |
| Today's issuances | COUNT(issuances) where date = today        |
| Plates today      | SUM(production.plates) where date = today  |
| Leftovers today   | COUNT(leftovers) where date = today        |

### Department Table
Per-department aggregates: total plates, issuance count, leftover count

### Stock Alerts
Items below 25% remaining — shown with mini progress bar

---

## Planned Future Modules
- **Reports** — Daily/weekly PDF export per department
- **Suppliers** — Supplier master, purchase order tracking
- **Users/Auth** — Role-based: Admin, Storekeeper, Department Head
- **Recipes** — Ingredient-to-plate mapping for auto material calculation
- **Billing** — Cost per plate based on material costs
