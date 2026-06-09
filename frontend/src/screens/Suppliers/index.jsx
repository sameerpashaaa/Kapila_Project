import { useState, useEffect, Fragment } from "react";
import Section from "../../components/Section";
import Card from "../../components/Card";
import Btn from "../../components/Btn";
import Input from "../../components/Input";
import Pagination from "../../components/Pagination";
import SearchBar from "../../components/SearchBar";
import ErrorMsg from "../../components/ErrorMsg";
import { COLORS } from "../../styles/colors";
import { usePaginatedApi } from "../../hooks/useApi";
import * as api from "../../api";

const LIMIT = 20;
const empty = { name: "", contact_name: "", phone: "", email: "", gstin: "", address: "" };

export default function SuppliersScreen() {
  const [form, setForm]     = useState(empty);
  const [editing, setEditing] = useState(null); // supplier id being edited
  const [msg, setMsg]       = useState("");
  const [q, setQ]           = useState("");
  const { items, total, page, loading, error, fetch } = usePaginatedApi(api.suppliers.list);

  const [expandedId, setExpandedId] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [poDrafting, setPoDrafting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState(null);

  const toggleExpand = async (id) => {
    if (expandedId === id) {
      setExpandedId(null);
      setPerformanceData(null);
      setSelectedCatalogItem(null);
      return;
    }
    setExpandedId(id);
    setSelectedCatalogItem(null);
    setPerformanceLoading(true);
    try {
      const res = await api.suppliers.performance(id);
      if (res.success) {
        setPerformanceData(res.data);
      }
    } catch (err) {
      flash("Error loading supplier details: " + err.message, COLORS.coral);
    } finally {
      setPerformanceLoading(false);
    }
  };

  const load = (overrides = {}) =>
    fetch({ limit: LIMIT, sort: "name", order: "asc", q, ...overrides });

  useEffect(() => { load(); }, []);

  const flash = (text, color = COLORS.success) => {
    setMsg({ text, color });
    setTimeout(() => setMsg(""), 2500);
  };

  const f = (k) => (e) => setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const submit = async () => {
    if (!form.name.trim()) return flash("Supplier name is required.", COLORS.coral);
    if (form.gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(form.gstin.trim())) {
      return flash("Invalid GSTIN format.", COLORS.coral);
    }
    try {
      if (editing) {
        await api.suppliers.update(editing, form);
        flash("Supplier updated ✓");
      } else {
        await api.suppliers.create(form);
        flash("Supplier added ✓");
      }
      setForm(empty);
      setEditing(null);
      load({ page: 1 });
    } catch (e) { flash(e.message, COLORS.coral); }
  };

  const startEdit = (s) => {
    setForm({ name: s.name, contact_name: s.contact_name || "", phone: s.phone || "", email: s.email || "", gstin: s.gstin || "", address: s.address || "" });
    setEditing(s.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => { setForm(empty); setEditing(null); };

  const remove = (id) => {
    setDeleteConfirmId(id);
  };

  const executeRemove = async () => {
    if (!deleteConfirmId) return;
    try {
      await api.suppliers.remove(deleteConfirmId);
      flash("Supplier deleted.");
      setDeleteConfirmId(null);
      load({ page: 1 });
    } catch (e) { flash(e.message, COLORS.coral); }
  };

  return (
    <Section title="Suppliers" sub="Manage vendor master — contacts, GSTIN, address">
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20 }}>

        {/* Form */}
        <Card>
          <p style={{ fontSize: 12, color: COLORS.muted, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {editing ? "Edit Supplier" : "Add Supplier"}
          </p>

          <Input label="Supplier Name *" value={form.name} onChange={f("name")} placeholder="e.g. Fresh Farms India" />
          <Input label="Contact Person" value={form.contact_name} onChange={f("contact_name")} placeholder="Name" />
          <Input label="Phone" type="tel" value={form.phone} onChange={f("phone")} placeholder="+91 98765 43210" />
          <Input label="Email" type="email" value={form.email} onChange={f("email")} placeholder="vendor@example.com" />
          <Input label="GSTIN" value={form.gstin} onChange={f("gstin")} placeholder="22AAAAA0000A1Z5" />

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: COLORS.muted, letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>
              Address
            </label>
            <textarea
              value={form.address}
              onChange={f("address")}
              rows={2}
              placeholder="Street, City, State"
              style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.text, borderRadius: 6, padding: "8px 12px", width: "100%", fontFamily: "'DM Sans',sans-serif", fontSize: 13, resize: "vertical" }}
            />
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <Btn onClick={submit} style={{ flex: 1 }}>{editing ? "Save Changes" : "Add Supplier"}</Btn>
            {editing && <Btn variant="ghost" onClick={cancelEdit}>Cancel</Btn>}
          </div>
          {msg && <p style={{ color: msg.color, fontSize: 12, marginTop: 8, textAlign: "center" }}>{msg.text}</p>}
        </Card>

        {/* List */}
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", gap: 10, alignItems: "center" }}>
            <SearchBar
              onSearch={(v) => { setQ(v); load({ page: 1, q: v }); }}
              placeholder="Search name, phone, GSTIN…"
            />
            <span style={{ color: COLORS.muted, fontSize: 12, whiteSpace: "nowrap" }}>{total} suppliers</span>
          </div>

          {loading ? (
            <p style={{ color: COLORS.muted, textAlign: "center", padding: 32 }}>Loading…</p>
          ) : error ? (
            <ErrorMsg error={error} />
          ) : items.length === 0 ? (
            <p style={{ color: COLORS.muted, textAlign: "center", padding: 32 }}>No suppliers yet. Add your first vendor above.</p>
          ) : (
            <>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    {["Supplier", "Contact", "Phone", "GSTIN", ""].map((h) => (
                      <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: COLORS.muted, fontWeight: 500, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((s) => {
                    const isExpanded = expandedId === s.id;
                    
                    const handleGenerateAutoDraft = async (e) => {
                      e.stopPropagation();
                      setPoDrafting(true);
                      try {
                        const res = await api.purchaseOrders.autoDraft(s.id);
                        flash(`Auto-draft PO ${res.data.po_number} successfully created!`, COLORS.success);
                        // Refresh performance details
                        const perfRes = await api.suppliers.performance(s.id);
                        setPerformanceData(perfRes.data);
                      } catch (err) {
                        flash(err.message || "No low stock items found to reorder.", COLORS.coral);
                      } finally {
                        setPoDrafting(false);
                      }
                    };

                    return (
                      <>
                        <tr 
                          key={s.id} 
                          style={{ 
                            borderBottom: `1px solid ${COLORS.border}22`,
                            cursor: "pointer",
                            background: isExpanded ? COLORS.surface + "bb" : "transparent"
                          }}
                          onClick={() => toggleExpand(s.id)}
                          onMouseEnter={(e) => { if (!isExpanded) e.currentTarget.style.background = COLORS.surface; }}
                          onMouseLeave={(e) => { if (!isExpanded) e.currentTarget.style.background = "transparent"; }}
                        >
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: 10, color: COLORS.muted }}>{isExpanded ? "▼" : "▶"}</span>
                              <div>
                                <p style={{ fontWeight: 600, color: COLORS.text }}>{s.name}</p>
                                {s.email && <p style={{ fontSize: 11, color: COLORS.muted }}>{s.email}</p>}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "12px 16px", color: COLORS.muted }}>{s.contact_name || "—"}</td>
                          <td style={{ padding: "12px 16px", color: COLORS.muted }}>
                            {s.phone ? (
                              <a href={`tel:${s.phone.replace(/[^0-9+]/g, '')}`} style={{ color: COLORS.accent, textDecoration: "none" }} onClick={e => e.stopPropagation()}>
                                {s.phone}
                              </a>
                            ) : "—"}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            {s.gstin
                              ? <span style={{ fontFamily: "monospace", fontSize: 11, background: COLORS.bg, color: COLORS.teal, padding: "2px 6px", borderRadius: 4 }}>{s.gstin}</span>
                              : <span style={{ color: COLORS.muted }}>—</span>}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                              <Btn small variant="ghost" onClick={(e) => { e.stopPropagation(); startEdit(s); }}>Edit</Btn>
                              <Btn small variant="danger" onClick={(e) => { e.stopPropagation(); remove(s.id); }}>Delete</Btn>
                            </div>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr>
                            <td colSpan="5" style={{ padding: "14px 20px 20px 30px", background: COLORS.bg + "22", borderBottom: `1px solid ${COLORS.border}44` }}>
                              <div style={{ border: `1px solid ${COLORS.border}55`, borderRadius: 8, padding: "16px 20px", background: COLORS.surface + "66" }}>
                                {performanceLoading ? (
                                  <p style={{ color: COLORS.muted, fontSize: 12, textAlign: "center", padding: "20px 0" }}>⏳ Loading supplier analytics dashboard…</p>
                                ) : !performanceData ? (
                                  <p style={{ color: COLORS.muted, fontSize: 12, textAlign: "center", padding: "20px 0" }}>⚠️ Failed to load performance details.</p>
                                ) : (
                                  <div>
                                    {/* Header & Metrics */}
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: `1px solid ${COLORS.border}44`, paddingBottom: 10 }}>
                                      <div>
                                        <h4 style={{ fontSize: 14, fontWeight: 600, color: COLORS.accent, margin: 0 }}>📊 {performanceData.supplier.name} Dashboard</h4>
                                        <p style={{ fontSize: 10, color: COLORS.muted, marginTop: 2 }}>Vendor ID: SUP-{performanceData.supplier.id} · Registered GSTIN: {performanceData.supplier.gstin || "N/A"}</p>
                                      </div>
                                      <Btn 
                                        small 
                                        onClick={handleGenerateAutoDraft} 
                                        disabled={poDrafting}
                                        style={{ background: COLORS.teal, color: "#fff", display: "flex", alignItems: "center", gap: 4 }}
                                      >
                                        {poDrafting ? "⏳ Auto-Drafting…" : "⚡ Auto-Draft PO (Low Stock)"}
                                      </Btn>
                                    </div>

                                    {/* Stats Widgets */}
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginBottom: 16 }}>
                                      <div style={{ background: COLORS.bg + "44", border: `1px solid ${COLORS.border}33`, borderRadius: 6, padding: "8px 12px" }}>
                                        <span style={{ fontSize: 10, color: COLORS.muted, textTransform: "uppercase" }}>Total Spend</span>
                                        <p style={{ fontSize: 16, fontWeight: 700, color: COLORS.teal, marginTop: 4 }}>₹{parseFloat(performanceData.stats.total_spend || 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                                      </div>
                                      <div style={{ background: COLORS.bg + "44", border: `1px solid ${COLORS.border}33`, borderRadius: 6, padding: "8px 12px" }}>
                                        <span style={{ fontSize: 10, color: COLORS.muted, textTransform: "uppercase" }}>Orders</span>
                                        <p style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, marginTop: 4 }}>{performanceData.stats.total_pos} POs</p>
                                      </div>
                                      <div style={{ background: COLORS.bg + "44", border: `1px solid ${COLORS.border}33`, borderRadius: 6, padding: "8px 12px" }}>
                                        <span style={{ fontSize: 10, color: COLORS.muted, textTransform: "uppercase" }}>Completed</span>
                                        <p style={{ fontSize: 16, fontWeight: 700, color: COLORS.success, marginTop: 4 }}>{performanceData.stats.completed_pos}</p>
                                      </div>
                                      <div style={{ background: COLORS.bg + "44", border: `1px solid ${COLORS.border}33`, borderRadius: 6, padding: "8px 12px" }}>
                                        <span style={{ fontSize: 10, color: COLORS.muted, textTransform: "uppercase" }}>Pending</span>
                                        <p style={{ fontSize: 16, fontWeight: 700, color: COLORS.coral, marginTop: 4 }}>{performanceData.stats.pending_pos}</p>
                                      </div>
                                      <div style={{ background: COLORS.bg + "44", border: `1px solid ${COLORS.border}33`, borderRadius: 6, padding: "8px 12px" }}>
                                        <span style={{ fontSize: 10, color: COLORS.muted, textTransform: "uppercase" }}>Fulfillment</span>
                                        <p style={{ fontSize: 16, fontWeight: 700, color: COLORS.teal, marginTop: 4 }}>
                                          {performanceData.stats.fulfillment_rate !== null ? `${performanceData.stats.fulfillment_rate}%` : "—"}
                                        </p>
                                      </div>
                                      <div style={{ background: COLORS.bg + "44", border: `1px solid ${COLORS.border}33`, borderRadius: 6, padding: "8px 12px" }}>
                                        <span style={{ fontSize: 10, color: COLORS.muted, textTransform: "uppercase" }}>Lead Time</span>
                                        <p style={{ fontSize: 16, fontWeight: 700, color: COLORS.purple, marginTop: 4 }}>
                                          {performanceData.stats.avg_lead_time_days !== null ? `${performanceData.stats.avg_lead_time_days}d` : "—"}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Sub columns: PO History (Left) and Catalog (Right) */}
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                      {/* Purchase Orders */}
                                      <div>
                                        <p style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.04em", marginBottom: 8 }}>🧾 Recent Purchase Orders</p>
                                        {performanceData.recentPOs.length === 0 ? (
                                          <p style={{ color: COLORS.muted, fontSize: 11, fontStyle: "italic", padding: "10px 0" }}>No POs issued yet.</p>
                                        ) : (
                                          <div style={{ maxHeight: 180, overflowY: "auto" }}>
                                            <table style={{ fontSize: 11 }}>
                                              <thead>
                                                <tr>
                                                  <th>PO #</th>
                                                  <th>Date</th>
                                                  <th>Status</th>
                                                  <th>Total</th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {performanceData.recentPOs.map((po) => (
                                                  <tr key={po.id}>
                                                    <td style={{ fontFamily: "monospace", color: COLORS.teal }}>{po.po_number}</td>
                                                    <td>{po.date}</td>
                                                    <td>
                                                      <span className="badge" style={{ 
                                                        background: po.status === "Received" ? COLORS.success + "22" : po.status === "Sent" ? COLORS.accent + "22" : COLORS.muted + "22",
                                                        color: po.status === "Received" ? COLORS.success : po.status === "Sent" ? COLORS.accent : COLORS.muted,
                                                        fontSize: 9,
                                                        padding: "1px 5px"
                                                      }}>
                                                        {po.status}
                                                      </span>
                                                    </td>
                                                    <td style={{ fontWeight: 600, color: COLORS.text }}>₹{parseFloat(po.total_amount).toFixed(0)}</td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          </div>
                                        )}
                                      </div>

                                      {/* Catalog */}
                                      <div>
                                        <p style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.04em", marginBottom: 8 }}>📦 Supplied Items Catalog</p>
                                        {performanceData.itemsSupplied.length === 0 ? (
                                          <p style={{ color: COLORS.muted, fontSize: 11, fontStyle: "italic", padding: "10px 0" }}>No stock items registered for this supplier.</p>
                                        ) : (
                                          <div style={{ maxHeight: 180, overflowY: "auto" }}>
                                            <table style={{ fontSize: 11 }}>
                                              <thead>
                                                <tr>
                                                  <th>Item</th>
                                                  <th>Last Cost</th>
                                                  <th>Avg Cost</th>
                                                  <th>Batches</th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {performanceData.itemsSupplied.map((it, idx) => {
                                                  const isSelected = selectedCatalogItem === it.name;
                                                  const itemHistory = performanceData.priceHistory.filter(ph => ph.name === it.name);
                                                  const itemTrend = (() => {
                                                    if (itemHistory.length < 2) return null;
                                                    const latest = parseFloat(itemHistory[0].price);
                                                    const prev = parseFloat(itemHistory[1].price);
                                                    if (prev === 0) return null;
                                                    return ((latest - prev) / prev) * 100;
                                                  })();

                                                  return (
                                                    <Fragment key={idx}>
                                                      <tr 
                                                        onClick={() => setSelectedCatalogItem(isSelected ? null : it.name)} 
                                                        style={{ 
                                                          cursor: "pointer", 
                                                          background: isSelected ? COLORS.border + "33" : "transparent"
                                                        }}
                                                        onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = COLORS.border + "11"; }}
                                                        onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                                                      >
                                                        <td style={{ fontWeight: 500, padding: "8px 12px" }}>
                                                          <span style={{ fontSize: 9, color: COLORS.muted, marginRight: 6 }}>{isSelected ? "▼" : "▶"}</span>
                                                          <span style={{ color: COLORS.accent, fontFamily: "monospace", fontSize: 9, marginRight: 6 }}>{it.item_code}</span>
                                                          {it.name}
                                                        </td>
                                                        <td style={{ color: COLORS.text, padding: "8px 12px" }}>
                                                          ₹{parseFloat(it.last_price || 0).toFixed(2)}
                                                          {itemTrend !== null && (
                                                            <span style={{ 
                                                              marginLeft: 6,
                                                              fontSize: 10,
                                                              color: itemTrend > 0 ? COLORS.coral : itemTrend < 0 ? COLORS.success : COLORS.muted,
                                                              fontWeight: 600
                                                            }}>
                                                              {itemTrend > 0 ? `↗ +${itemTrend.toFixed(1)}%` : itemTrend < 0 ? `↘ ${itemTrend.toFixed(1)}%` : `→ 0.0%`}
                                                            </span>
                                                          )}
                                                        </td>
                                                        <td style={{ color: COLORS.muted, padding: "8px 12px" }}>₹{parseFloat(it.avg_price || 0).toFixed(2)}</td>
                                                        <td style={{ padding: "8px 12px" }}>{it.total_batches}</td>
                                                      </tr>
                                                      {isSelected && (
                                                        <tr>
                                                          <td colSpan="4" style={{ padding: "6px 12px 10px 24px", background: COLORS.bg + "44" }}>
                                                            <div style={{ borderLeft: `2px solid ${COLORS.accent}`, paddingLeft: 10, marginTop: 4 }}>
                                                              <p style={{ fontSize: 9, color: COLORS.muted, textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>📈 Price History Timeline</p>
                                                              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                                                {itemHistory.map((h, hIdx) => {
                                                                  const prevPriceRecord = itemHistory[hIdx + 1];
                                                                  let priceDiffPct = null;
                                                                  if (prevPriceRecord) {
                                                                    const curP = parseFloat(h.price);
                                                                    const prevP = parseFloat(prevPriceRecord.price);
                                                                    if (prevP > 0) {
                                                                      priceDiffPct = ((curP - prevP) / prevP) * 100;
                                                                    }
                                                                  }
                                                                  return (
                                                                    <div key={hIdx} style={{ fontSize: 10, display: "flex", justifyContent: "space-between", alignItems: "center", background: COLORS.surface + "bb", border: `1px solid ${COLORS.border}22`, padding: "4px 8px", borderRadius: 4 }}>
                                                                      <span style={{ color: COLORS.muted }}>{new Date(h.date).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                        <span style={{ fontWeight: 600, color: COLORS.text }}>₹{parseFloat(h.price).toFixed(2)}</span>
                                                                        {priceDiffPct !== null && (
                                                                          <span style={{ 
                                                                            fontSize: 9,
                                                                            color: priceDiffPct > 0 ? COLORS.coral : priceDiffPct < 0 ? COLORS.success : COLORS.muted,
                                                                            fontWeight: 600
                                                                          }}>
                                                                            {priceDiffPct > 0 ? `↗ +${priceDiffPct.toFixed(1)}%` : priceDiffPct < 0 ? `↘ ${priceDiffPct.toFixed(1)}%` : `→ 0.0%`}
                                                                          </span>
                                                                        )}
                                                                      </div>
                                                                    </div>
                                                                  );
                                                                })}
                                                              </div>
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      )}
                                                    </Fragment>
                                                  );
                                                })}
                                              </tbody>
                                            </table>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
              <Pagination page={page} total={total} limit={LIMIT} onPage={(p) => load({ page: p })} />
            </>
          )}
        </Card>
      </div>
      {deleteConfirmId && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Card style={{ maxWidth: 400, width: "100%", padding: 24 }}>
            <h3 style={{ marginTop: 0, color: COLORS.text }}>Confirm Deletion</h3>
            <p style={{ color: COLORS.muted, fontSize: 13, marginBottom: 20 }}>Are you sure you want to delete this supplier? This cannot be undone.</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Btn variant="ghost" onClick={() => setDeleteConfirmId(null)}>Cancel</Btn>
              <Btn variant="danger" onClick={executeRemove}>Delete</Btn>
            </div>
          </Card>
        </div>
      )}
    </Section>
  );
}
