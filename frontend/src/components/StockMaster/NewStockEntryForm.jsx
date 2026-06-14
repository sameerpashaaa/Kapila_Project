import { useState, useEffect, useRef } from "react";
import Input from "../Input";
import Select from "../Select";
import Btn from "../Btn";
import { COLORS, UNITS } from "../../styles/colors";
import { useAppContext } from "../../context/AppContext";
import { useLocalSpeech } from "../../hooks/useLocalSpeech";
import * as api from "../../api";
import { today } from "../../utils/dates";
import { PlusCircle, ClipboardList, Eye, CheckCircle, AlertCircle } from "lucide-react";

const toTitleCase = (str) => {
  if (!str) return "";
  return str
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export function NewStockEntryForm({ onSuccess, reorderItem }) {
  const { stockNames, stocks, refreshStockNames } = useAppContext();
  const [form, setForm] = useState({ name: "", qty: "", unit: "kg", date: today(), price: "", supplier: "", expiry_date: "", min_alert_qty: "", freight: "", gst: "" });
  const [msg, setMsg]   = useState("");
  
  const fileInputRef = useRef();
  const [scannedPreview, setScannedPreview] = useState(null);
  const [scanningBill, setScanningBill] = useState(false);

  const [showQuickImport, setShowQuickImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [listenLang, setListenLang] = useState("en-IN");

  // Local speech-to-text (Whisper Tiny)
  const { listening, interimText, startRecording, stopRecording } = useLocalSpeech(listenLang);

  // Pre-fill form on reorderItem change
  useEffect(() => {
    if (reorderItem) {
      setShowQuickImport(false);
      setForm({
        name: reorderItem.name || "",
        qty: "",
        unit: reorderItem.unit || "kg",
        date: today(),
        price: reorderItem.price !== null && reorderItem.price !== undefined ? reorderItem.price.toString() : "",
        supplier: reorderItem.supplier || "",
        expiry_date: "",
        min_alert_qty: reorderItem.min_alert_qty !== null && reorderItem.min_alert_qty !== undefined ? reorderItem.min_alert_qty.toString() : "",
        freight: "",
        gst: ""
      });
      setMsg(`Form populated for ${reorderItem.name} ✓`);
      const timer = setTimeout(() => setMsg(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [reorderItem]);

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
      if (onSuccess) onSuccess();
      refreshStockNames();
    } catch (e) { 
      setMsg("Error: " + e.message); 
    }
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
      if (onSuccess) onSuccess();
      refreshStockNames();
    } catch (e) {
      setMsg("Error saving: " + e.message);
    }
  };

  const startListening = () => {
    if (listening) {
      stopRecording((status) => setMsg(status));
    } else {
      startRecording(
        (text) => {
          setImportText((prev) => (prev.trim() ? prev.trim() + "\n" + text : text));
          setMsg("Transcription complete ✓");
          setTimeout(() => setMsg(""), 3000);
        },
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
    
    return Object.entries(uniqueMap).map(([supplier, info]) => ({
      supplier,
      ...info
    })).sort((a, b) => a.price - b.price);
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
          <PlusCircle size={16} style={{ color: COLORS.brand }} /> New Stock Entry
        </p>
        <div style={{ display: "flex", gap: 6 }}>
          <Btn variant="ghost" small onClick={() => setShowQuickImport(!showQuickImport)} style={{ fontSize: 11, padding: "4px 8px" }}>
            {showQuickImport ? "Standard" : "Quick Import"}
          </Btn>
          <Btn variant="ghost" small onClick={() => fileInputRef.current.click()} style={{ fontSize: 11, padding: "4px 8px" }} disabled={scanningBill}>
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
            <Btn onClick={submitScannedItems} style={{ flex: 1 }}>Confirm & Log All</Btn>
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
          <Input label="Item name" value={form.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g. Rice, Tomatoes…" list="stock-names-form" />
          <datalist id="stock-names-form">
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
          <Btn onClick={add} style={{ width: "100%", marginTop: 8, height: 40 }}>Add to Store</Btn>
        </div>
      )}
      {msg && <p style={{ color: COLORS.success, fontSize: 12, marginTop: 8, textAlign: "center" }}>{msg}</p>}
    </>
  );
}
