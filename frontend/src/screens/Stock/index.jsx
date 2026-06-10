import { useState, useEffect, useRef, Fragment } from "react";
import Section from "../../components/Section";
import Card from "../../components/Card";
import Btn from "../../components/Btn";
import Input from "../../components/Input";
import Select from "../../components/Select";
import Pagination from "../../components/Pagination";
import SearchBar from "../../components/SearchBar";
import ErrorMsg from "../../components/ErrorMsg";
import { COLORS, UNITS, DEPARTMENTS } from "../../styles/colors";
import { usePaginatedApi } from "../../hooks/useApi";
import * as api from "../../api";
import { useAppContext } from "../../context/AppContext";
import { useLocalSpeech } from "../../hooks/useLocalSpeech";
import QRCode from "qrcode";
import {
  Banknote, PackageOpen, AlertTriangle, Filter, Users, Calendar, Tags,
  TrendingDown, ShoppingCart, Clock, ClipboardList, Package, CheckCircle,
  AlertCircle, LayoutList, RefreshCw, BarChart2, ShoppingBag, Printer,
  Edit3, Search, PlusCircle, Trash2, ArrowRight, Download, Eye, AlertOctagon,
  Send
} from "lucide-react";

const today = () => new Date().toISOString().slice(0, 10);
const LIMIT = 20;

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch { return dateStr; }
};

const toTitleCase = (str) => {
  if (!str) return "";
  return str
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const getItemEmoji = (name) => {
  if (!name) return "📦";
  const cleanName = name.toLowerCase();
  if (cleanName.includes("rice") || cleanName.includes("biryani") || cleanName.includes("idli") || cleanName.includes("batter")) return "🍚";
  if (cleanName.includes("tomato") || cleanName.includes("potato") || cleanName.includes("onion") || cleanName.includes("vegetable") || cleanName.includes("carrot") || cleanName.includes("garlic") || cleanName.includes("ginger")) return "🍅";
  if (cleanName.includes("milk") || cleanName.includes("curd") || cleanName.includes("cream") || cleanName.includes("dairy") || cleanName.includes("paneer")) return "🥛";
  if (cleanName.includes("chicken") || cleanName.includes("mutton") || cleanName.includes("egg") || cleanName.includes("fish") || cleanName.includes("meat")) return "🍗";
  if (cleanName.includes("oil") || cleanName.includes("ghee") || cleanName.includes("butter")) return "🧈";
  if (cleanName.includes("flour") || cleanName.includes("atta") || cleanName.includes("maida") || cleanName.includes("bread") || cleanName.includes("bun")) return "🍞";
  if (cleanName.includes("sugar") || cleanName.includes("salt") || cleanName.includes("spice") || cleanName.includes("masala") || cleanName.includes("chilli") || cleanName.includes("cardamom") || cleanName.includes("pepper")) return "🌶️";
  if (cleanName.includes("lemon") || cleanName.includes("juice") || cleanName.includes("apple") || cleanName.includes("banana") || cleanName.includes("fruit") || cleanName.includes("orange")) return "🍎";
  return "📦";
};

const getInitialsAvatar = (name) => {
  if (!name) return { text: "??", bg: "#f1f5f9", fg: "#64748b" };
  const clean = name.trim().replace(/[^a-zA-Z0-9\s]/g, "");
  const parts = clean.split(/\s+/).filter(Boolean);
  let text = "";
  if (parts.length >= 2) {
    text = (parts[0][0] + parts[1][0]).toUpperCase();
  } else if (parts.length === 1) {
    text = parts[0].slice(0, 2).toUpperCase();
  } else {
    text = "ST";
  }
  
  // Hashing to pick a color palette
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const colors = [
    { bg: "#eff6ff", fg: "#1d4ed8" }, // Blue
    { bg: "#ecfdf5", fg: "#047857" }, // Emerald
    { bg: "#fef3c7", fg: "#b45309" }, // Amber
    { bg: "#fff1f2", fg: "#be123c" }, // Rose
    { bg: "#f5f3ff", fg: "#6d28d9" }, // Purple
    { bg: "#ecfeff", fg: "#0e7490" }, // Cyan
    { bg: "#f0fdf4", fg: "#15803d" }, // Green
    { bg: "#fff7ed", fg: "#c2410c" }, // Orange
  ];
  
  const index = Math.abs(hash) % colors.length;
  return { text, ...colors[index] };
};


const PriceTrendChart = ({ points }) => {
  if (!points || points.length < 2) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 160, background: COLORS.bg + "44", borderRadius: 6, border: `1px dashed ${COLORS.border}` }}>
        <p style={{ color: COLORS.muted, fontSize: 12 }}>Need at least 2 price records to plot trend</p>
      </div>
    );
  }

  const width = 450;
  const height = 150;
  const padding = { top: 15, right: 15, bottom: 20, left: 35 };

  const prices = points.map(p => parseFloat(p.price));
  const minPrice = Math.min(...prices) * 0.9;
  const maxPrice = Math.max(...prices) * 1.1;
  const priceRange = maxPrice - minPrice;

  const getX = (idx) => {
    return padding.left + (idx / (points.length - 1)) * (width - padding.left - padding.right);
  };

  const getY = (val) => {
    return height - padding.bottom - ((val - minPrice) / priceRange) * (height - padding.top - padding.bottom);
  };

  let pathD = "";
  let areaD = "";
  points.forEach((p, idx) => {
    const x = getX(idx);
    const y = getY(parseFloat(p.price));
    if (idx === 0) {
      pathD = `M ${x} ${y}`;
      areaD = `M ${x} ${height - padding.bottom} L ${x} ${y}`;
    } else {
      pathD += ` L ${x} ${y}`;
      areaD += ` L ${x} ${y}`;
    }
    if (idx === points.length - 1) {
      areaD += ` L ${x} ${height - padding.bottom} Z`;
    }
  });

  return (
    <div style={{ background: COLORS.bg + "55", borderRadius: 6, padding: 12, border: `1px solid ${COLORS.border}44` }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLORS.brand} stopOpacity="0.3"/>
            <stop offset="100%" stopColor={COLORS.brand} stopOpacity="0.0"/>
          </linearGradient>
        </defs>

        {[0, 0.5, 1].map((r, i) => {
          const val = minPrice + r * priceRange;
          const y = getY(val);
          return (
            <g key={i}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke={COLORS.border} strokeWidth="0.5" strokeDasharray="3,3" />
              <text x={padding.left - 6} y={y + 3} fill={COLORS.muted} fontSize="8" textAnchor="end">₹{val.toFixed(0)}</text>
            </g>
          );
        })}

        <path d={areaD} fill="url(#chartGrad)" />
        <path d={pathD} fill="none" stroke={COLORS.brand} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {points.map((p, idx) => {
          const x = getX(idx);
          const y = getY(parseFloat(p.price));
          return (
            <g key={idx} style={{ cursor: "pointer" }}>
              <circle cx={x} cy={y} r="4" fill={COLORS.bg} stroke={COLORS.brand} strokeWidth="2" />
              <title>{`${p.date}\n₹${parseFloat(p.price).toFixed(2)}/unit\nSupplier: ${p.supplier || '—'}`}</title>
            </g>
          );
        })}

        {points.map((p, idx) => {
          if (idx === 0 || idx === points.length - 1 || points.length <= 5) {
            const x = getX(idx);
            return (
              <text key={idx} x={x} y={height - 4} fill={COLORS.muted} fontSize="8" textAnchor="middle">
                {p.date.slice(5)}
              </text>
            );
          }
          return null;
        })}
      </svg>
    </div>
  );
};

