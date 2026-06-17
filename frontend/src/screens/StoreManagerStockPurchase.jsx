import { useState, useEffect } from "react";
import Card from "../components/Card";
import { COLORS } from "../styles/colors";
import * as api from "../api";
import { useAppContext } from "../context/AppContext";
import { today } from "../utils/dates";
import { ChevronLeft } from "lucide-react";

// Extracted shared components
import { NewStockEntryForm } from "../components/StockMaster/NewStockEntryForm";

export default function StoreManagerStockPurchase() {
  const { stocks, refreshStockNames, setCurrentScreen } = useAppContext();
  
  const [ledgerData, setLedgerData] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [msg, setMsg] = useState("");

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

  useEffect(() => {
    loadLedger();
    refreshStockNames();
  }, []);



  // Filter ledger to only show Purchase movement
  const purchases = ledgerData.filter((item) => item.type === "Purchase");

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F8FAFC", display: "flex", flexDirection: "column" }}>
      {/* Page Header */}
      <div style={{
        backgroundColor: "white",
        borderBottom: "1px solid #E2E8F0",
        padding: "16px 24px",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "16px",
        flexShrink: 0
      }}>
        <button
          onClick={() => setCurrentScreen("store_manager_home")}
          style={{
            background: "none",
            border: "1px solid #E2E8F0",
            borderRadius: "8px",
            padding: "6px 12px",
            cursor: "pointer",
            color: "#475569",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontWeight: 500,
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#F1F5F9"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
        >
          <ChevronLeft size={16} /> Back
        </button>
        <h1 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#0F172A" }}>
          Purchase Order
        </h1>
      </div>

      {/* Body */}
      <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px", flexShrink: 0 }}>
        {/* New Stock Entry Form */}
        <Card style={{ backgroundColor: "white", borderRadius: "12px", border: "1px solid #E2E8F0", padding: "28px" }}>
          <NewStockEntryForm
            onSuccess={() => {
              loadLedger();
              refreshStockNames();
            }}
          />
        </Card>
      </div>

      {/* Recent Purchases Table — below */}
      <div style={{ padding: "0 24px 24px", flex: 1 }}>
        <Card style={{ backgroundColor: "white", borderRadius: "12px", border: "1px solid #E2E8F0", padding: "20px 24px" }}>
          <h2 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: 700, color: "#0F172A" }}>
            Recent Purchases
          </h2>
          {ledgerLoading ? (
            <p style={{ color: COLORS.muted, padding: 12 }}>Loading recent purchases...</p>
          ) : purchases.length === 0 ? (
            <p style={{ color: COLORS.muted, padding: 12 }}>No purchases recorded yet. Add your first stock entry above.</p>
          ) : (
            <div className="resp-table-wrap">
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
                <thead>
                  <tr style={{ background: COLORS.bg + "44", borderBottom: `1px solid ${COLORS.border}`, color: COLORS.muted, fontWeight: 600 }}>
                    <th style={{ padding: "10px 14px" }}>Date</th>
                    <th style={{ padding: "10px 14px" }}>Item</th>
                    <th style={{ padding: "10px 14px" }}>Supplier</th>
                    <th style={{ padding: "10px 14px" }}>Qty Added</th>
                    <th style={{ padding: "10px 14px" }}>Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.slice(0, 10).map((item, index) => (
                    <tr key={index} style={{ borderBottom: `1px solid ${COLORS.border}33` }}>
                      <td style={{ color: COLORS.muted, padding: "10px 14px" }}>{item.date}</td>
                      <td style={{ fontWeight: 600, padding: "10px 14px" }}>
                        <span style={{ color: COLORS.accent, fontSize: 10, display: "block", fontWeight: 600 }}>{item.item_code || "KPL-NEW"}</span>
                        {item.name}
                      </td>
                      <td style={{ padding: "10px 14px" }}>{item.detail || "—"}</td>
                      <td style={{ color: COLORS.success, fontWeight: 500, padding: "10px 14px" }}>+{item.qty} {item.unit}</td>
                      <td style={{ color: COLORS.muted, fontSize: 12, padding: "10px 14px" }}>Landed entry logged</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
      {msg && <p style={{ display: "none" }}>{msg}</p>}
    </div>
  );
}
