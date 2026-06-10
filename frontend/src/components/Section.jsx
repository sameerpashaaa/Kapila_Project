import { COLORS } from "../styles/colors";

export default function Section({ title, sub, children, style = {} }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", ...style }}>
      {(title || sub) && (
        <div style={{ marginBottom: 16, flexShrink: 0 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: COLORS.text, letterSpacing: "-0.02em" }}>{title}</h1>
          {sub && <p style={{ color: COLORS.muted, fontSize: 13, marginTop: 3 }}>{sub}</p>}
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        {children}
      </div>
    </div>
  );
}