export default function StockScreen() {
  const { stockNames, stocks, refreshStockNames } = useAppContext();
  const [form, setForm] = useState({ name: "", qty: "", unit: "kg", date: today(), price: "", supplier: "", expiry_date: "", min_alert_qty: "", freight: "", gst: "" });
  const [msg, setMsg]   = useState("");
  const [filters, setFilters] = useState({ low_stock: "", expiry_status: "", supplier: "", active_only: "" });
  const [stats, setStats]     = useState({ total_spend: 0, store_value: 0, low_stock_value: 0 });
  const { items, total, page, loading, error, fetch } = usePaginatedApi(api.stock.list);

  const [editingId, setEditingId] = useState(null);
  const [editRemaining, setEditRemaining] = useState("");

  const fileInputRef = useRef();
  const [scannedPreview, setScannedPreview] = useState(null);
  const [scanningBill, setScanningBill] = useState(false);

  const [showQuickImport, setShowQuickImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [listenLang, setListenLang] = useState("en-IN");

  // Local speech-to-text (Whisper Tiny — no Google, no internet)
  const { listening, statusMsg: speechStatus, transcript: speechTranscript, interimText, startRecording, stopRecording } = useLocalSpeech(listenLang);
  const [editMinAlert, setEditMinAlert] = useState("");
  const [groupByItem, setGroupByItem] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});
  const [chartItem, setChartItem] = useState("");
  const [editReason, setEditReason] = useState("Audit Correction");
  const [editNotes, setEditNotes] = useState("");

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
  const [insightsData, setInsightsData] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  const loadLedger = async () => {
    setLedgerLoading(true);
    try {
      const res = await api.stock.ledger();
      setLedgerData(res.data || []);
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
    const res = await fetch({ limit: LIMIT, sort: "created_at", order: "desc", ...merged });
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

  const add = async () => {
    if (!form.name || !form.qty) return;
    try {
      const quantityVal = parseFloat(form.qty) || 0;
      const basePriceVal = parseFloat(form.price) || 0;
      const gstVal = parseFloat(form.gst) || 0;
      const freightVal = parseFloat(form.freight) || 0;

      const landedPrice = quantityVal > 0 
        ? (basePriceVal * (1 + gstVal / 100)) + (freightVal / quantityVal)
        : basePriceVal;

      const payload = {
        name: toTitleCase(form.name),
        qty: quantityVal,
        unit: form.unit,
        price: landedPrice || null,
        supplier: form.supplier ? toTitleCase(form.supplier) : null,
        expiry_date: form.expiry_date || null,
        min_alert_qty: form.min_alert_qty ? parseFloat(form.min_alert_qty) : null,
        date: form.date || today()
      };

      if (!navigator.onLine) {
        const queue = JSON.parse(localStorage.getItem("kapila_offline_stock") || "[]");
        queue.push(payload);
        localStorage.setItem("kapila_offline_stock", JSON.stringify(queue));
        setForm({ name: "", qty: "", unit: "kg", date: today(), price: "", supplier: "", expiry_date: "", min_alert_qty: "", freight: "", gst: "" });
        setMsg("Offline: Purchase saved to local queue 📴");
        setTimeout(() => setMsg(""), 4000);
        return;
      }

      await api.stock.create(payload);
      setForm({ name: "", qty: "", unit: "kg", date: today(), price: "", supplier: "", expiry_date: "", min_alert_qty: "", freight: "", gst: "" });
      setMsg("Stock added ✓");
      setTimeout(() => setMsg(""), 2000);
      load({ page: 1 });
      refreshStockNames();
      refreshActiveTab();
    } catch (e) { setMsg("Error: " + e.message); }
  };

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

  const handleNameChange = (val) => {
    setForm((f) => {
      const updated = { ...f, name: val };
      if (val.trim()) {
        const matched = stocks
          .filter((s) => s.name.toLowerCase() === val.trim().toLowerCase())
          .sort((a, b) => b.id - a.id)[0];
        if (matched) {
          return {
            ...updated,
            unit: matched.unit || updated.unit,
            price: matched.price !== null ? matched.price.toString() : "",
            supplier: matched.supplier || "",
            min_alert_qty: matched.min_alert_qty !== null ? matched.min_alert_qty.toString() : "",
          };
        }
      }
      return updated;
    });
  };

  const handleScanBill = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setScanningBill(true);
    setMsg("Scanning bill with AI...");
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result.split(",")[1];
      try {
        const res = await api.scan.purchase(base64, file.type);
        if (res.success) {
          setScannedPreview({
            supplier: res.data.supplier || "",
            date: today(),
            items: res.data.items.map(it => ({
              name: it.name,
              qty: it.qty?.toString() || "",
              price: it.price?.toString() || "",
              unit: it.unit || "kg",
              item_code: it.item_code || ""
            }))
          });
          setMsg("Bill scanned successfully ✓");
        } else {
          setMsg("Failed to parse bill.");
        }
      } catch (err) {
        setMsg("Scan error: " + err.message);
      } finally {
        setScanningBill(false);
        setTimeout(() => setMsg(""), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  const updateScannedItem = (idx, field, val) => {
    setScannedPreview((prev) => {
      const nextItems = prev.items.map((it, i) => {
        if (i !== idx) return it;
        const updated = { ...it, [field]: val };
        if (field === "name") {
          const matched = stocks.find(s => s.name.toLowerCase() === val.trim().toLowerCase());
          if (matched) {
            updated.unit = matched.unit || updated.unit;
            updated.item_code = matched.item_code;
          }
        }
        return updated;
      });
      return { ...prev, items: nextItems };
    });
  };

  const printThermalLabel = async (item) => {
    const printWindow = window.open("", "_blank", "width=400,height=300");
    // Generate QR code locally — no internet needed
    const qrUrl = await QRCode.toDataURL(item.item_code, { width: 100, margin: 1 });
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Label - ${item.item_code}</title>
          <style>
            @page { size: 2in 1.2in; margin: 0; }
            body {
              font-family: 'Courier New', Courier, monospace;
              width: 1.9in;
              height: 1.1in;
              padding: 0.05in;
              margin: 0;
              box-sizing: border-box;
              display: flex;
              align-items: center;
              justify-content: space-between;
              background: #fff;
              color: #000;
            }
            .info {
              display: flex;
              flex-direction: column;
              justify-content: center;
              font-size: 8px;
              line-height: 1.1;
              max-width: 1.1in;
            }
            .code {
              font-size: 10px;
              font-weight: bold;
              margin-bottom: 2px;
            }
            .name {
              font-size: 9px;
              font-weight: bold;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .date {
              color: #555;
              font-size: 7px;
              margin-top: 1px;
            }
            .qr {
              width: 45px;
              height: 45px;
            }
          </style>
        </head>
        <body>
          <div class="info">
            <div class="code">${item.item_code}</div>
            <div class="name">${item.name}</div>
            <div class="qty">Qty: ${item.qty} ${item.unit}</div>
            <div class="date">Recd: ${item.date}</div>
            <div class="date">Exp: ${item.expiry_date || 'N/A'}</div>
          </div>
          <img class="qr" src="${qrUrl}" onload="window.print(); window.close();" />
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const toggleExpandItem = (name) => {
    setExpandedItems(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const removeScannedItem = (idx) => {
    setScannedPreview(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx)
    }));
  };

  const submitScannedItems = async () => {
    if (!scannedPreview || !scannedPreview.items.length) return;
    setMsg("Adding items to store...");
    try {
      for (const it of scannedPreview.items) {
        if (!it.name || !it.qty) continue;
        await api.stock.create({
          name: toTitleCase(it.name),
          qty: parseFloat(it.qty),
          price: it.price ? parseFloat(it.price) : null,
          unit: it.unit || "kg",
          supplier: scannedPreview.supplier ? toTitleCase(scannedPreview.supplier) : null,
          date: scannedPreview.date || today(),
          item_code: it.item_code || null
        });
      }
      setScannedPreview(null);
      setMsg("Scanned stock added ✓");
      setTimeout(() => setMsg(""), 3000);
      load({ page: 1 });
      refreshStockNames();
      refreshActiveTab();
    } catch (e) {
      setMsg("Error saving: " + e.message);
    }
  };

  // Toggle recording with local Whisper (replaces Google Web Speech)
  const startListening = () => {
    if (listening) {
      stopRecording((status) => setMsg(status));
    } else {
      startRecording(
        // onResult — append transcript to the text area
        (text) => {
          setImportText((prev) => (prev.trim() ? prev.trim() + "\n" + text : text));
          setMsg("Transcription complete ✓");
          setTimeout(() => setMsg(""), 3000);
        },
        // onStatus — show progress messages
        (status) => setMsg(status)
      );
    }
  };

  const parseImportText = async () => {
    if (!importText.trim()) return;
    setMsg("Parsing text list with AI...");
    try {
      const res = await api.scan.text(importText);
      if (res.success) {
        setScannedPreview({
          supplier: res.data.supplier || "",
          date: today(),
          items: res.data.items.map(it => ({
            name: it.name,
            qty: it.qty?.toString() || "",
            price: it.price?.toString() || "",
            unit: it.unit || "kg",
            item_code: it.item_code || ""
          }))
        });
        setShowQuickImport(false);
        setImportText("");
        setMsg("Import parsed successfully ✓");
      } else {
        setMsg("Failed to parse text.");
      }
    } catch (err) {
      setMsg("Parse error: " + err.message);
    } finally {
      setTimeout(() => setMsg(""), 3000);
    }
  };

  const handleFilterChange = (field, val) => {
    setFilters((f) => {
      const nextFilters = { ...f, [field]: val };
      load({ page: 1, ...nextFilters });
      return nextFilters;
    });
  };

  const uniqueSuppliers = Array.from(new Set(stocks.map((s) => s.supplier).filter(Boolean)));

  // ── Group items by name for the "Group by Item" view ──────────────────────
  const groupedItems = (() => {
    const map = {};
    items.forEach((b) => {
      const key = b.name.toLowerCase();
      if (!map[key]) {
        map[key] = {
          name: b.name,
          item_code: b.item_code,
          unit: b.unit,
          remaining: 0,
          totalCost: 0,
          batchCount: 0,
          batches: [],
        };
      }
      map[key].remaining   += parseFloat(b.remaining || 0);
      map[key].totalCost   += parseFloat(b.price || 0) * parseFloat(b.qty || 0);
      map[key].batchCount  += 1;
      map[key].batches.push(b);
    });
    return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
  })();

  // ── CSV export ─────────────────────────────────────────────────────────────
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

  const getSupplierPriceComparison = (name) => {
    if (!name || !name.trim()) return null;
    const matches = stocks.filter(
      (s) => s.name.toLowerCase() === name.trim().toLowerCase() && s.price !== null
    );
    if (matches.length === 0) return null;
    
    const uniqueMap = {};
    matches.forEach(m => {
      if (!uniqueMap[m.supplier] || new Date(m.date) > new Date(uniqueMap[m.supplier].date)) {
        uniqueMap[m.supplier] = { price: m.price, date: m.date };
      }
    });
    
    const uniqueList = Object.entries(uniqueMap).map(([supplier, info]) => ({
      supplier,
      ...info
    })).sort((a, b) => a.price - b.price);

    return uniqueList;
  };

  const handleReorderClick = (item) => {
    setShowQuickImport(false);
    setForm({
      name: item.name,
      qty: "",
      unit: item.unit || "kg",
      date: today(),
      price: item.price !== null ? item.price.toString() : "",
      supplier: item.supplier || "",
      expiry_date: "",
      min_alert_qty: item.min_alert_qty !== null ? item.min_alert_qty.toString() : ""
    });
    setMsg(`Form populated for ${item.name} ✓`);
    setTimeout(() => setMsg(""), 3000);
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

  const isTotalActive = filters.low_stock === "" && filters.active_only === "";
  const isActiveActive = filters.active_only === "true";
  const isLowActive = filters.low_stock === "true";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, height: "100%" }}>
      {/* KPI Strip */}
      <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
        {[ 
          { id: "total", label: "Total Active Spend", value: stats.total_spend, color: COLORS.teal, icon: <Banknote size={20} /> },
          { id: "active", label: "Current Store Value", value: stats.store_value, color: COLORS.accent, icon: <PackageOpen size={20} /> },
          { id: "low", label: "Low Stock Value", value: stats.low_stock_value, color: COLORS.danger, icon: <AlertTriangle size={20} /> }
        ].map((kpi) => {
          const isActive = (kpi.id === "total" && isTotalActive) || (kpi.id === "active" && isActiveActive) || (kpi.id === "low" && isLowActive);
          return (
            <Card
              key={kpi.id}
              onClick={() => handleStatCardClick(kpi.id)}
              style={{ 
                flex: 1,
                padding: "14px 20px", 
                display: "flex", 
                alignItems: "center", 
                gap: 14, 
                cursor: "pointer", 
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                border: `1px solid ${COLORS.border}`,
                borderTop: isActive ? `3px solid ${kpi.color}` : `1px solid ${COLORS.border}`,
                boxShadow: isActive ? "0 4px 12px rgba(0,0,0,0.06)" : "none",
                transform: isActive ? "translateY(-1px)" : "none",
                paddingTop: isActive ? "12px" : "14px" // offset to keep overall height consistent
              }}
            >
              <div style={{ 
                display: "flex", alignItems: "center", justifyContent: "center", 
                width: 40, height: 40, borderRadius: 8, 
                background: kpi.color + "15", color: kpi.color,
                flexShrink: 0
              }}>
                {kpi.icon}
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 500, color: COLORS.muted, marginBottom: 2 }}>{kpi.label}</p>
                <p style={{ fontSize: 24, fontWeight: 700, color: COLORS.text, lineHeight: 1.1 }}>₹{parseFloat(kpi.value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </Card>
          );
        })}
      </div>

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
                onKeyDown={(e) => {
                  const tabs = ["inventory", "ledger", "insights", "procurement"];
                  const currentIndex = tabs.indexOf(id);
                  if (e.key === "ArrowRight") {
                    const nextId = tabs[(currentIndex + 1) % tabs.length];
                    handleTabChange(nextId);
                    e.currentTarget.parentElement.querySelector(`[aria-selected="true"]`)?.focus();
                  } else if (e.key === "ArrowLeft") {
                    const prevId = tabs[(currentIndex - 1 + tabs.length) % tabs.length];
                    handleTabChange(prevId);
                    e.currentTarget.parentElement.querySelector(`[aria-selected="true"]`)?.focus();
                  }
                }}
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
              <Btn small variant="ghost" onClick={exportCSV} icon={<Download size={14} />} title="Export current view to CSV">
                Export CSV
              </Btn>
            </div>
          </div>

          {activeTab === "inventory" && (
            <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
              <div style={{ padding: "14px 20px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", background: COLORS.bg + "22", flexShrink: 0 }}>
                <SearchBar onSearch={(q) => load({ page: 1, q })} placeholder="Search items…" style={{ flex: 1, minWidth: 200 }} />
                <Btn variant="ghost" small onClick={() => setGroupByItem(!groupByItem)} icon={groupByItem ? <LayoutList size={12} /> : <BarChart2 size={12} />} style={{ fontSize: 12, padding: "6px 12px" }}>
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

              {loading ? (
                <p style={{ color: COLORS.muted, textAlign: "center", padding: 32 }}>Loading…</p>
              ) : error ? (
                <ErrorMsg error={error} />
              ) : items.length === 0 ? (
                <p style={{ color: COLORS.muted, textAlign: "center", padding: 40 }}>No stock recorded yet</p>
              ) : groupByItem ? (
                <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                  <div style={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th>Total Batches</th>
                          <th>Total Remaining</th>
                          <th>Avg Cost</th>
                          <th>Total Value</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupedItems.map((item, idx) => {
                          const isExpanded = !!expandedItems[item.name.toLowerCase()];
                          const healthy = item.batches.every(b => {
                            const pct = b.qty > 0 ? (b.remaining / b.qty) * 100 : 0;
                            return b.min_alert_qty !== null ? b.remaining > b.min_alert_qty : pct >= 25;
                          });
                          const totalVal = item.batches.reduce((sum, b) => sum + (b.remaining * (b.price || 0)), 0);
                          const avgCost = item.batchCount > 0 ? (item.totalCost / item.batchCount) : 0;

                          return (
                            <Fragment key={idx}>
                              <tr onClick={() => toggleExpandItem(item.name)} style={{ cursor: "pointer", transition: "background 0.2s" }}>
                                <td style={{ fontWeight: 600 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <span style={{ fontSize: 10, color: COLORS.muted }}>{isExpanded ? "▼" : "▶"}</span>
                                    {(() => {
                                      const avatar = getInitialsAvatar(item.name);
                                      return (
                                        <div style={{
                                          width: 32,
                                          height: 32,
                                          borderRadius: "50%",
                                          background: avatar.bg,
                                          color: avatar.fg,
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          fontSize: 12,
                                          fontWeight: 600,
                                          flexShrink: 0
                                        }}>
                                          {avatar.text}
                                        </div>
                                      );
                                    })()}
                                    <div>
                                      <span style={{ color: COLORS.accent, fontSize: 10, display: "block", fontWeight: 600, letterSpacing: "0.04em" }}>{item.item_code}</span>
                                      <span style={{ fontSize: "14px", color: COLORS.text }}>{item.name}</span>
                                    </div>
                                  </div>
                                </td>
                                <td>{item.batches.length} batch(es)</td>
                                <td style={{ fontWeight: 500, color: healthy ? COLORS.success : COLORS.danger }}>
                                  {item.remaining.toFixed(2)} {item.unit}
                                </td>
                                <td>{avgCost > 0 ? `₹${avgCost.toFixed(2)}` : "—"}</td>
                                <td style={{ fontWeight: 600, color: COLORS.teal }}>₹{totalVal.toFixed(2)}</td>
                                <td>
                                  <span className="status-badge" style={{ background: healthy ? "var(--color-accent-green-light)" : "var(--color-accent-red-light)", color: healthy ? "var(--color-accent-green)" : "var(--color-accent-red)" }}>
                                    {healthy ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                                    {healthy ? "Healthy" : "Low Stock"}
                                  </span>
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr>
                                  <td colSpan="6" style={{ padding: "10px 14px 16px 30px", background: COLORS.bg + "22" }}>
                                    <div style={{ border: `1px solid ${COLORS.border}55`, borderRadius: 8, padding: "14px 20px", background: COLORS.surface + "aa" }}>
                                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                                        <p style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 6 }}>
                                          <ClipboardList size={14} /> FIFO Batch Pipeline & Expiry Log
                                        </p>
                                        <span style={{ fontSize: 10, color: COLORS.muted, fontStyle: "italic" }}>Oldest batches are consumed first (FIFO order)</span>
                                      </div>

                                      <div style={{ position: "relative", borderLeft: `2px solid ${COLORS.border}`, paddingLeft: 20, marginLeft: 6, display: "flex", flexDirection: "column", gap: 12 }}>
                                        {item.batches.map((b) => {
                                          const bPct = b.qty > 0 ? (b.remaining / b.qty) * 100 : 0;
                                          const bColor = bPct > 50 ? COLORS.success : bPct > 20 ? COLORS.accent : COLORS.danger;
                                          
                                          // Determine dot color
                                          let dotColor = COLORS.success;
                                          if (b.remaining <= 0) dotColor = COLORS.muted;
                                          else if (bPct < 25) dotColor = COLORS.danger;
                                          else if (bPct < 50) dotColor = COLORS.accent;
                                          
                                          // Expiry check
                                          const todayVal = new Date(today());
                                          const isExpired = b.expiry_date && new Date(b.expiry_date) < todayVal;
                                          if (isExpired && b.remaining > 0) dotColor = COLORS.danger;

                                          return (
                                            <div key={b.id} style={{ position: "relative" }}>
                                              {/* Timeline Dot */}
                                              <div style={{
                                                position: "absolute",
                                                left: "-26px",
                                                top: "16px",
                                                width: "10px",
                                                height: "10px",
                                                borderRadius: "50%",
                                                background: dotColor,
                                                border: `2px solid ${COLORS.bg}`,
                                                boxShadow: `0 0 6px ${dotColor}`
                                              }} />

                                              {/* Batch Card */}
                                              <div style={{
                                                background: COLORS.bg + "88",
                                                border: `1px solid ${COLORS.border}44`,
                                                borderRadius: 6,
                                                padding: "12px 16px",
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                gap: 20
                                              }}>
                                                {/* Left details */}
                                                <div>
                                                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                    <span style={{ fontFamily: "monospace", fontSize: 11, color: COLORS.purple, background: COLORS.purple + "18", padding: "2px 6px", borderRadius: 4 }}>{b.item_code}</span>
                                                    <span style={{ fontSize: 11, color: COLORS.muted }}>Recd: {b.date}</span>
                                                    {b.expiry_date && (
                                                      <span className="status-badge" style={{ 
                                                        background: isExpired ? "var(--color-accent-red-light)" : "var(--color-accent-green-light)", 
                                                        color: isExpired ? "var(--color-accent-red)" : "var(--color-accent-green)",
                                                        fontSize: 10,
                                                        padding: "2px 6px"
                                                      }}>
                                                        {isExpired ? <AlertCircle size={10} /> : <CheckCircle size={10} />}
                                                        {isExpired ? "Expired" : `Exp: ${b.expiry_date}`}
                                                      </span>
                                                    )}
                                                  </div>
                                                  <p style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, marginTop: 6 }}>Supplier: {b.supplier || "—"}</p>
                                                </div>

                                                {/* Mid progress */}
                                                <div style={{ flex: 1, maxWidth: 220, display: "flex", flexDirection: "column", gap: 4 }}>
                                                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                                                    <span style={{ color: bColor, fontWeight: 600 }}>{parseFloat(b.remaining).toFixed(1)} / {b.qty} {b.unit}</span>
                                                    <span style={{ color: COLORS.muted }}>({bPct.toFixed(0)}%)</span>
                                                  </div>
                                                  <div style={{ height: 6, background: COLORS.border + "55", borderRadius: 3, overflow: "hidden" }}>
                                                    <div style={{ height: "100%", width: `${bPct}%`, background: bColor }} />
                                                  </div>
                                                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: COLORS.muted }}>
                                                    <span>Landed cost: {b.price ? `₹${parseFloat(b.price).toFixed(2)}` : "—"}</span>
                                                    {b.min_alert_qty !== null && <span>Min: {b.min_alert_qty}</span>}
                                                  </div>
                                                </div>

                                                {/* Right action controls */}
                                                <div style={{ display: "flex", gap: 6 }}>
                                                  <Btn variant="ghost" small onClick={() => setPrintModalItem(b)} title="Print Label" style={{ padding: "6px 8px", border: `1px solid ${COLORS.border}` }}>
                                                    <Printer size={14} />
                                                  </Btn>
                                                  <Btn variant="ghost" small onClick={() => {
                                                    setAdjustModalItem(b);
                                                    setAdjustQty(b.remaining.toString());
                                                    setAdjustMinAlert(b.min_alert_qty !== null ? b.min_alert_qty.toString() : "");
                                                    setAdjustReason("Audit Correction");
                                                    setAdjustNotes("");
                                                  }} title="Adjust Qty" style={{ padding: "6px 8px" }}>
                                                    <Edit3 size={14} />
                                                  </Btn>
                                                  <Btn variant="danger" small onClick={() => remove(b.id)}>✕</Btn>
                                                </div>

                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <Pagination page={page} total={total} limit={LIMIT} onPage={(p) => load({ page: p })} />
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                  <div style={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
                    <table>
                      <thead><tr><th>Item</th><th>Batch</th><th>Original Qty</th><th>Remaining</th><th>Unit Cost</th><th>Value (Rem / Orig)</th><th>Supplier</th><th>Expiry</th><th>Date</th><th></th></tr></thead>
                      <tbody>
                        {items.map((item) => {
                          const pct = item.qty > 0 ? (item.remaining / item.qty) * 100 : 0;
                          const isLow = item.min_alert_qty !== null ? item.remaining <= item.min_alert_qty : pct < 25;
                          const color = pct > 50 ? COLORS.success : pct > 20 ? COLORS.accent : COLORS.danger;
                          
                          const origCost = item.price ? item.qty * item.price : 0;
                          const remCost = item.price ? item.remaining * item.price : 0;

                          const getExpiryBadge = (expiryDate) => {
                            if (!expiryDate) return null;
                            const todayVal = new Date(today());
                            const expiryVal = new Date(expiryDate);
                            const diffTime = expiryVal - todayVal;
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            
                            if (diffDays < 0) {
                              return <span className="status-badge" style={{ background: "var(--color-accent-red-light)", color: "var(--color-accent-red)" }}><AlertCircle size={12} /> Expired ({expiryDate})</span>;
                            }
                            if (diffDays <= 3) {
                              return <span className="status-badge" style={{ background: "var(--color-accent-amber-light)", color: "var(--color-accent-amber)" }}><Clock size={12} /> Expiring soon ({diffDays}d)</span>;
                            }
                            return <span className="status-badge" style={{ background: "var(--color-accent-green-light)", color: "var(--color-accent-green)" }}><CheckCircle size={12} /> Fresh ({expiryDate})</span>;
                          };
                          
                          return (
                            <tr key={item.id} style={{ 
                              background: isLow ? "var(--color-accent-red-light)" : "transparent",
                              transition: "background 0.2s"
                            }}>
                              <td style={{ fontWeight: 500, borderLeft: isLow ? `3px solid ${COLORS.danger}` : "3px solid transparent", paddingLeft: 11 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                  {(() => {
                                    const avatar = getInitialsAvatar(item.name);
                                    return (
                                      <div style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: "50%",
                                        background: avatar.bg,
                                        color: avatar.fg,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: 12,
                                        fontWeight: 600,
                                        flexShrink: 0
                                      }}>
                                        {avatar.text}
                                      </div>
                                    );
                                  })()}
                                  <div>
                                    <span style={{ color: COLORS.accent, fontSize: 10, display: "block", fontWeight: 600, letterSpacing: "0.04em" }}>{item.item_code}</span>
                                    <span style={{ fontSize: "14px" }}>{item.name}</span>
                                    {isLow && (
                                      <span style={{ color: COLORS.danger, fontSize: 10, display: "flex", alignItems: "center", gap: 3, marginTop: 2, fontWeight: 600, letterSpacing: "0.04em" }}>
                                        <AlertCircle size={10} /> LOW STOCK
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td>
                                {item.batch_no
                                  ? <span style={{ fontFamily: "monospace", fontSize: 11, color: COLORS.purple, background: COLORS.purple + "18", padding: "2px 6px", borderRadius: 4 }}>{item.batch_no}</span>
                                  : <span style={{ color: COLORS.muted, fontSize: 11 }}>—</span>}
                              </td>
                              <td>{item.qty} {item.unit}</td>
                              <td>
                                {editingId === item.id ? (
                                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                    <label style={{ fontSize: 9, color: COLORS.muted }}>Remaining:</label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={editRemaining}
                                      onChange={(e) => setEditRemaining(e.target.value)}
                                      style={{ width: 80, padding: "4px 8px", fontSize: 12, background: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.text, borderRadius: 4 }}
                                    />
                                    <label style={{ fontSize: 9, color: COLORS.muted }}>Min Alert:</label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={editMinAlert}
                                      onChange={(e) => setEditMinAlert(e.target.value)}
                                      style={{ width: 80, padding: "4px 8px", fontSize: 12, background: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.text, borderRadius: 4 }}
                                    />
                                    <label style={{ fontSize: 9, color: COLORS.muted }}>Reason:</label>
                                    <select
                                      value={editReason}
                                      onChange={(e) => setEditReason(e.target.value)}
                                      style={{ width: 80, padding: "2px 4px", fontSize: 10, background: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.text, borderRadius: 4 }}
                                    >
                                      <option value="Audit Correction">Audit Correction</option>
                                      <option value="Spoiled / Spilled">Spoiled / Spilled</option>
                                      <option value="Pest Damage">Pest Damage</option>
                                      <option value="Kitchen Theft">Kitchen Theft</option>
                                    </select>
                                    <label style={{ fontSize: 9, color: COLORS.muted }}>Notes:</label>
                                    <input
                                      value={editNotes}
                                      onChange={(e) => setEditNotes(e.target.value)}
                                      placeholder="Notes"
                                      style={{ width: 80, padding: "4px 8px", fontSize: 10, background: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.text, borderRadius: 4 }}
                                    />
                                  </div>
                                ) : (
                                  <>
                                    <span style={{ color, fontWeight: 500 }}>{parseFloat(item.remaining).toFixed(2)}</span>
                                    <div style={{ height: 6, background: COLORS.border, borderRadius: 3, marginTop: 6, width: 80, overflow: "hidden" }}>
                                      <div style={{ height: "100%", width: `${pct}%`, background: color }} />
                                    </div>
                                  </>
                                )}
                              </td>
                              <td>{item.price ? `₹${parseFloat(item.price).toFixed(2)} / ${item.unit}` : "—"}</td>
                              <td>
                                {item.price ? (
                                  <>
                                    <span style={{ fontWeight: 500, color: color }}>₹{remCost.toFixed(2)}</span>
                                    <span style={{ display: "block", fontSize: 10, color: COLORS.muted, marginTop: 2 }}>of ₹{origCost.toFixed(2)}</span>
                                  </>
                                ) : "—"}
                              </td>
                              <td style={{ color: COLORS.muted }}>{item.supplier || "—"}</td>
                              <td>{getExpiryBadge(item.expiry_date) || "—"}</td>
                              <td style={{ color: COLORS.muted }}>{formatDate(item.date)}</td>
                              <td>
                                <div style={{ display: "flex", gap: 4 }}>
                                  <Btn variant="ghost" small onClick={() => setPrintModalItem(item)} title="Print Label" style={{ padding: "6px 8px", border: `1px solid ${COLORS.border}` }}>
                                    <Printer size={14} />
                                  </Btn>
                                  <Btn variant="ghost" small onClick={() => {
                                    setAdjustModalItem(item);
                                    setAdjustQty(item.remaining.toString());
                                    setAdjustMinAlert(item.min_alert_qty !== null ? item.min_alert_qty.toString() : "");
                                    setAdjustReason("Audit Correction");
                                    setAdjustNotes("");
                                  }} style={{ padding: "6px 8px" }}>
                                    <Edit3 size={14} />
                                  </Btn>
                                  <Btn variant="danger" small onClick={() => remove(item.id)}>✕</Btn>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <Pagination page={page} total={total} limit={LIMIT} onPage={(p) => load({ page: p })} />
                </div>
              )}
            </div>
          )}

          {activeTab === "ledger" && (
            ledgerLoading ? (
              <p style={{ color: COLORS.muted, textAlign: "center", padding: 32 }}>Loading ledger…</p>
            ) : ledgerData.length === 0 ? (
              <p style={{ color: COLORS.muted, textAlign: "center", padding: 40 }}>No stock movement recorded yet</p>
            ) : (
              <div style={{ overflowY: "auto", maxHeight: 420, padding: "14px 20px" }}>
                <table style={{ borderCollapse: "separate", borderSpacing: "0 6px" }}>
                  <thead>
                    <tr>
                      <th style={{ background: "transparent" }}>Date</th>
                      <th style={{ background: "transparent" }}>Item</th>
                      <th style={{ background: "transparent" }}>Action</th>
                      <th style={{ background: "transparent" }}>Qty</th>
                      <th style={{ background: "transparent" }}>Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledgerData.map((item, index) => {
                      const isPurchase = item.type === "Purchase";
                      const isIssue = item.type === "Issue";
                      const typeColor = isPurchase ? COLORS.teal : isIssue ? COLORS.accent : COLORS.purple;
                      const typeBg = isPurchase ? COLORS.teal + "15" : isIssue ? COLORS.accent + "15" : COLORS.purple + "15";
                      
                      return (
                        <tr key={index} style={{ background: COLORS.bg + "44" }}>
                          <td style={{ color: COLORS.muted, padding: "10px 14px" }}>{item.date}</td>
                          <td style={{ fontWeight: 600, padding: "10px 14px" }}>
                            <span style={{ color: COLORS.accent, fontSize: 10, display: "block", fontWeight: 600 }}>{item.item_code || "KPL-NEW"}</span>
                            {item.name}
                          </td>
                          <td style={{ padding: "10px 14px" }}>
                            <span className="badge" style={{ background: typeBg, color: typeColor, textTransform: "uppercase", fontSize: 10 }}>
                              {item.type}
                            </span>
                          </td>
                          <td style={{ color: isPurchase ? COLORS.success : isIssue ? COLORS.coral : COLORS.text, fontWeight: 500, padding: "10px 14px" }}>
                            {isPurchase ? "+" : isIssue ? "-" : ""}{item.qty}
                          </td>
                          <td style={{ color: COLORS.muted, fontSize: 12, padding: "10px 14px" }}>
                            {isPurchase ? `From ${item.detail || "Unknown"}` : isIssue ? `Issued to ${item.detail}` : `Detail: ${item.detail}`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}

          {activeTab === "insights" && (
            insightsLoading ? (
              <p style={{ color: COLORS.muted, textAlign: "center", padding: 32 }}>Loading insights…</p>
            ) : !insightsData ? (
              <p style={{ color: COLORS.muted, textAlign: "center", padding: 40 }}>No insights available</p>
            ) : (() => {
              const trendNames = Array.from(new Set((insightsData.priceTrends || []).map(p => p.name)));
              const currentChartItem = chartItem || trendNames[0] || "";
              const points = (insightsData.priceTrends || [])
                .filter(p => p.name === currentChartItem)
                .sort((a, b) => new Date(a.date) - new Date(b.date));

              return (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 20, padding: 20, overflowY: "auto", maxHeight: 420 }}>
                  <div>
                    <p style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Active Supplier Spend</p>
                    <table style={{ fontSize: 12, marginBottom: 20 }}>
                      <thead><tr><th>Supplier</th><th>Batches</th><th>Active Spend</th></tr></thead>
                      <tbody>
                        {(insightsData.supplierSpend || []).map((row, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 500 }}>{row.supplier}</td>
                            <td>{row.batch_count}</td>
                            <td style={{ color: COLORS.teal, fontWeight: 600 }}>₹{parseFloat(row.active_value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <p style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Historical Price Records</p>
                    <div style={{ overflowY: "auto", maxHeight: 180, border: `1px solid ${COLORS.border}55`, borderRadius: 6, padding: "8px 12px" }}>
                      {(insightsData.priceTrends || []).map((trend, idx) => (
                        <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${COLORS.border}22`, padding: "6px 0", fontSize: 12 }}>
                          <div>
                            <span style={{ fontWeight: 600 }}>{trend.name}</span>
                            <span style={{ fontSize: 10, color: COLORS.muted, marginLeft: 8 }}>{trend.date}</span>
                            <span style={{ display: "block", fontSize: 10, color: COLORS.muted }}>Supplier: {trend.supplier || "—"}</span>
                          </div>
                          <span style={{ color: COLORS.accent, fontWeight: 600 }}>₹{parseFloat(trend.price || 0).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <p style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>📈 Price Trend Visualizer</p>
                      <select
                        value={currentChartItem}
                        onChange={(e) => { setChartItem(e.target.value); }}
                        style={{ width: 150, padding: "4px 8px", fontSize: 11, height: "26px" }}
                      >
                        {trendNames.map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                    {currentChartItem ? (
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.accent, marginBottom: 8 }}>{currentChartItem} Price Index</p>
                        <PriceTrendChart points={points} />
                      </div>
                    ) : (
                      <p style={{ color: COLORS.muted, fontSize: 12, textAlign: "center", padding: 40 }}>No price records to chart</p>
                    )}
                  </div>
                </div>
              );
            })()
          )}

          {activeTab === "procurement" && (
            procurementLoading ? (
              <p style={{ color: COLORS.muted, textAlign: "center", padding: 32 }}>Loading procurement data…</p>
            ) : !procurementData ? (
              <p style={{ color: COLORS.muted, textAlign: "center", padding: 40 }}>No procurement data yet</p>
            ) : (
              <div style={{ padding: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, overflowY: "auto", maxHeight: 420 }}>

                {/* Recent POs */}
                <div>
                  <p style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Recent Purchase Orders</p>
                  {procurementData.recentPOs.length === 0 ? (
                    <p style={{ color: COLORS.muted, fontSize: 12 }}>No POs yet.</p>
                  ) : (
                    <table style={{ fontSize: 12 }}>
                      <thead><tr><th>PO #</th><th>Supplier</th><th>Date</th><th>Status</th><th>Total</th></tr></thead>
                      <tbody>
                        {procurementData.recentPOs.map((po) => {
                          const statusColor = { Draft: COLORS.muted, Sent: COLORS.accent, Received: COLORS.success, Cancelled: COLORS.coral }[po.status] || COLORS.muted;
                          return (
                            <tr key={po.id}>
                              <td style={{ fontFamily: "monospace", color: COLORS.teal, fontSize: 11 }}>{po.po_number}</td>
                              <td style={{ fontWeight: 500 }}>{po.supplier_name}</td>
                              <td style={{ color: COLORS.muted }}>{po.date}</td>
                              <td><span style={{ background: statusColor + "22", color: statusColor, padding: "1px 7px", borderRadius: 20, fontSize: 10, fontWeight: 600 }}>{po.status}</span></td>
                              <td style={{ color: COLORS.accent, fontWeight: 600 }}>₹{parseFloat(po.total_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 0 })}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Recent GRNs */}
                <div>
                  <p style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Recent Goods Receipts</p>
                  {procurementData.recentGRNs.length === 0 ? (
                    <p style={{ color: COLORS.muted, fontSize: 12 }}>No GRNs yet.</p>
                  ) : (
                    <table style={{ fontSize: 12 }}>
                      <thead><tr><th>GRN #</th><th>Supplier</th><th>Date</th><th>Invoice</th><th>Total</th></tr></thead>
                      <tbody>
                        {procurementData.recentGRNs.map((g) => (
                          <tr key={g.id}>
                            <td style={{ fontFamily: "monospace", color: COLORS.teal, fontSize: 11 }}>{g.grn_number}</td>
                            <td style={{ fontWeight: 500 }}>{g.supplier_name}</td>
                            <td style={{ color: COLORS.muted }}>{g.date}</td>
                            <td style={{ color: COLORS.muted, fontSize: 11 }}>{g.invoice_no || "—"}</td>
                            <td style={{ color: COLORS.accent, fontWeight: 600 }}>₹{parseFloat(g.total_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 0 })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Supplier master summary */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <p style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Registered Suppliers</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    {procurementData.suppliers.length === 0 ? (
                      <p style={{ color: COLORS.muted, fontSize: 12 }}>No suppliers registered. Go to Suppliers to add vendors.</p>
                    ) : (
                      procurementData.suppliers.map((s) => (
                        <div key={s.id} style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "10px 14px", minWidth: 160 }}>
                          <p style={{ fontWeight: 600, fontSize: 13, color: COLORS.text }}>{s.name}</p>
                          {s.phone && <p style={{ fontSize: 11, color: COLORS.muted, marginTop: 3 }}>📞 {s.phone}</p>}
                          {s.gstin && <p style={{ fontSize: 10, color: COLORS.teal, marginTop: 3, fontFamily: "monospace" }}>{s.gstin}</p>}
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            )
          )}

         </Card>

      {/* Print Preview Modal */}
      {printModalItem && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.65)", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 1000,
          backdropFilter: "blur(4px)"
        }}>
          <div style={{
            background: COLORS.surface, border: `1px solid ${COLORS.border}`,
            borderRadius: 12, padding: 24, width: 450, maxWidth: "90%",
            boxShadow: `0 8px 32px rgba(15, 23, 42, 0.15)`
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
              <Printer size={18} /> Label Print Preview
            </h3>
            <p style={{ fontSize: 13, color: COLORS.muted, marginBottom: 20 }}>Verify layout specs for the 2.0" x 1.2" thermal printer label before dispatching print command.</p>
            
            {/* Label design container */}
            <div style={{
              background: "#fff", color: "#000", padding: "16px 20px", borderRadius: 6,
              fontFamily: "'Courier New', monospace", fontSize: 12, minHeight: 120,
              boxShadow: "inset 0 2px 8px rgba(0,0,0,0.1)", display: "flex",
              justifyContent: "space-between", alignItems: "center", marginBottom: 20,
              border: "4px solid #fff", borderStyle: "double"
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 3, maxWidth: "60%", lineHeight: 1.1 }}>
                <span style={{ fontSize: 13, fontWeight: "bold", letterSpacing: "0.05em" }}>{printModalItem.item_code}</span>
                <span style={{ fontSize: 11, fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{printModalItem.name}</span>
                <span style={{ fontSize: 9 }}>Qty: {printModalItem.remaining} {printModalItem.unit}</span>
                <span style={{ fontSize: 8 }}>Recd: {printModalItem.date}</span>
                {printConfig.showExpiry && printModalItem.expiry_date && (
                  <span style={{ fontSize: 8 }}>Exp: {printModalItem.expiry_date}</span>
                )}
                {printConfig.showPrice && printModalItem.price && (
                  <span style={{ fontSize: 9, fontWeight: "bold", marginTop: 4 }}>Price: ₹{parseFloat(printModalItem.price).toFixed(2)}</span>
                )}
              </div>
              
              {/* Graphic element */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                {printConfig.labelFormat === "qr" ? (
                  <img 
                    src={printModalItem._qrDataUrl || ""}
                    ref={(el) => { if (el && !printModalItem._qrDataUrl) QRCode.toDataURL(printModalItem.item_code, { width: 65, margin: 1 }).then(url => setPrintModalItem(p => ({ ...p, _qrDataUrl: url }))); }}
                    style={{ width: 65, height: 65 }}
                    alt="QR Code"
                  />
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    {/* Simulated barcode bars */}
                    <div style={{ display: "flex", height: 45, width: 75, alignItems: "stretch", background: "#000", padding: "0 2px" }}>
                      {[2, 1, 3, 1, 2, 4, 1, 2, 3, 1, 2, 1, 3, 1, 2].map((w, i) => (
                        <div key={i} style={{ flexGrow: w, background: i % 2 === 0 ? "#000" : "#fff" }} />
                      ))}
                    </div>
                    <span style={{ fontSize: 8, marginTop: 2 }}>* {printModalItem.item_code} *</span>
                  </div>
                )}
              </div>
            </div>

            {/* Config Checkboxes */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer", color: COLORS.text }}>
                <input 
                  type="checkbox" 
                  checked={printConfig.showPrice} 
                  onChange={(e) => setPrintConfig(prev => ({ ...prev, showPrice: e.target.checked }))}
                  style={{ width: "auto", marginRight: 8 }}
                />
                Include Unit Cost / Price on label
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer", color: COLORS.text }}>
                <input 
                  type="checkbox" 
                  checked={printConfig.showExpiry} 
                  onChange={(e) => setPrintConfig(prev => ({ ...prev, showExpiry: e.target.checked }))}
                  style={{ width: "auto", marginRight: 8 }}
                />
                Include Expiry Date on label
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: 13, color: COLORS.muted }}>Format:</span>
                <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, cursor: "pointer", color: COLORS.text }}>
                  <input 
                    type="radio" 
                    name="lblFormat" 
                    checked={printConfig.labelFormat === "qr"} 
                    onChange={() => setPrintConfig(prev => ({ ...prev, labelFormat: "qr" }))}
                    style={{ width: "auto", marginRight: 4 }}
                  />
                  QR Code
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, cursor: "pointer", color: COLORS.text }}>
                  <input 
                    type="radio" 
                    name="lblFormat" 
                    checked={printConfig.labelFormat === "barcode"} 
                    onChange={() => setPrintConfig(prev => ({ ...prev, labelFormat: "barcode" }))}
                    style={{ width: "auto", marginRight: 4 }}
                  />
                  Classic Barcode
                </label>
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: 10 }}>
              <Btn 
              onClick={async () => {
                  const printWindow = window.open("", "_blank", "width=400,height=300");
                  let content;
                  if (printConfig.labelFormat === "qr") {
                    const url = await QRCode.toDataURL(printModalItem.item_code, { width: 100, margin: 1 });
                    content = `<img class="qr" src="${url}" />`;
                  } else {
                    content = `
                      <div class="barcode-container">
                        <div class="barcode">
                          ${[2, 1, 3, 1, 2, 4, 1, 2, 3, 1, 2, 1, 3, 1, 2].map((w, i) => `<div class="bar" style="flex-grow: ${w}; background: ${i % 2 === 0 ? "#000" : "#fff"}"></div>`).join("")}
                        </div>
                        <div class="barcode-text">* ${printModalItem.item_code} *</div>
                      </div>
                    `;
                  }

                  printWindow.document.write(`
                    <html>
                      <head>
                        <title>Print Label - ${printModalItem.item_code}</title>
                        <style>
                          @page { size: 2in 1.2in; margin: 0; }
                          body {
                            font-family: 'Courier New', Courier, monospace;
                            width: 1.9in;
                            height: 1.1in;
                            padding: 0.05in;
                            margin: 0;
                            box-sizing: border-box;
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                            background: #fff;
                            color: #000;
                          }
                          .info {
                            display: flex;
                            flex-direction: column;
                            justify-content: center;
                            font-size: 8px;
                            line-height: 1.1;
                            max-width: 1.1in;
                          }
                          .code {
                            font-size: 10px;
                            font-weight: bold;
                            margin-bottom: 2px;
                          }
                          .name {
                            font-size: 9px;
                            font-weight: bold;
                            white-space: nowrap;
                            overflow: hidden;
                            text-overflow: ellipsis;
                          }
                          .date {
                            color: #555;
                            font-size: 7px;
                            margin-top: 1px;
                          }
                          .qr {
                            width: 45px;
                            height: 45px;
                          }
                          .barcode-container {
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                          }
                          .barcode {
                            display: flex;
                            height: 35px;
                            width: 60px;
                          }
                          .bar {
                            height: 100%;
                          }
                          .barcode-text {
                            font-size: 6px;
                            margin-top: 2px;
                          }
                        </style>
                      </head>
                      <body>
                        <div class="info">
                          <div class="code">${printModalItem.item_code}</div>
                          <div class="name">${printModalItem.name}</div>
                          <div class="qty">Qty: ${printModalItem.remaining} ${printModalItem.unit}</div>
                          <div class="date">Recd: ${printModalItem.date}</div>
                          ${printConfig.showExpiry && printModalItem.expiry_date ? `<div class="date">Exp: ${printModalItem.expiry_date}</div>` : ""}
                          ${printConfig.showPrice && printModalItem.price ? `<div class="date" style="font-weight:bold;">Price: ₹${parseFloat(printModalItem.price).toFixed(2)}</div>` : ""}
                        </div>
                        ${content}
                        <script>window.onload = function() { window.print(); window.close(); }</script>
                      </body>
                    </html>
                  `);
                  printWindow.document.close();
                  setPrintModalItem(null);
                }} 
                icon={<Printer size={16} />}
                style={{ flex: 1 }}
              >
                Confirm Print
              </Btn>
              <Btn variant="ghost" onClick={() => setPrintModalItem(null)} style={{ border: `1px solid ${COLORS.border}`, flex: 1 }}>
                Cancel
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* Quick Adjustment Modal */}
      {adjustModalItem && (() => {
        const currentQty = parseFloat(adjustModalItem.remaining || 0);
        const targetQty = parseFloat(adjustQty) || 0;
        const delta = targetQty - currentQty;
        const isSurplus = delta > 0;
        
        const handleSaveAdjustment = async () => {
          try {
            await api.stock.update(adjustModalItem.id, {
              remaining: targetQty,
              min_alert_qty: adjustMinAlert.trim() === "" ? null : parseFloat(adjustMinAlert),
              reason: adjustReason,
              notes: adjustNotes.trim() === "" ? null : adjustNotes
            });
            setAdjustModalItem(null);
            load();
            refreshActiveTab();
            setMsg("Batch adjustments successfully applied ✓");
            setTimeout(() => setMsg(""), 3000);
          } catch (e) {
            setMsg("Error adjusting stock: " + e.message);
            setTimeout(() => setMsg(""), 4000);
          }
        };

        return (
          <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(15, 23, 42, 0.65)", display: "flex",
            alignItems: "center", justifyContent: "center", zIndex: 1000,
            backdropFilter: "blur(4px)"
          }}>
            <div style={{
              background: COLORS.surface, border: `1px solid ${COLORS.border}`,
              borderRadius: 12, padding: 24, width: 450, maxWidth: "90%",
              boxShadow: `0 8px 32px rgba(15, 23, 42, 0.15)`
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                <Edit3 size={18} /> Quick Stock Adjustment
              </h3>
              <p style={{ fontSize: 13, color: COLORS.muted, marginBottom: 16 }}>
                Adjusting batch code <span style={{ color: COLORS.purple, fontWeight: "bold" }}>{adjustModalItem.item_code}</span> of <span style={{ color: COLORS.text, fontWeight: "bold" }}>{adjustModalItem.name}</span>.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 11, color: COLORS.muted, display: "block", marginBottom: 4 }}>System Remaining</label>
                  <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, padding: "8px 12px", borderRadius: 6, fontSize: 13, fontWeight: "bold", color: COLORS.text }}>
                    {currentQty.toFixed(2)} {adjustModalItem.unit}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: COLORS.muted, display: "block", marginBottom: 4 }}>Original Quantity</label>
                  <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, padding: "8px 12px", borderRadius: 6, fontSize: 13, color: COLORS.muted }}>
                    {parseFloat(adjustModalItem.qty).toFixed(2)} {adjustModalItem.unit}
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 10, marginBottom: 16 }}>
                <Input 
                  label={`Adjusted Remaining (${adjustModalItem.unit})`}
                  type="number"
                  step="0.01"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  placeholder="0.00"
                />
                <Input 
                  label="Min Alert Level"
                  type="number"
                  step="0.01"
                  value={adjustMinAlert}
                  onChange={(e) => setAdjustMinAlert(e.target.value)}
                  placeholder="e.g. 5.0"
                />
              </div>

              {/* Real-time Delta visual feedback */}
              {delta !== 0 && (
                <div style={{
                  background: isSurplus ? COLORS.teal + "11" : COLORS.coral + "11",
                  border: `1px dashed ${isSurplus ? COLORS.teal : COLORS.coral}44`,
                  borderRadius: 6, padding: "8px 12px", fontSize: 12, marginBottom: 16,
                  display: "flex", justifyContent: "space-between", alignItems: "center"
                }}>
                  <span style={{ color: COLORS.muted }}>Reconciliation Delta:</span>
                  <span style={{ fontWeight: "bold", color: isSurplus ? COLORS.success : COLORS.coral, fontSize: 13 }}>
                    {isSurplus ? `+${delta.toFixed(2)}` : delta.toFixed(2)} {adjustModalItem.unit} ({isSurplus ? "Surplus / Ingress" : "Shrinkage / Waste"})
                  </span>
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, color: COLORS.muted, display: "block", marginBottom: 4 }}>Adjustment Reason</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  style={{
                    width: "100%", padding: "8px 12px", fontSize: 12,
                    background: COLORS.bg, border: `1px solid ${COLORS.border}`,
                    color: COLORS.text, borderRadius: 6
                  }}
                >
                  <option value="Audit Correction">Audit Correction</option>
                  <option value="Spoiled / Spilled">Spoiled / Spilled</option>
                  <option value="Pest Damage">Pest Damage</option>
                  <option value="Kitchen Theft">Kitchen Theft</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 11, color: COLORS.muted, display: "block", marginBottom: 4 }}>Audit Log Notes</label>
                <textarea
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="Provide supporting context for this adjustment..."
                  rows={3}
                  style={{
                    width: "100%", padding: "8px 12px", fontSize: 12,
                    background: COLORS.bg, border: `1px solid ${COLORS.border}`,
                    color: COLORS.text, borderRadius: 6, resize: "vertical"
                  }}
                />
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 10 }}>
                <Btn 
                  onClick={handleSaveAdjustment} 
                  disabled={adjustQty.trim() === "" || isNaN(targetQty) || targetQty < 0}
                  icon={<CheckCircle size={16} />}
                  style={{ flex: 1 }}
                >
                  Apply & Log Adjustment
                </Btn>
                <Btn variant="ghost" onClick={() => setAdjustModalItem(null)} style={{ border: `1px solid ${COLORS.border}`, flex: 1 }}>
                  Cancel
                </Btn>
              </div>

            </div>
          </div>
        );
      })()}
    {/* Right Panel containing Add Form and Low Stock Alerts */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Low Stock Alerts & Expiry Warnings Card */}
          <Card style={{ padding: 16 }}>
            {/* Header / Global Action */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, borderBottom: `1px solid ${COLORS.border}55`, paddingBottom: 10 }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                  <AlertOctagon size={16} style={{ color: COLORS.danger }} /> Store Alerts
                </p>
                <p style={{ fontSize: 10, color: COLORS.muted, marginTop: 2 }}>Auto-evaluated warnings</p>
              </div>
              {lowStockItems.length > 0 && (
                <div style={{ display: "flex", gap: 4 }}>
                  <Btn variant="ghost" small onClick={copyPOToClipboard} icon={<ClipboardList size={12} />} style={{ fontSize: 11, padding: "4px 8px", border: `1px solid ${COLORS.border}` }} title="Copy Purchase Order to Clipboard">
                    Copy PO
                  </Btn>
                  <Btn variant="ghost" small onClick={generateWhatsAppPO} icon={<Send size={12} />} style={{ fontSize: 11, padding: "4px 8px", background: "#25D36622", border: "1px solid #25D36644", color: "#25D366" }} title="Send Purchase Order to WhatsApp">
                    Send PO
                  </Btn>
                </div>
              )}
            </div>

            {/* Section 1: Low Stock alerts */}
            <p style={{ fontSize: 12, color: COLORS.muted, fontWeight: 600, textTransform: "uppercase", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
              <TrendingDown size={14} /> Low Stock Levels ({lowStockItems.length})
            </p>
            {lowStockItems.length === 0 ? (
              <div style={{ textAlign: "center", padding: "14px 0", background: COLORS.bg + "22", borderRadius: 6, marginBottom: 16 }}>
                <p style={{ fontSize: 11, color: COLORS.success, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <CheckCircle size={14} /> All levels healthy
                </p>
              </div>
            ) : (
              <div style={{ maxHeight: 180, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
                {lowStockItems.map((item) => {
                  const pct = item.qty > 0 ? (item.remaining / item.qty) * 100 : 0;
                  return (
                    <div key={item.id} style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 14px",
                      background: COLORS.bg + "55",
                      border: `1px solid ${COLORS.border}44`,
                      borderLeft: `3px solid ${COLORS.danger}`,
                      borderRadius: 6
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, overflow: "hidden", flex: 1 }}>
                        {(() => {
                          const avatar = getInitialsAvatar(item.name);
                          return (
                            <div style={{
                              width: 28,
                              height: 28,
                              borderRadius: "50%",
                              background: avatar.bg,
                              color: avatar.fg,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 10,
                              fontWeight: 600,
                              flexShrink: 0
                            }}>
                              {avatar.text}
                            </div>
                          );
                        })()}
                        <div style={{ overflow: "hidden", lineHeight: 1.2 }}>
                          <span style={{ color: COLORS.accent, fontSize: 9, display: "block", fontWeight: 600 }}>{item.item_code}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, display: "block", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", color: COLORS.text }}>{item.name}</span>
                          <span style={{ fontSize: 11, color: COLORS.danger, display: "block", marginTop: 2, fontWeight: 500 }}>
                            {parseFloat(item.remaining).toFixed(1)} / {item.qty} {item.unit} ({pct.toFixed(0)}%)
                          </span>
                          <div style={{ height: 6, background: COLORS.border + "55", borderRadius: 3, overflow: "hidden", marginTop: 4, width: "100%", maxWidth: 150 }}>
                            <div style={{ height: "100%", width: `${Math.min(100, Math.max(0, pct))}%`, background: COLORS.danger }} />
                          </div>
                        </div>
                      </div>
                      <Btn variant="ghost" small onClick={() => handleReorderClick(item)} icon={<ShoppingCart size={12} />} title="Reorder" style={{ padding: "6px 8px" }} />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Section 2: Expiry warnings */}
            <p style={{ fontSize: 12, color: COLORS.muted, fontWeight: 600, textTransform: "uppercase", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
              <Clock size={14} /> Spoilage & Expiry Alerts ({expiringSoonItems.length})
            </p>
            {expiringSoonItems.length === 0 ? (
              <div style={{ textAlign: "center", padding: "14px 0", background: COLORS.bg + "22", borderRadius: 6 }}>
                <p style={{ fontSize: 11, color: COLORS.success, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <CheckCircle size={14} /> No near expiries
                </p>
              </div>
            ) : (
              <div style={{ maxHeight: 180, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                {expiringSoonItems.map((item) => {
                  const todayVal = new Date(today());
                  const expiryVal = new Date(item.expiry_date);
                  const diffTime = expiryVal - todayVal;
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  return (
                    <div key={item.id} style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 14px",
                      background: COLORS.bg + "55",
                      border: `1px solid ${COLORS.border}44`,
                      borderLeft: `3px solid ${COLORS.warning}`,
                      borderRadius: 6
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, overflow: "hidden", flex: 1 }}>
                        {(() => {
                          const avatar = getInitialsAvatar(item.name);
                          return (
                            <div style={{
                              width: 28,
                              height: 28,
                              borderRadius: "50%",
                              background: avatar.bg,
                              color: avatar.fg,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 10,
                              fontWeight: 600,
                              flexShrink: 0
                            }}>
                              {avatar.text}
                            </div>
                          );
                        })()}
                        <div style={{ overflow: "hidden", lineHeight: 1.2 }}>
                          <span style={{ color: COLORS.accent, fontSize: 9, display: "block", fontWeight: 600 }}>{item.item_code}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, display: "block", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", color: COLORS.text }}>{item.name}</span>
                          <span style={{ fontSize: 11, color: COLORS.danger, display: "block", marginTop: 2, fontWeight: 500 }}>
                            {item.remaining} {item.unit} remaining
                          </span>
                          <div style={{ height: 6, background: COLORS.border + "55", borderRadius: 3, overflow: "hidden", marginTop: 4, width: "100%", maxWidth: 150 }}>
                            <div style={{ height: "100%", width: diffDays <= 0 ? "100%" : `${Math.max(10, 100 - (diffDays * 10))}%`, background: COLORS.danger }} />
                          </div>
                        </div>
                      </div>
                      <span className="status-badge" style={{ background: "var(--color-accent-red-light)", color: "var(--color-accent-red)", fontSize: 10, padding: "2px 6px" }}>
                        {diffDays <= 0 ? "Expired" : `${diffDays} days`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        
          {/* Add form */}
          <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
              <PlusCircle size={16} style={{ color: COLORS.brand }} /> New Stock Entry
            </p>
            <div style={{ display: "flex", gap: 6 }}>
              <Btn variant="ghost" small onClick={() => setShowQuickImport(!showQuickImport)} icon={<ClipboardList size={12} />} style={{ fontSize: 11, padding: "4px 8px" }}>
                {showQuickImport ? "Standard" : "Quick Import"}
              </Btn>
              <Btn variant="ghost" small onClick={() => fileInputRef.current.click()} icon={<Eye size={12} />} style={{ fontSize: 11, padding: "4px 8px" }} disabled={scanningBill}>
                {scanningBill ? "Scanning…" : "Scan Slip"}
              </Btn>
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleScanBill} />

          {scannedPreview ? (
            <div>
              <p style={{ fontSize: 13, color: COLORS.accent, fontWeight: 600, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <ClipboardList size={14} /> Scanned Bill Review
              </p>
              <Input label="Supplier / Vendor" value={scannedPreview.supplier} onChange={(e) => setScannedPreview(prev => ({ ...prev, supplier: e.target.value }))} />
              <Input label="Date received" type="date" value={scannedPreview.date} onChange={(e) => setScannedPreview(prev => ({ ...prev, date: e.target.value }))} />
              
              <p style={{ fontSize: 12, color: COLORS.muted, fontWeight: 600, marginBottom: 8, marginTop: 12 }}>Items Scanned</p>
              <div style={{ maxHeight: 200, overflowY: "auto", marginBottom: 12 }}>
                {scannedPreview.items.map((it, idx) => (
                  <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 50px 60px 24px", gap: 6, marginBottom: 8, alignItems: "center" }}>
                    <input value={it.name} onChange={(e) => updateScannedItem(idx, "name", e.target.value)} style={{ padding: "4px 6px", fontSize: 12, background: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.text, borderRadius: 4 }} placeholder="Item" />
                    <input type="number" value={it.qty} onChange={(e) => updateScannedItem(idx, "qty", e.target.value)} style={{ padding: "4px 6px", fontSize: 12, background: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.text, borderRadius: 4 }} placeholder="Qty" />
                    <input type="number" step="0.01" value={it.price} onChange={(e) => updateScannedItem(idx, "price", e.target.value)} style={{ padding: "4px 6px", fontSize: 12, background: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.text, borderRadius: 4 }} placeholder="Price" />
                    <button onClick={() => removeScannedItem(idx)} style={{ background: "transparent", border: "none", color: COLORS.danger, cursor: "pointer", fontSize: 14 }}>✕</button>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <Btn onClick={submitScannedItems} icon={<CheckCircle size={16} />} style={{ flex: 1 }}>Confirm & Log All</Btn>
                <Btn variant="danger" onClick={() => setScannedPreview(null)}>Cancel</Btn>
              </div>
            </div>
          ) : showQuickImport ? (
            <div>
              <p style={{ fontSize: 13, color: COLORS.accent, fontWeight: 600, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                <ClipboardList size={14} /> Quick Dictate / Text Import
              </p>
              <p style={{ fontSize: 11, color: COLORS.muted, marginBottom: 12 }}>Type, paste WhatsApp text, or use voice dictation in Telugu and other local languages.</p>
              
              {(() => {
                const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                if (!isSecure) {
                  return (
                    <div style={{
                      background: COLORS.coral + "15",
                      border: `1px solid ${COLORS.coral}33`,
                      borderRadius: 6,
                      padding: "8px 10px",
                      fontSize: 11,
                      color: COLORS.coral,
                      marginBottom: 12,
                      lineHeight: 1.3
                    }}>
                      ⚠️ <strong>Security Restriction:</strong> Web Speech recognition requires a secure context. Because this app is accessed over HTTP on a custom IP, your browser has blocked the microphone. Please open <strong>http://localhost:5173</strong> (or setup HTTPS) to enable dictation.
                    </div>
                  );
                }
                return null;
              })()}
              
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, color: COLORS.muted, display: "block", marginBottom: 4 }}>Dictation Language</label>
                  <select
                    value={listenLang}
                    onChange={(e) => setListenLang(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      fontSize: 12,
                      background: COLORS.bg,
                      border: `1px solid ${COLORS.border}`,
                      color: COLORS.text,
                      borderRadius: 4
                    }}
                  >
                    <option value="en-IN">🇺🇸 English (en-IN)</option>
                    <option value="te-IN">🇮🇳 Telugu / తెలుగు (te-IN)</option>
                    <option value="hi-IN">🇮🇳 Hindi / हिन्दी (hi-IN)</option>
                    <option value="ta-IN">🇮🇳 Tamil / தமிழ் (ta-IN)</option>
                    <option value="kn-IN">🇮🇳 Kannada / ಕನ್ನಡ (kn-IN)</option>
                    <option value="ml-IN">🇮🇳 Malayalam / മലയാളം (ml-IN)</option>
                    <option value="mr-IN">🇮🇳 Marathi / मराठी (mr-IN)</option>
                    <option value="gu-IN">🇮🇳 Gujarati / ગુજરાતી (gu-IN)</option>
                    <option value="bn-IN">🇮🇳 Bengali / বাংলা (bn-IN)</option>
                    <option value="pa-IN">🇮🇳 Punjabi / ਪੰਜਾਬੀ (pa-IN)</option>
                  </select>
                </div>
                <div style={{ display: "flex", alignItems: "flex-end" }}>
                  <button
                    onClick={startListening}
                    className={listening ? "pulse" : ""}
                    style={{
                      padding: "7px 12px",
                      fontSize: 12,
                      background: listening ? COLORS.coral : COLORS.bg,
                      border: `1px solid ${listening ? COLORS.coral : COLORS.border}`,
                      color: listening ? "#fff" : COLORS.text,
                      borderRadius: 4,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontWeight: 600,
                      transition: "all 0.2s",
                      height: "33px"
                    }}
                  >
                    {listening ? "🛑 Stop" : "🎤 Speak"}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, color: COLORS.muted, display: "block", marginBottom: 4 }}>Pasted Text or Transcribed Voice</label>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="e.g. Aloo 10 kilo at 20&#10;Tamatalu 5 kg rate 40&#10;KPL-101 20 kg"
                  rows={6}
                  style={{
                    width: "100%",
                    padding: "8px",
                    fontSize: 12,
                    background: COLORS.bg,
                    border: `1px solid ${COLORS.border}`,
                    color: COLORS.text,
                    borderRadius: 4,
                    fontFamily: "inherit",
                    resize: "vertical"
                  }}
                />
                {interimText && (
                  <div style={{ 
                    fontSize: 12, 
                    color: COLORS.accent, 
                    marginTop: 6, 
                    display: "flex", 
                    alignItems: "center", 
                    gap: 6,
                    padding: "6px 10px",
                    background: COLORS.accent + "11",
                    border: `1px dashed ${COLORS.accent}44`,
                    borderRadius: 4
                  }}>
                    <span className="pulse" style={{ fontSize: 10 }}>🎙️</span>
                    <span style={{ fontStyle: "italic" }}>Hearing: "{interimText}"...</span>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <Btn onClick={parseImportText} style={{ flex: 1 }} disabled={!importText.trim()}>Parse & Review</Btn>
                <Btn variant="ghost" onClick={() => { setShowQuickImport(false); setImportText(""); }} style={{ border: `1px solid ${COLORS.border}`, flex: 1 }}>Cancel</Btn>
              </div>
            </div>
          ) : (
            <div>
              <Input label="Item name" value={form.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g. Rice, Tomatoes…" list="stock-names" />
              <datalist id="stock-names">
                {stockNames.map((n) => <option key={n} value={n} />)}
              </datalist>

              {form.name && (() => {
                const comparison = getSupplierPriceComparison(form.name);
                if (!comparison || comparison.length === 0) return null;
                return (
                  <div style={{
                    background: COLORS.teal + "11",
                    border: `1px dashed ${COLORS.teal}44`,
                    borderRadius: 6,
                    padding: "8px 10px",
                    fontSize: 11,
                    marginBottom: 12,
                    lineHeight: 1.3
                  }}>
                    <p style={{ color: COLORS.teal, fontWeight: 600, marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>💡 Best Supplier Price Comparison</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      {comparison.map((item, idx) => (
                        <div key={idx} style={{ display: "flex", justifyContent: "space-between", color: COLORS.text }}>
                          <span style={{ color: COLORS.muted }}>{item.supplier || "Unknown Supplier"}:</span>
                          <span style={{ fontWeight: 600, color: idx === 0 ? COLORS.success : COLORS.text }}>
                            ₹{item.price.toFixed(2)} {idx === 0 ? "🏆 (Cheapest)" : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Input label="Quantity" type="number" value={form.qty} onChange={(e) => setForm((f) => ({ ...f, qty: e.target.value }))} placeholder="0" />
                <Select label="Unit" value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}>
                  {UNITS.map((u) => <option key={u}>{u}</option>)}
                </Select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Input label={`Price (per ${form.unit})`} type="number" step="0.01" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="0.00" />
                <Input label="Supplier" value={form.supplier} onChange={(e) => setForm((f) => ({ ...f, supplier: e.target.value }))} placeholder="e.g. National Traders" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Input label="GST / Tax (%)" type="number" value={form.gst} onChange={(e) => setForm((f) => ({ ...f, gst: e.target.value }))} placeholder="e.g. 5, 12" />
                <Input label="Freight / Transport (₹)" type="number" value={form.freight} onChange={(e) => setForm((f) => ({ ...f, freight: e.target.value }))} placeholder="e.g. 150" />
              </div>
              {form.qty && form.price && (() => {
                const quantityVal = parseFloat(form.qty) || 0;
                const basePriceVal = parseFloat(form.price) || 0;
                const gstVal = parseFloat(form.gst) || 0;
                const freightVal = parseFloat(form.freight) || 0;
                const landedPrice = quantityVal > 0 
                  ? (basePriceVal * (1 + gstVal / 100)) + (freightVal / quantityVal)
                  : basePriceVal;
                return (
                  <div style={{ 
                    fontSize: 13, 
                    background: "var(--color-accent-green-light)", 
                    padding: "12px 14px", 
                    borderRadius: 8, 
                    marginBottom: 12, 
                    border: `1px solid var(--color-accent-green)`, 
                    color: COLORS.text,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: COLORS.muted }}>Base Total Value:</span>
                      <span style={{ fontWeight: 600 }}>₹{(quantityVal * basePriceVal).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid rgba(16, 185, 129, 0.2)`, paddingTop: 6, marginTop: 2 }}>
                      <span style={{ color: COLORS.muted, fontWeight: 500 }}>Landed Cost (per unit):</span>
                      <span style={{ color: "var(--color-accent-green)", fontWeight: 700 }}>
                        ₹{landedPrice.toFixed(2)} / {form.unit}
                      </span>
                    </div>
                  </div>
                );
              })()}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Input label="Expiry Date" type="date" value={form.expiry_date} onChange={(e) => setForm((f) => ({ ...f, expiry_date: e.target.value }))} />
                <Input label="Min Alert Level" type="number" step="0.01" value={form.min_alert_qty} onChange={(e) => setForm((f) => ({ ...f, min_alert_qty: e.target.value }))} placeholder="e.g. 5.0" />
              </div>
              <Input label="Date received" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
              <Btn onClick={add} icon={<PlusCircle size={16} />} style={{ width: "100%", marginTop: 8, height: 40 }}>Add to Store</Btn>
            </div>
          )}
          {msg && <p style={{ color: COLORS.success, fontSize: 12, marginTop: 8, textAlign: "center" }}>{msg}</p>}
          </Card>

          </div>

        </div>
      </div>
  );
}
