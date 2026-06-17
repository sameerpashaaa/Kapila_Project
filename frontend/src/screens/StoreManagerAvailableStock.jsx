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
import { useBreakpoint } from "../styles/responsive";

import { StockKpiCards } from "../components/StockMaster/StockKpiCards";
import StoreAlertsPanel from "../components/StockMaster/StoreAlertsPanel";
import { StockTable } from "../components/StockMaster/StockTable";

const LIMIT = 20;

export default function StoreManagerAvailableStock() {
  const { stocks, refreshStockNames, setCurrentScreen } = useAppContext();
  const { isMobile } = useBreakpoint();
  const [filters, setFilters] = useState({ low_stock: "", expiry_status: "", supplier: "", active_only: "" });
  const [stats, setStats]     = useState({ total_spend: 0, store_value: 0, low_stock_value: 0 });
  const { items, total, page, loading, error, fetch } = usePaginatedApi(api.stock.list);
  const [groupByItem, setGroupByItem] = useState(false);

  const load = async (overrides = {}) => {
    const merged = { ...filters, ...overrides };
    const currentLimit = overrides.limit || (groupByItem ? 1000 : LIMIT);
    const res = await fetch({ limit: currentLimit, sort: "created_at", order: "desc", ...merged });
    if (res && res.stats) setStats(res.stats);
  };

  useEffect(() => { load(); refreshStockNames(); }, []);

  const handleFilterChange = (field, val) => {
    setFilters((f) => {
      const next = { ...f, [field]: val };
      load({ page: 1, ...next });
      return next;
    });
  };

  const handleStatCardClick = (type) => {
    setFilters((f) => {
      const next = { ...f };
      if (type === "total")       { next.low_stock = ""; next.active_only = ""; }
      else if (type === "active") { next.low_stock = ""; next.active_only = "true"; }
      else if (type === "low")    { next.low_stock = "true"; next.active_only = ""; }
      load({ page: 1, ...next });
      return next;
    });
  };

  const exportCSV = () => {
    const headers = ["item_code","name","qty","remaining","unit","price","supplier","batch_no","expiry_date","date"];
    const rows = items.map((r) => headers.map((h) => (r[h] != null ? `"${String(r[h]).replace(/"/g,'""')}"` : '""')).join(","));
    const blob = new Blob([headers.join(",") + "\n" + rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `kapila_stock_${today()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const lowStockItems = stocks.filter((item) => {
    const pct = item.qty > 0 ? (item.remaining / item.qty) * 100 : 0;
    return item.min_alert_qty !== null ? item.remaining <= item.min_alert_qty : pct < 25;
  });

  const expiringSoonItems = stocks.filter((item) => {
    if (!item.expiry_date || item.remaining <= 0) return false;
    const diff = Math.ceil((new Date(item.expiry_date) - new Date(today())) / 86400000);
    return diff >= 0 && diff <= 3;
  });

  const uniqueSuppliers = Array.from(new Set(stocks.map((s) => s.supplier).filter(Boolean)));

  const chipStyle = (active) => ({
    fontSize: 13,
    padding: "8px 16px",
    borderRadius: "100px",
    border: active ? "1px solid #e8a838" : "1px solid #E2E8F0",
    background: active ? "#FFFDF5" : "#F8FAFC",
    color: active ? "#B47000" : "#475569",
    cursor: "pointer",
    fontWeight: 500,
    flexShrink: 0,
    whiteSpace: "nowrap",
    minHeight: isMobile ? 40 : "auto",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  });

  const selectStyle = (active) => ({
    ...chipStyle(active),
    display: "block",
    appearance: "none",
    paddingRight: 32,
    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='${active ? "%23B47000" : "%23475569"}' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
    outline: "none",
    maxWidth: isMobile ? "160px" : "200px",
  });

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F8FAFC", display: "flex", flexDirection: "column" }}>

      {/* ── Page Header ── */}
      <div style={{
        backgroundColor: "white", borderBottom: "1px solid #E2E8F0",
        padding: isMobile ? "12px 16px" : "16px 24px",
        display: "flex", flexDirection: isMobile ? "column" : "row",
        gap: isMobile ? "8px" : "12px",
        alignItems: isMobile ? "flex-start" : "center",
        justifyContent: "space-between", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, width: isMobile ? "100%" : "auto", justifyContent: isMobile ? "space-between" : "flex-start" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => setCurrentScreen("store_manager_home")}
              style={{ background: "none", border: "1px solid #E2E8F0", borderRadius: 8, padding: "8px 12px", cursor: "pointer", color: "#475569", fontSize: 14, display: "flex", alignItems: "center", gap: 6, fontWeight: 500, minHeight: 40 }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#F1F5F9"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            >
              <ChevronLeft size={16} /> Back
            </button>
            <h1 style={{ margin: 0, fontSize: isMobile ? 17 : 18, fontWeight: 700, color: "#0F172A" }}>Available Stock</h1>
          </div>
          {isMobile && (
            <Btn small variant="ghost" onClick={exportCSV} icon={<Download size={14} />} style={{ padding: "8px 12px" }}>Export</Btn>
          )}
        </div>
        {!isMobile && (
          <Btn small variant="ghost" onClick={exportCSV} icon={<Download size={14} />} title="Export current view to CSV">Export CSV</Btn>
        )}
      </div>

      {/* ── Body ── */}
      <div style={{ padding: isMobile ? "12px 16px" : "24px", flex: 1, display: "flex", flexDirection: "column", gap: isMobile ? "12px" : "16px" }}>

        <StockKpiCards data={stats} filters={filters} handleStatCardClick={handleStatCardClick} isMobile={isMobile} />

        <StoreAlertsPanel lowStockItems={lowStockItems} expiringSoonItems={expiringSoonItems} showActions={false} style={{ marginBottom: 8 }} />

        {/* ── Table Card ── */}
        <Card style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>

          {/* Search + Filters */}
          <div style={{
            padding: isMobile ? "12px 16px" : "16px 24px",
            borderBottom: `1px solid ${COLORS.border}`,
            display: "flex", flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? "10px" : "16px",
            alignItems: isMobile ? "stretch" : "center",
            justifyContent: "space-between",
            backgroundColor: "#ffffff",
          }}>
            <div style={{ flex: isMobile ? "unset" : "1 1 250px", maxWidth: isMobile ? "none" : "400px" }}>
              <SearchBar onSearch={(q) => load({ page: 1, q })} placeholder="Search items…" style={{ width: "100%", margin: 0 }} />
            </div>

            {/* Pill filter bar — scrollable on mobile */}
            <div className={isMobile ? "mob-filter-bar" : ""} style={isMobile ? {} : { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
              <button
                onClick={() => { const n = !groupByItem; setGroupByItem(n); load({ page: 1, limit: n ? 1000 : LIMIT }); }}
                className="chip" style={chipStyle(false)}
              >
                {groupByItem ? "All Batches" : "Group by Item"}
              </button>

              {!isMobile && <div style={{ height: 24, width: 1, background: COLORS.border }} />}

              <button
                onClick={() => handleFilterChange("low_stock", filters.low_stock === "true" ? "" : "true")}
                className={filters.low_stock === "true" ? "chip active" : "chip"}
                style={chipStyle(filters.low_stock === "true")}
              >
                <Filter size={14} /> Low Stock
              </button>

              <select value={filters.expiry_status} onChange={(e) => handleFilterChange("expiry_status", e.target.value)} style={selectStyle(!!filters.expiry_status)}>
                <option value="">All Expiry</option>
                <option value="expired">Expired</option>
                <option value="expiring">Expiring Soon</option>
                <option value="fresh">Fresh</option>
              </select>

              <select value={filters.supplier} onChange={(e) => handleFilterChange("supplier", e.target.value)} style={selectStyle(!!filters.supplier)}>
                <option value="">All Suppliers</option>
                {uniqueSuppliers.map((sup) => <option key={sup} value={sup}>{sup}</option>)}
              </select>
            </div>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <StockTable
              items={items} loading={loading} error={error}
              page={page} total={total} limit={LIMIT}
              onPage={(p) => load({ page: p })}
              groupByItem={groupByItem} readOnly={true} isMobile={isMobile}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
