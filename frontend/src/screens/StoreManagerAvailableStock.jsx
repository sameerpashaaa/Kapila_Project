import { useState, useEffect } from "react";
import Card from "../components/Card";
import Btn from "../components/Btn";
import SearchBar from "../components/SearchBar";
import { COLORS } from "../styles/colors";
import { usePaginatedApi } from "../hooks/useApi";
import * as api from "../api";
import { useAppContext } from "../context/AppContext";
import { today } from "../utils/dates";
import { Filter, ChevronLeft, Download } from "lucide-react";

// Extracted shared components
import { StockKpiCards } from "../components/StockMaster/StockKpiCards";
import StoreAlertsPanel from "../components/StockMaster/StoreAlertsPanel";
import { StockTable } from "../components/StockMaster/StockTable";

const LIMIT = 20;

export default function StoreManagerAvailableStock() {
  const { stocks, refreshStockNames } = useAppContext();
  const { setCurrentScreen } = useAppContext();
  const [filters, setFilters] = useState({ low_stock: "", expiry_status: "", supplier: "", active_only: "" });
  const [stats, setStats]     = useState({ total_spend: 0, store_value: 0, low_stock_value: 0 });
  const { items, total, page, loading, error, fetch } = usePaginatedApi(api.stock.list);
  const [groupByItem, setGroupByItem] = useState(false);

  const load = async (overrides = {}) => {
    const merged = { ...filters, ...overrides };
    const currentLimit = overrides.limit || (groupByItem ? 1000 : LIMIT);
    const res = await fetch({ limit: currentLimit, sort: "created_at", order: "desc", ...merged });
    if (res && res.stats) {
      setStats(res.stats);
    }
  };

  useEffect(() => {
    load();
    refreshStockNames();
  }, []);

  const handleFilterChange = (field, val) => {
    setFilters((f) => {
      const nextFilters = { ...f, [field]: val };
      load({ page: 1, ...nextFilters });
      return nextFilters;
    });
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

  const uniqueSuppliers = Array.from(new Set(stocks.map((s) => s.supplier).filter(Boolean)));

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F8FAFC", display: "flex", flexDirection: "column" }}>
      {/* Page Header */}
      <div style={{
        backgroundColor: "white",
        borderBottom: "1px solid #E2E8F0",
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
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
            Available Stock
          </h1>
        </div>
        <Btn small variant="ghost" onClick={exportCSV} icon={<Download size={14} />} title="Export current view to CSV">
          Export CSV
        </Btn>
      </div>

      {/* Body */}
      <div style={{ padding: "24px", flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* KPI Cards row */}
        <StockKpiCards 
          data={stats} 
          filters={filters} 
          handleStatCardClick={handleStatCardClick} 
        />

        {/* Store Alerts — collapsible/full-width panel */}
        <StoreAlertsPanel
          lowStockItems={lowStockItems}
          expiringSoonItems={expiringSoonItems}
          showActions={false} /* Hide Copy PO / Send PO / Reorder actions in read-only view */
          style={{ marginBottom: "8px" }}
        />

        {/* Table Card */}
        <Card style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
          {/* Search + Filters row */}
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", background: COLORS.bg + "22" }}>
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

          <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <StockTable
              items={items}
              loading={loading}
              error={error}
              page={page}
              total={total}
              limit={LIMIT}
              onPage={(p) => load({ page: p })}
              groupByItem={groupByItem}
              readOnly={true} /* Suppress all adjustment/print actions in Available Stock */
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
