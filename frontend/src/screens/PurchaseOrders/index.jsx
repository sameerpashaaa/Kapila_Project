import { useState, useEffect } from "react";
import Card from "../../components/Card";
import Btn from "../../components/Btn";
import Input from "../../components/Input";
import Pagination from "../../components/Pagination";
import ErrorMsg from "../../components/ErrorMsg";
import { COLORS, UNITS } from "../../styles/colors";
import { usePaginatedApi } from "../../hooks/useApi";
import { useAppContext } from "../../context/AppContext";
import * as api from "../../api";
import { Plus, ArrowLeft, FileText, Truck, CheckCircle, XCircle, Clock, ChevronRight } from "lucide-react";

const LIMIT = 20;
const today = () => new Date().toISOString().slice(0, 10);

const STATUS_CONFIG = {
  Draft:     { bg: "#f1f5f9", text: "#64748b", icon: <Clock size={11} />, dot: "#94a3b8" },
  Sent:      { bg: "#ecfdf5", text: "#059669", icon: <FileText size={11} />, dot: "#10b981" },
  Received:  { bg: "#eff6ff", text: "#2563eb", icon: <CheckCircle size={11} />, dot: "#3b82f6" },
  Cancelled: { bg: "#fff1f2", text: "#e11d48", icon: <XCircle size={11} />, dot: "#f43f5e" },
};

const emptyItem = { item_code: "", name: "", qty: "", unit: UNITS[0], unit_price: "" };

