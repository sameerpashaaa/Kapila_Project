import { useState, useEffect } from "react";
import Section from "../../components/Section";
import { usePaginatedApi } from "../../hooks/useApi";
import * as api from "../../api";
import { getAccessToken } from "../../api/authToken";
import { COLORS } from "../../styles/colors";
import IssuanceTopSection from "./components/IssuanceTopSection";
import IssuanceHistory from "./components/IssuanceHistory";
import IndentHistoryModal from "../../components/issuance/IndentHistoryModal";

import { useAuth } from "../../context/AuthContext";
import { useAppContext } from "../../context/AppContext";

import { today } from "../../utils/dates";
const LIMIT = 20;

export default function StoreIssuancePage() {
  const { roles } = useAuth();
  const { setCurrentScreen } = useAppContext();
  const isStoreManager = roles.some((r) => r.key === "store_manager");

  const [pendingIndents, setPendingIndents] = useState([]);
  const [selectedIndent, setSelectedIndent] = useState(null);
  const [issueQtys, setIssueQtys] = useState({});
  const [availableStock, setAvailableStock] = useState({});
  
  const [scanText, setScanText] = useState("");
  const [scanning, setScanning] = useState(false);
  const [msg, setMsg] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const { items, total, page, loading, error, fetch: fetchHistory } = usePaginatedApi(api.issuances.list);

  const loadIssuances = (overrides = {}) =>
    fetchHistory({ limit: LIMIT, sort: "date", order: "desc", ...overrides });

  useEffect(() => {
    loadIssuances();
    api.indents.list({ status: "pending", limit: 100 }).then((r) => {
      if (r.success) setPendingIndents(r.data);
    });
  }, []);

  const handleSelectIndent = async (ind) => {
    setSelectedIndent(ind);
    if (!ind) {
      setIssueQtys({});
      setAvailableStock({});
      return;
    }

    const q = {};
    ind.items.forEach((it, i) => { q[i] = it.qty; });
    setIssueQtys(q);
    setAvailableStock({});
    
    try {
      const itemNames = ind.items.map(it => it.name);
      const res = await api.stock.available(itemNames);
      if (res.success) {
        setAvailableStock(res.data);
      }
    } catch (e) {
      console.error("Failed to check stock availability:", e);
    }
  };

  const handleQtyChange = (idx, value) => {
    setIssueQtys(prev => ({ ...prev, [idx]: value }));
  };

  const handleIssue = async () => {
    if (!selectedIndent) return;
    
    const issueItems = selectedIndent.items.map((it, idx) => ({
      name: it.name,
      qty: parseFloat(it.qty),
      issued: parseFloat(issueQtys[idx] ?? it.qty),
      unit: it.unit || "kg",
      item_code: it.item_code,
    }));

    try {
      await api.issuances.create({
        indent_id: selectedIndent.id,
        dept: selectedIndent.dept,
        date: today(),
        scanned: false,
        items: issueItems,
      });
      setSelectedIndent(null);
      setMsg("Material issued and stock updated ✓");
      setTimeout(() => setMsg(""), 3000);
      loadIssuances({ page: 1 });
      api.indents.list({ status: "pending", limit: 100 }).then((r) => {
        if (r.success) setPendingIndents(r.data);
      });
    } catch (e) { 
      setMsg("Error: " + e.message); 
      setTimeout(() => setMsg(""), 3000);
    }
  };

  const handleScan = async (file) => {
    if (!file) return;
    setScanning(true);
    setScanText("Reading form with AI…");
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result.split(",")[1];
      try {
        // Fix for 401 bug: use getAccessToken() to send Bearer token to backend
        const BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
        const url = (BASE.startsWith("http") ? BASE : window.location.origin + BASE) + "/scan/indent";
        const token = getAccessToken();
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY || "dummy-key" // Required header
          },
          body: JSON.stringify({ image: base64, mime_type: file.type })
        });

        const data = await res.json();

        if (data.success) {
          setScanText(`Detected: ${data.data.dept} — ${data.data.items?.length || 0} items`);
          setMsg("Scanned indent added ✓");
          loadIssuances({ page: 1 });
          
          // Try to auto-select the detected indent if it matches one in pending list
          if (data.data.id) {
            const ind = pendingIndents.find(i => i.id === data.data.id);
            if (ind) handleSelectIndent(ind);
          }
        } else {
          setScanText("Could not parse form. Please enter manually.");
        }
      } catch {
        setScanText("Scan error. Check connection.");
      }
      setScanning(false);
      setTimeout(() => setMsg(""), 3000);
      setTimeout(() => setScanText(""), 3000);
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      {isStoreManager ? (
        <div style={{ minHeight: "100vh", backgroundColor: "#F8FAFC", display: "flex", flexDirection: "column" }}>
          {/* Unified Page Header */}
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
              ← Back
            </button>
            <h1 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#0F172A" }}>
              Store Issuance
            </h1>
          </div>

          {/* Unified body layout */}
          <div style={{ padding: "24px", flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
            <IssuanceTopSection 
              onScan={handleScan}
              scanning={scanning}
              scanText={scanText}
              msg={msg}
              pendingIndents={pendingIndents}
              selectedIndent={selectedIndent}
              onSelectIndent={handleSelectIndent}
              onIssue={handleIssue}
              issueQtys={issueQtys}
              availableStock={availableStock}
              onQtyChange={handleQtyChange}
              onShowHistory={() => setIsHistoryOpen(true)}
            />
            
            <IssuanceHistory 
              items={items}
              total={total}
              page={page}
              loading={loading}
              error={error}
              onPageChange={(p) => loadIssuances({ page: p })}
              LIMIT={LIMIT}
            />

            <IndentHistoryModal 
              isOpen={isHistoryOpen}
              onClose={() => setIsHistoryOpen(false)}
            />
          </div>
        </div>
      ) : (
        <Section title="Issue Material" sub="Storekeeper issues goods against indent requests">
          <IssuanceTopSection 
            onScan={handleScan}
            scanning={scanning}
            scanText={scanText}
            msg={msg}
            pendingIndents={pendingIndents}
            selectedIndent={selectedIndent}
            onSelectIndent={handleSelectIndent}
            onIssue={handleIssue}
            issueQtys={issueQtys}
            availableStock={availableStock}
            onQtyChange={handleQtyChange}
            onShowHistory={() => setIsHistoryOpen(true)}
          />
          
          <IssuanceHistory 
            items={items}
            total={total}
            page={page}
            loading={loading}
            error={error}
            onPageChange={(p) => loadIssuances({ page: p })}
            LIMIT={LIMIT}
          />

          <IndentHistoryModal 
            isOpen={isHistoryOpen}
            onClose={() => setIsHistoryOpen(false)}
          />
        </Section>
      )}
    </>
  );
}
