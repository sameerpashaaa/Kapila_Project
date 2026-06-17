import { useState, useEffect, useRef, useCallback } from "react";
import Section from "../../components/Section";
import { usePaginatedApi } from "../../hooks/useApi";
import * as api from "../../api";
import { getAccessToken } from "../../api/authToken";
import { COLORS } from "../../styles/colors";
import IssuanceTopSection from "./components/IssuanceTopSection";
import IssuanceHistory from "./components/IssuanceHistory";
import IndentHistoryModal from "../../components/issuance/IndentHistoryModal";
import { useBreakpoint } from "../../styles/responsive";

import { useAuth } from "../../context/AuthContext";
import { useAppContext } from "../../context/AppContext";

import { today } from "../../utils/dates";
const LIMIT = 20;

export default function StoreIssuancePage() {
  const { roles } = useAuth();
  const { setCurrentScreen, setNavBlocker } = useAppContext();
  const { isMobile } = useBreakpoint();
  const isStoreManager = roles.some((r) => r.key === "store_manager");

  const [pendingIndents, setPendingIndents] = useState([]);
  const [selectedIndent, setSelectedIndent] = useState(null);
  const [issueQtys, setIssueQtys] = useState({});
  const [availableStock, setAvailableStock] = useState({});
  const [confirmedItems, setConfirmedItems] = useState(new Set());
  
  const pendingIssueRef = useRef(new Map());
  const issuedRef = useRef(false);

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

  const autoIssue = useCallback(async () => {
    if (issuedRef.current) return;
    if (pendingIssueRef.current.size === 0) return;

    issuedRef.current = true;
    const issueItems = Array.from(pendingIssueRef.current.values());

    try {
      await api.issuances.create({
        indent_id: selectedIndent.id,
        dept: selectedIndent.dept,
        date: today(),
        scanned: false,
        items: issueItems,
      });
      setSelectedIndent(null);
      setConfirmedItems(new Set());
      pendingIssueRef.current.clear();
      setMsg("Material issued and stock updated ✓");
      setTimeout(() => setMsg(""), 3000);
      loadIssuances({ page: 1 });
      api.indents.list({ status: "pending", limit: 100 }).then((r) => {
        if (r.success) setPendingIndents(r.data);
      });
    } catch (e) {
      issuedRef.current = false;
      setMsg("Error: " + e.message);
      setTimeout(() => setMsg(""), 3000);
      throw e;
    }
  }, [selectedIndent, issueQtys]);

  const handleSelectIndent = async (ind) => {
    if (pendingIssueRef.current.size > 0 && !issuedRef.current) {
      if (ind?.id === selectedIndent?.id) return;
      const confirmed = window.confirm(
        `You have ${pendingIssueRef.current.size} confirmed item(s) not yet issued.\n\nThey will be auto-issued now before switching indents. Continue?`
      );
      if (!confirmed) return;
      try {
        await autoIssue();
      } catch (err) {
        alert("Could not auto-issue confirmed items. Please use 'Issue & Update Stock' before switching.");
        return;
      }
    }

    setSelectedIndent(ind);
    setConfirmedItems(new Set());
    pendingIssueRef.current.clear();
    issuedRef.current = false;
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

  const handleToggleConfirm = (idx) => {
    if (confirmedItems.has(idx)) return;
    setConfirmedItems((prev) => {
      const next = new Set(prev);
      next.add(idx);
      return next;
    });

    const item = selectedIndent?.items[idx];
    if (item) {
      pendingIssueRef.current.set(idx, {
        name: item.name,
        qty: parseFloat(item.qty),
        issued: parseFloat(issueQtys[idx] ?? item.qty),
        unit: item.unit || "kg",
        item_code: item.item_code,
      });
    }
  };

  const handleIssue = async () => {
    if (!selectedIndent) return;
    if (confirmedItems.size === 0) return;
    await autoIssue();
  };

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (pendingIssueRef.current.size === 0 || issuedRef.current) return;

      autoIssue().catch(console.error);

      const token = getAccessToken();
      const payload = JSON.stringify({
        token,
        indentId: selectedIndent?.id,
        items: Array.from(pendingIssueRef.current.values()),
      });
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon("/api/store-issuance/auto-issue", blob);

      e.preventDefault();
      e.returnValue = "You have confirmed items that haven't been fully issued. Leaving now will auto-issue them.";
      return e.returnValue;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [autoIssue, selectedIndent]);

  useEffect(() => {
    if (setNavBlocker) {
      setNavBlocker(() => async (newScreen) => {
        if (pendingIssueRef.current.size > 0 && !issuedRef.current) {
          try {
            await autoIssue();
            return true;
          } catch (e) {
             alert("Auto-issue failed. Please issue manually before leaving.");
             return false;
          }
        }
        return true;
      });
    }
    return () => {
      if (setNavBlocker) setNavBlocker(null);
    };
  }, [autoIssue, setNavBlocker]);

  // Sync unmount / screen change fallback (fires beacon to backend synchronously)
  useEffect(() => {
    return () => {
      if (pendingIssueRef.current.size > 0 && !issuedRef.current) {
        const token = getAccessToken();
        const payload = JSON.stringify({
          token,
          indentId: selectedIndent?.id,
          items: Array.from(pendingIssueRef.current.values()),
        });
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon("/api/store-issuance/auto-issue", blob);
      }
    };
  }, [selectedIndent]);

  const handleScan = async (file) => {
    if (!file) return;
    setScanning(true);
    setScanText("Reading form with AI…");
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result.split(",")[1];
      try {
        // Fix for 401 bug: use getAccessToken() to send Bearer token to backend
        const BASE = import.meta.env.VITE_API_URL || "/api";
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
            padding: isMobile ? "12px 16px" : "16px 24px",
            display: "flex", alignItems: "center", gap: 16, flexShrink: 0,
          }}>
            <button
              onClick={() => setCurrentScreen("store_manager_home")}
              style={{
                background: "none",
                border: "1.5px solid #E2E8F0",
                borderRadius: "8px",
                padding: "8px 16px",
                cursor: "pointer",
                color: "#0F172A",
                fontSize: "15px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontWeight: 700,
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#F1F5F9"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            >
              ← Back
            </button>
            <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 800, color: "#0F172A", fontFamily: "var(--font-display, inherit)" }}>
              Store Issuance
            </h1>
          </div>

          {/* Unified body layout */}
          <div style={selectedIndent ? {
            padding: "24px",
            height: "calc(100vh - 65px)",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            boxSizing: "border-box",
            overflow: "hidden"
          } : {
            padding: "24px",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "16px"
          }}>
            <div style={selectedIndent ? { height: "90%", display: "flex", flexDirection: "column", minHeight: 0 } : undefined}>
              <IssuanceTopSection 
                onScan={handleScan} scanning={scanning} scanText={scanText} msg={msg}
                pendingIndents={pendingIndents} selectedIndent={selectedIndent} onSelectIndent={handleSelectIndent}
                onIssue={handleIssue} issueQtys={issueQtys} availableStock={availableStock}
                onQtyChange={handleQtyChange} onShowHistory={() => setIsHistoryOpen(true)}
                confirmedItems={confirmedItems} onToggleConfirm={handleToggleConfirm}
                isMobile={isMobile}
              />
            </div>
            
            <div style={selectedIndent ? { height: "10%", minHeight: 0 } : undefined}>
              <IssuanceHistory 
                items={items}
                total={total}
                page={page}
                loading={loading}
                error={error}
                onPageChange={(p) => loadIssuances({ page: p })}
                LIMIT={LIMIT}
                defaultExpanded={selectedIndent ? false : true}
                style={selectedIndent ? { height: "100%", overflowY: "auto" } : undefined}
              />
            </div>

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
            confirmedItems={confirmedItems}
            onToggleConfirm={handleToggleConfirm}
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
