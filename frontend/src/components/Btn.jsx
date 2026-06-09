import { COLORS } from "../styles/colors";

const variants = {
  primary: { background: COLORS.brand,       color: COLORS.surface },
  ghost:   { background: "transparent",      color: COLORS.text,    border: `1px solid ${COLORS.border}` },
  danger:  { background: COLORS.danger,      color: COLORS.surface },
  success: { background: COLORS.success,     color: COLORS.surface },
  warning: { background: COLORS.warning,     color: COLORS.surface },
};

export default function Btn({ children, onClick, variant = "primary", small, style = {}, disabled, loading }) {
  const isInteractive = !disabled && !loading;
  return (
    <button
      onClick={isInteractive ? onClick : undefined}
      disabled={disabled || loading}
      style={{
        ...variants[variant],
        padding: small ? "5px 12px" : "8px 18px",
        opacity: isInteractive ? 1 : 0.6,
        cursor: isInteractive ? "pointer" : "not-allowed",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        ...style,
      }}
      onMouseEnter={(e) => { if (isInteractive) e.currentTarget.style.opacity = "0.85"; }}
      onMouseLeave={(e) => { if (isInteractive) e.currentTarget.style.opacity = "1"; }}
    >
      {loading && <span className="pulse" style={{ width: 12, height: 12, border: "2px solid currentColor", borderRightColor: "transparent", borderRadius: "50%", display: "inline-block" }}></span>}
      {children}
    </button>
  );
}
