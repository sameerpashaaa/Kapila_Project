import { useState, useEffect, useRef } from "react";
import Section from "../../components/Section";
import Card from "../../components/Card";
import Btn from "../../components/Btn";
import Select from "../../components/Select";
import Pagination from "../../components/Pagination";
import ErrorMsg from "../../components/ErrorMsg";
import { COLORS } from "../../styles/colors";
import { usePaginatedApi } from "../../hooks/useApi";
import * as api from "../../api";

const today = () => new Date().toISOString().slice(0, 10);
const LIMIT = 20;

export default function IssuanceScreen() {
  const [pendingIndents, setPendingIndents] = useState([]);
  const [selected, setSelected]   = useState(null);
  const [issueQtys, setIssueQtys] = useState({});
  const [availableStock, setAvailableStock] = useState({});
  const [scanText, setScanText]   = useState("");
  const [scanning, setScanning]   = useState(false);
  const [msg, setMsg]             = useState("");
  const fileRef = useRef();

  const { items, total, page, loading, error, fetch } = usePaginatedApi(api.issuances.list);

  const loadIssuances = (overrides = {}) =>
    fetch({ limit: LIMIT, sort: "date", order: "desc", ...overrides });

  useEffect(() => {
    loadIssuances();
    api.indents.list({ status: "pending", limit: 100 }).then((r) => setPendingIndents(r.data));
  }, []);

  const selectIndent = async (ind) => {
    setSelected(ind);
    const q = {};
    ind.items.forEach((it, i) => { q[i] = it.qty; });
    setIssueQtys(q);
    setAvailableStock({});
    try {
      const itemNames = ind.items.map(it => it.name);
      const res = await api.stock.available(itemNames);
      if (res.success) {
        setAvailableStock(res.data);
      }
    } catch (e) {
      console.error("Failed to check stock availability:", e);
    }
  };

  const issue = async () => {
    if (!selected) return;
    const issueItems = selected.items.map((it, idx) => ({
      name: it.name,
      qty: parseFloat(it.qty),
      issued: parseFloat(issueQtys[idx] ?? it.qty),
      unit: it.unit || "kg",
      item_code: it.item_code,
    }));
    try {
      await api.issuances.create({
        indent_id: selected.id,
        dept: selected.dept,
        date: today(),
        scanned: false,
        items: issueItems,
      });
      setSelected(null);
      setMsg("Material issued and stock updated ✓");
      setTimeout(() => setMsg(""), 3000);
      loadIssuances({ page: 1 });
      api.indents.list({ status: "pending", limit: 100 }).then((r) => setPendingIndents(r.data));
    } catch (e) { setMsg("Error: " + e.message); }
  };

  const handleScan = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setScanning(true);
    setScanText("Reading form with AI…");
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result.split(",")[1];
      try {
        const data = await api.scan.indent(base64, file.type);
        if (data.success) {
          setScanText(`Detected: ${data.data.dept} — ${data.data.items.length} items`);
          setMsg("Scanned indent added ✓");
          loadIssuances({ page: 1 });
        } else {
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

  return (
    <Section title="Issue Material" sub="Storekeeper issues goods against indent requests">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* Scan panel */}
        <Card>
          <p style={{ fontSize: 12, color: COLORS.muted, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>Scan indent form</p>
          <div
            onClick={() => fileRef.current.click()}
            style={{ border: `2px dashed ${COLORS.border}`, borderRadius: 10, padding: 32, textAlign: "center", cursor: "pointer" }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = COLORS.accent)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = COLORS.border)}
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
          {pendingIndents.length === 0 ? (
            <p style={{ color: COLORS.muted, textAlign: "center", padding: 24 }}>No pending indents</p>
          ) : (
            <>
              <Select label="Select indent" value={selected?.id || ""} onChange={(e) => {
                const ind = pendingIndents.find((i) => i.id === parseInt(e.target.value));
                if (ind) selectIndent(ind);
              }}>
                <option value="">-- Choose --</option>
                {pendingIndents.map((i) => <option key={i.id} value={i.id}>{i.dept} — {i.date}</option>)}
              </Select>
              {selected && (
                <>
                  <p style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Adjust quantities</p>
                  {selected.items.map((it, idx) => (
                    <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 90px 50px", gap: 8, marginBottom: 8, alignItems: "center" }}>
                      <div style={{ padding: "8px 12px", background: COLORS.bg, borderRadius: 6, fontSize: 13 }}>
                        <div>
                          <span style={{ color: COLORS.accent, fontWeight: 500, marginRight: 4 }}>{it.item_code}</span>
                          {it.name}
                        </div>
                        {(() => {
                          const available = availableStock[it.name.toLowerCase()] ?? 0;
                          const requested = parseFloat(issueQtys[idx] ?? it.qty);
                          const isLow = available < requested;
                          return (
                            <div style={{ fontSize: 10, color: isLow ? COLORS.coral : COLORS.teal, marginTop: 4, fontWeight: 500 }}>
                              {isLow ? `⚠️ Insufficient: ${available} available` : `✓ Store Stock: ${available} available`}
                            </div>
                          );
                        })()}
                      </div>
                      <input type="number" value={issueQtys[idx] ?? it.qty} onChange={(e) => setIssueQtys((q) => ({ ...q, [idx]: e.target.value }))} />
                      <div style={{ fontSize: 12, color: COLORS.muted }}>{it.unit || "kg"}</div>
                    </div>
                  ))}
                  <Btn onClick={issue} style={{ width: "100%", marginTop: 8 }}>Issue & Update Stock</Btn>
                </>
              )}
            </>
          )}
        </Card>
      </div>

      {/* History */}
      <Card style={{ marginTop: 20, padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${COLORS.border}` }}>
          <p style={{ fontSize: 12, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Issuance history</p>
        </div>
        {loading ? (
          <p style={{ color: COLORS.muted, textAlign: "center", padding: 32 }}>Loading…</p>
        ) : error ? (
          <ErrorMsg error={error} />
        ) : items.length === 0 ? (
          <p style={{ color: COLORS.muted, textAlign: "center", padding: 32 }}>No issuances recorded</p>
        ) : (
          <>
            <table>
              <thead><tr><th>Date</th><th>Department</th><th>Items issued</th><th>Source</th></tr></thead>
              <tbody>
                {items.map((iss) => (
                  <tr key={iss.id}>
                    <td style={{ color: COLORS.muted }}>{iss.date}</td>
                    <td style={{ fontWeight: 500, color: COLORS.accent }}>{iss.dept}</td>
                    <td>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {(iss.items || []).map((it, i) => (
                          <span key={i} style={{ fontSize: 11, background: COLORS.border + "44", borderRadius: 4, padding: "2px 7px" }}>
                            <span style={{ color: COLORS.accent, fontWeight: 500, marginRight: 4 }}>{it.item_code}</span>
                            {it.name} <span style={{ color: COLORS.muted }}>{it.issued} {it.unit || "kg"}</span>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className="badge" style={{ background: iss.scanned ? COLORS.teal + "22" : COLORS.success + "22", color: iss.scanned ? COLORS.teal : COLORS.success }}>
                        {iss.scanned ? "Scanned" : "Manual"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} total={total} limit={LIMIT} onPage={(p) => loadIssuances({ page: p })} />
          </>
        )}
      </Card>
    </Section>
  );
}
