export const COLORS = {
  brand:     "#10b981", // Emerald green — primary actions, active nav
  brandDark: "#059669", // Darker emerald for hover states
  brandLight:"#ecfdf5", // Very light mint — hover backgrounds
  success:   "#10b981", // Positive states (same as brand)
  warning:   "#f59e0b", // Watch/caution states
  danger:    "#ef4444", // Errors, critical alerts
  text:      "#1e293b", // Body text
  muted:     "#64748b", // Labels, subtitles
  bg:        "#f8fafc", // Page background (barely-blue white)
  surface:   "#ffffff", // Cards, panels
  border:    "#e2e8f0", // Borders, dividers

  // Legacy aliases to prevent breaking other screens
  accent:    "#10b981",
  accentDim: "#059669",
  coral:     "#ef4444",
  teal:      "#10b981",
  purple:    "#8b5cf6",
  primary:   "#8b5cf6",
  neutral:   "#64748b",
  card:      "#ffffff",
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
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; }
  body {
    background: ${COLORS.bg};
    color: ${COLORS.text};
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
    border: 1px solid ${COLORS.border};
    color: ${COLORS.text};
    border-radius: 8px;
    padding: 8px 12px;
    font-family: 'Inter', sans-serif;
    font-size: var(--text-data);
    outline: none;
    width: 100%;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  input:focus, select:focus, textarea:focus {
    border-color: ${COLORS.brand};
    box-shadow: 0 0 0 3px ${COLORS.brand}20;
  }
  select option { background: #ffffff; color: ${COLORS.text}; }
  button { cursor: pointer; font-family: 'Inter', sans-serif; font-size: var(--text-data); font-weight: 500; border: none; border-radius: 8px; transition: all 0.15s; }
  table { width: 100%; border-collapse: collapse; font-size: var(--text-data); }
  th {
    text-align: left;
    padding: 10px 16px;
    color: #475569;
    font-weight: 600;
    font-size: var(--text-label);
    letter-spacing: 0.07em;
    text-transform: uppercase;
    border-bottom: 1px solid ${COLORS.border};
    background: #f8fafc;
    white-space: nowrap;
  }
  td {
    padding: 11px 16px;
    border-bottom: 1px solid ${COLORS.border}88;
    vertical-align: middle;
    font-size: var(--text-data);
    color: #334155;
  }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: #f0fdf4; }
  tr:hover .row-actions { opacity: 1; }
  .row-actions { transition: opacity 0.15s; opacity: 0.4; }
  .row-actions:hover { opacity: 1; }
  .danger-hover:hover { color: ${COLORS.danger} !important; border-color: ${COLORS.danger} !important; }
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
    0%,100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(0.9); }
  }
  .pulse { animation: pulse 1.8s infinite ease-in-out; }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .fade-in { animation: fadeIn 0.2s ease-out; }
`;
