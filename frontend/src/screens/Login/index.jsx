import { useState } from "react";
import kapilaLogo from "../../assets/kapila-logo.png";
import { COLORS, globalCss } from "../../styles/colors";
import { useAuth } from "../../context/AuthContext";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@kapila.local");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{globalCss}</style>
      <div style={{
        minHeight: "100vh",
        background: COLORS.bg,
        display: "grid",
        placeItems: "center",
        padding: 20,
      }}>
        <form onSubmit={submit} style={{
          width: "100%",
          maxWidth: 390,
          background: COLORS.card,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 8,
          padding: 28,
          boxShadow: "0 18px 60px rgba(0,0,0,0.28)",
        }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
            <img src={kapilaLogo} alt="Kapila IMS" style={{ height: 42, objectFit: "contain" }} />
          </div>
          <h1 style={{ margin: "0 0 6px", color: COLORS.text, fontSize: 28, fontFamily: "var(--font-display)" }}>Sign in</h1>
          <p style={{ margin: "0 0 22px", color: COLORS.muted, fontSize: 14 }}>Use your Kapila inventory account.</p>

          <label style={{ color: COLORS.muted, fontSize: 12, fontWeight: 700 }}>Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={fieldStyle}
            autoComplete="email"
          />

          <label style={{ color: COLORS.muted, fontSize: 12, fontWeight: 700 }}>Password</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            style={fieldStyle}
            autoComplete="current-password"
          />

          {error && <div style={{ color: COLORS.danger || COLORS.coral, fontSize: 13, marginBottom: 12 }}>{error}</div>}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              height: 42,
              border: "none",
              borderRadius: 8,
              background: COLORS.brand || COLORS.accent,
              color: "#111827",
              fontWeight: 800,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </>
  );
}

const fieldStyle = {
  width: "100%",
  height: 40,
  margin: "7px 0 14px",
  borderRadius: 8,
  border: `1px solid ${COLORS.border}`,
  background: COLORS.surface,
  color: COLORS.text,
  padding: "0 12px",
  outline: "none",
};
