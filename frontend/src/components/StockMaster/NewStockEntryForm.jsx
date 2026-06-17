import { useState, useEffect, useRef } from "react";
import Input from "../Input";
import Select from "../Select";
import Btn from "../Btn";
import { COLORS, UNITS } from "../../styles/colors";
import { useAppContext } from "../../context/AppContext";
import { useLocalSpeech } from "../../hooks/useLocalSpeech";
import * as api from "../../api";
import { today } from "../../utils/dates";
import { PlusCircle, ClipboardList, Plus, Trash2, Camera, Mic, RefreshCw } from "lucide-react";

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
  
  const [form, setForm] = useState({
    supplier: "",
    date: today(),
    freight: "",
    gst: "",
    items: [{ id: Date.now(), name: "", qty: "", unit: "kg", price: "", item_code: "", expiry_date: "", min_alert_qty: "" }]
  });
  
  const [msg, setMsg]   = useState("");
  const fileInputRef = useRef();
  const [scanningBill, setScanningBill] = useState(false);
  const [showQuickImport, setShowQuickImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [listenLang, setListenLang] = useState("en-IN");
  const [activeRowIdx, setActiveRowIdx] = useState(null);

  // Local speech-to-text (Whisper Tiny)
  const { listening, interimText, startRecording, stopRecording } = useLocalSpeech(listenLang);

  useEffect(() => {
    if (reorderItem) {
      setShowQuickImport(false);
      setForm({
        supplier: reorderItem.supplier || "",
        date: today(),
        freight: "",
        gst: "",
        items: [{
          id: Date.now(),
          name: reorderItem.name || "",
          qty: "",
          unit: reorderItem.unit || "kg",
          price: reorderItem.price !== null ? reorderItem.price.toString() : "",
          item_code: reorderItem.item_code || "",
          expiry_date: "",
          min_alert_qty: reorderItem.min_alert_qty !== null ? reorderItem.min_alert_qty.toString() : ""
        }]
      });
      setMsg(`Form populated for ${reorderItem.name} ✓`);
      const timer = setTimeout(() => setMsg(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [reorderItem]);

  const handleAutoFillLowStock = () => {
    const lowStock = stocks.filter((item) => {
      const pct = item.qty > 0 ? (item.remaining / item.qty) * 100 : 0;
      return item.min_alert_qty !== null ? item.remaining <= item.min_alert_qty : pct < 25;
    });
    if (lowStock.length === 0) {
      alert("No low stock items found.");
      return;
    }
    setForm(prev => ({
      ...prev,
      items: lowStock.map(it => ({
        id: Date.now() + Math.random(),
        name: it.name,
        qty: (it.min_alert_qty ? it.min_alert_qty * 2 : 10).toString(),
        price: it.price !== null ? it.price.toString() : "",
        unit: it.unit || "kg",
        item_code: it.item_code || "",
        expiry_date: "",
        min_alert_qty: it.min_alert_qty !== null ? it.min_alert_qty.toString() : ""
      }))
    }));
    setMsg("Auto-filled low stock items ✓");
    setTimeout(() => setMsg(""), 3000);
  };

  const addRow = () => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { id: Date.now() + Math.random(), name: "", qty: "", unit: "kg", price: "", item_code: "", expiry_date: "", min_alert_qty: "" }]
    }));
  };

  const removeRow = (idx) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx)
    }));
  };

  const clearAllItems = () => {
    setForm(prev => ({
      ...prev,
      items: [{ id: Date.now(), name: "", qty: "", unit: "kg", price: "", item_code: "", expiry_date: "", min_alert_qty: "" }]
    }));
  };

  const updateItem = (idx, field, val) => {
    setForm((prev) => {
      const nextItems = prev.items.map((it, i) => {
        if (i !== idx) return it;
        const updated = { ...it, [field]: val };
        if (field === "name") {
          const matched = stocks.find(s => s.name.toLowerCase() === val.trim().toLowerCase());
          if (matched) {
            updated.unit = matched.unit || updated.unit;
            updated.item_code = matched.item_code;
            updated.price = matched.price !== null ? matched.price.toString() : updated.price;
            updated.min_alert_qty = matched.min_alert_qty !== null ? matched.min_alert_qty.toString() : updated.min_alert_qty;
          }
        }
        return updated;
      });
      return { ...prev, items: nextItems };
    });
  };

  const addAllToStore = async () => {
    const validItems = form.items.filter(it => it.name && it.qty);
    if (validItems.length === 0) {
      setMsg("Please add at least one valid item with a name and quantity.");
      setTimeout(() => setMsg(""), 3000);
      return;
    }
    
    setMsg("Adding items to store...");
    try {
      const gstVal = parseFloat(form.gst) || 0;
      const freightVal = parseFloat(form.freight) || 0;
      const totalQty = validItems.reduce((acc, it) => acc + (parseFloat(it.qty) || 0), 0);
      const freightPerItem = totalQty > 0 ? freightVal / validItems.length : 0; // Simple average distribution

      for (const it of validItems) {
        const basePriceVal = parseFloat(it.price) || 0;
        const quantityVal = parseFloat(it.qty) || 0;
        
        const landedPrice = quantityVal > 0 
          ? (basePriceVal * (1 + gstVal / 100)) + (freightPerItem / quantityVal)
          : basePriceVal;

        const payload = {
          name: toTitleCase(it.name),
          qty: quantityVal,
          unit: it.unit || "kg",
          price: landedPrice || null,
          supplier: form.supplier ? toTitleCase(form.supplier) : null,
          expiry_date: it.expiry_date || null,
          min_alert_qty: it.min_alert_qty ? parseFloat(it.min_alert_qty) : null,
          date: form.date || today()
        };

        if (!navigator.onLine) {
          const queue = JSON.parse(localStorage.getItem("kapila_offline_stock") || "[]");
          queue.push(payload);
          localStorage.setItem("kapila_offline_stock", JSON.stringify(queue));
        } else {
          await api.stock.create(payload);
        }
      }

      setForm({
        supplier: "", date: today(), freight: "", gst: "",
        items: [{ id: Date.now(), name: "", qty: "", unit: "kg", price: "", item_code: "", expiry_date: "", min_alert_qty: "" }]
      });
      
      setMsg("All stock added successfully ✓");
      setTimeout(() => setMsg(""), 3000);
      if (onSuccess) onSuccess();
      refreshStockNames();
    } catch (e) {
      setMsg("Error saving: " + e.message);
    }
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
          setForm(prev => ({
            ...prev,
            supplier: res.data.supplier || prev.supplier,
            items: res.data.items.map(it => ({
              id: Date.now() + Math.random(),
              name: it.name,
              qty: it.qty?.toString() || "",
              price: it.price?.toString() || "",
              unit: it.unit || "kg",
              item_code: it.item_code || "",
              expiry_date: "",
              min_alert_qty: ""
            }))
          }));
          setMsg("Bill scanned successfully ✓");
        } else {
          setMsg("Failed to parse bill.");
        }
      } catch (err) {
        setMsg("Scan error: " + err.message);
      } finally {
        setScanningBill(false);
        e.target.value = null;
        setTimeout(() => setMsg(""), 3000);
      }
    };
    reader.readAsDataURL(file);
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
        setForm(prev => ({
          ...prev,
          supplier: res.data.supplier || prev.supplier,
          items: [
            ...(prev.items.length === 1 && !prev.items[0].name ? [] : prev.items),
            ...res.data.items.map(it => ({
              id: Date.now() + Math.random(),
              name: it.name,
              qty: it.qty?.toString() || "",
              price: it.price?.toString() || "",
              unit: it.unit || "kg",
              item_code: it.item_code || "",
              expiry_date: "",
              min_alert_qty: ""
            }))
          ]
        }));
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

  return (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <p style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
          <PlusCircle size={20} style={{ color: COLORS.brand }} /> New Purchase Order
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <Btn variant="ghost" onClick={handleAutoFillLowStock} style={{ fontSize: "14px", fontWeight: 700 }}>
            Auto-Fill Low Stock
          </Btn>
          <Btn variant="ghost" onClick={() => setShowQuickImport(!showQuickImport)} style={{ fontSize: "14px", fontWeight: 700 }}>
            {showQuickImport ? "Hide Import" : "Quick Import"}
          </Btn>
          <Btn variant="ghost" onClick={() => fileInputRef.current.click()} disabled={scanningBill} style={{ fontSize: "14px", fontWeight: 700 }}>
            <Camera size={16} /> {scanningBill ? "Scanning…" : "Scan Bill / Slip"}
          </Btn>
        </div>
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleScanBill} />

      {showQuickImport && (
        <div style={{ background: COLORS.surface, padding: "16px", borderRadius: 8, border: `1px solid ${COLORS.border}`, marginBottom: 20 }}>
          <p style={{ fontSize: 15, color: COLORS.accent, fontWeight: 700, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
            <Mic size={16} /> Quick Dictate / Text Import
          </p>
          <p style={{ fontSize: 11, color: COLORS.muted, marginBottom: 12 }}>Type, paste WhatsApp text, or use voice dictation in local languages.</p>
          
          <div className="resp-form-grid" style={{ marginBottom: 10 }}>
            <div>
              <label style={{ fontSize: 11, color: COLORS.muted, display: "block", marginBottom: 4 }}>Dictation Language</label>
              <select
                value={listenLang}
                onChange={(e) => setListenLang(e.target.value)}
                style={{ width: "100%", padding: "8px", fontSize: 13, background: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.text, borderRadius: 4 }}
              >
                <option value="en-IN">🇺🇸 English (en-IN)</option>
                <option value="te-IN">🇮🇳 Telugu / తెలుగు (te-IN)</option>
                <option value="hi-IN">🇮🇳 Hindi / हिन्दी (hi-IN)</option>
                <option value="ta-IN">🇮🇳 Tamil / தமிழ் (ta-IN)</option>
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button
                onClick={startListening}
                className={listening ? "pulse" : ""}
                style={{
                  padding: "8px 16px", fontSize: 13, background: listening ? COLORS.coral : COLORS.bg,
                  border: `1px solid ${listening ? COLORS.coral : COLORS.border}`, color: listening ? "#fff" : COLORS.text,
                  borderRadius: 4, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontWeight: 600,
                  height: "35px"
                }}
              >
                {listening ? "🛑 Stop Dictation" : "🎤 Start Dictation"}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="e.g. Tomato 10 kg rate 40"
              rows={4}
              style={{ width: "100%", padding: "10px", fontSize: 13, background: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.text, borderRadius: 4, resize: "vertical" }}
            />
            {interimText && (
              <div style={{ fontSize: 12, color: COLORS.accent, marginTop: 6, padding: "8px", background: COLORS.accent + "11", border: `1px dashed ${COLORS.accent}44`, borderRadius: 4 }}>
                <span className="pulse">🎙️</span> <i>Hearing: "{interimText}"...</i>
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn onClick={parseImportText} style={{ flex: 1 }} disabled={!importText.trim()}>Parse & Extract Items</Btn>
            <Btn variant="ghost" onClick={() => { setShowQuickImport(false); setImportText(""); }} style={{ border: `1px solid ${COLORS.border}` }}>Cancel</Btn>
          </div>
        </div>
      )}

      {/* Global Invoice Details */}
      <div className="resp-form-grid" style={{ marginBottom: 16 }}>
        <Input label="Supplier / Vendor" value={form.supplier} onChange={(e) => setForm((f) => ({ ...f, supplier: e.target.value }))} placeholder="e.g. National Traders" />
        <Input label="Date received" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
        <Input label="GST / Tax (%)" type="number" value={form.gst} onChange={(e) => setForm((f) => ({ ...f, gst: e.target.value }))} placeholder="0" />
        <Input label="Total Freight (₹)" type="number" value={form.freight} onChange={(e) => setForm((f) => ({ ...f, freight: e.target.value }))} placeholder="0" />
      </div>

      {/* Excel-like Items Table */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, marginTop: 24 }}>
        <span style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "0.05em", color: "#475569", textTransform: "uppercase" }}>Purchase Items</span>
        <button onClick={clearAllItems} style={{ background: "transparent", border: "none", color: COLORS.danger, fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
          <Trash2 size={14} /> Clear All
        </button>
      </div>
      
      <div className="resp-table-wrap" style={{ border: "1px solid #e2e8f0", borderRadius: 8, marginBottom: 16 }}>
        <table className="excel-table">
          <colgroup>
            <col style={{ width: "40px" }} />
            <col style={{ width: "auto" }} />
            <col style={{ width: "80px" }} />
            <col style={{ width: "70px" }} />
            <col style={{ width: "90px" }} />
            <col style={{ width: "110px" }} />
            <col style={{ width: "90px" }} />
            <col style={{ width: "40px" }} />
          </colgroup>
          <thead>
            <tr>
              <th className="row-num">#</th>
              <th>Item Name</th>
              <th>Qty</th>
              <th>Unit</th>
              <th>Base Price</th>
              <th>Expiry Date</th>
              <th>Min Alert</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {form.items.map((it, idx) => {
              const isActive = activeRowIdx === idx;
              return (
                <tr key={it.id} className={`excel-row ${isActive ? 'active-row' : ''}`} onClick={() => setActiveRowIdx(idx)}>
                  <td className="row-num">{idx + 1}</td>
                  <td style={{ position: "relative" }}>
                    <input
                      className="excel-input"
                      value={it.name}
                      onChange={(e) => updateItem(idx, "name", e.target.value)}
                      placeholder="Item Name"
                      list={`stock-names-${idx}`}
                    />
                    <datalist id={`stock-names-${idx}`}>
                      {stockNames.map((n) => <option key={n} value={n} />)}
                    </datalist>
                  </td>
                  <td>
                    <input
                      type="number"
                      className="excel-input"
                      value={it.qty}
                      onChange={(e) => updateItem(idx, "qty", e.target.value)}
                      placeholder="0"
                    />
                  </td>
                  <td>
                    <select
                      className="excel-input"
                      value={it.unit}
                      onChange={(e) => updateItem(idx, "unit", e.target.value)}
                      style={{ padding: "4px 8px", border: "none", borderRadius: 0, height: "100%" }}
                    >
                      {UNITS.map((u) => <option key={u}>{u}</option>)}
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      className="excel-input"
                      value={it.price}
                      onChange={(e) => updateItem(idx, "price", e.target.value)}
                      placeholder="0.00"
                    />
                  </td>
                  <td>
                    <input
                      type="date"
                      className="excel-input"
                      value={it.expiry_date}
                      onChange={(e) => updateItem(idx, "expiry_date", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="excel-input"
                      value={it.min_alert_qty}
                      onChange={(e) => updateItem(idx, "min_alert_qty", e.target.value)}
                      placeholder="e.g. 5"
                    />
                  </td>
                  <td>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeRow(idx); }}
                      className="row-delete-btn"
                      title="Delete Row"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ padding: "8px 12px", background: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
          <button onClick={addRow} className="add-row-btn" style={{ background: "transparent", border: "none", color: COLORS.brand, fontWeight: 600, fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
            <Plus size={14} /> Add Row
          </button>
        </div>
      </div>

      <Btn onClick={addAllToStore} style={{ width: "100%", height: 48, fontSize: "16px", fontWeight: 700 }}>
        Confirm & Save Purchase Order
      </Btn>

      {msg && <p style={{ color: COLORS.success, fontSize: 13, marginTop: 12, textAlign: "center", fontWeight: 600 }}>{msg}</p>}
      
      <style dangerouslySetInnerHTML={{ __html: `
        .excel-table { width: 100%; border-collapse: collapse; margin-bottom: 0px; }
        .excel-table th { background: #f8fafc; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; padding: 10px 10px; font-size: 11px; font-weight: 600; color: #475569; text-transform: uppercase; text-align: left; }
        .excel-table td { border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; padding: 0; position: relative; }
        .excel-table tr.excel-row:nth-child(even) { background-color: #fafafa; }
        .excel-table tr.excel-row:hover { background-color: #f1f5f9; }
        .excel-table tr.active-row td { border-top: 2px solid #3b82f6; border-bottom: 2px solid #3b82f6; }
        .excel-table tr.active-row td:first-child { border-left: 2px solid #3b82f6; }
        .excel-table tr.active-row td:last-child { border-right: 2px solid #3b82f6; }
        .row-num { padding: 8px 10px !important; color: #94a3b8; font-size: 12px; text-align: center; }
        .excel-input { width: 100%; height: 38px; border: none; background: transparent; padding: 8px 10px; font-size: 14px; color: #1e293b; outline: none; box-sizing: border-box; }
        .excel-input:focus { background: white; }
        .row-delete-btn { background: transparent; border: none; color: #ef4444; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; font-size: 14px; opacity: 0.7; }
        .row-delete-btn:hover { opacity: 1; }
      `}}/>
    </>
  );
}
