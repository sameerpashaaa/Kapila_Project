import KplCodeBadge from "../../../components/KplCodeBadge";
import { COLORS } from "../../../styles/colors";

export default function IssuanceItemRow({ idx, item, issueQty, available, onQtyChange }) {
  const numQty = parseFloat(issueQty) || 0;
  const numAvail = parseFloat(available) || 0;
  const isInsufficient = numAvail < numQty;

  return (
    <tr
      style={{ backgroundColor: idx % 2 === 0 ? "#ffffff" : "#fafafa" }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f0f9ff")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = idx % 2 === 0 ? "#ffffff" : "#fafafa")}
    >
      {/* # */}
      <td style={tdStyle({ width: 40, textAlign: "center", color: COLORS.muted })}>
        {idx + 1}
      </td>

      {/* ITEM CODE */}
      <td style={tdStyle({ width: 100 })}>
        <KplCodeBadge code={item.item_code} />
      </td>

      {/* ITEM NAME */}
      <td style={tdStyle({ fontWeight: 500, color: COLORS.text })}>
        {item.name}
      </td>

      {/* QTY (requested) */}
      <td style={tdStyle({ width: 70, color: COLORS.muted })}>
        {item.qty}
      </td>

      {/* ISSUE QTY — editable input */}
      <td style={tdStyle({ width: 90 })}>
        <input
          type="number"
          value={issueQty}
          onChange={(e) => onQtyChange(idx, e.target.value)}
          title={isInsufficient ? `Only ${numAvail} available` : ""}
          style={{
            width: "100%",
            padding: "5px 8px",
            borderRadius: 6,
            border: `1.5px solid ${isInsufficient ? "#ef4444" : "#e2e8f0"}`,
            backgroundColor: isInsufficient ? "#fff5f5" : "#ffffff",
            fontSize: 13,
            outline: "none",
            transition: "border-color 0.15s",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = isInsufficient ? "#ef4444" : "#3b82f6";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = isInsufficient ? "#ef4444" : "#e2e8f0";
          }}
        />
      </td>

      {/* UNIT */}
      <td style={tdStyle({ width: 70, color: COLORS.muted })}>
        {item.unit || "kg"}
      </td>

      {/* AVAIL — colour-coded exactly like Indent's AVAIL column */}
      <td style={tdStyle({ width: 110 })}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 12,
            fontWeight: 600,
            color: isInsufficient ? "#ef4444" : "#16a34a",
            backgroundColor: isInsufficient ? "#fef2f2" : "#f0fdf4",
            padding: "3px 10px",
            borderRadius: 20,
            whiteSpace: "nowrap",
          }}
        >
          {isInsufficient ? "⚠" : "✓"} {numAvail} available
        </span>
      </td>
    </tr>
  );
}

function tdStyle(extra = {}) {
  return {
    padding: "12px 14px",
    fontSize: 13,
    borderBottom: "1px solid #f1f5f9",
    verticalAlign: "middle",
    ...extra,
  };
}
