import { useState, useEffect } from "react";
import { globalCss, COLORS } from "./styles/colors";
import { AppProvider, useAppContext } from "./context/AppContext";
import { 
  LayoutDashboard, Package, Factory, Building2, Receipt, Inbox, Bell, 
  Scale, ArrowLeftRight, CalendarRange, ClipboardList, Send, ChefHat, 
  ArchiveRestore, Trash2, Database 
} from "lucide-react";

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
      { id: "dashboard",    label: "Dashboard",       icon: <LayoutDashboard size={20} /> },
    ]
  },
  {
    title: "Master Data",
    items: [
      { id: "stock",        label: "Stock Master",    icon: <Package size={20} /> },
      { id: "suppliers",    label: "Suppliers Master", icon: <Factory size={20} /> },
      { id: "departments",  label: "Departments",     icon: <Building2 size={20} /> },
    ]
  },
  {
    title: "Procurement",
    items: [
      { id: "pos",          label: "Purchase Orders", icon: <Receipt size={20} /> },
      { id: "grn",          label: "Goods Receipt",   icon: <Inbox size={20} /> },
      { id: "reorder",      label: "Reorder Points",  icon: <Bell size={20} /> },
    ]
  },
  {
    title: "Store Management",
    items: [
      { id: "reconcile",    label: "Reconciliation",  icon: <Scale size={20} /> },
      { id: "transfers",    label: "Transfers",       icon: <ArrowLeftRight size={20} /> },
    ]
  },
  {
    title: "Kitchen & Depts",
    items: [
      { id: "menu_planner", label: "Menu Planner",    icon: <CalendarRange size={20} /> },
      { id: "indent",       label: "Indent Material", icon: <ClipboardList size={20} /> },
      { id: "issuance",     label: "Store Issuance",  icon: <Send size={20} /> },
      { id: "production",   label: "Daily Production",icon: <ChefHat size={20} /> },
      { id: "leftover",     label: "Leftovers Logs",  icon: <ArchiveRestore size={20} /> },
      { id: "waste_analytics", label: "Waste Analytics", icon: <Trash2 size={20} /> },
    ]
  }
];

function Inner() {
  const { currentScreen: screen, setCurrentScreen: setScreen, refreshStockNames } = useAppContext();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => { refreshStockNames(); }, []);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setIsSidebarOpen(false); // Unconditionally close when resizing
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const handleNavigation = (id) => {
    setScreen(id);
    if (isMobile) setIsSidebarOpen(false);
  };

  return (
    <>
      <style>{globalCss}</style>
      <div style={{ display: "flex", minHeight: "100vh", backgroundColor: COLORS.bg, flexDirection: isMobile ? "column" : "row" }}>
        
        {/* Mobile Header Toolbar */}
        {isMobile && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 20px", background: COLORS.surface, borderBottom: `1px solid ${COLORS.border}`,
            position: "sticky", top: 0, zIndex: 90
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button 
                onClick={() => setIsSidebarOpen(true)}
                aria-label="Open Navigation Menu"
                style={{ background: "none", border: "none", fontSize: 24, color: COLORS.text, cursor: "pointer" }}
              >
                ☰
              </button>
              <span style={{ fontWeight: 600, color: COLORS.accent, fontSize: 16 }}>Kapila Inventory</span>
            </div>
          </div>
        )}

        {/* Sidebar Overlay for Mobile */}
        {isMobile && isSidebarOpen && (
          <div 
            onClick={() => setIsSidebarOpen(false)}
            style={{
              position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)", zIndex: 99
            }}
          />
        )}

        {/* Sidebar */}
        <div style={{
          width: 220,
          background: COLORS.surface,
          borderRight: `1px solid ${COLORS.border}`,
          padding: "20px 0",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0,
          bottom: 0,
          left: isMobile ? (isSidebarOpen ? 0 : -220) : 0,
          transition: "left 0.3s ease",
          zIndex: 100
        }}>
          {/* Stylized Logo */}
          <div style={{ marginBottom: 24, padding: "0 20px", display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
              <path d="M8 6C8 4.89543 8.89543 4 10 4C11.1046 4 12 4.89543 12 6V14C13.5 11.5 16.5 10 20 10C24.4183 10 28 13.5817 28 18V26C28 27.1046 27.1046 28 26 28C24.8954 28 24 27.1046 24 26V18C24 15.7909 22.2091 14 20 14C17.7909 14 16 15.7909 16 18V26C16 27.1046 15.1046 28 14 28C12.8954 28 12 27.1046 12 26V18" fill={COLORS.brand} />
            </svg>
            <span style={{ fontWeight: 700, fontSize: 18, color: COLORS.text, letterSpacing: "-0.02em" }}>Kapila IMS</span>
          </div>

          {/* Navigation Items */}
          <div style={{ flex: 1, overflowY: "auto", width: "100%", padding: "0 12px", display: "flex", flexDirection: "column", gap: 16, scrollbarWidth: "none" }}>
            {NAV_CATEGORIES.map((cat) => (
              <div key={cat.title}>
                <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.06em", padding: "0 12px", marginBottom: 6 }}>
                  {cat.title}
                </div>
                {cat.items.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleNavigation(n.id)}
                    aria-label={`${cat.title}: ${n.label}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      background: screen === n.id ? COLORS.brandLight : "transparent",
                      color: screen === n.id ? COLORS.brand : COLORS.text,
                      cursor: "pointer",
                      border: "none",
                      transition: "all 0.15s",
                      textAlign: "left"
                    }}
                    onMouseEnter={(e) => {
                      if (screen !== n.id) e.currentTarget.style.background = `${COLORS.border}55`;
                    }}
                    onMouseLeave={(e) => {
                      if (screen !== n.id) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <span style={{ color: screen === n.id ? COLORS.brand : COLORS.muted, display: "flex" }} aria-hidden="true">
                      {n.icon}
                    </span>
                    <span style={{
                      fontSize: 13,
                      fontWeight: screen === n.id ? 600 : 500,
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis",
                      overflow: "hidden",
                    }}>
                      {n.label}
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* Bottom indicator */}
          <div style={{ padding: "16px 20px", borderTop: `1px solid ${COLORS.border}55`, display: "flex", alignItems: "center", gap: 10 }}>
            <Database size={16} color={COLORS.muted} />
            <span style={{ fontSize: 11, color: COLORS.muted, fontWeight: 500 }}>PostgreSQL Connected</span>
          </div>
        </div>

        {/* Main content */}
        <div style={{ 
          marginLeft: isMobile ? 0 : 220, 
          flex: 1, 
          padding: isMobile ? "16px" : "24px 32px", 
          minHeight: "100vh", 
          backgroundColor: COLORS.bg 
        }}>
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
