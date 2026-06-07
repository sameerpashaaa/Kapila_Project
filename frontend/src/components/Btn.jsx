import { COLORS } from "../styles/colors";

const variants = {
  primary: { background: COLORS.accent,   color: COLORS.bg },
  ghost:   { background: "transparent",   color: COLORS.text,    border: `1px solid ${COLORS.border}` },
  danger:  { background: "#7f1d1d",       color: COLORS.coral },
  success: { background: "#14532d",       color: COLORS.success },
};

export default function Btn({ children, onClick, variant = "primary", small, style = {}, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...variants[variant],
        padding: small ? "5px 12px" : "8px 18px",
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        ...style,
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.opacity = "0.82"; }}
      onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.opacity = "1"; }}
    >
      {children}
    </button>
  );
}
