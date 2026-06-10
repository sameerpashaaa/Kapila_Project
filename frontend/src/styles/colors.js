export const COLORS = {
  // Primary — Indigo (replaces emerald green)
  brand:      "#4F46E5",   // Indigo — primary actions, active nav
  brandDark:  "#4338CA",   // Darker indigo for hover states
  brandLight: "#EEF2FF",   // Very light indigo — hover backgrounds, focus rings
  
  // Semantic states
  success:    "#10b981",   // Emerald — positive states (keep)
  warning:    "#f59e0b",   // Amber — caution states (keep)
  danger:     "#ef4444",   // Red — errors, critical
  info:       "#3b82f6",   // Blue — informational states
  
  // Text
  text:       "#1e293b",   // Slate-800
  muted:      "#64748b",   // Slate-500
  
  // Surfaces
  bg:         "var(--color-bg-page)",
  surface:    "var(--color-bg-card)",
  border:     "var(--color-border)",
  
  // Chart palette
  chart1:     "#4F46E5",   // Indigo
  chart2:     "#8B5CF6",   // Violet
  chart3:     "#A78BFA",   // Light violet
  chart4:     "#C4B5FD",   // Lavender
  chart5:     "#10b981",   // Emerald accent
  
  // Legacy aliases
  accent:     "#4F46E5",
  accentDim:  "#4338CA",
  coral:      "#ef4444",
  teal:       "#10b981",
  purple:     "#8b5cf6",
  primary:    "#4F46E5",
  neutral:    "#64748b",
  card:       "var(--color-bg-card)",
};

export const DEPARTMENTS = [
  "South Indian", "North Indian", "Continental", "Juices", "Bakery", "Chinese",
];

export const UNITS = ["kg", "g", "L", "ml", "pcs", "dozen", "box", "plates", "portions"];

export const globalCss = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');

  :root {
    /* --- Type Scale --- */
    --text-label:  12px;    /* form labels, small headers */
    --text-data:   13.5px;  /* table data, regular text */
    --text-body:   14px;    /* body text, descriptions */
    --text-kpi:    24px;    /* KPI values */
    --text-title:  15px;    /* Section / panel titles */

    /* --- Spacing --- */
    --gap-xs: 4px;
    --gap-sm: 8px;
    --gap-md: 16px;
    --gap-lg: 24px;
    
    /* --- Sidebar (LIGHT theme) --- */
    --sidebar-bg:         #FFFFFF;
    --sidebar-border:     #E5E7EB;
    --sidebar-text:       #6B7280;
    --sidebar-text-hover: #1F2937;
    --sidebar-active-bg:  #4F46E5;
    --sidebar-active-text:#FFFFFF;
    --sidebar-hover-bg:   #F3F4F6;
    --sidebar-category:   #9CA3AF;

    /* --- Kapila IMS Stock Master Redesign Tokens --- */
    --color-bg-page:        #F5F7FA;
    --color-bg-card:        #FFFFFF;
    --color-bg-sidebar:     #FFFFFF;
    --color-accent-primary: #4F46E5;
    --color-accent-primary-light: #EEF2FF;
    --color-accent-green:   #10B981;
    --color-accent-green-light: #ECFDF5;
    --color-accent-amber:   #F59E0B;
    --color-accent-amber-light: #FEF3C7;
    --color-accent-red:     #EF4444;
    --color-accent-red-light: #FEF2F2;
    --color-accent-blue:    #3B82F6;
    --color-accent-blue-light: #EFF6FF;
    --color-text-primary:   #1E293B;
    --color-text-secondary: #475569;
    --color-text-muted:     #64748B;
    --color-border:         #E5E7EB;
    --color-border-strong:  #D1D5DB;
    --radius-sm:            8px;
    --radius-md:            12px;
    --radius-lg:            16px;
    --shadow-card:          0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06);
    --shadow-card-hover:    0 4px 6px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.06);
    --shadow-sidebar:       1px 0 3px rgba(0,0,0,0.04);
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; }
  body {
    background: var(--color-bg-page);
    color: var(--color-text-primary);
    font-family: 'Inter', system-ui, sans-serif;
    font-size: var(--text-body);
    height: 100%;
    font-variant-numeric: tabular-nums;
    font-feature-settings: "tnum";
    -webkit-font-smoothing: antialiased;
  }
  #root { height: 100%; }
  
  /* --- Scrollbar Styling --- */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
  
  input, select, textarea {
    background: #ffffff;
    border: 1px solid var(--color-border);
    color: var(--color-text-primary);
    border-radius: 8px;
    padding: 8px 12px;
    font-family: 'Inter', sans-serif;
    font-size: var(--text-data);
    outline: none;
    width: 100%;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  input:focus, select:focus, textarea:focus {
    border-color: var(--color-accent-primary);
    box-shadow: 0 0 0 3px var(--color-accent-primary-light);
  }
  select option { background: #ffffff; color: var(--color-text-primary); }
  button { cursor: pointer; font-family: 'Inter', sans-serif; font-size: var(--text-data); font-weight: 500; border: none; border-radius: 8px; transition: all 0.15s; }
  
  /* --- Table Styling --- */
  table { width: 100%; border-collapse: collapse; font-size: var(--text-data); }
  th {
    text-align: left;
    padding: 12px 16px;
    color: var(--color-text-secondary);
    font-weight: 600;
    font-size: var(--text-label);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    border-bottom: 1px solid var(--color-border);
    background: #f8fafc;
    white-space: nowrap;
  }
  td {
    padding: 12px 16px;
    border-bottom: 1px solid var(--color-border);
    vertical-align: middle;
    font-size: var(--text-data);
    color: var(--color-text-primary);
    transition: background-color 0.15s ease;
  }
  tr:last-child td { border-bottom: none; }
  tr:nth-child(even) td { background: #f8fafc; }
  tr:hover td { background: var(--color-accent-primary-light); }
  
  /* --- Row Actions --- */
  .row-actions { transition: opacity 0.15s; opacity: 0.7; }
  tr:hover .row-actions { opacity: 1; }
  .row-actions:hover { opacity: 1; }
  .danger-hover:hover { color: var(--color-accent-red) !important; border-color: var(--color-accent-red) !important; }
  
  /* --- Badge & Chip Utilities --- */
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
  }
  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    line-height: 1;
    white-space: nowrap;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 100px;
    font-size: 13px;
    font-weight: 500;
    background: #f1f5f9;
    color: #475569;
    border: 1px solid #e2e8f0;
    transition: all 0.15s ease;
    cursor: pointer;
    user-select: none;
  }
  .chip:hover {
    background: #e2e8f0;
    color: #0f172a;
    border-color: #cbd5e1;
  }
  .chip.active {
    background: var(--color-accent-primary-light);
    color: var(--color-accent-primary);
    border-color: var(--color-accent-primary);
  }

  .stock-table th, .stock-table td { padding: 12px 14px; }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
  .pulse { animation: pulse 2s infinite; }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .fade-in { animation: fadeIn 0.2s ease-out; }
`;


