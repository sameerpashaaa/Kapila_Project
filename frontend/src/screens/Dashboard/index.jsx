import { useState, useEffect } from "react";
import Card from "../../components/Card";
import { COLORS } from "../../styles/colors";

// --- CUSTOM HIGH FIDELITY SVG ICONS ---
const Icons = {
  Home: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  Check: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#76c043" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  ArrowUpRight: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#df5252" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  ),
  RentedDirty: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 14h16M4 18h16M7 6l3 4 3-4M17 10v4" />
      <circle cx="6" cy="10" r="1" />
      <circle cx="18" cy="6" r="1" />
    </svg>
  ),
  VacantDirty: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 21h14M7 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M11 7h2M11 11h2M11 15h2" />
    </svg>
  ),
  SunCloud: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5d7290" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 8.58" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="23" y1="12" x2="21" y2="12" />
      <line x1="4" y1="4" x2="5.6" y2="5.6" />
      <line x1="20" y1="4" x2="18.4" y2="5.6" />
    </svg>
  ),
  Bell: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5d7290" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  Search: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  ChevronDown: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  ChevronLeft: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  ChevronRight: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  Refresh: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
    </svg>
  ),
  Phone: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  Message: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
};

export default function Dashboard() {
  const [selectedHotel, setSelectedHotel] = useState("Hilton Garden Inn");
  const [isHotelDropdownOpen, setIsHotelDropdownOpen] = useState(false);
  const [isNewResModalOpen, setIsNewResModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Calendar Selection State
  const [activeBedTab, setActiveBedTab] = useState("1 Bed (6)");
  const [activeRoomCode, setActiveRoomCode] = useState("#1014");

  // Reservation Form State
  const [newResForm, setNewResForm] = useState({
    name: "", room: "Room #1420", arrival: "", departure: ""
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const hotelsList = [
    { name: "Hilton Garden Inn", location: "Sylhet Financial District" },
    { name: "Hilton Grand Palace", location: "Dhaka Central Business" },
    { name: "Kapila Boutique Hotel", location: "Main City Center" }
  ];

  const handleCreateReservation = (e) => {
    e.preventDefault();
    if (!newResForm.name) return;
    showToast(`Reservation created for ${newResForm.name} in ${newResForm.room}!`);
    setIsNewResModalOpen(false);
    setNewResForm({ name: "", room: "Room #1420", arrival: "", departure: "" });
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 1000,
          background: "#2b5a2b", color: "#ffffff", padding: "12px 24px",
          borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          fontWeight: 500, fontSize: 13, display: "flex", alignItems: "center", gap: 10,
          animation: "pulse 1.5s infinite"
        }}>
          <span>✓</span> {toastMessage}
        </div>
      )}

      {/* --- DASHBOARD HEADER --- */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 24, paddingBottom: 16, borderBottom: `1px solid ${COLORS.border}55`
      }}>
        {/* Left header: Title and Dropdown */}
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: COLORS.text, letterSpacing: "-0.5px" }}>Dashboard</h1>
          
          <div style={{ position: "relative" }}>
            <button 
              onClick={() => setIsHotelDropdownOpen(!isHotelDropdownOpen)}
              style={{
                display: "flex", alignItems: "center", gap: 10, background: "#ffffff",
                border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "8px 16px",
                textAlign: "left", cursor: "pointer", transition: "all 0.2s"
              }}
            >
              <div style={{
                background: "#f0fdf4", border: "1px solid #dcfce7",
                borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                🏨
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: 13, color: COLORS.text, lineHeight: 1.2 }}>{selectedHotel}</p>
                <p style={{ fontSize: 10, color: COLORS.muted }}>
                  {hotelsList.find(h => h.name === selectedHotel)?.location || "Sylhet Financial District"}
                </p>
              </div>
              <span style={{ color: COLORS.muted, marginLeft: 8 }}><Icons.ChevronDown /></span>
            </button>

            {isHotelDropdownOpen && (
              <div style={{
                position: "absolute", top: "110%", left: 0, zIndex: 150,
                width: 250, background: "#ffffff", border: `1px solid ${COLORS.border}`,
                borderRadius: 12, boxShadow: "0 8px 20px rgba(0,0,0,0.08)", padding: 6
              }}>
                {hotelsList.map((h) => (
                  <button
                    key={h.name}
                    onClick={() => {
                      setSelectedHotel(h.name);
                      setIsHotelDropdownOpen(false);
                      showToast(`Switched view to ${h.name}`);
                    }}
                    style={{
                      width: "100%", textAlign: "left", padding: "8px 12px",
                      background: selectedHotel === h.name ? "#f0fdf4" : "transparent",
                      color: selectedHotel === h.name ? COLORS.accent : COLORS.text,
                      borderRadius: 8, border: "none", display: "flex", flexDirection: "column",
                      cursor: "pointer", margin: "2px 0"
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: 12 }}>{h.name}</span>
                    <span style={{ fontSize: 10, color: COLORS.muted }}>{h.location}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right header: Greeting, weather, action button, bell, user avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ fontSize: 13, color: COLORS.muted, textAlign: "right" }}>
            <span style={{ color: COLORS.text, fontWeight: 600 }}>Good morning! Muhammad</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, color: COLORS.text, fontSize: 13 }}>
            <Icons.SunCloud />
            <div>
              <span style={{ fontWeight: 600 }}>22°C</span> <span style={{ color: COLORS.muted }}>Partly sunny</span>
            </div>
          </div>

          <button 
            onClick={() => setIsNewResModalOpen(true)}
            style={{
              display: "flex", alignItems: "center", gap: 8, background: "#ffffff",
              border: `1.5px solid ${COLORS.border}`, borderRadius: 12, padding: "10px 18px",
              fontWeight: 600, color: COLORS.text, cursor: "pointer", transition: "all 0.2s",
              boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = COLORS.accent}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = COLORS.border}
          >
            📋 New reservation
          </button>

          {/* Bell Icon with badge */}
          <div 
            onClick={() => showToast("No new alerts since last update")}
            style={{
              position: "relative", width: 40, height: 40, background: "#ffffff",
              border: `1px solid ${COLORS.border}`, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
            }}
          >
            <Icons.Bell />
            <span style={{
              position: "absolute", top: 10, right: 10, width: 6, height: 6,
              background: COLORS.coral, borderRadius: "50%"
            }} />
          </div>

          {/* User Profile Avatar */}
          <div 
            onClick={() => showToast("User Profile: Muhammad (Administrator)")}
            style={{
              display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
              background: "#ffffff", border: `1px solid ${COLORS.border}`,
              padding: "4px 8px 4px 4px", borderRadius: 30
            }}
          >
            <img 
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" 
              alt="User" 
              style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} 
            />
            <span style={{ color: COLORS.muted }}><Icons.ChevronDown /></span>
          </div>
        </div>
      </div>

      {/* --- ROW 1 LAYOUT: RESERVATION, OCCUPANCY, REVENUE --- */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 20, marginBottom: 20 }}>
        
        {/* CARD 1: RESERVATION */}
        <Card style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: COLORS.muted, textTransform: "capitalize", marginBottom: 12 }}>Reservation</h3>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {/* In Home */}
              <div style={{ borderRight: `1.5px solid ${COLORS.border}77`, paddingRight: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: COLORS.muted, fontSize: 11, marginBottom: 4 }}>
                  <Icons.Home /> <span>In home</span>
                </div>
                <span style={{ fontSize: 28, fontWeight: 700, color: COLORS.text }}>20</span>
              </div>
              
              {/* Arrival */}
              <div style={{ borderRight: `1.5px solid ${COLORS.border}77`, paddingRight: 12, paddingLeft: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: COLORS.muted, fontSize: 11, marginBottom: 4 }}>
                  <Icons.Check /> <span>Arrival</span>
                </div>
                <span style={{ fontSize: 28, fontWeight: 700, color: COLORS.text }}>14</span>
              </div>
              
              {/* Departure */}
              <div style={{ paddingLeft: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: COLORS.muted, fontSize: 11, marginBottom: 4 }}>
                  <Icons.ArrowUpRight /> <span>Departure</span>
                </div>
                <span style={{ fontSize: 28, fontWeight: 700, color: COLORS.text }}>27</span>
              </div>
            </div>
          </div>

          <div style={{ borderTop: `1.5px solid ${COLORS.border}55`, paddingTop: 16 }}>
            <h4 style={{ fontSize: 12, fontWeight: 600, color: COLORS.muted, marginBottom: 12 }}>House keeping</h4>
            <div style={{ display: "flex", gap: 28 }}>
              {/* Rented & dirty */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  background: "#f1f5f9", borderRadius: 8, width: 32, height: 32,
                  display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.muted
                }}>
                  <Icons.RentedDirty />
                </div>
                <div>
                  <p style={{ fontSize: 10, color: COLORS.muted }}>Rented & dirty</p>
                  <p style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, lineHeight: 1.1 }}>14</p>
                </div>
              </div>

              {/* Vacant & dirty */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  background: "#f1f5f9", borderRadius: 8, width: 32, height: 32,
                  display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.muted
                }}>
                  <Icons.VacantDirty />
                </div>
                <div>
                  <p style={{ fontSize: 10, color: COLORS.muted }}>Vacant & dirty</p>
                  <p style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, lineHeight: 1.1 }}>27</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* CARD 2: OCCUPANCY */}
        <Card style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: COLORS.muted, marginBottom: 16 }}>Occupancy</h3>
            
            {/* Status Legend row */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              {/* Vacant */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: COLORS.muted, marginBottom: 2 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.teal }} />
                  <span>Vacant</span>
                </div>
                <p style={{ fontSize: 24, fontWeight: 700, color: COLORS.text }}>49</p>
              </div>

              {/* Occupied */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: COLORS.muted, marginBottom: 2 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.success }} />
                  <span>Occupied</span>
                </div>
                <p style={{ fontSize: 24, fontWeight: 700, color: COLORS.text }}>34</p>
              </div>

              {/* Not ready */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: COLORS.muted, marginBottom: 2 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.lightGreen }} />
                  <span>Not ready</span>
                </div>
                <p style={{ fontSize: 24, fontWeight: 700, color: COLORS.text }}>08</p>
              </div>
            </div>
          </div>

          {/* Color-segmented stacked progress bar */}
          <div style={{
            display: "flex", height: 60, width: "100%", borderRadius: 12, overflow: "hidden",
            boxShadow: "inset 0 1px 3px rgba(0,0,0,0.06)", marginTop: 12
          }}>
            {/* Vacant (49 / 91 total = 54%) */}
            <div style={{ width: "54%", background: COLORS.teal, transition: "width 0.3s" }} title="Vacant: 54%" />
            {/* Occupied (34 / 91 total = 37%) */}
            <div style={{ width: "37%", background: COLORS.success, transition: "width 0.3s" }} title="Occupied: 37%" />
            {/* Not ready (8 / 91 total = 9%) */}
            <div style={{ width: "9%", background: COLORS.lightGreen, transition: "width 0.3s" }} title="Not ready: 9%" />
          </div>
        </Card>

        {/* CARD 3: REVENUE */}
        <Card style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: COLORS.muted }}>Revenue</h3>
            <span 
              onClick={() => showToast("Opening Revenue Details...")}
              style={{ fontSize: 11, fontWeight: 600, color: COLORS.accent, cursor: "pointer", display: "flex", alignItems: "center", gap: 2 }}
            >
              Details &gt;&gt;
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 10, marginTop: 16 }}>
            {/* Last 30 Days */}
            <div>
              <p style={{ fontSize: 11, color: COLORS.muted, marginBottom: 4 }}>Last 30 days</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontSize: 11, color: COLORS.muted, fontWeight: 500 }}>USD</span>
                <span style={{ fontSize: 24, fontWeight: 700, color: COLORS.text }}>1,500</span>
              </div>
            </div>

            {/* Yesterday */}
            <div>
              <p style={{ fontSize: 11, color: COLORS.muted, marginBottom: 4 }}>Yesterday</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontSize: 11, color: COLORS.muted, fontWeight: 500 }}>USD</span>
                <span style={{ fontSize: 24, fontWeight: 700, color: COLORS.text }}>350</span>
              </div>
            </div>
          </div>
          
          <div style={{ height: 10 }} />
        </Card>
      </div>

      {/* --- ROW 2 LAYOUT: BOOKING CHART & CALENDAR SCHEDULE --- */}
      <div style={{ display: "grid", gridTemplateColumns: "1.9fr 1.1fr", gap: 20, marginBottom: 20 }}>
        
        {/* CARD 4: BOOKING TREND GRAPH */}
        <Card style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 380 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: COLORS.text }}>Booking</h3>
              <button 
                onClick={() => showToast("Updating booking data...")}
                style={{ background: "none", border: "none", color: COLORS.muted, cursor: "pointer", display: "flex", alignItems: "center" }}
              >
                <Icons.Refresh />
              </button>
              <span style={{ fontSize: 11, color: COLORS.muted }}>Last update 1m ago</span>
            </div>

            {/* Chart Dropdown */}
            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 500, color: COLORS.accent, cursor: "pointer" }}>
              <span>Last 7 days</span>
              <Icons.ChevronDown />
            </div>
          </div>

          {/* SVG Smooth Curve Spline Graph */}
          <div style={{ flex: 1, position: "relative", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
            <svg viewBox="0 0 600 220" width="100%" height="220" style={{ overflow: "visible" }}>
              {/* Y Axis Grid lines */}
              <line x1="0" y1="20" x2="600" y2="20" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="70" x2="600" y2="70" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="120" x2="600" y2="120" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="170" x2="600" y2="170" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="220" x2="600" y2="220" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />

              {/* Y Axis Labels */}
              <text x="-15" y="24" fill="#94a3b8" fontSize="10" textAnchor="end">100</text>
              <text x="-15" y="74" fill="#94a3b8" fontSize="10" textAnchor="end">75</text>
              <text x="-15" y="124" fill="#94a3b8" fontSize="10" textAnchor="end">50</text>
              <text x="-15" y="174" fill="#94a3b8" fontSize="10" textAnchor="end">25</text>
              <text x="-15" y="224" fill="#94a3b8" fontSize="10" textAnchor="end">0</text>

              {/* Verticals */}
              <line x1="20" y1="20" x2="20" y2="220" stroke="#f8fafc" strokeWidth="1" />
              <line x1="110" y1="20" x2="110" y2="220" stroke="#f8fafc" strokeWidth="1" />
              <line x1="200" y1="20" x2="200" y2="220" stroke="#f8fafc" strokeWidth="1" />
              <line x1="290" y1="20" x2="290" y2="220" stroke="#f8fafc" strokeWidth="1" />
              <line x1="380" y1="20" x2="380" y2="220" stroke="#f8fafc" strokeWidth="1" />
              <line x1="470" y1="20" x2="470" y2="220" stroke="#f8fafc" strokeWidth="1" />
              <line x1="560" y1="20" x2="560" y2="220" stroke="#f8fafc" strokeWidth="1" />

              {/* Wavy Sine Curve */}
              <path
                d="M 20 150 C 60 130, 80 150, 110 160 C 150 170, 170 190, 200 185 C 240 180, 260 120, 290 85 C 330 45, 350 40, 380 90 C 420 160, 440 180, 470 170 C 500 160, 520 120, 560 110"
                fill="none"
                stroke={COLORS.success}
                strokeWidth="4"
                strokeLinecap="round"
              />

              {/* Glowing circles at spline peaks */}
              <circle cx="290" cy="85" r="5" fill={COLORS.success} stroke="#ffffff" strokeWidth="2" />
              <circle cx="380" cy="90" r="5" fill={COLORS.success} stroke="#ffffff" strokeWidth="2" />
            </svg>
          </div>

          {/* X Axis Date Labels */}
          <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: 16, paddingRight: 16, marginTop: 12 }}>
            <span style={{ fontSize: 10, color: COLORS.muted }}>01-Mar 2023</span>
            <span style={{ fontSize: 10, color: COLORS.muted }}>02-Mar 2023</span>
            <span style={{ fontSize: 10, color: COLORS.muted }}>03-Mar 2023</span>
            <span style={{ fontSize: 10, color: COLORS.muted }}>04-Mar 2023</span>
            <span style={{ fontSize: 10, color: COLORS.muted }}>05-Mar 2023</span>
            <span style={{ fontSize: 10, color: COLORS.muted }}>06-Mar 2023</span>
            <span style={{ fontSize: 10, color: COLORS.muted }}>07-Mar 2023</span>
          </div>
        </Card>

        {/* CARD 5: CALENDAR SCHEDULE / ROOM SELECTOR */}
        <Card style={{ display: "flex", flexDirection: "column", height: 380, padding: "16px 16px 10px" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: COLORS.text }}>Calendar</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: COLORS.muted }}>
              <span style={{ cursor: "pointer" }} onClick={() => showToast("Previous month")}><Icons.ChevronLeft /></span>
              <span style={{ fontWeight: 600, color: COLORS.text }}>March</span>
              <span style={{ cursor: "pointer" }} onClick={() => showToast("Next month")}><Icons.ChevronRight /></span>
            </div>
          </div>

          {/* Beds configuration Filter Tabs */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 8 }}>
            {["1 Bed (6)", "2 Beds (12)", "3 Beds (15)"].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveBedTab(tab);
                  showToast(`Selected room category: ${tab}`);
                }}
                style={{
                  fontSize: 10, padding: "6px 2px", borderRadius: 8,
                  fontWeight: 600, textAlign: "center",
                  background: activeBedTab === tab ? "#111827" : "#f1f5f9",
                  color: activeBedTab === tab ? "#ffffff" : COLORS.text,
                  border: "none", cursor: "pointer", transition: "all 0.15s"
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Room Number Sub-Tabs */}
          <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 6, marginBottom: 10, scrollbarWidth: "none" }}>
            {["#1012", "#1013", "#1014", "#1022", "#1023", "#1025"].map((room) => (
              <button
                key={room}
                onClick={() => {
                  setActiveRoomCode(room);
                  showToast(`Viewing calendar schedule for Room ${room}`);
                }}
                style={{
                  fontSize: 10, padding: "4px 8px", borderRadius: 6,
                  background: "#ffffff", color: COLORS.text,
                  border: activeRoomCode === room ? "2.5px solid #111827" : `1px solid ${COLORS.border}`,
                  fontWeight: activeRoomCode === room ? 700 : 500, cursor: "pointer",
                  whiteSpace: "nowrap", flexShrink: 0
                }}
              >
                {room}
              </button>
            ))}
          </div>

          {/* Vertical Scrollable Bookings Timeline */}
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, paddingRight: 4 }}>
            
            {/* Booking 1: 13 Wed */}
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ width: 40, textAlign: "center", flexShrink: 0 }}>
                <p style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, lineHeight: 1 }}>13</p>
                <p style={{ fontSize: 10, color: COLORS.muted, textTransform: "uppercase" }}>Wed</p>
              </div>
              <div style={{
                flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center",
                background: "#e2efe0", color: "#2e5b2e", padding: "8px 12px", borderRadius: 10,
                fontSize: 12, fontWeight: 600, borderLeft: "4px solid #76c043"
              }}>
                <span>Yeasin arafat</span>
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=60&q=80" style={{ width: 20, height: 20, borderRadius: "50%", objectFit: "cover" }} />
              </div>
            </div>

            {/* Booking 2: 14 Thu */}
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ width: 40, textAlign: "center", flexShrink: 0 }}>
                <p style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, lineHeight: 1 }}>14</p>
                <p style={{ fontSize: 10, color: COLORS.muted, textTransform: "uppercase" }}>Thu</p>
              </div>
              <div style={{
                flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center",
                background: "#e2efe0", color: "#2e5b2e", padding: "8px 12px", borderRadius: 10,
                fontSize: 12, fontWeight: 600, borderLeft: "4px solid #76c043"
              }}>
                <span>Yeasin arafat</span>
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=60&q=80" style={{ width: 20, height: 20, borderRadius: "50%", objectFit: "cover" }} />
              </div>
            </div>

            {/* Booking 3: 15 Fri */}
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ width: 40, textAlign: "center", flexShrink: 0 }}>
                <p style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, lineHeight: 1 }}>15</p>
                <p style={{ fontSize: 10, color: COLORS.muted, textTransform: "uppercase" }}>Fri</p>
              </div>
              <div style={{
                flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center",
                background: "#f3f0ea", color: "#6b5d44", padding: "8px 12px", borderRadius: 10,
                fontSize: 12, fontWeight: 600, borderLeft: "4px solid #a8a29e"
              }}>
                <span>Faruk ahmad</span>
                <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=60&q=80" style={{ width: 20, height: 20, borderRadius: "50%", objectFit: "cover" }} />
              </div>
            </div>

            {/* Booking 4: 16 Sat (Available) */}
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ width: 40, textAlign: "center", flexShrink: 0 }}>
                <p style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, lineHeight: 1 }}>16</p>
                <p style={{ fontSize: 10, color: COLORS.muted, textTransform: "uppercase" }}>Sat</p>
              </div>
              <div 
                onClick={() => {
                  setNewResForm({...newResForm, arrival: "2026-06-16"});
                  setIsNewResModalOpen(true);
                }}
                style={{
                  flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center",
                  border: `1.5px dashed ${COLORS.border}`, padding: "8px 12px", borderRadius: 10,
                  fontSize: 11, fontWeight: 500, color: COLORS.muted, cursor: "pointer",
                  background: "#fafafa"
                }}
              >
                <span>Available for booking</span>
                <span style={{ color: "#76c043", fontSize: 16, fontWeight: "bold" }}>+</span>
              </div>
            </div>

            {/* Booking 5: 17 Sun (Available) */}
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ width: 40, textAlign: "center", flexShrink: 0 }}>
                <p style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, lineHeight: 1 }}>17</p>
                <p style={{ fontSize: 10, color: COLORS.muted, textTransform: "uppercase" }}>Sun</p>
              </div>
              <div 
                onClick={() => {
                  setNewResForm({...newResForm, arrival: "2026-06-17"});
                  setIsNewResModalOpen(true);
                }}
                style={{
                  flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center",
                  border: `1.5px dashed ${COLORS.border}`, padding: "8px 12px", borderRadius: 10,
                  fontSize: 11, fontWeight: 500, color: COLORS.muted, cursor: "pointer",
                  background: "#fafafa"
                }}
              >
                <span>Available for booking</span>
                <span style={{ color: "#76c043", fontSize: 16, fontWeight: "bold" }}>+</span>
              </div>
            </div>

            {/* Booking 6: 18 Mon */}
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ width: 40, textAlign: "center", flexShrink: 0 }}>
                <p style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, lineHeight: 1 }}>18</p>
                <p style={{ fontSize: 10, color: COLORS.muted, textTransform: "uppercase" }}>Mon</p>
              </div>
              <div style={{
                flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center",
                background: "#e4ece4", color: "#365c36", padding: "8px 12px", borderRadius: 10,
                fontSize: 12, fontWeight: 600, borderLeft: "4px solid #3b5e35"
              }}>
                <span>Muhammad</span>
                <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=60&q=80" style={{ width: 20, height: 20, borderRadius: "50%", objectFit: "cover" }} />
              </div>
            </div>

            {/* Booking 7: 19 Tue */}
            <div style={{ display: "flex", gap: 10, alignItems: "center", paddingBottom: 10 }}>
              <div style={{ width: 40, textAlign: "center", flexShrink: 0 }}>
                <p style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, lineHeight: 1 }}>19</p>
                <p style={{ fontSize: 10, color: COLORS.muted, textTransform: "uppercase" }}>Tue</p>
              </div>
              <div style={{
                flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center",
                background: "#e0eefe", color: "#1d4ed8", padding: "8px 12px", borderRadius: 10,
                fontSize: 12, fontWeight: 600, borderLeft: "4px solid #3b82f6"
              }}>
                <span>Jamal hossain</span>
                <img src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=60&q=80" style={{ width: 20, height: 20, borderRadius: "50%", objectFit: "cover" }} />
              </div>
            </div>

          </div>
        </Card>
      </div>

      {/* --- ROW 3 LAYOUT: NEW CUSTOMERS & RECENT ACTIVITIES --- */}
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 20 }}>
        
        {/* CARD 6: NEW CUSTOMER LIST */}
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>New customer</h3>
            <span 
              onClick={() => showToast("Opening entire customers database...")}
              style={{ fontSize: 11, fontWeight: 600, color: COLORS.accent, cursor: "pointer" }}
            >
              View all &gt;&gt;
            </span>
          </div>

          <div style={{ maxHeight: 280, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {[
                  { name: "Faruk ahmad", room: "Room #1420", dates: "20/01/21 - 28/01/21", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=60&q=80" },
                  { name: "Yeasin arafat", room: "Room #1430", dates: "20/01/21 - 28/01/21", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=60&q=80" },
                  { name: "Rakib hassan", room: "Room #1422", dates: "20/01/21 - 28/01/21", avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=60&q=80" },
                  { name: "Porosh vai", room: "Room #1424", dates: "20/01/21 - 28/01/21", avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=60&q=80" },
                  { name: "Jamal hossain", room: "Room #1420", dates: "20/01/21 - 28/01/21", avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=60&q=80" }
                ].map((cust, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${COLORS.border}33` }}>
                    <td style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                      <img src={cust.avatar} style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} />
                      <span style={{ fontWeight: 600, fontSize: 13, color: COLORS.text }}>{cust.name}</span>
                    </td>
                    <td style={{ padding: "10px 16px", fontSize: 12, color: COLORS.muted }}>{cust.room}</td>
                    <td style={{ padding: "10px 16px", fontSize: 11, color: COLORS.muted, textAlign: "right" }}>{cust.dates}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* CARD 7: RECENT ACTIVITIES & FEEDBACK BUTTONS */}
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>Recent activities</h3>
            <span 
              onClick={() => showToast("Opening full activity history log...")}
              style={{ fontSize: 11, fontWeight: 600, color: COLORS.accent, cursor: "pointer" }}
            >
              View all &gt;&gt;
            </span>
          </div>

          <div style={{ maxHeight: 280, overflowY: "auto", padding: "8px 16px" }}>
            
            {/* Activity 1 */}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${COLORS.border}33` }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.muted }}>Room #1420</p>
                <p style={{ fontSize: 12, color: COLORS.text, marginTop: 2 }}>
                  <span style={{ fontWeight: 600 }}>Zain ahmad</span> requested for a coffee and water
                </p>
              </div>
              <span style={{ fontSize: 10, color: COLORS.muted, flexShrink: 0 }}>1 min</span>
            </div>

            {/* Activity 2 */}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${COLORS.border}33` }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.muted }}>Room #1222</p>
                <p style={{ fontSize: 12, color: COLORS.text, marginTop: 2 }}>
                  <span style={{ color: COLORS.accent, fontWeight: 600 }}>@Stuff</span> <span style={{ fontWeight: 600 }}>Safayet</span> entered room for cleaning
                </p>
              </div>
              <span style={{ fontSize: 10, color: COLORS.muted, flexShrink: 0 }}>9 min</span>
            </div>

            {/* Activity 3: Show Empathy Reaction row */}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${COLORS.border}33` }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.muted }}>Room #1940</p>
                <p style={{ fontSize: 12, color: COLORS.text, marginTop: 2, marginBottom: 8 }}>
                  <span style={{ fontWeight: 600 }}>Jamal hossain</span> provided a negative review
                </p>
                
                {/* INTERACTIVE ACTION PILL BUTTON */}
                <div style={{ display: "flex", gap: 6 }}>
                  <button 
                    onClick={() => showToast("Empathy response template generated! Alerting customer relations...")}
                    style={{
                      background: "#eaf6ec", border: "1px solid #cce8cf", borderRadius: 20,
                      padding: "4px 12px", fontSize: 10, fontWeight: 600, color: "#22542a",
                      display: "flex", alignItems: "center", gap: 4
                    }}
                  >
                    🪄 Show empathy
                  </button>
                  <button 
                    onClick={() => showToast("Dialing room #1940 phone line...")}
                    style={{
                      background: "#f3f4f6", border: `1px solid ${COLORS.border}`, borderRadius: "50%",
                      width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center",
                      color: COLORS.muted
                    }}
                  >
                    <Icons.Phone />
                  </button>
                  <button 
                    onClick={() => showToast("Opening message portal to room #1940...")}
                    style={{
                      background: "#f3f4f6", border: `1px solid ${COLORS.border}`, borderRadius: "50%",
                      width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center",
                      color: COLORS.muted
                    }}
                  >
                    <Icons.Message />
                  </button>
                </div>
              </div>
              <span style={{ fontSize: 10, color: COLORS.muted, flexShrink: 0 }}>21 min</span>
            </div>

            {/* Activity 4 */}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0" }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.muted }}>Room #1320</p>
                <p style={{ fontSize: 12, color: COLORS.text, marginTop: 2 }}>
                  <span style={{ fontWeight: 600 }}>Anik ahmed</span> checked out successfully
                </p>
              </div>
              <span style={{ fontSize: 10, color: COLORS.muted, flexShrink: 0 }}>22 min</span>
            </div>

          </div>
        </Card>
      </div>

      {/* --- NEW RESERVATION INTERACTIVE MODAL --- */}
      {isNewResModalOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0, 0, 0, 0.4)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{
            background: "#ffffff", border: `1px solid ${COLORS.border}`,
            borderRadius: 16, width: 420, padding: 24, boxShadow: "0 10px 30px rgba(0,0,0,0.15)"
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, marginBottom: 16 }}>Create New Reservation</h3>
            <form onSubmit={handleCreateReservation}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: COLORS.muted, marginBottom: 4 }}>Customer Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Yeasin arafat" 
                  value={newResForm.name}
                  onChange={(e) => setNewResForm({...newResForm, name: e.target.value})}
                  style={{ width: "100%" }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: COLORS.muted, marginBottom: 4 }}>Select Room</label>
                <select 
                  value={newResForm.room} 
                  onChange={(e) => setNewResForm({...newResForm, room: e.target.value})}
                  style={{ width: "100%" }}
                >
                  <option value="Room #1420">Room #1420 (1 Bed)</option>
                  <option value="Room #1430">Room #1430 (2 Beds)</option>
                  <option value="Room #1422">Room #1422 (1 Bed)</option>
                  <option value="Room #1424">Room #1424 (3 Beds)</option>
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: COLORS.muted, marginBottom: 4 }}>Arrival Date</label>
                  <input 
                    type="date" 
                    value={newResForm.arrival}
                    onChange={(e) => setNewResForm({...newResForm, arrival: e.target.value})}
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: COLORS.muted, marginBottom: 4 }}>Departure Date</label>
                  <input 
                    type="date" 
                    value={newResForm.departure}
                    onChange={(e) => setNewResForm({...newResForm, departure: e.target.value})}
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button 
                  type="button" 
                  onClick={() => setIsNewResModalOpen(false)}
                  style={{ padding: "8px 16px", borderRadius: 8, background: "#f3f4f6", color: COLORS.text, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  style={{ padding: "8px 16px", borderRadius: 8, background: COLORS.accent, color: "#ffffff", cursor: "pointer", fontWeight: 600 }}
                >
                  Save Reservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
