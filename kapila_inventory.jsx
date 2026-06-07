import { useState, useEffect, useRef } from "react";

const DEPARTMENTS = ["South Indian", "North Indian", "Continental", "Juices", "Bakery", "Chinese"];

const STORAGE_KEYS = {
  stock: "kapila_stock",
  indents: "kapila_indents",
  issuances: "kapila_issuances",
  production: "kapila_production",
  leftovers: "kapila_leftovers",
};

const today = () => new Date().toISOString().slice(0, 10);

function useStorage(key, initial) {
  const [val, setVal] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : initial;
    } catch { return initial; }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  }, [key, val]);
  return [val, setVal];
}

const COLORS = {
  bg: "#0f1117",
  surface: "#181c27",
  card: "#1e2333",
  border: "#2a3050",
  accent: "#e8a838",
  accentDim: "#b07a1a",
  teal: "#2dd4bf",
  coral: "#f87171",
  purple: "#a78bfa",
  text: "#e8e9f0",
  muted: "#7a8098",
  success: "#4ade80",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${COLORS.bg}; color: ${COLORS.text}; font-family: 'DM Sans', sans-serif; min-height: 100vh; }
  ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: ${COLORS.surface}; } ::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 2px; }
  input, select, textarea { background: ${COLORS.bg}; border: 1px solid ${COLORS.border}; color: ${COLORS.text}; border-radius: 6px; padding: 8px 12px; font-family: 'DM Sans', sans-serif; font-size: 13px; outline: none; width: 100%; transition: border-color 0.2s; }
  input:focus, select:focus, textarea:focus { border-color: ${COLORS.accent}; }
  select option { background: ${COLORS.surface}; }
  button { cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; border: none; border-radius: 6px; transition: all 0.15s; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; padding: 10px 14px; color: ${COLORS.muted}; font-weight: 500; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; border-bottom: 1px solid ${COLORS.border}; }
  td { padding: 11px 14px; border-bottom: 1px solid ${COLORS.border}22; vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: ${COLORS.border}22; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 500; }
