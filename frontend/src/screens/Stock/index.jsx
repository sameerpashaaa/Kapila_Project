import { useState, useEffect } from "react";
import Section from "../../components/Section";
import Card from "../../components/Card";
import Btn from "../../components/Btn";
import SearchBar from "../../components/SearchBar";
import { COLORS } from "../../styles/colors";
import { usePaginatedApi } from "../../hooks/useApi";
import * as api from "../../api";
import { useAppContext } from "../../context/AppContext";
import {
  LayoutList, Download, RefreshCw, BarChart2, ShoppingBag, Filter
} from "lucide-react";

import { today } from "../../utils/dates";
const LIMIT = 20;

import PriceTrendChart from "./PriceTrendChart";
import LedgerTab from "./LedgerTab";
import ProcurementTab from "./ProcurementTab";
import InsightsTab from "./InsightsTab";
import PrintPreviewModal from "./PrintPreviewModal";
import QuickAdjustmentModal from "./QuickAdjustmentModal";

// Extracted shared components
import { StockKpiCards } from "../../components/StockMaster/StockKpiCards";
import StoreAlertsPanel from "../../components/StockMaster/StoreAlertsPanel";
import { NewStockEntryForm } from "../../components/StockMaster/NewStockEntryForm";
import { StockTable } from "../../components/StockMaster/StockTable";

