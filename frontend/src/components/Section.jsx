import { COLORS } from "../styles/colors";

export default function Section({ title, sub, children }) {
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'DM Serif Display'", fontSize: 26, fontWeight: 400, color: COLORS.text }}>{title}</h2>
        {sub && <p style={{ color: COLORS.muted, fontSize: 13, marginTop: 4 }}>{sub}</p>}
      </div>
      {children}
    </div>
  );
}
