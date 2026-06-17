import { useState, useEffect } from "react";
import Card from "../components/Card";
import { COLORS } from "../styles/colors";
import * as api from "../api";
import { useAppContext } from "../context/AppContext";
import { today } from "../utils/dates";
import { ChevronLeft, ShoppingCart } from "lucide-react";
import { useBreakpoint } from "../styles/responsive";

import { NewStockEntryForm } from "../components/StockMaster/NewStockEntryForm";

export default function StoreManagerStockPurchase() {
  const { stocks, refreshStockNames, setCurrentScreen } = useAppContext();
  const { isMobile } = useBreakpoint();

  const [ledgerData, setLedgerData]       = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  const loadLedger = async () => {
    setLedgerLoading(true);
    try {
      const res = await api.stock.ledger({ page: 1, limit: 50 });
      setLedgerData(res.data || []);
    } catch (e) {
      console.error("Failed to load ledger:", e);
    } finally {
      setLedgerLoading(false);
    }
  };

  useEffect(() => { loadLedger(); refreshStockNames(); }, []);

  const purchases = ledgerData.filter((item) => item.type === "Purchase");

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#F8FAFC",
      display: "flex",
      flexDirection: "column",
      /* No overflow:hidden on mobile — allow natural scroll */
      ...(isMobile ? {} : { height: "100vh", overflow: "hidden" }),
    }}>

      {/* ── Page Header ── */}
      <div style={{
        backgroundColor: "white", borderBottom: "1px solid #E2E8F0",
        padding: isMobile ? "12px 16px" : "16px 24px",
        display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, flexShrink: 0,
      }}>
        <button
          onClick={() => setCurrentScreen("store_manager_home")}
          style={{ background: "none", border: "1px solid #E2E8F0", borderRadius: 8, padding: "8px 12px", cursor: "pointer", color: "#475569", fontSize: 14, display: "flex", alignItems: "center", gap: 6, fontWeight: 500, minHeight: 40 }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#F1F5F9"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
        >
          <ChevronLeft size={16} /> Back
        </button>
        <h1 style={{ margin: 0, fontSize: isMobile ? 18 : 24, fontWeight: 800, color: "#0F172A" }}>
          Purchase Order
        </h1>
      </div>

      {/* ── Body ── */}
      <div style={{
        flex: 1,
        padding: isMobile ? "16px" : "24px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        ...(isMobile ? {} : { minHeight: 0 }),
        boxSizing: "border-box",
      }}>

        {/* New Stock Entry Form */}
        <Card style={{
          flex: isMobile ? "unset" : 9,
          backgroundColor: "white", borderRadius: 12, border: "1px solid #E2E8F0",
          padding: isMobile ? "16px" : "24px",
          display: "flex", flexDirection: "column",
          ...(isMobile ? {} : { minHeight: 0 }),
          boxSizing: "border-box",
        }}>
          <div style={{ flex: 1, overflowY: isMobile ? "unset" : "auto", minHeight: 0, paddingRight: isMobile ? 0 : 4 }}>
            <NewStockEntryForm onSuccess={() => { loadLedger(); refreshStockNames(); }} />
          </div>
        </Card>

        {/* Recent Purchases */}
        <Card style={{
          flex: isMobile ? "unset" : 1,
          backgroundColor: "white", borderRadius: 12, border: "1px solid #E2E8F0",
          padding: isMobile ? "16px" : "16px 24px",
          display: "flex", flexDirection: "column",
          ...(isMobile ? {} : { minHeight: 0 }),
          boxSizing: "border-box",
        }}>
          <h2 style={{ margin: "0 0 12px 0", fontSize: isMobile ? 16 : 18, fontWeight: 800, color: "#0F172A", flexShrink: 0 }}>
            Recent Purchases
          </h2>
          <div style={{ flex: 1, overflowY: isMobile ? "unset" : "auto", minHeight: 0 }}>
            {ledgerLoading ? (
              <p style={{ color: COLORS.muted, fontSize: 12 }}>Loading recent purchases...</p>
            ) : purchases.length === 0 ? (
              <p style={{ color: COLORS.muted, fontSize: 12 }}>No purchases recorded yet. Add your first stock entry above.</p>
            ) : isMobile ? (
              /* Mobile: mini cards */
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {purchases.slice(0, 10).map((item, index) => (
                  <div key={index} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 12px", borderRadius: 8,
                    background: "#F8FAFC", border: "1px solid #E2E8F0",
                  }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: COLORS.success + "18", color: COLORS.success, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <ShoppingCart size={16} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: COLORS.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</p>
                      <p style={{ margin: 0, fontSize: 11, color: COLORS.muted }}>{item.date} · {item.detail || "—"}</p>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.success, flexShrink: 0 }}>+{item.qty} {item.unit}</span>
                  </div>
                ))}
              </div>
            ) : (
              /* Desktop: compact table */
              <div className="resp-table-wrap">
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, textAlign: "left" }}>
                  <thead>
                    <tr style={{ background: COLORS.bg + "44", borderBottom: `1px solid ${COLORS.border}`, color: COLORS.muted, fontWeight: 600 }}>
                      <th style={{ padding: "6px 10px", fontSize: 11 }}>Date</th>
                      <th style={{ padding: "6px 10px", fontSize: 11 }}>Item</th>
                      <th style={{ padding: "6px 10px", fontSize: 11 }}>Supplier</th>
                      <th style={{ padding: "6px 10px", fontSize: 11 }}>Qty Added</th>
                      <th style={{ padding: "6px 10px", fontSize: 11 }}>Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.slice(0, 10).map((item, index) => (
                      <tr key={index} style={{ borderBottom: `1px solid ${COLORS.border}33` }}>
                        <td style={{ color: COLORS.muted, padding: "6px 10px" }}>{item.date}</td>
                        <td style={{ fontWeight: 600, padding: "6px 10px" }}>
                          <span style={{ color: COLORS.accent, fontSize: 9, display: "block", fontWeight: 600 }}>{item.item_code || "KPL-NEW"}</span>
                          {item.name}
                        </td>
                        <td style={{ padding: "6px 10px" }}>{item.detail || "—"}</td>
                        <td style={{ color: COLORS.success, fontWeight: 500, padding: "6px 10px" }}>+{item.qty} {item.unit}</td>
                        <td style={{ color: COLORS.muted, fontSize: 11, padding: "6px 10px" }}>Landed entry logged</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
