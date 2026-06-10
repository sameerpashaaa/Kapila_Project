export const COLORS = {
  brand:     "#10b981", // Emerald green — primary actions, active nav
  brandDark: "#059669", // Darker emerald for hover states
  brandLight:"#ecfdf5", // Very light mint — hover backgrounds
  success:   "#10b981", // Positive states (same as brand)
  warning:   "#f59e0b", // Watch/caution states
  danger:    "#f43f5e", // Errors, critical alerts (rose)
  text:      "#0f172a", // Body text (slate-950)
  muted:     "#64748b", // Labels, subtitles (slate-500)
  bg:        "var(--color-bg-page)", // Page background (slate-100)
  surface:   "var(--color-bg-card)", // Cards, panels
  border:    "var(--color-border)", // Borders, dividers

  // Legacy aliases to prevent breaking other screens
  accent:    "#10b981",
  accentDim: "#059669",
  coral:     "#f43f5e",
  teal:      "#10b981",
  purple:    "#8b5cf6",
  primary:   "#8b5cf6",
  neutral:   "#64748b",
  card:      "var(--color-bg-card)",
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
    
    /* --- Sidebar --- */
    --sidebar-bg: #0f172a;
    --sidebar-border: #1e293b;
    --sidebar-text: #94a3b8;
    --sidebar-active-bg: #10b981;
    --sidebar-hover-bg: rgba(255, 255, 255, 0.06);
    --sidebar-category: #64748b;

    /* --- Kapila IMS Stock Master Redesign Tokens --- */
    --color-bg-page:        #f1f5f9;
    --color-bg-card:        #ffffff;
    --color-bg-sidebar:     #0f172a;
    --color-accent-green:   #10b981;
    --color-accent-green-light: #ecfdf5;
    --color-accent-amber:   #f59e0b;
    --color-accent-amber-light: #fef3c7;
    --color-accent-red:     #f43f5e;
    --color-accent-red-light: #fff1f2;
    --color-accent-blue:    #3b82f6;
    --color-accent-blue-light: #eff6ff;
    --color-text-primary:   #0f172a;
    --color-text-secondary: #475569;
    --color-text-muted:     #64748b;
    --color-border:         #e2e8f0;
    --color-border-strong:  #cbd5e1;
    --radius-sm:            6px;
    --radius-md:            10px;
    --radius-lg:            14px;
    --shadow-card:          0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
    --shadow-card-hover:    0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04);
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
    border-color: var(--color-accent-green);
    box-shadow: 0 0 0 3px var(--color-accent-green-light);
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
  tr:hover td { background: var(--color-accent-green-light); }
  
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
    background: var(--color-accent-green-light);
    color: var(--color-accent-green);
    border-color: var(--color-accent-green);
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


