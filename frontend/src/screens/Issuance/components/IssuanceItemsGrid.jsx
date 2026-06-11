import IssuanceItemRow from "./IssuanceItemRow";
import { COLORS } from "../../../styles/colors";
import { ClipboardList } from "lucide-react";

const TH = ({ children, style = {} }) => (
  <th
    style={{
      padding: "11px 14px",
      fontSize: 11,
      fontWeight: 600,
      color: COLORS.muted,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      textAlign: "left",
      backgroundColor: "#f8fafc",
      borderBottom: "1px solid #e2e8f0",
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {children}
  </th>
);

export default function IssuanceItemsGrid({ selectedIndent, issueQtys, availableStock, onQtyChange }) {
  const items = selectedIndent?.items || [];

  const totalItems = items.length;
  const needAttentionCount = items.filter((it, idx) => {
    const avail = parseFloat(availableStock[it.name?.toLowerCase()]) || 0;
    const req = parseFloat(issueQtys[idx] ?? it.qty) || 0;
    return avail < req;
  }).length;

  return (
    <div
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        backgroundColor: "#ffffff",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Scrollable table area */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ position: "sticky", top: 0, zIndex: 5 }}>
            <tr>
              <TH style={{ width: 40, textAlign: "center" }}>#</TH>
              <TH style={{ width: 100 }}>Item Code</TH>
              <TH>Item Name</TH>
              <TH style={{ width: 70 }}>QTY</TH>
              <TH style={{ width: 100 }}>Issue QTY</TH>
              <TH style={{ width: 70 }}>Unit</TH>
              <TH style={{ width: 140 }}>Avail</TH>
            </tr>
          </thead>
          <tbody>
            {!selectedIndent ? (
              <tr>
                <td colSpan={7} style={{ padding: "72px 20px", textAlign: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                    <ClipboardList size={40} color="#cbd5e1" />
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: COLORS.text }}>No indent selected</p>
                    <p style={{ margin: 0, fontSize: 13, color: COLORS.muted }}>
                      Select an indent from the left panel to view its items.
                    </p>
                  </div>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: "40px 20px", textAlign: "center", color: COLORS.muted, fontSize: 13 }}>
                  This indent has no items.
                </td>
              </tr>
            ) : (
              items.map((it, idx) => {
                const available = parseFloat(availableStock[it.name?.toLowerCase()]) || 0;
                const issueQty = issueQtys[idx] ?? it.qty;
                return (
                  <IssuanceItemRow
                    key={idx}
                    idx={idx}
                    item={it}
                    available={available}
                    issueQty={issueQty}
                    onQtyChange={onQtyChange}
                  />
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer — total + attention count, matching Indent's "Total items: N" footer */}
      <div
        style={{
          padding: "10px 16px",
          borderTop: "1px solid #e2e8f0",
          backgroundColor: "#fafafa",
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 16,
          fontSize: 13,
        }}
      >
        {needAttentionCount > 0 && (
          <span style={{ color: "#ef4444", fontWeight: 600 }}>
            ⚠ {needAttentionCount} need attention
          </span>
        )}
        <span style={{ color: COLORS.muted, fontWeight: 500 }}>
          Total items: <strong style={{ color: COLORS.text }}>{totalItems}</strong>
        </span>
      </div>
    </div>
  );
}