const fmt = (n) => parseFloat(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });

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
  const [submitting, setSubmitting] = useState(false);

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
    setTimeout(() => setMsg(""), 3000);
  };

  // ── Line item helpers ──────────────────────────────────
  const updateLine = (idx, key, val) => {
    setLineItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: val };
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
    setSubmitting(true);
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
    setSubmitting(false);
  };

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
    const c = STATUS_CONFIG[status] || STATUS_CONFIG.Draft;
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        background: c.bg, color: c.text,
        padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600
      }}>
        {c.icon} {status}
      </span>
    );
  };

  // ── DETAIL VIEW ────────────────────────────────────────
  if (view === "detail" && detail) {
    const sc = STATUS_CONFIG[detail.status] || STATUS_CONFIG.Draft;
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {/* Detail Header */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          marginBottom: 16, flexWrap: "wrap", flexShrink: 0
        }}>
          <button
            onClick={() => setView("list")}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "none", border: `1px solid ${COLORS.border}`,
              color: COLORS.muted, padding: "6px 12px", borderRadius: 8,
              fontSize: 13, cursor: "pointer"
            }}
          >
            <ArrowLeft size={14} /> Back
          </button>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: COLORS.text }}>{detail.po_number}</h1>
            <p style={{ fontSize: 12, color: COLORS.muted }}>{detail.supplier_name} · {detail.date}</p>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
            <StatusBadge status={detail.status} />
            {detail.status === "Draft" && <Btn small onClick={() => changeStatus(detail.id, "Sent")}>Mark Sent</Btn>}
            {detail.status === "Sent"  && <Btn small onClick={() => changeStatus(detail.id, "Received")}>Mark Received</Btn>}
            {["Draft", "Sent"].includes(detail.status) && (
              <Btn small variant="danger" onClick={() => deletePO(detail.id)}>Delete PO</Btn>
            )}
          </div>
        </div>

        {msg && <p style={{ color: msg.color, fontSize: 12, marginBottom: 10 }}>{msg.text}</p>}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16, flexShrink: 0 }}>
          {[
            ["Supplier", detail.supplier_name],
            ["PO Date", detail.date],
            ["GSTIN", detail.supplier_gstin || "—"],
            ["Phone", detail.supplier_phone || "—"],
            ["Total Amount", `₹${fmt(detail.total_amount)}`],
            ["Notes", detail.notes || "—"],
          ].map(([k, v]) => (
            <div key={k} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "10px 14px" }}>
              <p style={{ fontSize: 10, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>{k}</p>
              <p style={{ color: COLORS.text, fontSize: 14, fontWeight: 500 }}>{v}</p>
            </div>
          ))}
        </div>

        <Card style={{ padding: 0, overflow: "hidden", flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "10px 16px", borderBottom: `1px solid ${COLORS.border}`, background: "#f8fafc", flexShrink: 0 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>
              Order Items
            </span>
          </div>
          <div style={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
            <table>
              <thead>
                <tr>
                  {["Item Code", "Name", "Qty", "Unit", "Unit Price", "Total"].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(detail.items || []).map((it) => (
                  <tr key={it.id}>
                    <td style={{ fontFamily: "monospace", color: COLORS.teal, fontSize: 12 }}>{it.item_code}</td>
                    <td style={{ fontWeight: 500 }}>{it.name}</td>
                    <td>{it.qty}</td>
                    <td style={{ color: COLORS.muted }}>{it.unit}</td>
                    <td>₹{parseFloat(it.unit_price).toFixed(2)}</td>
                    <td style={{ fontWeight: 600, color: COLORS.accent }}>₹{parseFloat(it.total_price).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: `2px solid ${COLORS.border}` }}>
                  <td colSpan={5} style={{ textAlign: "right", fontWeight: 600, color: COLORS.muted, padding: "12px 16px" }}>Grand Total</td>
                  <td style={{ fontWeight: 700, color: COLORS.accent, fontSize: 16, padding: "12px 16px" }}>
                    ₹{fmt(detail.total_amount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  // ── CREATE VIEW ────────────────────────────────────────
  if (view === "create") {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {/* Create Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexShrink: 0 }}>
          <button
            onClick={() => setView("list")}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "none", border: `1px solid ${COLORS.border}`,
              color: COLORS.muted, padding: "6px 12px", borderRadius: 8,
              fontSize: 13, cursor: "pointer"
            }}
          >
            <ArrowLeft size={14} /> Back
          </button>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: COLORS.text }}>New Purchase Order</h1>
            <p style={{ fontSize: 12, color: COLORS.muted }}>Draft a PO for a supplier</p>
          </div>
        </div>

        {msg && <p style={{ color: msg.color, fontSize: 12, marginBottom: 12, flexShrink: 0 }}>{msg.text}</p>}

        <Card style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "20px 24px" }}>
          {/* Header fields */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
            <div>
              <label style={{ fontSize: 11, color: COLORS.muted, letterSpacing: "0.07em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                Supplier *
              </label>
              <select
                value={form.supplier_id}
                onChange={(e) => setForm((f) => ({ ...f, supplier_id: e.target.value }))}
                style={{ width: "100%", padding: "9px 12px", background: "#fff", border: `1px solid ${COLORS.border}`, color: COLORS.text, borderRadius: 8, fontSize: 13 }}
              >
                <option value="">— Select Supplier —</option>
                {supplierList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: COLORS.muted, letterSpacing: "0.07em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                PO Date *
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                style={{ width: "100%", padding: "9px 12px", background: "#fff", border: `1px solid ${COLORS.border}`, color: COLORS.text, borderRadius: 8, fontSize: 13 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: COLORS.muted, letterSpacing: "0.07em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                Notes
              </label>
              <input
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Optional instructions..."
                style={{ width: "100%", padding: "9px 12px", background: "#fff", border: `1px solid ${COLORS.border}`, color: COLORS.text, borderRadius: 8, fontSize: 13 }}
              />
            </div>
          </div>

          {/* Line Items */}
          <p style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10, fontWeight: 600 }}>
            Order Items
          </p>
          <div style={{ background: COLORS.bg, borderRadius: 10, border: `1px solid ${COLORS.border}`, overflow: "hidden", marginBottom: 12 }}>
            <table style={{ fontSize: 13 }}>
              <thead>
                <tr>
                  {["Item Name", "Item Code", "Qty", "Unit", "Unit Price (₹)", "Total", ""].map((h) => (
                    <th key={h} style={{ background: "#f1f5f9", padding: "9px 12px" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lineItems.map((it, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: "6px 10px" }}>
                      <input
                        list="stock-names"
                        value={it.name}
                        onChange={(e) => updateLine(idx, "name", e.target.value)}
                        placeholder="Item name"
                        style={{ background: "#fff", border: `1px solid ${COLORS.border}`, color: COLORS.text, borderRadius: 6, padding: "6px 10px", fontSize: 12, width: 180 }}
                      />
                    </td>
                    <td style={{ padding: "6px 10px" }}>
                      <input
                        value={it.item_code}
                        onChange={(e) => updateLine(idx, "item_code", e.target.value)}
                        placeholder="KPL-###"
                        style={{ background: "#fff", border: `1px solid ${COLORS.border}`, color: COLORS.teal, borderRadius: 6, padding: "6px 10px", fontSize: 12, width: 90, fontFamily: "monospace" }}
                      />
                    </td>
                    <td style={{ padding: "6px 10px" }}>
                      <input type="number" min="0.01" step="any" value={it.qty}
                        onChange={(e) => updateLine(idx, "qty", e.target.value)}
                        style={{ background: "#fff", border: `1px solid ${COLORS.border}`, color: COLORS.text, borderRadius: 6, padding: "6px 10px", fontSize: 12, width: 80 }}
                      />
                    </td>
                    <td style={{ padding: "6px 10px" }}>
                      <select value={it.unit} onChange={(e) => updateLine(idx, "unit", e.target.value)}
                        style={{ background: "#fff", border: `1px solid ${COLORS.border}`, color: COLORS.text, borderRadius: 6, padding: "6px 8px", fontSize: 12, width: 70 }}>
                        {UNITS.map((u) => <option key={u}>{u}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: "6px 10px" }}>
                      <input type="number" min="0" step="any" value={it.unit_price}
                        onChange={(e) => updateLine(idx, "unit_price", e.target.value)}
                        style={{ background: "#fff", border: `1px solid ${COLORS.border}`, color: COLORS.text, borderRadius: 6, padding: "6px 10px", fontSize: 12, width: 100 }}
                      />
                    </td>
                    <td style={{ padding: "6px 10px", color: COLORS.accent, fontWeight: 600, whiteSpace: "nowrap" }}>
                      ₹{lineTotal(it)}
                    </td>
                    <td style={{ padding: "6px 10px" }}>
                      {lineItems.length > 1 && (
                        <button
                          onClick={() => removeLine(idx)}
                          style={{ background: "none", border: "none", color: COLORS.danger, cursor: "pointer", fontSize: 16, padding: "0 4px" }}
                        >×</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <datalist id="stock-names">
            {stocks.map((s) => <option key={s.id} value={s.name} />)}
          </datalist>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <button
              onClick={addLine}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "none", border: `1px dashed ${COLORS.border}`,
                color: COLORS.muted, padding: "7px 14px", borderRadius: 8, fontSize: 13, cursor: "pointer"
              }}
            >
              <Plus size={14} /> Add Item
            </button>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 11, color: COLORS.muted, marginBottom: 2 }}>GRAND TOTAL</p>
              <p style={{ fontWeight: 700, color: COLORS.accent, fontSize: 22, letterSpacing: "-0.02em" }}>
                ₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, paddingTop: 16, borderTop: `1px solid ${COLORS.border}` }}>
            <Btn onClick={submit} loading={submitting} style={{ flex: 1 }}>Create Purchase Order</Btn>
            <Btn variant="ghost" onClick={autoDraft}>Auto-Draft (Low Stock)</Btn>
            <Btn variant="ghost" onClick={() => setView("list")}>Cancel</Btn>
          </div>
        </Card>
      </div>
    );
  }

  // ── LIST VIEW ──────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* List Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 16, flexShrink: 0, flexWrap: "wrap", gap: 12
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: COLORS.text, letterSpacing: "-0.02em" }}>Purchase Orders</h1>
          <p style={{ fontSize: 13, color: COLORS.muted, marginTop: 2 }}>Track POs from draft to delivery</p>
        </div>
        <Btn onClick={() => setView("create")}>
          <Plus size={15} /> New PO
        </Btn>
      </div>

      {/* Filters Bar */}
      <div style={{
        display: "flex", gap: 10, marginBottom: 14, alignItems: "center",
        flexWrap: "wrap", flexShrink: 0
      }}>
        <input
          value={filters.q}
          onChange={(e) => { setFilters((f) => ({ ...f, q: e.target.value })); load({ page: 1, q: e.target.value }); }}
          placeholder="Search PO# or supplier…"
          style={{
            flex: 1, minWidth: 200, padding: "8px 12px",
            border: `1px solid ${COLORS.border}`, borderRadius: 8,
            fontSize: 13, background: "#fff", color: COLORS.text
          }}
        />
        {/* Status pills */}
        <div style={{ display: "flex", gap: 6 }}>
          {["", "Draft", "Sent", "Received", "Cancelled"].map((s) => {
            const isActive = filters.status === s;
            const sc = s ? STATUS_CONFIG[s] : null;
            return (
              <button
                key={s}
                onClick={() => { setFilters((f) => ({ ...f, status: s })); load({ page: 1, status: s }); }}
                style={{
                  padding: "6px 14px", fontSize: 12, fontWeight: 600,
                  borderRadius: 20, border: `1px solid ${isActive ? (sc?.dot || COLORS.brand) : COLORS.border}`,
                  background: isActive ? (sc?.bg || COLORS.brand + "15") : "transparent",
                  color: isActive ? (sc?.text || COLORS.brand) : COLORS.muted,
                  cursor: "pointer", transition: "all 0.15s"
                }}
              >
                {s || "All"}
              </button>
            );
          })}
        </div>
        <select
          value={filters.supplier_id}
          onChange={(e) => { setFilters((f) => ({ ...f, supplier_id: e.target.value })); load({ page: 1, supplier_id: e.target.value }); }}
          style={{ padding: "8px 12px", background: "#fff", border: `1px solid ${COLORS.border}`, color: COLORS.text, borderRadius: 8, fontSize: 13, minWidth: 140 }}
        >
          <option value="">All Suppliers</option>
          {supplierList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {msg && <p style={{ color: msg.color, fontSize: 12, marginBottom: 10 }}>{msg.text}</p>}

      {/* PO Table */}
      <Card style={{ padding: 0, overflow: "hidden", flex: 1, display: "flex", flexDirection: "column" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, color: COLORS.muted, fontSize: 13 }}>
            Loading orders…
          </div>
        ) : error ? (
          <ErrorMsg error={error} />
        ) : items.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 12 }}>
            <div style={{ fontSize: 40 }}>📋</div>
            <p style={{ color: COLORS.muted, fontSize: 14, fontWeight: 500 }}>No purchase orders yet</p>
            <Btn onClick={() => setView("create")}><Plus size={14} /> Create your first PO</Btn>
          </div>
        ) : (
          <>
            <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
              <table>
                <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                  <tr>
                    <th>PO Number</th>
                    <th>Supplier</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th>Items</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((po) => {
                    const sc = STATUS_CONFIG[po.status] || STATUS_CONFIG.Draft;
                    return (
                      <tr
                        key={po.id}
                        onClick={() => openDetail(po.id)}
                        style={{ cursor: "pointer" }}
                      >
                        <td>
                          <span style={{ fontFamily: "monospace", color: COLORS.teal, fontWeight: 700, fontSize: 13 }}>
                            {po.po_number}
                          </span>
                        </td>
                        <td style={{ fontWeight: 500 }}>{po.supplier_name}</td>
                        <td style={{ color: COLORS.muted }}>{po.date}</td>
                        <td>
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            background: sc.bg, color: sc.text,
                            padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600
                          }}>
                            {sc.icon} {po.status}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700, color: COLORS.accent }}>
                          ₹{fmt(po.total_amount)}
                        </td>
                        <td style={{ color: COLORS.muted }}>
                          {po.item_count || "—"}
                        </td>
                        <td>
                          <ChevronRight size={16} color={COLORS.muted} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ borderTop: `1px solid ${COLORS.border}`, flexShrink: 0 }}>
              <Pagination page={page} total={total} limit={LIMIT} onPage={(p) => load({ page: p })} />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
