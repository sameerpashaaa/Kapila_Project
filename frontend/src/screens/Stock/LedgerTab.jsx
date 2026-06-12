import React from "react";
import { COLORS } from "../../styles/colors";
import Pagination from "../../components/Pagination";

const LedgerTab = ({ ledgerLoading, ledgerData, ledgerPage, ledgerTotal, limit, onPage }) => {
  if (ledgerLoading) {
    return <p style={{ color: COLORS.muted, textAlign: "center", padding: 32 }}>Loading ledger…</p>;
  }

  if (!ledgerData || ledgerData.length === 0) {
    return <p style={{ color: COLORS.muted, textAlign: "center", padding: 40 }}>No stock movement recorded yet</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ overflowY: "auto", flex: 1, padding: "14px 20px" }}>
        <table style={{ borderCollapse: "separate", borderSpacing: "0 6px", width: "100%" }}>
          <thead>
            <tr>
              <th style={{ background: "transparent", textAlign: "left" }}>Date</th>
              <th style={{ background: "transparent", textAlign: "left" }}>Item</th>
              <th style={{ background: "transparent", textAlign: "left" }}>Action</th>
              <th style={{ background: "transparent", textAlign: "left" }}>Qty</th>
              <th style={{ background: "transparent", textAlign: "left" }}>Detail</th>
            </tr>
          </thead>
          <tbody>
            {ledgerData.map((item, index) => {
              const isPurchase = item.type === "Purchase";
              const isIssue = item.type === "Issue";
              const typeColor = isPurchase ? COLORS.teal : isIssue ? COLORS.accent : COLORS.purple;
              const typeBg = isPurchase ? COLORS.teal + "15" : isIssue ? COLORS.accent + "15" : COLORS.purple + "15";
              
              return (
                <tr key={index} style={{ background: COLORS.bg + "44" }}>
                  <td style={{ color: COLORS.muted, padding: "10px 14px" }}>{item.date}</td>
                  <td style={{ fontWeight: 600, padding: "10px 14px" }}>
                    <span style={{ color: COLORS.accent, fontSize: 10, display: "block", fontWeight: 600 }}>{item.item_code || "KPL-NEW"}</span>
                    {item.name}
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <span className="badge" style={{ background: typeBg, color: typeColor, textTransform: "uppercase", fontSize: 10 }}>
                      {item.type}
                    </span>
                  </td>
                  <td style={{ color: isPurchase ? COLORS.success : isIssue ? COLORS.coral : COLORS.text, fontWeight: 500, padding: "10px 14px" }}>
                    {isPurchase ? "+" : isIssue ? "-" : ""}{item.qty}
                  </td>
                  <td style={{ color: COLORS.muted, fontSize: 12, padding: "10px 14px" }}>
                    {isPurchase ? `From ${item.detail || "Unknown"}` : isIssue ? `Issued to ${item.detail}` : `Detail: ${item.detail}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ padding: "12px 20px", borderTop: `1px solid ${COLORS.border}` }}>
        <Pagination page={ledgerPage} total={ledgerTotal} limit={limit} onPageChange={onPage} />
      </div>
    </div>
  );
};

export default LedgerTab;
