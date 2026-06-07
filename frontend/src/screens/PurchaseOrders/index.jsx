import { useState, useEffect } from "react";
import Section from "../../components/Section";
import Card from "../../components/Card";
import Btn from "../../components/Btn";
import Input from "../../components/Input";
import Select from "../../components/Select";
import Pagination from "../../components/Pagination";
import SearchBar from "../../components/SearchBar";
import ErrorMsg from "../../components/ErrorMsg";
import { COLORS, UNITS } from "../../styles/colors";
import { usePaginatedApi } from "../../hooks/useApi";
import { useAppContext } from "../../context/AppContext";
import * as api from "../../api";

const LIMIT = 20;
const today = () => new Date().toISOString().slice(0, 10);

const STATUS_COLORS = {
  Draft:      { bg: COLORS.muted + "20",   text: COLORS.muted },
  Sent:       { bg: COLORS.accent + "22",  text: COLORS.accent },
  Received:   { bg: COLORS.success + "22", text: COLORS.success },
  Cancelled:  { bg: COLORS.coral + "22",   text: COLORS.coral },
};

const emptyItem = { item_code: "", name: "", qty: "", unit: UNITS[0], unit_price: "" };

export default function PurchaseOrdersScreen() {
  const { stocks } = useAppContext();
  const [view, setView]         = useState("list"); // "list" | "create" | "detail"
  const [detail, setDetail]     = useState(null);
  const [supplierList, setSupplierList] = useState([]);
  const [msg, setMsg]           = useState("");
  const [filters, setFilters]   = useState({ status: "", supplier_id: "", q: "" });

  // Form state
  const [form, setForm]         = useState({ supplier_id: "", date: today(), notes: "" });
  const [lineItems, setLineItems] = useState([{ ...emptyItem }]);

  const { items, total, page, loading, error, fetch } = usePaginatedApi(api.purchaseOrders.list);

  const load = (overrides = {}) =>
    fetch({ limit: LIMIT, sort: "date", order: "desc", ...filters, ...overrides });

  useEffect(() => { load(); }, []);

  useEffect(() => {
    api.suppliers.list({ limit: 200, sort: "name", order: "asc" })
      .then((r) => setSupplierList(r.data || []))
      .catch(() => {});
  }, []);

  const flash = (text, color = COLORS.success) => {
    setMsg({ text, color });
    setTimeout(() => setMsg(""), 2500);
  };

  // ── Line item helpers ──────────────────────────────────
  const updateLine = (idx, key, val) => {
    setLineItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: val };
      // Auto-fill item_code when name is selected from stock
      if (key === "name") {
        const match = stocks.find((s) => s.name.toLowerCase() === val.toLowerCase());
        if (match) next[idx].item_code = match.item_code;
      }
      return next;
    });
  };
  const addLine    = () => setLineItems((p) => [...p, { ...emptyItem }]);
  const removeLine = (idx) => setLineItems((p) => p.filter((_, i) => i !== idx));

  const lineTotal = (it) => {
    const q = parseFloat(it.qty) || 0;
    const p = parseFloat(it.unit_price) || 0;
    return (q * p).toFixed(2);
  };
  const grandTotal = lineItems.reduce((sum, it) => sum + (parseFloat(it.qty) || 0) * (parseFloat(it.unit_price) || 0), 0);

  // ── Submit ─────────────────────────────────────────────
  const submit = async () => {
    if (!form.supplier_id) return flash("Please select a supplier.", COLORS.coral);
    const validLines = lineItems.filter((it) => it.name && it.qty && it.unit_price);
    if (validLines.length === 0) return flash("Add at least one item.", COLORS.coral);
    try {
      const payload = {
        supplier_id: parseInt(form.supplier_id),
        date: form.date,
        notes: form.notes || null,
        items: validLines.map((it) => ({
          item_code: it.item_code || it.name.toUpperCase().replace(/\s+/g, "-").slice(0, 20),
          name: it.name,
          qty: parseFloat(it.qty),
          unit: it.unit,
          unit_price: parseFloat(it.unit_price),
        })),
      };
      await api.purchaseOrders.create(payload);
      flash("Purchase Order created ✓");
      setForm({ supplier_id: "", date: today(), notes: "" });
      setLineItems([{ ...emptyItem }]);
      setView("list");
      load({ page: 1 });
    } catch (e) { flash(e.message, COLORS.coral); }
  };

  // ── Auto-draft from low stock ──────────────────────────
  const autoDraft = async () => {
    if (!form.supplier_id) return flash("Select a supplier for auto-draft.", COLORS.coral);
    try {
      const res = await api.purchaseOrders.autoDraft(parseInt(form.supplier_id));
      flash(`Auto-draft PO created: ${res.data.po_number} ✓`);
      setView("list");
      load({ page: 1 });
    } catch (e) { flash(e.message, COLORS.coral); }
  };

  // ── Detail view ────────────────────────────────────────
  const openDetail = async (id) => {
    try {
      const res = await api.purchaseOrders.getOne(id);
      setDetail(res.data);
      setView("detail");
    } catch (e) { flash(e.message, COLORS.coral); }
  };

  const changeStatus = async (id, status) => {
    try {
      await api.purchaseOrders.update(id, { status });
      const res = await api.purchaseOrders.getOne(id);
      setDetail(res.data);
      load({ page: 1 });
    } catch (e) { flash(e.message, COLORS.coral); }
  };

  const deletePO = async (id) => {
    if (!confirm("Delete this PO? This cannot be undone.")) return;
    try {
      await api.purchaseOrders.remove(id);
      flash("PO deleted.");
      setView("list");
      load({ page: 1 });
    } catch (e) { flash(e.message, COLORS.coral); }
  };

  // ── Status badge ───────────────────────────────────────
  const StatusBadge = ({ status }) => {
    const c = STATUS_COLORS[status] || STATUS_COLORS.Draft;
    return (
      <span style={{ background: c.bg, color: c.text, padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
        {status}
      </span>
    );
  };

  // ──────────────────────────────────────────────────────
  // DETAIL VIEW
  // ──────────────────────────────────────────────────────
  if (view === "detail" && detail) {
    return (
      <Section title={`PO — ${detail.po_number}`} sub={`${detail.supplier_name} · ${detail.date}`}>
        <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
          <StatusBadge status={detail.status} />
          <span style={{ color: COLORS.muted, fontSize: 13 }}>₹{parseFloat(detail.total_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            {detail.status === "Draft" && <Btn small onClick={() => changeStatus(detail.id, "Sent")}>Mark Sent</Btn>}
            {detail.status === "Sent"  && <Btn small onClick={() => changeStatus(detail.id, "Received")}>Mark Received</Btn>}
            {["Draft", "Sent"].includes(detail.status) && (
              <Btn small variant="danger" onClick={() => deletePO(detail.id)}>Delete PO</Btn>
            )}
            <Btn small variant="ghost" onClick={() => setView("list")}>← Back</Btn>
          </div>
        </div>

        {msg && <p style={{ color: msg.color, fontSize: 12, marginBottom: 10 }}>{msg.text}</p>}

        <Card>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 20 }}>
            {[
              ["Supplier", detail.supplier_name],
              ["PO Date", detail.date],
              ["GSTIN", detail.supplier_gstin || "—"],
              ["Phone", detail.supplier_phone || "—"],
              ["Notes", detail.notes || "—"],
            ].map(([k, v]) => (
              <div key={k}>
                <p style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>{k}</p>
                <p style={{ color: COLORS.text, fontSize: 13, marginTop: 4 }}>{v}</p>
              </div>
            ))}
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                {["Item Code", "Name", "Qty", "Unit", "Unit Price", "Total"].map((h) => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: COLORS.muted, fontWeight: 500, fontSize: 11, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(detail.items || []).map((it) => (
                <tr key={it.id} style={{ borderBottom: `1px solid ${COLORS.border}22` }}>
                  <td style={{ padding: "10px 12px", fontFamily: "monospace", color: COLORS.teal, fontSize: 12 }}>{it.item_code}</td>
                  <td style={{ padding: "10px 12px", color: COLORS.text, fontWeight: 500 }}>{it.name}</td>
                  <td style={{ padding: "10px 12px", color: COLORS.text }}>{it.qty}</td>
                  <td style={{ padding: "10px 12px", color: COLORS.muted }}>{it.unit}</td>
                  <td style={{ padding: "10px 12px", color: COLORS.text }}>₹{parseFloat(it.unit_price).toFixed(2)}</td>
                  <td style={{ padding: "10px 12px", fontWeight: 600, color: COLORS.accent }}>₹{parseFloat(it.total_price).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: `1px solid ${COLORS.border}` }}>
                <td colSpan={5} style={{ padding: "10px 12px", textAlign: "right", color: COLORS.muted, fontWeight: 600 }}>Grand Total</td>
                <td style={{ padding: "10px 12px", fontWeight: 700, color: COLORS.accent, fontSize: 15 }}>
                  ₹{parseFloat(detail.total_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </Card>
      </Section>
    );
  }

  // ──────────────────────────────────────────────────────
  // CREATE VIEW
  // ──────────────────────────────────────────────────────
  if (view === "create") {
    return (
      <Section title="New Purchase Order" sub="Draft a PO for a supplier — items auto-fill from stock">
        <Card style={{ maxWidth: 860 }}>
          {msg && <p style={{ color: msg.color, fontSize: 12, marginBottom: 12 }}>{msg.text}</p>}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            <div>
              <label style={{ fontSize: 11, color: COLORS.muted, letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Supplier *</label>
              <select
                value={form.supplier_id}
                onChange={(e) => setForm((f) => ({ ...f, supplier_id: e.target.value }))}
                style={{ width: "100%", padding: "8px 12px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.text, borderRadius: 6, fontSize: 13 }}
              >
                <option value="">— Select Supplier —</option>
                {supplierList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <Input label="PO Date *" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 11, color: COLORS.muted, letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
              placeholder="Optional delivery instructions, terms…"
              style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.text, borderRadius: 6, padding: "8px 12px", width: "100%", fontFamily: "'DM Sans',sans-serif", fontSize: 13, resize: "vertical" }}
            />
          </div>

          {/* Line Items */}
          <p style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Order Items</p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 8 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                {["Item Name", "Item Code", "Qty", "Unit", "Unit Price (₹)", "Total", ""].map((h) => (
                  <th key={h} style={{ padding: "8px 10px", textAlign: "left", color: COLORS.muted, fontWeight: 500, fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lineItems.map((it, idx) => (
                <tr key={idx} style={{ borderBottom: `1px solid ${COLORS.border}22` }}>
                  <td style={{ padding: "6px 8px" }}>
                    <input
                      list="stock-names"
                      value={it.name}
                      onChange={(e) => updateLine(idx, "name", e.target.value)}
                      placeholder="Item name"
                      style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.text, borderRadius: 4, padding: "6px 8px", fontSize: 12, width: 160 }}
                    />
                  </td>
                  <td style={{ padding: "6px 8px" }}>
                    <input
                      value={it.item_code}
                      onChange={(e) => updateLine(idx, "item_code", e.target.value)}
                      placeholder="KPL-###"
                      style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.teal, borderRadius: 4, padding: "6px 8px", fontSize: 12, width: 90, fontFamily: "monospace" }}
                    />
                  </td>
                  <td style={{ padding: "6px 8px" }}>
                    <input type="number" min="0.01" step="any" value={it.qty}
                      onChange={(e) => updateLine(idx, "qty", e.target.value)}
                      style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.text, borderRadius: 4, padding: "6px 8px", fontSize: 12, width: 70 }}
                    />
                  </td>
                  <td style={{ padding: "6px 8px" }}>
                    <select value={it.unit} onChange={(e) => updateLine(idx, "unit", e.target.value)}
                      style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.text, borderRadius: 4, padding: "6px 8px", fontSize: 12, width: 70 }}>
                      {UNITS.map((u) => <option key={u}>{u}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: "6px 8px" }}>
                    <input type="number" min="0" step="any" value={it.unit_price}
                      onChange={(e) => updateLine(idx, "unit_price", e.target.value)}
                      style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.text, borderRadius: 4, padding: "6px 8px", fontSize: 12, width: 90 }}
                    />
                  </td>
                  <td style={{ padding: "6px 8px", color: COLORS.accent, fontWeight: 600 }}>₹{lineTotal(it)}</td>
                  <td style={{ padding: "6px 8px" }}>
                    {lineItems.length > 1 && (
                      <Btn small variant="danger" onClick={() => removeLine(idx)}>✕</Btn>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <datalist id="stock-names">
            {stocks.map((s) => <option key={s.id} value={s.name} />)}
          </datalist>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <Btn small variant="ghost" onClick={addLine}>+ Add Item</Btn>
            <p style={{ fontWeight: 700, color: COLORS.accent, fontSize: 15 }}>
              Grand Total: ₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <Btn onClick={submit} style={{ flex: 1 }}>Create Purchase Order</Btn>
            <Btn variant="ghost" onClick={autoDraft}>Auto-Draft (Low Stock)</Btn>
            <Btn variant="ghost" onClick={() => setView("list")}>Cancel</Btn>
          </div>
        </Card>
      </Section>
    );
  }

  // ──────────────────────────────────────────────────────
  // LIST VIEW
  // ──────────────────────────────────────────────────────
  return (
    <Section title="Purchase Orders" sub="Track POs from draft to delivery">
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <SearchBar
          onSearch={(v) => { setFilters((f) => ({ ...f, q: v })); load({ page: 1, q: v }); }}
          placeholder="Search PO# or supplier…"
        />
        <select
          value={filters.status}
          onChange={(e) => { setFilters((f) => ({ ...f, status: e.target.value })); load({ page: 1, status: e.target.value }); }}
          style={{ padding: "7px 10px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.text, borderRadius: 6, fontSize: 12 }}
        >
          <option value="">All Statuses</option>
          {["Draft", "Sent", "Received", "Cancelled"].map((s) => <option key={s}>{s}</option>)}
        </select>
        <select
          value={filters.supplier_id}
          onChange={(e) => { setFilters((f) => ({ ...f, supplier_id: e.target.value })); load({ page: 1, supplier_id: e.target.value }); }}
          style={{ padding: "7px 10px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.text, borderRadius: 6, fontSize: 12 }}
        >
          <option value="">All Suppliers</option>
          {supplierList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <div style={{ marginLeft: "auto" }}>
          <Btn onClick={() => setView("create")}>+ New PO</Btn>
        </div>
      </div>

      {msg && <p style={{ color: msg.color, fontSize: 12, marginBottom: 10 }}>{msg.text}</p>}

      <Card style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <p style={{ color: COLORS.muted, textAlign: "center", padding: 32 }}>Loading…</p>
        ) : error ? (
          <ErrorMsg error={error} />
        ) : items.length === 0 ? (
          <p style={{ color: COLORS.muted, textAlign: "center", padding: 32 }}>No purchase orders yet. Create your first PO above.</p>
        ) : (
          <>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  {["PO Number", "Supplier", "Date", "Status", "Total", ""].map((h) => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: COLORS.muted, fontWeight: 500, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((po) => (
                  <tr key={po.id} style={{ borderBottom: `1px solid ${COLORS.border}22`, cursor: "pointer" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = COLORS.surface}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    onClick={() => openDetail(po.id)}>
                    <td style={{ padding: "12px 16px", fontFamily: "monospace", color: COLORS.teal, fontWeight: 600 }}>{po.po_number}</td>
                    <td style={{ padding: "12px 16px", color: COLORS.text, fontWeight: 500 }}>{po.supplier_name}</td>
                    <td style={{ padding: "12px 16px", color: COLORS.muted }}>{po.date}</td>
                    <td style={{ padding: "12px 16px" }}><StatusBadge status={po.status} /></td>
                    <td style={{ padding: "12px 16px", color: COLORS.accent, fontWeight: 600 }}>
                      ₹{parseFloat(po.total_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <Btn small variant="ghost" onClick={(e) => { e.stopPropagation(); openDetail(po.id); }}>View →</Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} total={total} limit={LIMIT} onPage={(p) => load({ page: p })} />
          </>
        )}
      </Card>
    </Section>
  );
}
