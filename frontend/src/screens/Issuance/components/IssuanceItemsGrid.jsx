import IssuanceItemRow from "./IssuanceItemRow";
import { COLORS } from "../../../styles/colors";
import { ClipboardList, CheckSquare, CheckCircle, X } from "lucide-react";

const TH = ({ children, style = {} }) => (
  <th style={{
    padding: "11px 14px", fontSize: 11, fontWeight: 600, color: COLORS.muted,
    textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "left",
    backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap",
    ...style,
  }}>
    {children}
  </th>
);

export default function IssuanceItemsGrid({
  selectedIndent, issueQtys, availableStock, onQtyChange,
  confirmedItems = new Set(), onToggleConfirm = () => {},
  onIssue, onSelectIndent, isMobile = false,
  stocks, getItemPrice,
}) {
  const items = selectedIndent?.items || [];
  const totalItems = items.length;
  const confirmedCount = confirmedItems ? confirmedItems.size : 0;
  const needAttentionCount = items.filter((it, idx) => {
    const avail = parseFloat(availableStock[it.name?.toLowerCase()]) || 0;
    const req = parseFloat(issueQtys[idx] ?? it.qty) || 0;
    return avail < req;
  }).length;

  const EmptyState = () => (
    <div style={{ padding: "64px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, textAlign: "center" }}>
      <ClipboardList size={40} color="#cbd5e1" />
      <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: COLORS.text }}>No indent selected</p>
      <p style={{ margin: 0, fontSize: 13, color: COLORS.muted }}>Select an indent from the list to view its items.</p>
    </div>
  );

  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, backgroundColor: "#ffffff", display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* Header */}
      {selectedIndent && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid #e2e8f0", backgroundColor: "#ffffff", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: isMobile ? 16 : 18, fontWeight: 800, color: COLORS.text }}>
              {selectedIndent.dept}
            </span>
            <span style={{ fontSize: 11, color: COLORS.muted }}>{selectedIndent.date}</span>
            {(() => {
              const isAdhoc = (selectedIndent.indent_type || "routine") === "adhoc";
              return (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "2px 10px", borderRadius: 20,
                  fontSize: 11, fontWeight: 700, letterSpacing: "0.03em",
                  background: isAdhoc ? "#FEF3C7" : "#D1FAE5",
                  color: isAdhoc ? "#92400E" : "#065F46",
                  border: `1px solid ${isAdhoc ? "#FCD34D" : "#6EE7B7"}`,
                  whiteSpace: "nowrap",
                }}>
                  {isAdhoc ? "⚡ Ad-Hoc" : "✓ Routine"}
                </span>
              );
            })()}
          </div>
          {onSelectIndent && (
            <button
              onClick={() => onSelectIndent(null)}
              style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: 6, padding: "4px 8px", cursor: "pointer", color: COLORS.muted, fontSize: 12, display: "flex", alignItems: "center", gap: 4, fontWeight: 600, minHeight: 36 }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = COLORS.brandLight; e.currentTarget.style.color = COLORS.brandDark; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = COLORS.muted; }}
            >
              Exit <X size={14} />
            </button>
          )}
        </div>
      )}

      {/* ── Body ── */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {!selectedIndent ? (
          <EmptyState />
        ) : items.length === 0 ? (
          <p style={{ color: COLORS.muted, textAlign: "center", padding: 40, fontSize: 13 }}>This indent has no items.</p>
        ) : isMobile ? (
          /* ── Mobile: item cards ── */
          <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "12px 12px 80px 12px" }}>
            {items.map((it, idx) => {
              const available = parseFloat(availableStock[it.name?.toLowerCase()]) || 0;
              const issueQty  = parseFloat(issueQtys[idx] ?? it.qty) || 0;
              const isLow     = available < issueQty;
              const isConf    = confirmedItems.has(idx);
              const unitPrice = getItemPrice ? getItemPrice(it.name) : 0;

              return (
                <div key={idx} style={{
                  background: isConf ? (COLORS.success + "08") : "#fff",
                  border: `1px solid ${isConf ? COLORS.success + "33" : (isLow ? COLORS.danger + "44" : "#e2e8f0")}`,
                  borderRadius: 10, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8,
                }}>
                  {/* Top row */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ minWidth: 0 }}>
                      <span style={{ fontSize: 9, color: COLORS.accent, display: "block", fontWeight: 700, marginBottom: 2, letterSpacing: "0.05em" }}>{it.item_code || "KPL"}</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, display: "block" }}>{it.name}</span>
                      <span style={{ fontSize: 11, color: COLORS.muted }}>{it.unit || "kg"} · Requested: {it.qty}</span>
                      <span style={{ fontSize: 11, color: COLORS.muted, display: "block", marginTop: 2 }}>
                        Price: ₹{unitPrice.toFixed(2)} | Cost: ₹{(issueQty * unitPrice).toFixed(2)}
                      </span>
                    </div>
                    <button
                      onClick={() => onToggleConfirm(idx)}
                      style={{
                        flexShrink: 0, padding: "6px 10px", borderRadius: 8,
                        border: `1.5px solid ${isConf ? COLORS.success : "#e2e8f0"}`,
                        background: isConf ? (COLORS.success + "15") : "#f8fafc",
                        color: isConf ? COLORS.success : COLORS.muted,
                        cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, minHeight: 40, minWidth: 40, justifyContent: "center",
                      }}
                    >
                      <CheckCircle size={16} />
                    </button>
                  </div>

                  {/* Issue qty row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: COLORS.muted, flexShrink: 0 }}>Issue Qty</label>
                    <input
                      type="number"
                      value={issueQtys[idx] ?? it.qty}
                      onChange={(e) => onQtyChange(idx, e.target.value)}
                      min="0" step="0.01"
                      style={{
                        flex: 1, padding: "8px 12px", fontSize: 15, fontWeight: 700, color: COLORS.text,
                        border: `1px solid ${isLow ? COLORS.danger : COLORS.border}`,
                        borderRadius: 8, background: "#f8fafc", outline: "none", minHeight: 44,
                      }}
                    />
                    <span style={{
                      flexShrink: 0, fontSize: 11, fontWeight: 600,
                      color: isLow ? COLORS.danger : COLORS.success,
                      padding: "3px 8px", borderRadius: 6,
                      background: isLow ? (COLORS.danger + "12") : (COLORS.success + "12"),
                    }}>
                      {isLow ? `⚠ Low (${available})` : `✓ ${available} avail`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── Desktop: full table ── */
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ position: "sticky", top: 0, zIndex: 5 }}>
              <tr>
                <TH style={{ width: 24, textAlign: "center" }}></TH>
                <TH style={{ width: 40, textAlign: "center" }}>#</TH>
                <TH style={{ width: 100 }}>Item Code</TH>
                <TH>Item Name</TH>
                <TH style={{ width: 70 }}>QTY</TH>
                <TH style={{ width: 100 }}>Issue QTY</TH>
                <TH style={{ width: 70 }}>Unit</TH>
                <TH style={{ width: 80 }}>Price</TH>
                <TH style={{ width: 90 }}>Cost</TH>
                <TH style={{ width: 80, textAlign: "center" }}>
                  <CheckSquare size={12} style={{ display: "inline-block", verticalAlign: "middle" }} />
                </TH>
                <TH style={{ width: 140 }}>Avail</TH>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => {
                const available = parseFloat(availableStock[it.name?.toLowerCase()]) || 0;
                const issueQty = issueQtys[idx] ?? it.qty;
                const unitPrice = getItemPrice ? getItemPrice(it.name) : 0;
                return (
                  <IssuanceItemRow
                    key={idx} idx={idx} item={it} available={available}
                    issueQty={issueQty} onQtyChange={onQtyChange}
                    isConfirmed={confirmedItems.has(idx)} onToggleConfirm={onToggleConfirm}
                    unitPrice={unitPrice}
                  />
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Stats footer */}
      <div style={{ padding: "10px 16px", borderTop: "1px solid #e2e8f0", backgroundColor: "#fafafa", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 16, fontSize: 13, flexShrink: 0 }}>
        {needAttentionCount > 0 && (
          <span style={{ color: "#ef4444", fontWeight: 600 }}>⚠ {needAttentionCount} need attention</span>
        )}
        <span style={{ color: COLORS.muted, fontWeight: 500 }}>
          Total Cost: <strong style={{ color: COLORS.text }}>₹{items.reduce((sum, it, idx) => sum + (parseFloat(issueQtys[idx] ?? it.qty) || 0) * (getItemPrice ? getItemPrice(it.name) : 0), 0).toFixed(2)}</strong>
        </span>
        <span style={{ color: COLORS.muted, fontWeight: 500 }}>
          Total items: <strong style={{ color: COLORS.text }}>{totalItems}</strong>
        </span>
      </div>

      {/* Issue action footer */}
      {selectedIndent && (
        <div style={{
          padding: isMobile ? "12px 16px" : "16px 20px",
          borderTop: "1px solid #e2e8f0",
          backgroundColor: "#ffffff",
          display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexShrink: 0,
        }}>
          <div>
            {confirmedCount > 0 && (
              <span style={{ color: COLORS.muted, fontSize: 13, fontWeight: 500 }}>
                {confirmedCount} of {totalItems} items confirmed
              </span>
            )}
          </div>
          <button
            onClick={onIssue}
            disabled={confirmedCount === 0}
            style={{
              height: isMobile ? 48 : 40,
              padding: isMobile ? "0 20px" : "0 24px",
              flex: isMobile ? 1 : "unset",
              backgroundColor: "#111827", opacity: confirmedCount > 0 ? 1 : 0.5,
              color: "#ffffff", border: "none", borderRadius: 8,
              fontSize: 14, fontWeight: 700, cursor: confirmedCount > 0 ? "pointer" : "not-allowed",
              transition: "all 0.15s", letterSpacing: "0.01em",
            }}
          >
            Issue &amp; Update Stock
          </button>
        </div>
      )}
    </div>
  );
}
