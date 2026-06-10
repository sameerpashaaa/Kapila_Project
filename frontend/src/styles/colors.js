export const COLORS = {
  brand:     "#10b981", // Emerald green — primary actions, active nav
  brandDark: "#059669", // Darker emerald for hover states
  brandLight:"#ecfdf5", // Very light mint — hover backgrounds
  success:   "#10b981", // Positive states (same as brand)
  warning:   "#f59e0b", // Watch/caution states
  danger:    "#ef4444", // Errors, critical alerts
  text:      "#1e293b", // Body text
  muted:     "#64748b", // Labels, subtitles
  bg:        "var(--color-bg-page)", // Page background (barely-blue white)
  surface:   "var(--color-bg-card)", // Cards, panels
  border:    "var(--color-border)", // Borders, dividers

  // Legacy aliases to prevent breaking other screens
  accent:    "#10b981",
  accentDim: "#059669",
  coral:     "#ef4444",
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
    --text-label:  11px;    /* uppercase column headers, form labels */
    --text-data:   13px;    /* table data, body text */
    --text-body:   13.5px;  /* paragraphs, descriptions */
    --text-kpi:    20px;    /* KPI values */
    --text-title:  15px;    /* Section / panel titles */

    /* --- Spacing --- */
    --gap-xs: 4px;
    --gap-sm: 8px;
    --gap-md: 16px;
    --gap-lg: 24px;
    
    /* --- Sidebar --- */
    --sidebar-bg: #1e293b;
    --sidebar-border: #334155;
    --sidebar-text: #94a3b8;
    --sidebar-active-bg: #10b981;
    --sidebar-hover-bg: #334155;
    --sidebar-category: #475569;

    /* --- Kapila IMS Stock Master Redesign Tokens --- */
    --color-bg-page:        #F4F6F9;
    --color-bg-card:        #FFFFFF;
    --color-bg-sidebar:     #0F172A;
    --color-accent-green:   #10B981;
    --color-accent-green-light: #D1FAE5;
    --color-accent-amber:   #F59E0B;
    --color-accent-amber-light: #FEF3C7;
    --color-accent-red:     #EF4444;
    --color-accent-red-light: #FEE2E2;
    --color-accent-blue:    #3B82F6;
    --color-accent-blue-light: #EFF6FF;
    --color-text-primary:   #111827;
    --color-text-secondary: #6B7280;
    --color-text-muted:     #9CA3AF;
    --color-border:         #E5E7EB;
    --color-border-strong:  #D1D5DB;
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
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
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
  table { width: 100%; border-collapse: collapse; font-size: var(--text-data); }
  th {
    text-align: left;
    padding: 10px 16px;
    color: var(--color-text-secondary);
    font-weight: 600;
    font-size: var(--text-label);
    letter-spacing: 0.07em;
    text-transform: uppercase;
    border-bottom: 1px solid var(--color-border);
    background: #f8fafc;
    white-space: nowrap;
  }
  td {
    padding: 11px 16px;
    border-bottom: 1px solid var(--color-border);
    vertical-align: middle;
    font-size: var(--text-data);
    color: var(--color-text-primary);
  }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: #f0fdf4; }
  tr:hover .row-actions { opacity: 1; }
  .row-actions { transition: opacity 0.15s; opacity: 0.4; }
  .row-actions:hover { opacity: 1; }
  .danger-hover:hover { color: var(--color-accent-red) !important; border-color: var(--color-accent-red) !important; }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
  }
  .stock-table th, .stock-table td { padding: 10px 14px; }
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

