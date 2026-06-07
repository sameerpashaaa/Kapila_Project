import { COLORS } from "../styles/colors";

export default function Input({ label, ...props }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && (
        <label style={{ fontSize: 11, color: COLORS.muted, letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>
          {label}
        </label>
      )}
      <input {...props} />
    </div>
  );
}
