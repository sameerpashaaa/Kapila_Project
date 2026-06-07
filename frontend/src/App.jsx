import { useState, useEffect } from "react";
import { globalCss, COLORS } from "./styles/colors";
import { AppProvider, useAppContext } from "./context/AppContext";
import Dashboard      from "./screens/Dashboard";
import StockScreen    from "./screens/Stock";
import IndentScreen   from "./screens/Indent";
import IssuanceScreen from "./screens/Issuance";
import ProductionScreen from "./screens/Production";
import LeftoverScreen from "./screens/Leftovers";
import SuppliersScreen      from "./screens/Suppliers";
import DepartmentsScreen    from "./screens/Departments";
import PurchaseOrdersScreen  from "./screens/PurchaseOrders";
import GoodsReceiptScreen    from "./screens/GoodsReceipt";
import ReconciliationScreen  from "./screens/Reconciliation";
import TransfersScreen       from "./screens/Transfers";
import ReorderPointsScreen   from "./screens/ReorderPoints";
import MenuPlannerScreen     from "./screens/MenuPlanner";
import WasteAnalyticsScreen   from "./screens/WasteAnalytics";

const NAV_CATEGORIES = [
  {
    title: "General",
    items: [
      { id: "dashboard",    label: "Dashboard",       icon: "📊" },
    ]
  },
  {
    title: "Master Data",
    items: [
      { id: "stock",        label: "Stock Master",    icon: "📦" },
      { id: "suppliers",    label: "Suppliers Master", icon: "🏭" },
      { id: "departments",  label: "Departments",     icon: "🏢" },
    ]
  },
  {
    title: "Procurement",
    items: [
      { id: "pos",          label: "Purchase Orders", icon: "🧾" },
      { id: "grn",          label: "Goods Receipt",   icon: "📥" },
      { id: "reorder",      label: "Reorder Points",  icon: "🔔" },
    ]
  },
  {
    title: "Store Management",
    items: [
      { id: "reconcile",    label: "Reconciliation",  icon: "⚖️" },
      { id: "transfers",    label: "Transfers",       icon: "↔️" },
    ]
  },
  {
    title: "Kitchen & Depts",
    items: [
      { id: "menu_planner", label: "Menu Planner",     icon: "🗓️" },
      { id: "indent",       label: "Indent Material", icon: "📋" },
      { id: "issuance",     label: "Store Issuance",  icon: "🔄" },
      { id: "production",   label: "Daily Production", icon: "🍽️" },
      { id: "leftover",     label: "Leftovers Logs",  icon: "↩️" },
      { id: "waste_analytics", label: "Waste Analytics", icon: "🗑️" },
    ]
  }
];

function Inner() {
  const { currentScreen: screen, setCurrentScreen: setScreen, refreshStockNames } = useAppContext();

  useEffect(() => { refreshStockNames(); }, []);

  const screens = {
    dashboard:  <Dashboard />,
    stock:      <StockScreen />,
    suppliers:  <SuppliersScreen />,
    departments: <DepartmentsScreen />,
    pos:        <PurchaseOrdersScreen />,
    grn:        <GoodsReceiptScreen />,
    reorder:    <ReorderPointsScreen />,
    reconcile:  <ReconciliationScreen />,
    transfers:  <TransfersScreen />,
    indent:     <IndentScreen />,
    issuance:   <IssuanceScreen />,
    production: <ProductionScreen />,
    leftover:   <LeftoverScreen />,
    menu_planner: <MenuPlannerScreen />,
    waste_analytics: <WasteAnalyticsScreen />,
  };

  return (
    <>
      <style>{globalCss}</style>
      <div style={{ display: "flex", minHeight: "100vh", backgroundColor: COLORS.bg }}>
        {/* Sidebar */}
        <div style={{
          width: 80,
          background: COLORS.surface,
          borderRight: `1px solid ${COLORS.border}`,
          padding: "20px 0",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "fixed",
          top: 0,
          bottom: 0,
          zIndex: 100
        }}>
          {/* Stylized Logo from Screenshot */}
          <div style={{ marginBottom: 24, display: "flex", justifyContent: "center" }}>
            <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
              <path d="M8 6C8 4.89543 8.89543 4 10 4C11.1046 4 12 4.89543 12 6V14C13.5 11.5 16.5 10 20 10C24.4183 10 28 13.5817 28 18V26C28 27.1046 27.1046 28 26 28C24.8954 28 24 27.1046 24 26V18C24 15.7909 22.2091 14 20 14C17.7909 14 16 15.7909 16 18V26C16 27.1046 15.1046 28 14 28C12.8954 28 12 27.1046 12 26V18" fill={COLORS.accent} />
            </svg>
          </div>

          {/* Navigation Items */}
          <div style={{ flex: 1, overflowY: "auto", width: "100%", padding: "0 6px", display: "flex", flexDirection: "column", gap: 6, scrollbarWidth: "none" }}>
            {NAV_CATEGORIES.map((cat) => 
              cat.items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setScreen(n.id)}
                  title={`${cat.title}: ${n.label}`}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 3,
                    width: 64,
                    height: 56,
                    borderRadius: 10,
                    margin: "0 auto",
                    background: screen === n.id ? "#e6f0e6" : "transparent",
                    color: screen === n.id ? COLORS.accent : COLORS.muted,
                    cursor: "pointer",
                    border: "none",
                    transition: "all 0.15s",
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => {
                    if (screen !== n.id) e.currentTarget.style.background = "#f4f6f4";
                  }}
                  onMouseLeave={(e) => {
                    if (screen !== n.id) e.currentTarget.style.background = "transparent";
                  }}
                >
                  <span style={{ fontSize: 18, color: screen === n.id ? COLORS.accent : COLORS.muted }}>{n.icon}</span>
                  <span style={{
                    fontSize: 8,
                    fontWeight: screen === n.id ? 600 : 500,
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    width: "100%",
                    textAlign: "center"
                  }}>
                    {n.label}
                  </span>
                </button>
              ))
            )}
          </div>

          {/* Bottom indicator */}
          <div style={{ padding: "12px 0 0", borderTop: `1px solid ${COLORS.border}55`, width: "100%", display: "flex", justifyContent: "center" }}>
            <span style={{ fontSize: 10, color: COLORS.muted, cursor: "help" }} title="PostgreSQL Backend Connected">DB</span>
          </div>
        </div>

        {/* Main content */}
        <div style={{ marginLeft: 80, flex: 1, padding: "24px 32px", minHeight: "100vh", backgroundColor: COLORS.bg }}>
          {screens[screen]}
        </div>
      </div>
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Inner />
    </AppProvider>
  );
}
