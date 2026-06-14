import { useState, useEffect } from "react";
import Card from "../components/Card";
import { COLORS } from "../styles/colors";
import * as api from "../api";
import { useAppContext } from "../context/AppContext";
import { today } from "../utils/dates";
import { ChevronLeft } from "lucide-react";

// Extracted shared components
import StoreAlertsPanel from "../components/StockMaster/StoreAlertsPanel";
import { NewStockEntryForm } from "../components/StockMaster/NewStockEntryForm";

export default function StoreManagerStockPurchase() {
  const { stocks, refreshStockNames, setCurrentScreen } = useAppContext();
  
  const [ledgerData, setLedgerData] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [reorderItem, setReorderItem] = useState(null);
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

  const lowStockItems = stocks.filter((item) => {
    const pct = item.qty > 0 ? (item.remaining / item.qty) * 100 : 0;
    return item.min_alert_qty !== null ? item.remaining <= item.min_alert_qty : pct < 25;
  });

  const expiringSoonItems = stocks.filter((item) => {
    if (!item.expiry_date || item.remaining <= 0) return false;
    const todayVal = new Date(today());
    const expiryVal = new Date(item.expiry_date);
    const diffTime = expiryVal - todayVal;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 3;
  });

  const handleReorderClick = (item) => {
    setReorderItem(item);
  };

  const generateWhatsAppPO = () => {
    if (lowStockItems.length === 0) return;
    const header = "*KAPILA INVENTORY - PURCHASE ORDER*\n\nGenerated: " + today() + "\n\n";
    const itemsText = lowStockItems.map((item, idx) => {
      const needed = item.min_alert_qty ? (item.min_alert_qty * 2) : 10;
      return `${idx + 1}. *${item.name}* - Needs approx. ${needed} ${item.unit} (Current: ${parseFloat(item.remaining).toFixed(1)} ${item.unit})`;
    }).join("\n");
    const footer = "\n\nPlease check pricing and confirm delivery date.";
    window.open(`https://wa.me/?text=${encodeURIComponent(header + itemsText + footer)}`, "_blank");
  };

  const copyPOToClipboard = () => {
    if (lowStockItems.length === 0) return;
    const header = "*KAPILA INVENTORY - PURCHASE ORDER*\n\nGenerated: " + today() + "\n\n";
    const itemsText = lowStockItems.map((item, idx) => {
      const needed = item.min_alert_qty ? (item.min_alert_qty * 2) : 10;
      return `${idx + 1}. *${item.name}* - Needs approx. ${needed} ${item.unit} (Current: ${parseFloat(item.remaining).toFixed(1)} ${item.unit})`;
    }).join("\n");
    const footer = "\n\nPlease check pricing and confirm delivery date.";
    navigator.clipboard.writeText(header + itemsText + footer);
    setMsg("PO copied to clipboard ✓");
    setTimeout(() => setMsg(""), 3000);
  };

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
          Stock Purchase
        </h1>
      </div>

      {/* Body */}
      <div style={{ padding: "24px", display: "grid", gridTemplateColumns: window.innerWidth < 768 ? "1fr" : "340px 1fr", gap: "24px", flexShrink: 0 }}>
        {/* Left: Store Alerts */}
        <StoreAlertsPanel
          lowStockItems={lowStockItems}
          expiringSoonItems={expiringSoonItems}
          copyPOToClipboard={copyPOToClipboard}
          generateWhatsAppPO={generateWhatsAppPO}
          handleReorderClick={handleReorderClick}
          showActions={true} /* Show PO & Reorder actions in purchase view */
        />

        {/* Right: New Stock Entry Form */}
        <Card style={{ backgroundColor: "white", borderRadius: "12px", border: "1px solid #E2E8F0", padding: "28px" }}>
          <NewStockEntryForm
            onSuccess={() => {
              loadLedger();
              refreshStockNames();
            }}
            reorderItem={reorderItem}
          />
        </Card>
      </div>

      {/* Recent Purchases Table — below */}
      <div style={{ padding: "0 24px 24px", flex: 1 }}>
        <Card style={{ backgroundColor: "white", borderRadius: "12px", border: "1px solid #E2E8F0", padding: "20px 24px" }}>
          <h2 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: 600, color: "#0F172A" }}>
            Recent Purchases
          </h2>
          {ledgerLoading ? (
            <p style={{ color: COLORS.muted, padding: 12 }}>Loading recent purchases...</p>
          ) : purchases.length === 0 ? (
            <p style={{ color: COLORS.muted, padding: 12 }}>No purchases recorded yet. Add your first stock entry above.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
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