export default function StockScreen() {
  const { stocks, refreshStockNames } = useAppContext();
  const [msg, setMsg]   = useState("");
  const [filters, setFilters] = useState({ low_stock: "", expiry_status: "", supplier: "", active_only: "" });
  const [stats, setStats]     = useState({ total_spend: 0, store_value: 0, low_stock_value: 0 });
  const { items, total, page, loading, error, fetch } = usePaginatedApi(api.stock.list);

  const [editingId, setEditingId] = useState(null);
  const [editRemaining, setEditRemaining] = useState("");
  const [editMinAlert, setEditMinAlert] = useState("");
  const [editReason, setEditReason] = useState("Audit Correction");
  const [editNotes, setEditNotes] = useState("");
  const [reorderItem, setReorderItem] = useState(null);

  // Print Label Preview Modal State
  const [printModalItem, setPrintModalItem] = useState(null);
  const [printConfig, setPrintConfig] = useState({ showPrice: true, labelFormat: "qr", showExpiry: true });

  // Quick Adjustment Modal State
  const [adjustModalItem, setAdjustModalItem] = useState(null);
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustMinAlert, setAdjustMinAlert] = useState("");
  const [adjustReason, setAdjustReason] = useState("Audit Correction");
  const [adjustNotes, setAdjustNotes] = useState("");

  const [activeTab, setActiveTab] = useState("inventory"); // "inventory", "ledger", "insights", "procurement"
  const [procurementData, setProcurementData] = useState(null);
  const [procurementLoading, setProcurementLoading] = useState(false);
  const [ledgerData, setLedgerData] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerTotal, setLedgerTotal] = useState(0);
  const [insightsData, setInsightsData] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  const [groupByItem, setGroupByItem] = useState(false);

  const loadLedger = async (params = {}) => {
    setLedgerLoading(true);
    try {
      const p = params.page || ledgerPage;
      const res = await api.stock.ledger({ page: p, limit: LIMIT });
      setLedgerData(res.data || []);
      setLedgerTotal(res.total || 0);
      setLedgerPage(p);
    } catch {}
    setLedgerLoading(false);
  };

  const loadInsights = async () => {
    setInsightsLoading(true);
    try {
      const res = await api.stock.insights();
      setInsightsData(res.data);
    } catch {}
    setInsightsLoading(false);
  };

  const loadProcurement = async () => {
    setProcurementLoading(true);
    try {
      const [posRes, grnRes, suppRes] = await Promise.all([
        api.purchaseOrders.list({ limit: 10, sort: "date", order: "desc" }),
        api.grn.list({ limit: 10, sort: "date", order: "desc" }),
        api.suppliers.list({ limit: 100, sort: "name", order: "asc" }),
      ]);
      setProcurementData({
        recentPOs:  posRes.data  || [],
        recentGRNs: grnRes.data  || [],
        suppliers:  suppRes.data || [],
      });
    } catch {}
    setProcurementLoading(false);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "ledger")      loadLedger();
    if (tab === "insights")    loadInsights();
    if (tab === "procurement") loadProcurement();
  };

  const refreshActiveTab = (tab = activeTab) => {
    if (tab === "ledger")      loadLedger();
    if (tab === "insights")    loadInsights();
    if (tab === "procurement") loadProcurement();
  };

  const load = async (overrides = {}) => {
    const merged = { ...filters, ...overrides };
    const currentLimit = overrides.limit || (groupByItem ? 1000 : LIMIT);
    const res = await fetch({ limit: currentLimit, sort: "created_at", order: "desc", ...merged });
    if (res && res.stats) {
      setStats(res.stats);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const syncOffline = async () => {
      if (!navigator.onLine) return;
      const queue = JSON.parse(localStorage.getItem("kapila_offline_stock") || "[]");
      if (queue.length === 0) return;
      
      setMsg(`Syncing ${queue.length} offline records...`);
      try {
        for (const item of queue) {
          await api.stock.create(item);
        }
        localStorage.removeItem("kapila_offline_stock");
        setMsg("Synced offline purchases successfully ✓");
        load({ page: 1 });
        refreshStockNames();
        refreshActiveTab();
      } catch (err) {
        setMsg("Sync error: " + err.message);
      } finally {
        setTimeout(() => setMsg(""), 3000);
      }
    };

    window.addEventListener("online", syncOffline);
    syncOffline();
    return () => window.removeEventListener("online", syncOffline);
  }, [stocks]);

  const remove = async (id) => {
    try {
      await api.stock.remove(id);
      load({ page: 1 });
      refreshStockNames();
      refreshActiveTab();
    } catch (e) { setMsg("Error: " + e.message); }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditRemaining(item.remaining.toString());
    setEditMinAlert(item.min_alert_qty !== null ? item.min_alert_qty.toString() : "");
    setEditReason("Audit Correction");
    setEditNotes("");
  };

  const saveEdit = async (id) => {
    try {
      await api.stock.update(id, {
        remaining: parseFloat(editRemaining),
        min_alert_qty: editMinAlert.trim() === "" ? null : parseFloat(editMinAlert),
        reason: editReason,
        notes: editNotes.trim() === "" ? null : editNotes
      });
      setEditingId(null);
      load();
      refreshActiveTab();
    } catch (e) { setMsg("Error updating stock: " + e.message); }
  };

  const handleFilterChange = (field, val) => {
    setFilters((f) => {
      const nextFilters = { ...f, [field]: val };
      load({ page: 1, ...nextFilters });
      return nextFilters;
    });
  };

  const uniqueSuppliers = Array.from(new Set(stocks.map((s) => s.supplier).filter(Boolean)));

  const exportCSV = () => {
    const headers = ["item_code", "name", "qty", "remaining", "unit", "price", "supplier", "batch_no", "expiry_date", "date"];
    const rows = items.map((r) =>
      headers.map((h) => (r[h] !== undefined && r[h] !== null ? `"${String(r[h]).replace(/"/g, '""')}"` : '""')).join(",")
    );
    const blob = new Blob([headers.join(",") + "\n" + rows.join("\n")], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href = url; a.download = `kapila_stock_${today()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

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

  const handleStatCardClick = (type) => {
    setFilters((f) => {
      let nextFilters = { ...f };
      if (type === "total") {
        nextFilters.low_stock = "";
        nextFilters.active_only = "";
      } else if (type === "active") {
        nextFilters.low_stock = "";
        nextFilters.active_only = "true";
      } else if (type === "low") {
        nextFilters.low_stock = "true";
        nextFilters.active_only = "";
      }
      load({ page: 1, ...nextFilters });
      return nextFilters;
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, height: "100%" }}>
      {/* KPI Strip */}
      <StockKpiCards 
        data={stats} 
        filters={filters} 
        handleStatCardClick={handleStatCardClick} 
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, flex: 1, minHeight: 0 }}>
        {/* List */}
        <Card style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
          {/* Tabs header */}
          <div 
            role="tablist" 
            aria-label="Stock Master Views"
            style={{ padding: "12px 20px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", gap: 8, alignItems: "center" }}
          >
            {[
              { id: "inventory",   label: "Inventory",     icon: <LayoutList size={14} /> },
              { id: "ledger",      label: "Ledger",        icon: <RefreshCw size={14} /> },
              { id: "insights",    label: "Cost Insights", icon: <BarChart2 size={14} /> },
              { id: "procurement", label: "Procurement",   icon: <ShoppingBag size={14} /> },
            ].map(({ id, label, icon }) => (
              <button
                key={id}
                role="tab"
                aria-selected={activeTab === id}
                tabIndex={activeTab === id ? 0 : -1}
                onClick={() => handleTabChange(id)}
                style={{
                  background: activeTab === id ? COLORS.brand + "15" : "transparent",
                  border: "none",
                  color: activeTab === id ? COLORS.brand : COLORS.muted,
                  padding: "8px 12px",
                  fontSize: 13.5,
                  fontWeight: activeTab === id ? 600 : 500,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  whiteSpace: "nowrap",
                  outline: "none",
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                {icon}
                {label}
              </button>
            ))}
            <div style={{ marginLeft: "auto" }}>
              <Btn small variant="ghost" onClick={exportCSV} title="Export current view to CSV">
                Export CSV
              </Btn>
            </div>
          </div>

          {activeTab === "inventory" && (
            <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
              <div style={{ padding: "14px 20px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", background: COLORS.bg + "22", flexShrink: 0 }}>
                <SearchBar onSearch={(q) => load({ page: 1, q })} placeholder="Search items…" style={{ flex: 1, minWidth: 200 }} />
                <Btn variant="ghost" small onClick={() => {
                  const nextVal = !groupByItem;
                  setGroupByItem(nextVal);
                  load({ page: 1, limit: nextVal ? 1000 : LIMIT });
                }} style={{ fontSize: 12, padding: "6px 12px" }}>
                  {groupByItem ? "View All Batches" : "Group by Item"}
                </Btn>
                
                <div style={{ height: "24px", width: "1px", background: COLORS.border, margin: "0 6px" }}></div>
                
                {/* Pill Filters */}
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => handleFilterChange("low_stock", filters.low_stock === "true" ? "" : "true")}
                    className={filters.low_stock === "true" ? "chip active" : "chip"}
                    style={{ fontSize: 12 }}
                  >
                    <Filter size={12} /> Low Stock
                  </button>

                  <select
                    value={filters.expiry_status}
                    onChange={(e) => handleFilterChange("expiry_status", e.target.value)}
                    className={filters.expiry_status ? "chip active" : "chip"}
                    style={{ 
                      fontSize: 12, 
                      paddingRight: "24px", 
                      appearance: "none", 
                      backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, 
                      backgroundRepeat: "no-repeat", 
                      backgroundPosition: "right 8px center", 
                      backgroundSize: "10px",
                      cursor: "pointer",
                      outline: "none"
                    }}
                  >
                    <option value="">All Expiry</option>
                    <option value="expired">Expired</option>
                    <option value="expiring">Expiring Soon</option>
                    <option value="fresh">Fresh</option>
                  </select>

                  <select
                    value={filters.supplier}
                    onChange={(e) => handleFilterChange("supplier", e.target.value)}
                    className={filters.supplier ? "chip active" : "chip"}
                    style={{ 
                      fontSize: 12, 
                      paddingRight: "24px", 
                      appearance: "none", 
                      backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, 
                      backgroundRepeat: "no-repeat", 
                      backgroundPosition: "right 8px center", 
                      backgroundSize: "10px",
                      cursor: "pointer",
                      outline: "none"
                    }}
                  >
                    <option value="">All Suppliers</option>
                    {uniqueSuppliers.map((sup) => <option key={sup} value={sup}>{sup}</option>)}
                  </select>
                </div>
              </div>

              <StockTable
                items={items}
                loading={loading}
                error={error}
                page={page}
                total={total}
                limit={LIMIT}
                onPage={(p) => load({ page: p })}
                groupByItem={groupByItem}
                readOnly={false}
                
                setPrintModalItem={setPrintModalItem}
                setAdjustModalItem={setAdjustModalItem}
                setAdjustQty={setAdjustQty}
                setAdjustMinAlert={setAdjustMinAlert}
                setAdjustReason={setAdjustReason}
                setAdjustNotes={setAdjustNotes}
                remove={remove}
                editingId={editingId}
                startEdit={startEdit}
                saveEdit={saveEdit}
                editRemaining={editRemaining}
                setEditRemaining={setEditRemaining}
                editMinAlert={editMinAlert}
                setEditMinAlert={setEditMinAlert}
                editReason={editReason}
                setEditReason={setEditReason}
                editNotes={editNotes}
                setEditNotes={setEditNotes}
              />
            </div>
          )}

          {activeTab === "ledger" && (
            <LedgerTab 
              ledgerLoading={ledgerLoading} 
              ledgerData={ledgerData} 
              ledgerPage={ledgerPage}
              ledgerTotal={ledgerTotal}
              limit={LIMIT}
              onPage={(p) => loadLedger({ page: p })}
            />
          )}

          {activeTab === "insights" && (
            <InsightsTab 
              insightsLoading={insightsLoading} 
              insightsData={insightsData} 
              chartItem={chartItem} 
              setChartItem={setChartItem} 
            />
          )}

          {activeTab === "procurement" && (
            <ProcurementTab procurementLoading={procurementLoading} procurementData={procurementData} />
          )}

         </Card>

        {/* Right Panel containing Add Form and Low Stock Alerts */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <StoreAlertsPanel
            lowStockItems={lowStockItems}
            expiringSoonItems={expiringSoonItems}
            copyPOToClipboard={copyPOToClipboard}
            generateWhatsAppPO={generateWhatsAppPO}
            handleReorderClick={handleReorderClick}
          />
        
          <Card>
            <NewStockEntryForm
              onSuccess={() => { load({ page: 1 }); refreshActiveTab(); }}
              reorderItem={reorderItem}
            />
          </Card>
        </div>
      </div>

      {/* Print Preview Modal */}
      <PrintPreviewModal 
        printModalItem={printModalItem}
        setPrintModalItem={setPrintModalItem}
        printConfig={printConfig}
        setPrintConfig={setPrintConfig}
      />

      {/* Quick Adjustment Modal */}
      <QuickAdjustmentModal 
        adjustModalItem={adjustModalItem}
        setAdjustModalItem={setAdjustModalItem}
        adjustQty={adjustQty}
        setAdjustQty={setAdjustQty}
        adjustMinAlert={adjustMinAlert}
        setAdjustMinAlert={setAdjustMinAlert}
        adjustReason={adjustReason}
        setAdjustReason={setAdjustReason}
        adjustNotes={adjustNotes}
        setAdjustNotes={setAdjustNotes}
        load={load}
        refreshActiveTab={refreshActiveTab}
        setMsg={setMsg}
      />
      {msg && <p style={{ display: "none" }}>{msg}</p>}
    </div>
  );
}
