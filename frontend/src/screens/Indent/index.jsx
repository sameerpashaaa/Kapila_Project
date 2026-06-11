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
import { useLocalSpeech } from "../../hooks/useLocalSpeech";
import { Plus, Zap, Mic, History, Trash2, Printer, Search, Inbox } from "lucide-react";

const WhatsAppIcon = ({ size = 15 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const cleanDeptName = (name) => {
  if (!name) return "";
  return name.replace(/\s*\(.*?\)\s*/g, "").split(" - ")[0].split(" | ")[0].trim();
};

const formatDate = (dateStr) => {
  try {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  } catch {
    return dateStr;
  }
};

const getStatusStyleAndText = (status) => {
  const s = (status || "").toLowerCase();
  if (s === "issued") {
    return { bg: "#D1FAE5", color: "#065F46", text: "Issued" };
  }
  if (s === "pending") {
    return { bg: "#FEF3C7", color: "#92400E", text: "Pending" };
  }
  return { bg: "#F3F4F6", color: "#6B7280", text: status.charAt(0).toUpperCase() + status.slice(1) };
};

const today = () => new Date().toISOString().slice(0, 10);
const LIMIT = 20;

export default function IndentScreen() {
  const { stockNames, stocks, indentPreFill, setIndentPreFill } = useAppContext();
  const [deptsList, setDeptsList] = useState([]);
  const [deptItemsMap, setDeptItemsMap] = useState({});
  const [deptLeftovers, setDeptLeftovers] = useState([]);
  const [availableStock, setAvailableStock] = useState({});

  // Local speech-to-text (Whisper Tiny — no Google, no internet)
  const { listening, statusMsg: speechStatus, startRecording, stopRecording } = useLocalSpeech("en-IN");
  
  const [form, setForm] = useState({ dept: "", date: today(), items: [{ name: "", qty: "", unit: "kg", item_code: "" }] });
  const [msg, setMsg]   = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const { items, total, page, loading, error, fetch } = usePaginatedApi(api.indents.list);

  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState({});
  const [activeCategory, setActiveCategory] = useState("All");
  const [historySearch, setHistorySearch] = useState("");

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
    if (listening) {
      stopRecording((status) => {
        setMsg(status);
        setTimeout(() => setMsg(""), 3000);
      });
    } else {
      startRecording(
        (text) => {
          parseVoiceInput(text);
          setMsg(`Heard: "${text}"`);
          setTimeout(() => setMsg(""), 3500);
        },
        (status) => {
          setMsg(status);
        }
      );
    }
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
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 20px; display: flex; flex-direction: column; align-items: center; gap: 8px; }
            .logo-container { background: #1E293B; border-radius: 8px; padding: 8px 20px; display: inline-flex; align-items: center; justify-content: center; }
            .details { margin-bottom: 20px; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th { background: #f2f2f2; padding: 8px; text-align: left; border-bottom: 2px solid #ddd; }
            .footer { text-align: center; font-size: 12px; color: #777; margin-top: 40px; border-top: 1px solid #ddd; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo-container">
              <img src="/kapila-logo.png" alt="Kapila" style="height: 32px; display: block;" />
            </div>
            <h3 style="margin: 6px 0 0; font-size: 16px; letter-spacing: 0.05em; color: #475569; text-transform: uppercase;">Nightly Indent Slip</h3>
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
      <div className="indent-layout-grid">
        {/* Left Panel - Form */}
        <Card style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: "12px", padding: "20px 24px" }}>
          <p style={{ fontSize: "10px", fontWeight: 500, letterSpacing: "0.08em", color: "#9CA3AF", textTransform: "uppercase", marginBottom: "16px" }}>NEW INDENT FORM</p>
          
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: "11px", color: "#6B7280", marginBottom: "4px", display: "block", fontWeight: 400 }}>
              Department
            </label>
            <select className="indent-field" value={form.dept} onChange={handleDeptChange}>
              {deptsList.map((d) => <option key={d.id} value={d.name}>{d.name} ({d.code})</option>)}
            </select>
          </div>
          
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: "11px", color: "#6B7280", marginBottom: "4px", display: "block", fontWeight: 400 }}>
              Date needed
            </label>
            <input className="indent-field" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
          </div>

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

          <p style={{ fontSize: "10px", fontWeight: 500, letterSpacing: "0.08em", color: "#9CA3AF", textTransform: "uppercase", marginTop: "14px", marginBottom: "8px" }}>ITEMS REQUESTED</p>
          
          <div style={{
            background: "#F9FAFB",
            border: "1px solid #E5E7EB",
            borderRadius: "8px",
            padding: "10px 14px",
            minHeight: "72px",
            marginTop: "14px",
            maxHeight: "280px",
            overflowY: "auto"
          }}>
            {form.items.length === 0 || (form.items.length === 1 && !form.items[0].name && !form.items[0].qty) ? (
              <div style={{ fontSize: "12px", color: "#9CA3AF", textAlign: "center", padding: "12px 0" }}>
                No items added yet
              </div>
            ) : (
              form.items.map((item, idx) => {
                const cleanName = item.name.toLowerCase().trim();
                const avail = availableStock[cleanName];
                const isStockCheckActive = item.name && avail !== undefined;
                const isLowStock = isStockCheckActive && avail <= 5;
                
                return (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                    {/* SKU badge */}
                    <span style={{
                      background: "#EFF6FF",
                      color: "#1D4ED8",
                      padding: "2px 7px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: 500,
                      fontFamily: "monospace"
                    }}>
                      {item.item_code || "NEW"}
                    </span>

                    {/* Item name */}
                    {item.name ? (
                      <span style={{ fontSize: "12px", color: "#111827", fontWeight: 500 }}>
                        {item.name}
                      </span>
                    ) : (
                      <input 
                        value={item.name} 
                        onChange={(e) => updateItem(idx, "name", e.target.value)} 
                        placeholder="Item name" 
                        list="stock-names" 
                        style={{ 
                          border: "1px solid #D1D5DB",
                          borderRadius: "4px",
                          padding: "2px 6px",
                          fontSize: "12px",
                          color: "#111827",
                          background: "#fff",
                          width: "120px"
                        }} 
                      />
                    )}

                    {/* Quantity */}
                    <input 
                      value={item.qty} 
                      onChange={(e) => updateItem(idx, "qty", e.target.value)} 
                      placeholder="Qty" 
                      type="number" 
                      style={{ 
                        border: "1px solid #D1D5DB",
                        borderRadius: "4px",
                        padding: "2px 6px",
                        fontSize: "12px",
                        color: "#6B7280",
                        background: "#fff",
                        width: "60px"
                      }} 
                    />
                    <span style={{ fontSize: "12px", color: "#6B7280" }}>
                      {item.unit || "kg"}
                    </span>

                    {isStockCheckActive && (
                      <span style={{
                        fontSize: 9,
                        fontWeight: 600,
                        padding: "1px 4px",
                        borderRadius: 3,
                        background: isLowStock ? COLORS.coral + "22" : COLORS.success + "22",
                        color: isLowStock ? COLORS.coral : COLORS.success,
                        whiteSpace: "nowrap"
                      }}>
                        Avail: {avail}
                      </span>
                    )}

                    {/* Trash icon */}
                    <button 
                      onClick={() => removeRow(idx)} 
                      style={{ 
                        background: "transparent", 
                        border: "none", 
                        cursor: "pointer", 
                        marginLeft: "auto", 
                        padding: "4px",
                        display: "flex",
                        alignItems: "center",
                        color: "#EF4444"
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <datalist id="stock-names">{filteredStockNames.map((n) => <option key={n} value={n} />)}</datalist>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "12px" }}>
            <button className="indent-btn" onClick={addRow}>
              <Plus size={15} /> Add Item
            </button>
            <button className="indent-btn" onClick={() => { setSelectedItems({}); setShowModal(true); }}>
              <Zap size={15} /> Add Multi
            </button>
            <button 
              onClick={startListening} 
              className="indent-btn"
              style={listening ? { background: "#FEF2F2", borderColor: "#EF4444", color: "#EF4444" } : {}}
            >
              <Mic size={15} color={listening ? "#EF4444" : "#374151"} />
              {listening ? "Recording... (tap to stop)" : "Voice Input"}
            </button>
            <button className="indent-btn" onClick={smartAutofill}>
              <History size={15} /> Autofill History
            </button>

            <button 
              className="submit-indent-btn" 
              onClick={submit}
              disabled={form.items.filter((i) => i.name && i.qty).length === 0}
            >
              Submit Indent
            </button>
          </div>

          <style dangerouslySetInnerHTML={{__html: `
            @keyframes pulse {
              0% { transform: scale(0.85); opacity: 0.5; }
              50% { transform: scale(1.15); opacity: 1; }
              100% { transform: scale(0.85); opacity: 0.5; }
            }
            .indent-field {
              width: 100%;
              padding: 8px 12px;
              border: 1px solid #D1D5DB;
              border-radius: 8px;
              background: #F9FAFB;
              font-size: 13px;
              outline: none;
              box-sizing: border-box;
              transition: border-color 0.15s, box-shadow 0.15s;
            }
            .indent-field:focus {
              outline: 2px solid #1D3557;
              outline-offset: 1px;
            }
            .indent-btn {
              padding: 7px 10px;
              border: 1px solid #D1D5DB;
              border-radius: 8px;
              background: transparent;
              color: #374151;
              font-size: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 6px;
              cursor: pointer;
              transition: background 0.15s;
            }
            .indent-btn:hover {
              background: #F3F4F6;
            }
            .submit-indent-btn {
              grid-column: span 2;
              padding: 10px;
              background: #1D3557;
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 13px;
              font-weight: 500;
              cursor: pointer;
              margin-top: 6px;
              width: 100%;
              transition: background 0.15s;
            }
            .submit-indent-btn:hover {
              background: #162840;
            }
            .submit-indent-btn:disabled {
              opacity: 0.5;
              cursor: not-allowed;
            }
            .indent-layout-grid {
              display: grid;
              grid-template-columns: 320px 1fr;
              gap: 16px;
              align-items: start;
            }
            .history-table-row {
              border-bottom: 1px solid #F3F4F6;
              transition: background 0.15s;
            }
            .history-table-row:hover {
              background: #F9FAFB;
            }
            @media (max-width: 768px) {
              .indent-layout-grid {
                grid-template-columns: 1fr;
              }
            }
          `}}/>

          {/* Quick Sharing Section */}
          <div style={{ borderTop: "1px solid #E5E7EB", margin: "14px 0" }}></div>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", fontSize: "12px", color: "#6B7280" }}>
            <span style={{ color: "#6B7280" }}>Share Order:</span>
            <button 
              onClick={shareWhatsApp} 
              style={{ 
                background: "transparent", 
                border: "none", 
                color: "#25D366", 
                fontSize: "12px", 
                cursor: "pointer", 
                fontWeight: 600, 
                display: "flex", 
                alignItems: "center", 
                gap: "4px",
                padding: 0
              }}
            >
              <WhatsAppIcon size={14} /> WhatsApp
            </button>
            <span style={{ color: "#E5E7EB" }}>|</span>
            <button 
              onClick={printSlip} 
              style={{ 
                background: "transparent", 
                border: "none", 
                color: "#374151", 
                fontSize: "12px", 
                cursor: "pointer", 
                fontWeight: 600, 
                display: "flex", 
                alignItems: "center", 
                gap: "4px",
                padding: 0
              }}
            >
              <Printer size={14} /> Print Slip
            </button>
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

        {/* Right Panel - List */}
        <Card style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: "12px", padding: "20px 24px" }}>
          <p style={{ fontSize: "10px", fontWeight: 500, letterSpacing: "0.08em", color: "#9CA3AF", textTransform: "uppercase", marginBottom: "16px" }}>INDENT HISTORY</p>
          
          {/* Search & Filter Bar */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={15} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
              <input
                value={historySearch}
                onChange={(e) => {
                  setHistorySearch(e.target.value);
                  if (!e.target.value) load({ page: 1, q: "" });
                }}
                placeholder="Search items…"
                style={{
                  width: "100%",
                  padding: "7px 10px 7px 32px",
                  border: "1px solid #D1D5DB",
                  borderRadius: "8px",
                  background: "#F9FAFB",
                  fontSize: "12px",
                  outline: "none"
                }}
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); load({ page: 1, status: e.target.value }); }}
              style={{
                padding: "7px 10px",
                border: "1px solid #D1D5DB",
                borderRadius: "8px",
                background: "#F9FAFB",
                fontSize: "12px",
                outline: "none"
              }}
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="issued">Issued</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <button
              onClick={() => load({ page: 1, q: historySearch.trim() })}
              style={{
                padding: "7px 14px",
                background: "#1D3557",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "12px",
                cursor: "pointer"
              }}
            >
              Search
            </button>
          </div>

          {loading ? (
            <p style={{ color: COLORS.muted, textAlign: "center", padding: 32 }}>Loading…</p>
          ) : error ? (
            <ErrorMsg error={error} />
          ) : (
            <>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                  <colgroup>
                    <col style={{ width: "22%" }} />
                    <col style={{ width: "16%" }} />
                    <col style={{ width: "46%" }} />
                    <col style={{ width: "16%" }} />
                  </colgroup>
                  <thead>
                    <tr style={{ background: "#F9FAFB" }}>
                      <th style={{ fontSize: "11px", fontWeight: 500, color: "#6B7280", textAlign: "left", padding: "8px 10px", borderBottom: "1px solid #E5E7EB", letterSpacing: "0.04em", textTransform: "uppercase" }}>DEPARTMENT</th>
                      <th style={{ fontSize: "11px", fontWeight: 500, color: "#6B7280", textAlign: "left", padding: "8px 10px", borderBottom: "1px solid #E5E7EB", letterSpacing: "0.04em", textTransform: "uppercase" }}>DATE NEEDED</th>
                      <th style={{ fontSize: "11px", fontWeight: 500, color: "#6B7280", textAlign: "left", padding: "8px 10px", borderBottom: "1px solid #E5E7EB", letterSpacing: "0.04em", textTransform: "uppercase" }}>ITEMS</th>
                      <th style={{ fontSize: "11px", fontWeight: 500, color: "#6B7280", textAlign: "right", padding: "8px 10px", borderBottom: "1px solid #E5E7EB", letterSpacing: "0.04em", textTransform: "uppercase" }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan="4" style={{ textAlign: "center", padding: "40px 20px" }}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                            <Inbox size={32} color="#D1D5DB" />
                            <span style={{ fontSize: "13px", color: "#9CA3AF", marginTop: "8px" }}>
                              No indent requests found
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      items.map((ind) => {
                        const statusInfo = getStatusStyleAndText(ind.status);
                        return (
                          <tr key={ind.id} className="history-table-row">
                            {/* DEPARTMENT */}
                            <td style={{ padding: "10px 8px", verticalAlign: "middle" }}>
                              <span style={{ fontWeight: 500, fontSize: "13px", color: "#111827" }}>
                                {cleanDeptName(ind.dept)}
                              </span>
                            </td>
                            {/* DATE NEEDED */}
                            <td style={{ padding: "10px 8px", verticalAlign: "middle" }}>
                              <span style={{ fontSize: "12px", color: "#6B7280", whiteSpace: "nowrap" }}>
                                {formatDate(ind.date)}
                              </span>
                            </td>
                            {/* ITEMS */}
                            <td style={{ padding: "10px 8px", verticalAlign: "middle" }}>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
                                {(ind.items || []).map((it, i) => (
                                  <div key={i} style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                    <span style={{
                                      background: "#F3F4F6",
                                      border: "1px solid #E5E7EB",
                                      borderRadius: "4px",
                                      padding: "2px 6px",
                                      fontSize: "10px",
                                      fontFamily: "monospace",
                                      color: "#6B7280"
                                    }}>
                                      {it.item_code}
                                    </span>
                                    <span style={{ fontSize: "11px", color: "#374151" }}>
                                      {it.name} · {it.qty} {it.unit || "kg"}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </td>
                            {/* STATUS */}
                            <td style={{ padding: "10px 8px", textAlign: "right", verticalAlign: "middle" }}>
                              <span style={{
                                background: statusInfo.bg,
                                color: statusInfo.color,
                                padding: "2px 10px",
                                borderRadius: "20px",
                                fontSize: "10px",
                                fontWeight: 500,
                                display: "inline-block"
                              }}>
                                {statusInfo.text}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              {items.length > 0 && (
                <Pagination page={page} total={total} limit={LIMIT} onPage={(p) => load({ page: p })} />
              )}
            </>
          )}
        </Card>
      </div>
    </Section>
  );
}
