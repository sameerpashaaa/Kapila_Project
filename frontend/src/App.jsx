import { useState, useEffect } from "react";
import { globalCss, COLORS } from "./styles/colors";
import { AppProvider, useAppContext } from "./context/AppContext";
import { 
  LayoutDashboard, Package, Factory, Building2, Receipt, Inbox, Bell, 
  Scale, ArrowLeftRight, CalendarRange, ClipboardList, Send, ChefHat, 
  ArchiveRestore, Trash2, Database, ChevronRight, Search
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
      { id: "dashboard",    label: "Dashboard",       icon: <LayoutDashboard size={16} /> },
    ]
  },
  {
    title: "Master Data",
    items: [
      { id: "stock",        label: "Stock Master",    icon: <Package size={16} /> },
      { id: "suppliers",    label: "Suppliers Master", icon: <Factory size={16} /> },
      { id: "departments",  label: "Departments",     icon: <Building2 size={16} /> },
    ]
  },
  {
    title: "Procurement",
    items: [
      { id: "pos",          label: "Purchase Orders", icon: <Receipt size={16} /> },
      { id: "grn",          label: "Goods Receipt",   icon: <Inbox size={16} /> },
      { id: "reorder",      label: "Reorder Points",  icon: <Bell size={16} /> },
    ]
  },
  {
    title: "Store Management",
    items: [
      { id: "reconcile",    label: "Reconciliation",  icon: <Scale size={16} /> },
      { id: "transfers",    label: "Transfers",       icon: <ArrowLeftRight size={16} /> },
    ]
  },
  {
    title: "Kitchen & Depts",
    items: [
      { id: "menu_planner", label: "Menu Planner",    icon: <CalendarRange size={16} /> },
      { id: "indent",       label: "Indent Material", icon: <ClipboardList size={16} /> },
      { id: "issuance",     label: "Store Issuance",  icon: <Send size={16} /> },
      { id: "production",   label: "Daily Production",icon: <ChefHat size={16} /> },
      { id: "leftover",     label: "Leftovers Logs",  icon: <ArchiveRestore size={16} /> },
      { id: "waste_analytics", label: "Waste Analytics", icon: <Trash2 size={16} /> },
    ]
  }
];

const SIDEBAR_WIDTH = 230;

