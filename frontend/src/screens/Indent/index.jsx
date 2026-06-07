import { useState, useEffect } from "react";
import Section from "../../components/Section";
import Card from "../../components/Card";
import Btn from "../../components/Btn";
import Input from "../../components/Input";
import Select from "../../components/Select";
import Pagination from "../../components/Pagination";
import SearchBar from "../../components/SearchBar";
import ErrorMsg from "../../components/ErrorMsg";
import { COLORS } from "../../styles/colors";
import { usePaginatedApi } from "../../hooks/useApi";
import * as api from "../../api";
import { useAppContext } from "../../context/AppContext";

const today = () => new Date().toISOString().slice(0, 10);
const LIMIT = 20;

export default function IndentScreen() {
  const { stockNames, stocks, indentPreFill, setIndentPreFill } = useAppContext();
  const [deptsList, setDeptsList] = useState([]);
  const [deptItemsMap, setDeptItemsMap] = useState({});
  const [deptLeftovers, setDeptLeftovers] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [availableStock, setAvailableStock] = useState({});
  
  const [form, setForm] = useState({ dept: "", date: today(), items: [{ name: "", qty: "", unit: "kg", item_code: "" }] });
  const [msg, setMsg]   = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const { items, total, page, loading, error, fetch } = usePaginatedApi(api.indents.list);

  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState({});
  const [activeCategory, setActiveCategory] = useState("All");

  const uniqueStockItems = [];
  const seenNames = new Set();
  stocks.forEach(s => {
    if (!seenNames.has(s.name.toLowerCase())) {
      seenNames.add(s.name.toLowerCase());
      uniqueStockItems.push(s);
    }
  });

  // Category classifier helper
  const getItemCategory = (name) => {
    const n = name.toLowerCase();
    if (n.includes("rice") || n.includes("oil") || n.includes("basmati") || n.includes("powder") || n.includes("dal") || n.includes("atta") || n.includes("sugar") || n.includes("masala") || n.includes("soda") || n.includes("salt") || n.includes("flour")) return "Grocery";
    if (n.includes("butter") || n.includes("curd") || n.includes("milk") || n.includes("cheese") || n.includes("paneer")) return "Dairy";
    if (n.includes("ginger") || n.includes("garlic") || n.includes("chilli") || n.includes("lemon") || n.includes("onion") || n.includes("potato") || n.includes("mint") || n.includes("coriander")) return "Vegetables";
    if (n.includes("cover") || n.includes("dust") || n.includes("napkin") || n.includes("soap") || n.includes("mop") || n.includes("paper") || n.includes("bottle") || n.includes("cup") || n.includes("glass") || n.includes("spoon")) return "Disposables";
    return "Others";
  };

  // Filter items based on selected department's Excel items
  const getFilteredStockItems = () => {
    if (!form.dept) return uniqueStockItems;
    const currentDeptItems = deptItemsMap[form.dept.toUpperCase()] || [];
    if (currentDeptItems.length === 0) {
      return uniqueStockItems;
    }
    return uniqueStockItems.filter(s => {
      return currentDeptItems.some(name => {
        const cleanName = name.toLowerCase().trim();
        const cleanStockName = s.name.toLowerCase().trim();
        return cleanStockName === cleanName || cleanStockName.includes(cleanName) || cleanName.includes(cleanStockName);
      });
    });
  };

  const filteredStockItems = getFilteredStockItems();
  const filteredStockNames = filteredStockItems.map(s => s.name);

  // Retrieve top 4 quick-add suggestion chips
  const getSuggestedChips = () => {
    return filteredStockItems.slice(0, 5).map(s => ({
      name: s.name,
      unit: s.unit,
      item_code: s.item_code
    }));
  };

  const suggestedChips = getSuggestedChips();

  const load = (overrides = {}) =>
    fetch({ limit: LIMIT, sort: "created_at", order: "desc", status: statusFilter, ...overrides });

  const loadLeftovers = (deptName) => {
    if (!deptName) return;
    api.leftovers.list({ dept: deptName, limit: 50 }).then((res) => {
      if (res.success) {
        setDeptLeftovers((res.data || []).filter(l => l.qty > 0 && l.carried_forward));
      }
    }).catch(console.error);
  };

  // Fetch available stock for selected items inline
  const fetchStockLevels = async (itemNames) => {
    const cleanNames = itemNames.filter(Boolean);
    if (cleanNames.length === 0) return;
    try {
      const res = await api.stock.available(cleanNames);
      if (res.success) {
        setAvailableStock(prev => ({ ...prev, ...res.data }));
      }
    } catch {}
  };

  // Load and Restore from localStorage
  useEffect(() => {
    load();
    
    const savedDraft = localStorage.getItem("kapila_indent_draft");
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setForm(parsed);
        const itemNames = parsed.items.map(it => it.name).filter(Boolean);
        fetchStockLevels(itemNames);
      } catch {}
    }

    api.departments.list().then((res) => {
      if (res.success && res.data.length > 0) {
        setDeptsList(res.data);
        
        if (indentPreFill) {
          const newForm = {
            dept: indentPreFill.dept,
            date: today(),
            items: indentPreFill.items.map(it => ({
              name: it.name,
              qty: it.qty.toString(),
              unit: it.unit,
              item_code: stocks.find(s => s.name.toLowerCase() === it.name.toLowerCase())?.item_code || "KPL-NEW"
            }))
          };
          setForm(newForm);
          loadLeftovers(indentPreFill.dept);
          fetchStockLevels(indentPreFill.items.map(it => it.name));
          setIndentPreFill(null);
          setMsg("Pre-filled items from Menu Plan ✓");
          setTimeout(() => setMsg(""), 3000);
        } else if (!savedDraft) {
          const initialDept = res.data[0].name;
          setForm((f) => ({ ...f, dept: initialDept }));
          loadLeftovers(initialDept);
        }
      }
    }).catch(console.error);

    api.departments.items().then((res) => {
      if (res.success && res.data) {
        setDeptItemsMap(res.data);
      }
    }).catch(console.error);
  }, [indentPreFill]);

  // Save changes to draft
  useEffect(() => {
    if (form.dept) {
      localStorage.setItem("kapila_indent_draft", JSON.stringify(form));
    }
  }, [form]);

  const handleDeptChange = (e) => {
    const val = e.target.value;
    setForm((f) => ({ ...f, dept: val, items: [{ name: "", qty: "", unit: "kg", item_code: "" }] }));
    loadLeftovers(val);
  };

  const addRow    = () => setForm((f) => ({ ...f, items: [...f.items, { name: "", qty: "", unit: "kg", item_code: "" }] }));
  const removeRow = (idx) => setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  const addSuggestionChip = (chip) => {
    setForm(prev => {
      // Check if already in items
      const exists = prev.items.some(it => it.name.toLowerCase() === chip.name.toLowerCase());
      if (exists) return prev;

      const baseItems = (prev.items.length === 1 && !prev.items[0].name) ? [] : prev.items;
      const newItems = [...baseItems, { name: chip.name, qty: "", unit: chip.unit, item_code: chip.item_code }];
      fetchStockLevels([chip.name]);
      return { ...prev, items: newItems };
    });
  };

  const addSelectedItems = () => {
    const toAdd = filteredStockItems.filter(s => selectedItems[s.name]);
    if (toAdd.length > 0) {
      setForm(prev => {
        const baseItems = (prev.items.length === 1 && !prev.items[0].name) ? [] : prev.items;
        const newRows = toAdd.map(s => ({
          name: s.name,
          qty: "",
          unit: s.unit,
          item_code: s.item_code
        }));
        return { ...prev, items: [...baseItems, ...newRows] };
      });
      fetchStockLevels(toAdd.map(s => s.name));
      setSelectedItems({});
      setShowModal(false);
      setSearchQuery("");
    }
  };
  
  const updateItem = (idx, field, val) => {
    setForm((f) => {
      const newItems = f.items.map((it, i) => {
        if (i !== idx) return it;
        const updated = { ...it, [field]: val };
        if (field === "name") {
          const matched = stocks.find((s) => s.name.toLowerCase() === val.trim().toLowerCase());
          if (matched) {
            updated.unit = matched.unit;
            updated.item_code = matched.item_code;
            fetchStockLevels([matched.name]);
          }
        }
        return updated;
      });
      return { ...f, items: newItems };
    });
  };

  const deductLeftover = (leftover) => {
    setForm(prev => {
      const matchedIdx = prev.items.findIndex(it => it.name.toLowerCase() === leftover.item.toLowerCase());
      if (matchedIdx !== -1) {
        const newItems = [...prev.items];
        const currentQty = parseFloat(newItems[matchedIdx].qty || 0);
        const newQty = Math.max(0, currentQty - leftover.qty);
        newItems[matchedIdx] = { ...newItems[matchedIdx], qty: newQty.toString() };
        return { ...prev, items: newItems };
      } else {
        const stockItem = stocks.find(s => s.name.toLowerCase() === leftover.item.toLowerCase());
        const baseItems = (prev.items.length === 1 && !prev.items[0].name) ? [] : prev.items;
        fetchStockLevels([leftover.item]);
        return {
          ...prev,
          items: [
            ...baseItems,
            {
              name: leftover.item,
              qty: "0",
              unit: leftover.unit,
              item_code: stockItem ? stockItem.item_code : "KPL-NEW"
            }
          ]
        };
      }
    });
    setDeptLeftovers(prev => prev.filter(l => l.id !== leftover.id));
  };

  const smartAutofill = async () => {
    if (!form.dept) return;
    try {
      const res = await api.indents.list({ dept: form.dept, limit: 10 });
      if (res.success && res.data.length > 0) {
        const lastIndents = res.data.slice(0, 3);
        const itemTotals = {};
        const itemCounts = {};
        const itemMeta = {};

        lastIndents.forEach(ind => {
          (ind.items || []).forEach(it => {
            const key = it.name.toLowerCase();
            itemTotals[key] = (itemTotals[key] || 0) + parseFloat(it.qty || 0);
            itemCounts[key] = (itemCounts[key] || 0) + 1;
            itemMeta[key] = { name: it.name, unit: it.unit, item_code: it.item_code };
          });
        });

        const autofilledItems = Object.keys(itemTotals).map(key => {
          const avgQty = Math.round((itemTotals[key] / itemCounts[key]) * 10) / 10;
          return {
            name: itemMeta[key].name,
            qty: avgQty.toString(),
            unit: itemMeta[key].unit,
            item_code: itemMeta[key].item_code
          };
        });

        if (autofilledItems.length > 0) {
          setForm(f => ({ ...f, items: autofilledItems }));
          fetchStockLevels(autofilledItems.map(it => it.name));
          setMsg("Autofilled from history ✓");
          setTimeout(() => setMsg(""), 2500);
        } else {
          setMsg("No history for department");
          setTimeout(() => setMsg(""), 2000);
        }
      } else {
        setMsg("No history found");
        setTimeout(() => setMsg(""), 2000);
      }
    } catch (err) {
      setMsg("Autofill failed: " + err.message);
    }
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setMsg("Listening... say items and quantities (e.g. 'Butter 5, Basmati Rice 10')");
    };

    recognition.onerror = () => {
      setIsListening(false);
      setMsg("Voice error. Try again.");
      setTimeout(() => setMsg(""), 2000);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setMsg(`Heard: "${transcript}"`);
      setTimeout(() => setMsg(""), 3500);
      parseVoiceInput(transcript);
    };

    recognition.start();
  };

  const parseVoiceInput = (text) => {
    const normalized = text.toLowerCase()
      .replace(/\bone\b/g, "1")
      .replace(/\btwo\b/g, "2")
      .replace(/\bthree\b/g, "3")
      .replace(/\bfour\b/g, "4")
      .replace(/\bfive\b/g, "5")
      .replace(/\bsix\b/g, "6")
      .replace(/\bseven\b/g, "7")
      .replace(/\beight\b/g, "8")
      .replace(/\bnine\b/g, "9")
      .replace(/\bten\b/g, "10");

    const phrases = normalized.split(/,|\band\b/);
    const added = [];

    phrases.forEach(phrase => {
      const numMatch = phrase.match(/\d+(?:\.\d+)?/);
      if (!numMatch) return;
      
      const qty = numMatch[0];
      const cleanPhrase = phrase
        .replace(qty, "")
        .replace(/\bkg\b|\bpcs\b|\blitre\b|\bl\b|\bpacket\b|\bpackets\b/gi, "")
        .trim();

      if (cleanPhrase.length < 2) return;

      const matched = filteredStockItems.find(s => 
        s.name.toLowerCase().includes(cleanPhrase) || cleanPhrase.includes(s.name.toLowerCase())
      );

      if (matched) {
        added.push({
          name: matched.name,
          qty: qty,
          unit: matched.unit,
          item_code: matched.item_code
        });
      } else {
        added.push({
          name: cleanPhrase.toUpperCase(),
          qty: qty,
          unit: "kg",
          item_code: "KPL-NEW"
        });
      }
    });

    if (added.length > 0) {
      setForm(prev => {
        const baseItems = (prev.items.length === 1 && !prev.items[0].name) ? [] : prev.items;
        return { ...prev, items: [...baseItems, ...added] };
      });
      fetchStockLevels(added.map(it => it.name));
      setMsg(`Added ${added.length} items ✓`);
    } else {
      setMsg("No items recognized. Speak clearly like: 'Butter 5, Rice 10'.");
    }
  };

  const getShareText = () => {
    const itemsText = form.items
      .filter(i => i.name && i.qty)
      .map(i => `• ${i.name}: ${i.qty} ${i.unit || "kg"}`)
      .join("\n");
    
    return `*KAPILA INVENTORY - INDENT REQUEST*\n` +
           `*Department:* ${form.dept}\n` +
           `*Date Needed:* ${form.date}\n\n` +
           `*Items Requested:*\n${itemsText}`;
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(getShareText());
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const printSlip = () => {
    const itemsHtml = form.items
      .filter(i => i.name && i.qty)
      .map(i => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${i.item_code || "N/A"}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">${i.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${i.qty} ${i.unit || "kg"}</td>
        </tr>
      `).join("");

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Indent Slip - ${form.dept}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .details { margin-bottom: 20px; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th { background: #f2f2f2; padding: 8px; text-align: left; border-bottom: 2px solid #ddd; }
            .footer { text-align: center; font-size: 12px; color: #777; margin-top: 40px; border-top: 1px solid #ddd; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>KAPILA INVENTORY</h2>
            <h3>NIGHTLY INDENT SLIP</h3>
          </div>
          <div class="details">
            <p><strong>Department:</strong> ${form.dept}</p>
            <p><strong>Date Needed:</strong> ${form.date}</p>
            <p><strong>Printed At:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Item Name</th>
                <th style="text-align: right;">Qty</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="footer">
            <p>Kapila Kitchen Indent Request System</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const submit = async () => {
    const validItems = form.items.filter((i) => i.name && i.qty);
    if (!validItems.length) return;
    try {
      await api.indents.create({ ...form, items: validItems.map((i) => ({ ...i, qty: parseFloat(i.qty), unit: i.unit || "kg", item_code: i.item_code || "KPL-NEW" })) });
      localStorage.removeItem("kapila_indent_draft");
      setForm({ dept: deptsList[0]?.name || "", date: today(), items: [{ name: "", qty: "", unit: "kg", item_code: "" }] });
      setMsg("Indent submitted ✓");
      setTimeout(() => setMsg(""), 2000);
      load({ page: 1 });
    } catch (e) { setMsg("Error: " + e.message); }
  };

  return (
    <Section title="Indent Request" sub="Departments submit nightly material requirements">
      <div style={{ display: "grid", gridTemplateColumns: "450px 1fr", gap: 20 }}>
        {/* Form */}
        <Card>
          <p style={{ fontSize: 12, color: COLORS.muted, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>New indent form</p>
          
          <Select label="Department" value={form.dept} onChange={handleDeptChange}>
            {deptsList.map((d) => <option key={d.id} value={d.name}>{d.name} ({d.code})</option>)}
          </Select>
          
          <Input label="Date needed" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />

          {/* Leftovers Zero-Waste Alert Banner */}
          {deptLeftovers.length > 0 && (
            <div style={{
              background: COLORS.coral + "22",
              border: `1px solid ${COLORS.coral}66`,
              borderRadius: 8,
              padding: "10px 14px",
              marginBottom: 16,
              fontSize: 12,
              color: COLORS.text
            }}>
              <div style={{ fontWeight: 600, color: COLORS.coral, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                <span>⚠️ Raw Leftovers Alert</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {deptLeftovers.map(l => (
                  <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 11 }}>{l.item}: <strong>{l.qty} {l.unit}</strong> available</span>
                    <button 
                      onClick={() => deductLeftover(l)}
                      style={{
                        background: COLORS.coral,
                        color: "#fff",
                        border: "none",
                        borderRadius: 4,
                        padding: "3px 8px",
                        fontSize: 10,
                        cursor: "pointer",
                        fontWeight: 600,
                        transition: "opacity 0.2s"
                      }}
                      onMouseOver={(e) => e.target.style.opacity = "0.8"}
                      onMouseOut={(e) => e.target.style.opacity = "1"}
                    >
                      Use / Deduct
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick-Add Suggestions Chips */}
          {suggestedChips.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 10, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Quick Add Suggestions</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {suggestedChips.map(chip => (
                  <button
                    key={chip.name}
                    onClick={() => addSuggestionChip(chip)}
                    style={{
                      background: COLORS.bg + "66",
                      border: `1px solid ${COLORS.border}aa`,
                      borderRadius: 20,
                      padding: "4px 10px",
                      fontSize: 11,
                      color: COLORS.accent,
                      cursor: "pointer",
                      fontWeight: 500,
                      transition: "all 0.15s"
                    }}
                    onMouseOver={e => e.target.style.borderColor = COLORS.accent}
                    onMouseOut={e => e.target.style.borderColor = COLORS.border + "aa"}
                  >
                    + {chip.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <p style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Items requested</p>
          
          <div style={{ maxHeight: 280, overflowY: "auto", paddingRight: 4, marginBottom: 10 }}>
            {form.items.map((item, idx) => {
              const cleanName = item.name.toLowerCase().trim();
              const avail = availableStock[cleanName];
              const isStockCheckActive = item.name && avail !== undefined;
              const isLowStock = isStockCheckActive && avail <= 5;
              
              return (
                <div key={idx} style={{
                  background: COLORS.bg + "88",
                  border: `1px solid ${COLORS.border}88`,
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 10,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8
                }}>
                  {/* Top row: Item Name & Inline Stock badge */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                    {item.name ? (
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontWeight: 600, color: COLORS.text, fontSize: 13 }}>{item.name}</span>
                        {item.item_code && <span style={{ fontSize: 10, color: COLORS.muted }}>{item.item_code}</span>}
                      </div>
                    ) : (
                      <input 
                        value={item.name} 
                        onChange={(e) => updateItem(idx, "name", e.target.value)} 
                        placeholder="Item name" 
                        list="stock-names" 
                        style={{ 
                          width: "100%",
                          background: COLORS.surface,
                          border: `1px solid ${COLORS.border}`,
                          color: COLORS.text,
                          borderRadius: 6,
                          padding: "6px 10px",
                          fontSize: 12
                        }} 
                      />
                    )}
                    {isStockCheckActive && (
                      <span style={{
                        fontSize: 10,
                        fontWeight: 600,
                        padding: "2px 6px",
                        borderRadius: 4,
                        background: isLowStock ? COLORS.coral + "22" : COLORS.success + "22",
                        color: isLowStock ? COLORS.coral : COLORS.success,
                        whiteSpace: "nowrap"
                      }}>
                        Avail: {avail} {item.unit}
                      </span>
                    )}
                  </div>

                  {/* Bottom row: Qty, Unit, and Delete */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <input 
                      value={item.qty} 
                      onChange={(e) => updateItem(idx, "qty", e.target.value)} 
                      placeholder="Qty" 
                      type="number" 
                      style={{ 
                        flex: 1,
                        background: COLORS.surface,
                        border: `1px solid ${COLORS.border}`,
                        color: COLORS.text,
                        borderRadius: 6,
                        padding: "8px 12px",
                        fontSize: 13
                      }} 
                    />
                    <span style={{ fontSize: 13, color: COLORS.accent, fontWeight: 600, minWidth: 32, textAlign: "center" }}>
                      {item.unit || "kg"}
                    </span>
                    <Btn variant="danger" small onClick={() => removeRow(idx)} style={{ padding: "6px 10px" }}>✕</Btn>
                  </div>
                </div>
              );
            })}
          </div>

          <datalist id="stock-names">{filteredStockNames.map((n) => <option key={n} value={n} />)}</datalist>

          <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
            <Btn variant="ghost" onClick={addRow} small style={{ flex: "1 1 45%" }}>+ Add item</Btn>
            <Btn variant="ghost" onClick={() => { setSelectedItems({}); setShowModal(true); }} small style={{ flex: "1 1 45%", borderColor: COLORS.accent, color: COLORS.accent }}>⚡ Add Multi</Btn>
            
            <button 
              onClick={startListening} 
              style={{
                flex: "1 1 45%",
                background: isListening ? COLORS.coral : "transparent",
                color: isListening ? "#fff" : COLORS.text,
                border: `1px solid ${isListening ? COLORS.coral : COLORS.border}`,
                borderRadius: 6,
                padding: "8px 12px",
                fontSize: 12,
                cursor: "pointer",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                transition: "all 0.2s"
              }}
            >
              <span style={{
                width: 8, height: 8, borderRadius: "50%",
                background: isListening ? "#fff" : COLORS.coral,
                display: "inline-block",
                animation: isListening ? "pulse 1.2s infinite ease-in-out" : "none"
              }}/>
              {isListening ? "Listening..." : "🎙️ Voice Input"}
            </button>

            <button 
              onClick={smartAutofill}
              style={{
                flex: "1 1 45%",
                background: "transparent",
                color: COLORS.accent,
                border: `1px solid ${COLORS.accent}66`,
                borderRadius: 6,
                padding: "8px 12px",
                fontSize: 12,
                cursor: "pointer",
                fontWeight: 500
              }}
            >
              🔄 Autofill History
            </button>
          </div>

          <style dangerouslySetInnerHTML={{__html: `
            @keyframes pulse {
              0% { transform: scale(0.85); opacity: 0.5; }
              50% { transform: scale(1.15); opacity: 1; }
              100% { transform: scale(0.85); opacity: 0.5; }
            }
          `}}/>

          <Btn onClick={submit} style={{ width: "100%", marginBottom: 12 }}>Submit Indent</Btn>

          {/* Quick Sharing Section */}
          <div style={{ 
            display: "flex", gap: 10, justifyContent: "center", alignItems: "center",
            paddingTop: 10, borderTop: `1px solid ${COLORS.border}44`
          }}>
            <span style={{ fontSize: 11, color: COLORS.muted }}>Share Order:</span>
            <button onClick={shareWhatsApp} style={{ background: "transparent", border: "none", color: COLORS.success, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>💬 WhatsApp</button>
            <span style={{ color: COLORS.border }}>|</span>
            <button onClick={printSlip} style={{ background: "transparent", border: "none", color: COLORS.accent, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>🖨️ Print Slip</button>
          </div>

          {msg && <p style={{ color: COLORS.success, fontSize: 12, marginTop: 8, textAlign: "center" }}>{msg}</p>}
        </Card>

        {showModal && (
          <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0, 0, 0, 0.75)", display: "flex",
            alignItems: "center", justifyContent: "center", zIndex: 1000,
            backdropFilter: "blur(4px)"
          }}>
            <div style={{
              background: COLORS.surface, border: `1px solid ${COLORS.border}`,
              borderRadius: 10, width: 520, padding: 24, display: "flex",
              flexDirection: "column", maxHeight: "85vh", boxShadow: "0 10px 25px rgba(0,0,0,0.5)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, color: COLORS.accent, fontWeight: 600, margin: 0 }}>📦 Select Multiple Items</h3>
                <button onClick={() => setShowModal(false)} style={{ background: "transparent", color: COLORS.muted, fontSize: 16, border: "none", cursor: "pointer" }}>✕</button>
              </div>
              
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type to filter items..."
                style={{
                  background: COLORS.bg, border: `1px solid ${COLORS.border}`,
                  color: COLORS.text, borderRadius: 6, padding: "8px 12px",
                  marginBottom: 16, width: "100%", fontSize: 13
                }}
              />

              {/* Categorized Tab Bar */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14, borderBottom: `1px solid ${COLORS.border}33`, paddingBottom: 10 }}>
                {["All", "Grocery", "Dairy", "Vegetables", "Disposables", "Others"].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    style={{
                      background: activeCategory === cat ? COLORS.accent + "22" : "transparent",
                      border: `1px solid ${activeCategory === cat ? COLORS.accent : COLORS.border + "aa"}`,
                      borderRadius: 4,
                      padding: "4px 10px",
                      fontSize: 11,
                      color: activeCategory === cat ? COLORS.accent : COLORS.muted,
                      cursor: "pointer",
                      fontWeight: 600,
                      transition: "all 0.15s"
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div style={{ flex: 1, overflowY: "auto", marginBottom: 16, display: "flex", flexDirection: "column", gap: 6, maxHeight: 260, paddingRight: 6 }}>
                {filteredStockItems
                  .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .filter(s => activeCategory === "All" || getItemCategory(s.name) === activeCategory)
                  .map((s) => {
                    const isChecked = !!selectedItems[s.name];
                    return (
                      <label 
                        key={s.item_code} 
                        style={{ 
                          display: "flex", alignItems: "center", gap: 10, 
                          padding: "8px 12px", background: isChecked ? COLORS.accent + "11" : COLORS.bg + "44",
                          border: `1px solid ${isChecked ? COLORS.accent + "44" : COLORS.border + "44"}`,
                          borderRadius: 6, cursor: "pointer", transition: "all 0.15s"
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => setSelectedItems(prev => ({ ...prev, [s.name]: !prev[s.name] }))}
                          style={{ width: "auto", cursor: "pointer" }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <p style={{ fontSize: 13, fontWeight: 500, color: COLORS.text, margin: 0 }}>{s.name}</p>
                            <span style={{ fontSize: 9, color: COLORS.muted, background: COLORS.border + "33", padding: "1px 5px", borderRadius: 3 }}>
                              {getItemCategory(s.name)}
                            </span>
                          </div>
                          <p style={{ fontSize: 10, color: COLORS.muted, margin: "2px 0 0" }}>{s.item_code} · Unit: {s.unit}</p>
                        </div>
                      </label>
                    );
                  })}
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <Btn variant="ghost" onClick={() => setShowModal(false)}>Cancel</Btn>
                <Btn onClick={addSelectedItems}>Add Selected ({Object.values(selectedItems).filter(Boolean).length})</Btn>
              </div>
            </div>
          </div>
        )}

        {/* List */}
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", gap: 10, alignItems: "center" }}>
            <SearchBar onSearch={(q) => load({ page: 1, q })} placeholder="Search items…" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); load({ page: 1, status: e.target.value }); }}
              style={{ width: 130, padding: "7px 10px", fontSize: 12 }}
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="issued">Issued</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {loading ? (
            <p style={{ color: COLORS.muted, textAlign: "center", padding: 32 }}>Loading…</p>
          ) : error ? (
            <ErrorMsg error={error} />
          ) : items.length === 0 ? (
            <p style={{ color: COLORS.muted, textAlign: "center", padding: 40 }}>No indents yet</p>
          ) : (
            <>
              <div style={{ overflowY: "auto", maxHeight: 400 }}>
                {items.map((ind) => (
                  <div key={ind.id} style={{ padding: "14px 20px", borderBottom: `1px solid ${COLORS.border}22` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div>
                        <span style={{ fontWeight: 600, color: COLORS.accent }}>{ind.dept}</span>
                        <span style={{ color: COLORS.muted, fontSize: 12, marginLeft: 10 }}>{ind.date}</span>
                      </div>
                      <span className="badge" style={{
                        background: ind.status === "issued" ? COLORS.success + "22" : ind.status === "cancelled" ? COLORS.coral + "22" : COLORS.accent + "22",
                        color: ind.status === "issued" ? COLORS.success : ind.status === "cancelled" ? COLORS.coral : COLORS.accent,
                      }}>{ind.status}</span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {(ind.items || []).map((it, i) => (
                        <span key={i} style={{ fontSize: 12, background: COLORS.border + "44", borderRadius: 4, padding: "2px 8px" }}>
                          <span style={{ color: COLORS.accent, fontWeight: 500, marginRight: 4 }}>{it.item_code}</span>
                          {it.name} <span style={{ color: COLORS.muted }}>{it.qty} {it.unit || "kg"}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <Pagination page={page} total={total} limit={LIMIT} onPage={(p) => load({ page: p })} />
            </>
          )}
        </Card>
      </div>
    </Section>
  );
}
