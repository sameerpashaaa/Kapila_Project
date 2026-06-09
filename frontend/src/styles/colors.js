export const COLORS = {
  brand:     "#2b5a2b", // Primary actions, active nav
  brandLight:"#e6f0e6", // Hover backgrounds
  success:   "#1D9E75", // Positive states
  warning:   "#BA7517", // Watch/caution states
  danger:    "#E24B4A", // Errors, critical alerts
  text:      "#1e293b", // Body text
  muted:     "#64748b", // Labels, subtitles
  bg:        "#f4f6f5", // Page background
  surface:   "#ffffff", // Cards, panels
  border:    "#e5e8e5", // Borders, dividers
  
  // Legacy aliases to prevent breaking other screens
  accent:    "#2b5a2b", 
  accentDim: "#1e3f20", 
  coral:     "#E24B4A", 
  teal:      "#1D9E75", 
  purple:    "#7F77DD", 
  primary:   "#7F77DD", // Some dashboard elements used this
  neutral:   "#64748b",
  card:      "#ffffff",
};

export const DEPARTMENTS = [
  "South Indian", "North Indian", "Continental", "Juices", "Bakery", "Chinese",
];

export const UNITS = ["kg", "g", "L", "ml", "pcs", "dozen", "box", "plates", "portions"];

export const globalCss = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${COLORS.bg}; color: ${COLORS.text}; font-family: 'Inter', system-ui, sans-serif; min-height: 100vh; font-variant-numeric: tabular-nums; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: ${COLORS.bg}; }
  ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  input, select, textarea { background: #ffffff; border: 1px solid ${COLORS.border}; color: ${COLORS.text}; border-radius: 8px; padding: 8px 12px; font-family: 'Inter', sans-serif; font-size: 13px; outline: none; width: 100%; transition: border-color 0.2s; }
  input:focus, select:focus, textarea:focus { border-color: ${COLORS.brand}; }
  select option { background: #ffffff; color: ${COLORS.text}; }
  button { cursor: pointer; font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 500; border: none; border-radius: 8px; transition: all 0.15s; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; padding: 12px 16px; color: ${COLORS.muted}; font-weight: 500; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; border-bottom: 1px solid ${COLORS.border}; }
  td { padding: 12px 16px; border-bottom: 1px solid ${COLORS.border}22; vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: ${COLORS.border}22; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; }
  @keyframes pulse {
    0% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(0.96); }
    100% { opacity: 1; transform: scale(1); }
  }
  .pulse { animation: pulse 1.5s infinite ease-in-out; }
`;
