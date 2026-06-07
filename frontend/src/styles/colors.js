export const COLORS = {
  bg:        "#f4f6f5", // Very pale light grey-green background
  surface:   "#ffffff", // Sidebar and cards surface
  card:      "#ffffff",
  border:    "#e5e8e5", // Soft subtle borders
  accent:    "#2b5a2b", // Hilton Garden / brand green
  accentDim: "#1e3f20", // Dark green
  teal:      "#3b5e35", // Vacant: dark olive green
  coral:     "#df5252", // Departures: red/coral
  purple:    "#7c3aed",
  text:      "#1e293b", // Dark charcoal text
  muted:     "#64748b", // Muted slate text
  success:   "#76c043", // Occupied: bright lime green
  lightGreen: "#cce8b5", // Not ready: pale green
};

export const DEPARTMENTS = [
  "South Indian", "North Indian", "Continental", "Juices", "Bakery", "Chinese",
];

export const UNITS = ["kg", "g", "L", "ml", "pcs", "dozen", "box", "plates", "portions"];

export const globalCss = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&family=Inter:wght@300;400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${COLORS.bg}; color: ${COLORS.text}; font-family: 'Inter', 'DM Sans', sans-serif; min-height: 100vh; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: ${COLORS.bg}; }
  ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  input, select, textarea { background: #ffffff; border: 1px solid ${COLORS.border}; color: ${COLORS.text}; border-radius: 8px; padding: 8px 12px; font-family: 'Inter', sans-serif; font-size: 13px; outline: none; width: 100%; transition: border-color 0.2s; }
  input:focus, select:focus, textarea:focus { border-color: ${COLORS.accent}; }
  select option { background: #ffffff; color: ${COLORS.text}; }
  button { cursor: pointer; font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 500; border: none; border-radius: 8px; transition: all 0.15s; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; padding: 12px 16px; color: ${COLORS.muted}; font-weight: 500; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; border-bottom: 1px solid ${COLORS.border}; }
  td { padding: 12px 16px; border-bottom: 1px solid ${COLORS.border}22; vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: ${COLORS.border}22; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 500; }
  @keyframes pulse {
    0% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(0.96); }
    100% { opacity: 1; transform: scale(1); }
  }
  .pulse { animation: pulse 1.5s infinite ease-in-out; }
`;