`;

function Btn({ children, onClick, variant = "primary", small, style = {} }) {
  const styles = {
    primary: { background: COLORS.accent, color: "#0f1117", padding: small ? "5px 12px" : "8px 18px" },
    ghost: { background: "transparent", color: COLORS.text, border: `1px solid ${COLORS.border}`, padding: small ? "5px 12px" : "8px 18px" },
    danger: { background: "#7f1d1d", color: COLORS.coral, padding: small ? "5px 12px" : "8px 18px" },
    success: { background: "#14532d", color: COLORS.success, padding: small ? "5px 12px" : "8px 18px" },
  };
  return (
    <button onClick={onClick} style={{ ...styles[variant], ...style }}
      onMouseEnter={e => e.currentTarget.style.opacity = "0.82"}
      onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
      {children}
    </button>
  );
}

function Card({ children, style = {} }) {
  return <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20, ...style }}>{children}</div>;
}

function Section({ title, sub, children }) {
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

function Input({ label, ...props }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <label style={{ fontSize: 11, color: COLORS.muted, letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>{label}</label>}
      <input {...props} />
    </div>
  );
}

function Select({ label, children, ...props }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <label style={{ fontSize: 11, color: COLORS.muted, letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>{label}</label>}
      <select {...props}>{children}</select>
    </div>
  );
}

// ── PURCHASE / STOCK ──────────────────────────────────────────────────────────
function StockScreen({ stock, setStock }) {
  const [form, setForm] = useState({ name: "", qty: "", unit: "kg", date: today() });
  const [msg, setMsg] = useState("");

  const add = () => {
    if (!form.name || !form.qty) return;
    const item = { id: Date.now(), ...form, qty: parseFloat(form.qty), remaining: parseFloat(form.qty) };
    setStock(s => [item, ...s]);
    setForm({ name: "", qty: "", unit: "kg", date: today() });
    setMsg("Stock added ✓"); setTimeout(() => setMsg(""), 2000);
  };

  const remove = (id) => setStock(s => s.filter(i => i.id !== id));

  return (
    <Section title="Purchase & Stock" sub="Record incoming stock from suppliers">
      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 20 }}>
        <Card>
          <p style={{ fontSize: 12, color: COLORS.muted, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>Add new stock</p>
          <Input label="Item name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Rice, Tomatoes…" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Input label="Quantity" type="number" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} placeholder="0" />
            <Select label="Unit" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
              {["kg", "g", "L", "ml", "pcs", "dozen", "box"].map(u => <option key={u}>{u}</option>)}
            </Select>
          </div>
          <Input label="Date received" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          <Btn onClick={add} style={{ width: "100%", marginTop: 4 }}>Add to Store</Btn>
          {msg && <p style={{ color: COLORS.success, fontSize: 12, marginTop: 8, textAlign: "center" }}>{msg}</p>}
        </Card>

        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${COLORS.border}` }}>
            <p style={{ fontSize: 12, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Current stock — {stock.length} items</p>
          </div>
          {stock.length === 0 ? (
            <p style={{ color: COLORS.muted, textAlign: "center", padding: 40 }}>No stock recorded yet</p>
          ) : (
            <div style={{ overflowY: "auto", maxHeight: 380 }}>
              <table>
                <thead><tr><th>Item</th><th>Original</th><th>Remaining</th><th>Unit</th><th>Date</th><th></th></tr></thead>
                <tbody>
                  {stock.map(item => {
                    const pct = item.qty > 0 ? (item.remaining / item.qty) * 100 : 0;
                    const color = pct > 50 ? COLORS.success : pct > 20 ? COLORS.accent : COLORS.coral;
                    return (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 500 }}>{item.name}</td>
                        <td>{item.qty}</td>
                        <td>
                          <span style={{ color }}>{item.remaining.toFixed(2)}</span>
                          <div style={{ height: 2, background: COLORS.border, borderRadius: 1, marginTop: 4, width: 60 }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 1, transition: "width 0.3s" }} />
                          </div>
                        </td>
                        <td style={{ color: COLORS.muted }}>{item.unit}</td>
                        <td style={{ color: COLORS.muted }}>{item.date}</td>
                        <td><Btn variant="danger" small onClick={() => remove(item.id)}>✕</Btn></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </Section>
  );
}

// ── INDENT ────────────────────────────────────────────────────────────────────
function IndentScreen({ indents, setIndents, stock }) {
  const [form, setForm] = useState({ dept: DEPARTMENTS[0], date: today(), items: [{ name: "", qty: "" }] });
  const [msg, setMsg] = useState("");

  const addRow = () => setForm(f => ({ ...f, items: [...f.items, { name: "", qty: "" }] }));
  const removeRow = idx => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  const updateItem = (idx, field, val) => setForm(f => ({ ...f, items: f.items.map((it, i) => i === idx ? { ...it, [field]: val } : it) }));

  const submit = () => {
    const validItems = form.items.filter(i => i.name && i.qty);
    if (!validItems.length) return;
    setIndents(s => [{ id: Date.now(), ...form, items: validItems, status: "pending" }, ...s]);
    setForm({ dept: DEPARTMENTS[0], date: today(), items: [{ name: "", qty: "" }] });
    setMsg("Indent submitted ✓"); setTimeout(() => setMsg(""), 2000);
  };

  const stockNames = stock.map(s => s.name);

  return (
    <Section title="Indent Request" sub="Departments submit nightly material requirements">
      <div style={{ display: "grid", gridTemplateColumns: "400px 1fr", gap: 20 }}>
        <Card>
          <p style={{ fontSize: 12, color: COLORS.muted, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>New indent form</p>
          <Select label="Department" value={form.dept} onChange={e => setForm(f => ({ ...f, dept: e.target.value }))}>
            {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
          </Select>
          <Input label="Date needed" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          <p style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Items requested</p>
          {form.items.map((item, idx) => (
            <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 80px 32px", gap: 6, marginBottom: 8 }}>
              <input value={item.name} onChange={e => updateItem(idx, "name", e.target.value)} placeholder="Item name" list="stock-names" />
              <input value={item.qty} onChange={e => updateItem(idx, "qty", e.target.value)} placeholder="Qty" type="number" />
              <button onClick={() => removeRow(idx)} style={{ background: "#7f1d1d22", color: COLORS.coral, border: `1px solid #7f1d1d44`, borderRadius: 6, fontSize: 14 }}>✕</button>
            </div>
          ))}
          <datalist id="stock-names">{stockNames.map(n => <option key={n} value={n} />)}</datalist>
          <Btn variant="ghost" onClick={addRow} small style={{ marginBottom: 12 }}>+ Add item</Btn>
          <Btn onClick={submit} style={{ width: "100%" }}>Submit Indent</Btn>
          {msg && <p style={{ color: COLORS.success, fontSize: 12, marginTop: 8, textAlign: "center" }}>{msg}</p>}
        </Card>

        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${COLORS.border}` }}>
            <p style={{ fontSize: 12, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Submitted indents</p>
          </div>
          {indents.length === 0 ? (
            <p style={{ color: COLORS.muted, textAlign: "center", padding: 40 }}>No indents yet</p>
          ) : (
            <div style={{ overflowY: "auto", maxHeight: 400 }}>
              {indents.map(ind => (
                <div key={ind.id} style={{ padding: "14px 20px", borderBottom: `1px solid ${COLORS.border}22` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div>
                      <span style={{ fontWeight: 600, color: COLORS.accent }}>{ind.dept}</span>
                      <span style={{ color: COLORS.muted, fontSize: 12, marginLeft: 10 }}>{ind.date}</span>
                    </div>
                    <span className="badge" style={{
                      background: ind.status === "issued" ? "#14532d" : "#7c4a1022",
                      color: ind.status === "issued" ? COLORS.success : COLORS.accent
                    }}>{ind.status}</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {ind.items.map((it, i) => (
                      <span key={i} style={{ fontSize: 12, background: COLORS.border + "44", borderRadius: 4, padding: "2px 8px", color: COLORS.text }}>
                        {it.name} <span style={{ color: COLORS.muted }}>{it.qty}</span>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </Section>
  );
}

// ── ISSUANCE (with scan simulation) ──────────────────────────────────────────
function IssuanceScreen({ indents, setIndents, stock, setStock, issuances, setIssuances }) {
  const [selected, setSelected] = useState(null);
  const [scanText, setScanText] = useState("");
  const [scanning, setScanning] = useState(false);
  const [msg, setMsg] = useState("");
  const [issueQtys, setIssueQtys] = useState({});
  const fileRef = useRef();

  const pending = indents.filter(i => i.status === "pending");

  const selectIndent = (ind) => {
    setSelected(ind);
    const q = {};
    ind.items.forEach((it, idx) => { q[idx] = it.qty; });
    setIssueQtys(q);
  };

  const handleScan = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setScanning(true);
    setScanText("Reading form with AI...");
    await new Promise(r => setTimeout(r, 1200));

    // Call Claude API to extract indent data from image
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result.split(",")[1];
      const mediaType = file.type;
      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1000,
            messages: [{
              role: "user",
              content: [
                { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
                { type: "text", text: "This is a hotel indent/requisition form. Extract: department name, date, and list of items with quantities. Respond ONLY as JSON: {\"dept\":\"...\",\"date\":\"YYYY-MM-DD\",\"items\":[{\"name\":\"...\",\"qty\":\"...\"}]}. If you cannot read clearly, make reasonable guesses from what's visible." }
              ]
            }]
          })
        });
        const data = await res.json();
        const text = data.content?.[0]?.text || "";
        try {
          const clean = text.replace(/```json|```/g, "").trim();
          const parsed = JSON.parse(clean);
          setScanText(`Detected: ${parsed.dept} — ${parsed.items.length} items`);
          setIssuances(s => [{
            id: Date.now(),
            indentId: null,
            dept: parsed.dept,
            date: parsed.date || today(),
            items: parsed.items.map(it => ({ ...it, issued: it.qty })),
            scanned: true
          }, ...s]);
          setMsg("Scanned indent added ✓");
        } catch {
          setScanText("Could not parse form. Please enter manually.");
        }
      } catch {
        setScanText("Scan error. Check connection.");
      }
      setScanning(false);
      setTimeout(() => setMsg(""), 3000);
    };
    reader.readAsDataURL(file);
  };

  const issue = () => {
    if (!selected) return;
    const items = selected.items.map((it, idx) => ({ ...it, issued: parseFloat(issueQtys[idx] || it.qty) }));
    // Deduct from stock
    setStock(prev => prev.map(s => {
      const match = items.find(i => i.name.toLowerCase() === s.name.toLowerCase());
      if (match) return { ...s, remaining: Math.max(0, s.remaining - match.issued) };
      return s;
    }));
    setIssuances(prev => [{ id: Date.now(), indentId: selected.id, dept: selected.dept, date: today(), items }, ...prev]);
    setIndents(prev => prev.map(i => i.id === selected.id ? { ...i, status: "issued" } : i));
    setSelected(null);
    setMsg("Material issued and stock updated ✓");
    setTimeout(() => setMsg(""), 3000);
  };

  return (
    <Section title="Issue Material" sub="Storekeeper issues goods and scans indent forms">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* Scan panel */}
        <Card>
          <p style={{ fontSize: 12, color: COLORS.muted, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>Scan indent form</p>
          <div
            onClick={() => fileRef.current.click()}
            style={{ border: `2px dashed ${COLORS.border}`, borderRadius: 10, padding: 32, textAlign: "center", cursor: "pointer", transition: "border-color 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = COLORS.accent}
            onMouseLeave={e => e.currentTarget.style.borderColor = COLORS.border}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
            <p style={{ color: COLORS.muted, fontSize: 13 }}>Tap to upload scanned form image</p>
            <p style={{ color: COLORS.muted, fontSize: 11, marginTop: 4 }}>JPG, PNG supported</p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleScan} />
          {scanning && <p style={{ color: COLORS.accent, fontSize: 13, marginTop: 12, textAlign: "center" }}>⏳ {scanText}</p>}
          {!scanning && scanText && <p style={{ color: COLORS.teal, fontSize: 13, marginTop: 12, textAlign: "center" }}>{scanText}</p>}
          {msg && <p style={{ color: COLORS.success, fontSize: 13, marginTop: 8, textAlign: "center" }}>{msg}</p>}
        </Card>

        {/* Manual issue */}
        <Card>
          <p style={{ fontSize: 12, color: COLORS.muted, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>Issue from pending indent</p>
          {pending.length === 0 ? (
            <p style={{ color: COLORS.muted, textAlign: "center", padding: 24 }}>No pending indents</p>
          ) : (
            <>
              <Select label="Select indent" value={selected?.id || ""} onChange={e => selectIndent(pending.find(i => i.id === parseInt(e.target.value)))}>
                <option value="">-- Choose --</option>
                {pending.map(i => <option key={i.id} value={i.id}>{i.dept} — {i.date}</option>)}
              </Select>
              {selected && (
                <>
                  <p style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Adjust quantities to issue</p>
                  {selected.items.map((it, idx) => (
                    <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 80px", gap: 8, marginBottom: 8 }}>
                      <div style={{ padding: "8px 12px", background: COLORS.bg, borderRadius: 6, fontSize: 13 }}>{it.name}</div>
                      <input type="number" value={issueQtys[idx] ?? it.qty} onChange={e => setIssueQtys(q => ({ ...q, [idx]: e.target.value }))} />
                    </div>
                  ))}
                  <Btn onClick={issue} style={{ width: "100%", marginTop: 8 }}>Issue & Update Stock</Btn>
                </>
              )}
            </>
          )}
        </Card>
      </div>

      {/* Issuance history */}
      <Card style={{ marginTop: 20, padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${COLORS.border}` }}>
          <p style={{ fontSize: 12, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Issuance history</p>
        </div>
        {issuances.length === 0 ? (
          <p style={{ color: COLORS.muted, textAlign: "center", padding: 32 }}>No issuances recorded</p>
        ) : (
          <table>
            <thead><tr><th>Date</th><th>Department</th><th>Items issued</th><th>Source</th></tr></thead>
            <tbody>
              {issuances.map(iss => (
                <tr key={iss.id}>
                  <td style={{ color: COLORS.muted }}>{iss.date}</td>
                  <td style={{ fontWeight: 500, color: COLORS.accent }}>{iss.dept}</td>
                  <td>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {iss.items.map((it, i) => (
                        <span key={i} style={{ fontSize: 11, background: COLORS.border + "44", borderRadius: 4, padding: "2px 7px" }}>
                          {it.name} {it.issued}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span className="badge" style={{ background: iss.scanned ? "#1e3a5f" : "#1e2d1e", color: iss.scanned ? COLORS.teal : COLORS.success }}>
                      {iss.scanned ? "Scanned" : "Manual"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </Section>
  );
}

// ── PRODUCTION ────────────────────────────────────────────────────────────────
function ProductionScreen({ issuances, production, setProduction }) {
  const [form, setForm] = useState({ dept: DEPARTMENTS[0], date: today(), plates: "", notes: "" });
  const [msg, setMsg] = useState("");

  const submit = () => {
    if (!form.plates) return;
    setProduction(prev => [{ id: Date.now(), ...form, plates: parseInt(form.plates) }, ...prev]);
    setForm({ dept: DEPARTMENTS[0], date: today(), plates: "", notes: "" });
    setMsg("Production logged ✓"); setTimeout(() => setMsg(""), 2000);
  };

  const getIssued = (dept, date) => {
    const iss = issuances.filter(i => i.dept === dept && i.date === date);
    return iss.flatMap(i => i.items);
  };

  return (
    <Section title="Production Tracking" sub="Log plates prepared per department and cross-check with issued material">
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20 }}>
        <Card>
          <p style={{ fontSize: 12, color: COLORS.muted, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>Log production</p>
          <Select label="Department" value={form.dept} onChange={e => setForm(f => ({ ...f, dept: e.target.value }))}>
            {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
          </Select>
          <Input label="Date" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          <Input label="Plates / portions prepared" type="number" value={form.plates} onChange={e => setForm(f => ({ ...f, plates: e.target.value }))} placeholder="0" />
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: COLORS.muted, letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.text, borderRadius: 6, padding: "8px 12px", width: "100%", fontFamily: "'DM Sans',sans-serif", fontSize: 13, resize: "vertical" }} />
          </div>
          <Btn onClick={submit} style={{ width: "100%" }}>Log Production</Btn>
          {msg && <p style={{ color: COLORS.success, fontSize: 12, marginTop: 8, textAlign: "center" }}>{msg}</p>}
        </Card>

        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${COLORS.border}` }}>
            <p style={{ fontSize: 12, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Production log</p>
          </div>
          {production.length === 0 ? (
            <p style={{ color: COLORS.muted, textAlign: "center", padding: 32 }}>No production logged yet</p>
          ) : (
            <div style={{ overflowY: "auto", maxHeight: 400 }}>
              {production.map(p => {
                const issued = getIssued(p.dept, p.date);
                return (
                  <div key={p.id} style={{ padding: "14px 20px", borderBottom: `1px solid ${COLORS.border}22` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <div>
                        <span style={{ fontWeight: 600, color: COLORS.accent }}>{p.dept}</span>
                        <span style={{ color: COLORS.muted, fontSize: 12, marginLeft: 10 }}>{p.date}</span>
                      </div>
                      <span style={{ fontFamily: "'DM Serif Display'", fontSize: 20, color: COLORS.teal }}>{p.plates} plates</span>
                    </div>
                    {issued.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: COLORS.muted, marginRight: 4 }}>Materials used:</span>
                        {issued.map((it, i) => (
                          <span key={i} style={{ fontSize: 11, background: COLORS.border + "44", borderRadius: 4, padding: "2px 7px" }}>{it.name} {it.issued}</span>
                        ))}
                      </div>
                    )}
                    {p.notes && <p style={{ fontSize: 12, color: COLORS.muted }}>{p.notes}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </Section>
  );
}

// ── LEFTOVERS ─────────────────────────────────────────────────────────────────
function LeftoverScreen({ leftovers, setLeftovers, production }) {
  const [form, setForm] = useState({ dept: DEPARTMENTS[0], date: today(), item: "", qty: "", unit: "plates" });
  const [msg, setMsg] = useState("");

  const submit = () => {
    if (!form.item || !form.qty) return;
    setLeftovers(prev => [{ id: Date.now(), ...form, qty: parseFloat(form.qty), carriedForward: true }, ...prev]);
    setForm({ dept: DEPARTMENTS[0], date: today(), item: "", qty: "", unit: "plates" });
    setMsg("Leftover recorded ✓"); setTimeout(() => setMsg(""), 2000);
  };

  const deptSummary = DEPARTMENTS.map(d => {
    const prod = production.filter(p => p.dept === d).reduce((s, p) => s + p.plates, 0);
    const left = leftovers.filter(l => l.dept === d).reduce((s, l) => s + l.qty, 0);
    return { dept: d, prod, left };
  }).filter(d => d.prod > 0 || d.left > 0);

  return (
    <Section title="Leftover Tracking" sub="Count unsold prepared food and carry forward to next day">
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20 }}>
        <Card>
          <p style={{ fontSize: 12, color: COLORS.muted, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>Record leftover</p>
          <Select label="Department" value={form.dept} onChange={e => setForm(f => ({ ...f, dept: e.target.value }))}>
            {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
          </Select>
          <Input label="Date" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          <Input label="Item / dish" value={form.item} onChange={e => setForm(f => ({ ...f, item: e.target.value }))} placeholder="e.g. Idli batter, Curry" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Input label="Quantity" type="number" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} placeholder="0" />
            <Select label="Unit" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
              {["plates", "portions", "kg", "L", "pcs"].map(u => <option key={u}>{u}</option>)}
            </Select>
          </div>
          <Btn onClick={submit} style={{ width: "100%" }}>Record Leftover</Btn>
          {msg && <p style={{ color: COLORS.success, fontSize: 12, marginTop: 8, textAlign: "center" }}>{msg}</p>}
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Summary cards */}
          {deptSummary.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {deptSummary.map(d => (
                <Card key={d.dept} style={{ padding: 14 }}>
                  <p style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{d.dept}</p>
                  <p style={{ fontFamily: "'DM Serif Display'", fontSize: 22, color: COLORS.teal }}>{d.prod} <span style={{ fontSize: 12, color: COLORS.muted }}>plates</span></p>
                  <p style={{ fontSize: 12, color: COLORS.coral, marginTop: 2 }}>↩ {d.left} leftover</p>
                </Card>
              ))}
            </div>
          )}

          <Card style={{ padding: 0, overflow: "hidden", flex: 1 }}>
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${COLORS.border}` }}>
              <p style={{ fontSize: 12, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Leftover log</p>
            </div>
            {leftovers.length === 0 ? (
              <p style={{ color: COLORS.muted, textAlign: "center", padding: 32 }}>No leftovers recorded</p>
            ) : (
              <table>
                <thead><tr><th>Date</th><th>Dept</th><th>Item</th><th>Qty</th><th>Status</th></tr></thead>
                <tbody>
                  {leftovers.map(l => (
                    <tr key={l.id}>
                      <td style={{ color: COLORS.muted }}>{l.date}</td>
                      <td style={{ color: COLORS.accent, fontWeight: 500 }}>{l.dept}</td>
                      <td>{l.item}</td>
                      <td>{l.qty} {l.unit}</td>
                      <td><span className="badge" style={{ background: "#1a2a1a", color: COLORS.success }}>Carried forward</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>
      </div>
    </Section>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function Dashboard({ stock, indents, issuances, production, leftovers }) {
  const totalStock = stock.length;
  const lowStock = stock.filter(s => s.remaining / s.qty < 0.25).length;
  const todayIssuances = issuances.filter(i => i.date === today()).length;
  const todayPlates = production.filter(p => p.date === today()).reduce((s, p) => s + p.plates, 0);
  const totalLeftovers = leftovers.filter(l => l.date === today()).length;
  const pendingIndents = indents.filter(i => i.status === "pending").length;

  const stats = [
    { label: "Stock items", value: totalStock, color: COLORS.teal, sub: `${lowStock} low` },
    { label: "Pending indents", value: pendingIndents, color: COLORS.accent, sub: "awaiting issue" },
    { label: "Today's issuances", value: todayIssuances, color: COLORS.purple, sub: "departments served" },
    { label: "Plates today", value: todayPlates, color: COLORS.success, sub: "across all depts" },
    { label: "Leftovers today", value: totalLeftovers, color: COLORS.coral, sub: "carried forward" },
  ];

  const deptStats = DEPARTMENTS.map(d => ({
    dept: d,
    plates: production.filter(p => p.dept === d).reduce((s, p) => s + p.plates, 0),
    issuances: issuances.filter(i => i.dept === d).length,
    leftovers: leftovers.filter(l => l.dept === d).length,
  }));

  return (
    <Section title="Dashboard" sub={`Hotel Kapila — ${new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}`}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20 }}>
        {stats.map(s => (
          <Card key={s.label} style={{ padding: 16, textAlign: "center" }}>
            <p style={{ fontFamily: "'DM Serif Display'", fontSize: 36, color: s.color, lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontWeight: 500, fontSize: 13, marginTop: 6 }}>{s.label}</p>
            <p style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>{s.sub}</p>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${COLORS.border}` }}>
            <p style={{ fontSize: 12, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Department overview</p>
          </div>
          <table>
            <thead><tr><th>Department</th><th>Total plates</th><th>Issuances</th><th>Leftovers</th></tr></thead>
            <tbody>
              {deptStats.map(d => (
                <tr key={d.dept}>
                  <td style={{ fontWeight: 500 }}>{d.dept}</td>
                  <td><span style={{ color: COLORS.teal, fontWeight: 600 }}>{d.plates}</span></td>
                  <td>{d.issuances}</td>
                  <td style={{ color: d.leftovers > 0 ? COLORS.coral : COLORS.muted }}>{d.leftovers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${COLORS.border}` }}>
            <p style={{ fontSize: 12, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Stock alerts</p>
          </div>
          {lowStock === 0 ? (
            <p style={{ color: COLORS.success, textAlign: "center", padding: 32 }}>✓ All stock levels healthy</p>
          ) : (
            <table>
              <thead><tr><th>Item</th><th>Remaining</th><th>Original</th><th>Level</th></tr></thead>
              <tbody>
                {stock.filter(s => s.remaining / s.qty < 0.25).map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 500 }}>{s.name}</td>
                    <td style={{ color: COLORS.coral }}>{s.remaining.toFixed(2)} {s.unit}</td>
                    <td style={{ color: COLORS.muted }}>{s.qty} {s.unit}</td>
                    <td>
                      <div style={{ height: 4, background: COLORS.border, borderRadius: 2, width: 60 }}>
                        <div style={{ height: "100%", width: `${(s.remaining / s.qty) * 100}%`, background: COLORS.coral, borderRadius: 2 }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </Section>
  );
}

// ── APP ROOT ──────────────────────────────────────────────────────────────────
const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "stock", label: "Stock", icon: "📦" },
  { id: "indent", label: "Indent", icon: "📋" },
  { id: "issuance", label: "Issue", icon: "🔄" },
  { id: "production", label: "Production", icon: "🍽️" },
  { id: "leftover", label: "Leftovers", icon: "↩️" },
];

export default function App() {
  const [screen, setScreen] = useState("dashboard");
  const [stock, setStock] = useStorage(STORAGE_KEYS.stock, []);
  const [indents, setIndents] = useStorage(STORAGE_KEYS.indents, []);
  const [issuances, setIssuances] = useStorage(STORAGE_KEYS.issuances, []);
  const [production, setProduction] = useStorage(STORAGE_KEYS.production, []);
  const [leftovers, setLeftovers] = useStorage(STORAGE_KEYS.leftovers, []);

  return (
    <>
      <style>{css}</style>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        {/* Sidebar */}
        <div style={{ width: 200, background: COLORS.surface, borderRight: `1px solid ${COLORS.border}`, padding: "24px 0", display: "flex", flexDirection: "column", position: "fixed", top: 0, bottom: 0 }}>
          <div style={{ padding: "0 20px 24px" }}>
            <p style={{ fontFamily: "'DM Serif Display'", fontSize: 20, color: COLORS.accent, lineHeight: 1.1 }}>Kapila</p>
            <p style={{ fontSize: 11, color: COLORS.muted, marginTop: 3, letterSpacing: "0.06em", textTransform: "uppercase" }}>Inventory</p>
          </div>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setScreen(n.id)} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 20px",
              background: screen === n.id ? COLORS.accent + "15" : "transparent",
              borderLeft: screen === n.id ? `2px solid ${COLORS.accent}` : "2px solid transparent",
              color: screen === n.id ? COLORS.accent : COLORS.muted,
              fontWeight: screen === n.id ? 600 : 400, fontSize: 13,
              textAlign: "left", width: "100%", cursor: "pointer", border: "none",
              transition: "all 0.15s"
            }}>
              <span>{n.icon}</span>{n.label}
            </button>
          ))}
          <div style={{ marginTop: "auto", padding: "20px", borderTop: `1px solid ${COLORS.border}` }}>
            <p style={{ fontSize: 11, color: COLORS.muted }}>Data saved locally</p>
          </div>
        </div>

        {/* Main */}
        <div style={{ marginLeft: 200, flex: 1, padding: 32, minHeight: "100vh" }}>
          {screen === "dashboard" && <Dashboard stock={stock} indents={indents} issuances={issuances} production={production} leftovers={leftovers} />}
          {screen === "stock" && <StockScreen stock={stock} setStock={setStock} />}
          {screen === "indent" && <IndentScreen indents={indents} setIndents={setIndents} stock={stock} />}
          {screen === "issuance" && <IssuanceScreen indents={indents} setIndents={setIndents} stock={stock} setStock={setStock} issuances={issuances} setIssuances={setIssuances} />}
          {screen === "production" && <ProductionScreen issuances={issuances} production={production} setProduction={setProduction} />}
          {screen === "leftover" && <LeftoverScreen leftovers={leftovers} setLeftovers={setLeftovers} production={production} />}
        </div>
      </div>
    </>
  );
}
