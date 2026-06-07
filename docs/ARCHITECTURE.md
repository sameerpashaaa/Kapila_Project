# Architecture Overview — Tapila Inventory

## System Diagram
```
Browser (React SPA)
      │
      │ HTTPS
      ▼
   nginx
   ├── /          → frontend/dist (static)
   └── /api/*     → backend:3001 (Express)
                        │
                        ├── SQLite (dev) / PostgreSQL (prod)
                        └── Anthropic API (Claude — OCR/AI features)
```

## Data Flow per Module

### Stock Entry
```
User fills form
  → POST /api/stock
  → validate (name, qty, unit, date)
  → INSERT into stock table
  → return updated stock list
```

### Indent → Issuance
```
Dept submits indent
  → POST /api/indents { dept, date, items[] }
  → status: "pending"

Storekeeper issues:
  → POST /api/issuances { indentId, items[]{name, issued} }
  → PATCH /api/stock/:id  (deduct remaining for each item)
  → PATCH /api/indents/:id { status: "issued" }
```

### AI Scan (Issuance)
```
User uploads image
  → POST /api/scan/indent  (multipart)
  → backend: send to Claude API with base64 image
  → Claude returns { dept, date, items[] }
  → backend validates + saves as issuance
  → return parsed result
```

## Database Schema (target)

### stock
| column     | type    | notes                   |
|------------|---------|-------------------------|
| id         | integer | PK autoincrement        |
| name       | text    | item name               |
| qty        | real    | original quantity       |
| remaining  | real    | decremented on issuance |
| unit       | text    | kg/g/L/ml/pcs/dozen/box |
| date       | text    | YYYY-MM-DD              |
| created_at | text    | ISO timestamp           |

### indents
| column     | type    | notes                        |
|------------|---------|------------------------------|
| id         | integer | PK                           |
| dept       | text    | one of 6 departments         |
| date       | text    | YYYY-MM-DD                   |
| status     | text    | pending / issued / cancelled |
| created_at | text    |                              |

### indent_items
| column    | type    | notes          |
|-----------|---------|----------------|
| id        | integer | PK             |
| indent_id | integer | FK → indents   |
| name      | text    |                |
| qty       | real    |                |

### issuances
| column     | type    | notes               |
|------------|---------|---------------------|
| id         | integer | PK                  |
| indent_id  | integer | FK nullable (scan)  |
| dept       | text    |                     |
| date       | text    |                     |
| scanned    | integer | 0/1 boolean         |
| created_at | text    |                     |

### issuance_items
| column       | type    | notes           |
|--------------|---------|-----------------|
| id           | integer | PK              |
| issuance_id  | integer | FK → issuances  |
| name         | text    |                 |
| qty          | real    | requested       |
| issued       | real    | actually issued |

### production
| column     | type    | notes                |
|------------|---------|----------------------|
| id         | integer | PK                   |
| dept       | text    |                      |
| date       | text    |                      |
| plates     | integer |                      |
| notes      | text    | nullable             |
| created_at | text    |                      |

### leftovers
| column          | type    | notes           |
|-----------------|---------|-----------------|
| id              | integer | PK              |
| dept            | text    |                 |
| date            | text    |                 |
| item            | text    |                 |
| qty             | real    |                 |
| unit            | text    |                 |
| carried_forward | integer | 0/1             |
| created_at      | text    |                 |

## Environment Variables
```
# backend/.env
PORT=3001
DB_PATH=./db/tapila.sqlite         # dev
DATABASE_URL=postgres://...        # prod
ANTHROPIC_API_KEY=sk-ant-...
JWT_SECRET=...
NODE_ENV=development
```

## API Base URL
- Dev: `http://localhost:3001/api`
- Prod: `https://<domain>/api`