function Inner() {
  const { currentScreen: screen, setCurrentScreen: setScreen, refreshStockNames, stocks = [] } = useAppContext();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const lowStockCount = stocks.filter(item => {
    const pct = item.qty > 0 ? (item.remaining / item.qty) * 100 : 0;
    return item.min_alert_qty !== null ? item.remaining <= item.min_alert_qty : pct < 25;
  }).length;

  useEffect(() => { refreshStockNames(); }, []);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setIsSidebarOpen(false);
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

  const activeNavItem = NAV_CATEGORIES.flatMap(c => c.items).find(n => n.id === screen);

  return (
    <>
      <style>{globalCss}</style>
      <div style={{ display: "flex", height: "100vh", overflow: "hidden", backgroundColor: COLORS.bg }}>
        
        {/* Mobile Overlay */}
        {isMobile && isSidebarOpen && (
          <div 
            onClick={() => setIsSidebarOpen(false)}
            style={{
              position: "fixed", inset: 0,
              backgroundColor: "rgba(0,0,0,0.5)", zIndex: 99,
              backdropFilter: "blur(2px)"
            }}
          />
        )}

        {/* ═══ SIDEBAR ═══ */}
        <aside style={{
          width: SIDEBAR_WIDTH,
          background: "var(--color-bg-sidebar)",
          borderRight: "1px solid var(--sidebar-border)",
          boxShadow: "var(--shadow-sidebar)",
          display: "flex",
          flexDirection: "column",
          position: isMobile ? "fixed" : "relative",
          top: 0, bottom: 0, left: 0,
          transform: isMobile ? (isSidebarOpen ? "translateX(0)" : `translateX(-${SIDEBAR_WIDTH}px)`) : "none",
          transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
          zIndex: 100,
          flexShrink: 0,
          overflowY: "auto",
          scrollbarWidth: "thin"
        }}>
          {/* Logo */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "18px 20px", borderBottom: "1px solid var(--sidebar-border)",
            flexShrink: 0
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9, background: "var(--color-accent-primary)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#1F2937", letterSpacing: "-0.01em" }}>Kapila IMS</div>
              <div style={{ fontSize: 10, color: "var(--sidebar-category)", letterSpacing: "0.04em" }}>Inventory System</div>
            </div>
          </div>

          {/* User Profile */}
          <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid var(--sidebar-border)" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--color-accent-primary-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "var(--color-accent-primary)" }}>
              K
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1F2937" }}>Kapila Admin</div>
              <div style={{ fontSize: 11, color: "#9CA3AF" }}>Administrator</div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 4, overflowY: "auto", scrollbarWidth: "none" }}>
            {NAV_CATEGORIES.map((cat) => (
              <div key={cat.title} style={{ marginBottom: 4 }}>
                <div style={{
                  fontSize: 10, fontWeight: 700, color: "var(--sidebar-category)",
                  textTransform: "uppercase", letterSpacing: "0.08em",
                  padding: "8px 12px 4px", userSelect: "none"
                }}>
                  {cat.title}
                </div>
                {cat.items.map((n) => {
                  const isActive = screen === n.id;
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleNavigation(n.id)}
                      title={n.label}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: 8,
                        background: isActive ? "var(--sidebar-active-bg)" : "transparent",
                        color: isActive ? "var(--sidebar-active-text)" : "var(--sidebar-text)",
                        border: "none",
                        transition: "all 0.15s",
                        textAlign: "left",
                        fontSize: 13,
                        fontWeight: isActive ? 600 : 400,
                        cursor: "pointer",
                        position: "relative"
                      }}
                      onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = "var(--sidebar-hover-bg)"; e.currentTarget.style.color = "var(--sidebar-text-hover)"; } }}
                      onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--sidebar-text)"; } }}
                    >
                      <span style={{ 
                        color: isActive ? "var(--sidebar-active-text)" : "var(--sidebar-text)",
                        display: "flex", flexShrink: 0
                      }}>
                        {n.icon}
                      </span>
                      <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {n.label}
                      </span>
                      {n.id === "reorder" && lowStockCount > 0 && (
                        <span style={{
                          background: COLORS.danger,
                          color: "#fff",
                          fontSize: 9,
                          fontWeight: 700,
                          minWidth: 16, height: 16,
                          padding: "0 4px",
                          borderRadius: 8,
                          display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                          {lowStockCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div style={{
            padding: "12px 16px",
            borderTop: "1px solid var(--sidebar-border)",
            display: "flex", alignItems: "center", gap: 8,
            flexShrink: 0
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "#10B981"
            }} className="pulse" />
            <span style={{ fontSize: 11, color: "var(--sidebar-category)", fontWeight: 500 }}>PostgreSQL · Live v1.0.0</span>
          </div>
        </aside>

        {/* ═══ MAIN AREA ═══ */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
          
          {/* Top Bar */}
          <header style={{
            height: 52,
            display: "flex", alignItems: "center",
            padding: "0 24px",
            background: COLORS.surface,
            borderBottom: `1px solid ${COLORS.border}`,
            gap: 12,
            flexShrink: 0,
            zIndex: 10
          }}>
            {isMobile && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                style={{ background: "none", border: "none", fontSize: 20, color: COLORS.text, cursor: "pointer", display: "flex", padding: 4 }}
              >
                ☰
              </button>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: COLORS.muted }}>
              <span style={{ fontWeight: 600, color: COLORS.text }}>
                {activeNavItem?.label || "Dashboard"}
              </span>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", background: "#F3F4F6", borderRadius: 20, padding: "6px 12px", gap: 6 }}>
                <Search size={14} color="#9CA3AF" />
                <input placeholder="Search..." style={{ border: "none", background: "transparent", fontSize: 13, color: "#1F2937", outline: "none", width: 160 }} />
              </div>
              <div style={{ position: "relative", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: "50%", background: "#F3F4F6" }}>
                <Bell size={16} color="#6B7280" />
                <div style={{ position: "absolute", top: 6, right: 6, width: 6, height: 6, borderRadius: "50%", background: COLORS.danger }}></div>
              </div>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: COLORS.brand + "20",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 700, color: COLORS.brand,
                cursor: "pointer"
              }}>
                K
              </div>
            </div>
          </header>

          {/* Scrollable Content */}
          <main style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 24px",
            backgroundColor: COLORS.bg
          }}>
            {screens[screen]}
          </main>
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
