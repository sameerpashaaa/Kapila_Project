import { COLORS } from "../styles/colors";

export default function Card({ children, style = {} }) {
  return (
    <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20, ...style }}>
      {children}
    </div>
  );
}
