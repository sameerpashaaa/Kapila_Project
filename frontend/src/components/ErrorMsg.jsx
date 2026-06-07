import { COLORS } from "../styles/colors";

export default function ErrorMsg({ error }) {
  if (!error) return null;
  return (
    <p style={{ color: COLORS.coral, fontSize: 12, padding: "8px 12px", background: "#7f1d1d22", borderRadius: 6, marginTop: 8 }}>
      {error}
    </p>
  );
}
