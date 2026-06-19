import { useState, useEffect, useRef, useCallback } from "react";
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
import { useAuth } from "../../context/AuthContext";
import { useLocalSpeech } from "../../hooks/useLocalSpeech";
import { Plus, Zap, Mic, History, Trash2, Printer, Search, Inbox, ChevronDown, ChevronUp, Camera } from "lucide-react";

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

import { today } from "../../utils/dates";
const LIMIT = 20;

// ── ITEM NAME COMBOBOX ────────────────────────────────────────────────────────
// deptItems = ALL stock names (for search)
// deptJsonItems = dept-specific names (shown at top of results, highlighted)
function ItemNameCombobox({ value, dept, deptItems, deptJsonItems = [], stocks = [], autoFocus, onChange, onSelect }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || "");
  const [highlighted, setHighlighted] = useState(0);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  // Keep query in sync when parent value changes (e.g. chip add, autofill)
  useEffect(() => { setQuery(value || ""); }, [value]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Build filtered list: all matching query, prioritizing dept items if applicable
  const filtered = (() => {
    if (!dept) return [];
    const q = String(query).trim().toLowerCase();
    const deptSet = new Set((deptJsonItems || []).map(n => String(n).toLowerCase()));
    const matching = (deptItems || []).filter(name => !q || String(name).toLowerCase().includes(q));
    // Dept items to top
    const deptMatches = matching.filter(n => deptSet.has(String(n).toLowerCase()));
    const otherMatches = matching.filter(n => !deptSet.has(String(n).toLowerCase()));
    return [...deptMatches, ...otherMatches].slice(0, 60);
  })();

  const handleKey = (e) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") { setOpen(true); setHighlighted(0); }
      return;
    }
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlighted(h => Math.min(h + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)); }
    else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[highlighted]) { onSelect(filtered[highlighted]); setQuery(filtered[highlighted]); setOpen(false); }
    }
    else if (e.key === "Escape") { setOpen(false); }
  };

  const handleChange = (e) => {
    const v = e.target.value;
    setQuery(v);
    onChange(v);
    setOpen(true);
    setHighlighted(0);
  };

  const handleBlur = () => {
    setTimeout(() => setOpen(false), 120);
  };

  const handleSelect = (name) => {
    onSelect(name);
    setQuery(name);
    setOpen(false);
  };

  const deptSet = new Set((deptJsonItems || []).map(n => String(n).toLowerCase()));

  return (
    <div className="item-combobox-wrap" ref={wrapRef}>
      <input
        ref={inputRef}
        className="item-combobox-input"
        value={query}
        autoFocus={autoFocus}
        placeholder="Search item..."
        onChange={handleChange}
        onFocus={() => { setOpen(true); setHighlighted(0); }}
        onBlur={handleBlur}
        onKeyDown={handleKey}
      />
      {open && (
        <div className="item-combobox-dropdown">
          {!dept ? (
            <div className="item-combobox-empty">Please select a department first</div>
          ) : filtered.length === 0 ? (
            <div className="item-combobox-empty">No items found</div>
          ) : (
            filtered.map((name, i) => {
              const stockMatch = stocks.find(s => String(s.name).toLowerCase() === String(name).toLowerCase());
              const isDeptItem = deptSet.has(String(name).toLowerCase());
              return (
                <div
                  key={name}
                  className={`item-combobox-option${highlighted === i ? " active" : ""}`}
                  onMouseDown={() => handleSelect(name)}
                  onMouseEnter={() => setHighlighted(i)}
                >
                  <span style={{ fontWeight: 500, color: "#111827", flex: 1 }}>{name}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                    {isDeptItem && (
                      <span style={{ fontSize: 9, fontWeight: 700, color: "#15803D", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 4, padding: "1px 5px", letterSpacing: "0.04em" }}>DEPT</span>
                    )}
                    {stockMatch && (
                      <span style={{ fontSize: 11, color: "#6B7280", fontFamily: "monospace" }}>{stockMatch.item_code}</span>
                    )}
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}


export default function IndentScreen() {
  const { stockNames, stocks = [], indentPreFill, setIndentPreFill, setCurrentScreen } = useAppContext();
  const { roles } = useAuth();
  const isChef = roles.some((r) => r.key === "chef");
  const [deptsList, setDeptsList] = useState([]);
  const [deptItemsMap, setDeptItemsMap] = useState({});
  const [deptLeftovers, setDeptLeftovers] = useState([]);
  const [availableStock, setAvailableStock] = useState({});

  // Local speech-to-text (Whisper Tiny — no Google, no internet)
  const { listening, statusMsg: speechStatus, startRecording, stopRecording } = useLocalSpeech();
  
  const [form, setForm] = useState({ dept: "", date: today(), indent_type: "routine", items: [{ id: Date.now(), name: "", qty: "", unit: "kg", item_code: "", notes: "" }] });
  const [activeRowIdx, setActiveRowIdx] = useState(0);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(true);
  const [msg, setMsg]   = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loadingScan, setLoadingScan] = useState(false);
  const fileInputRef = useRef(null);
  const { items, total, page, loading, error, fetch } = usePaginatedApi(api.indents.list);

  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState({});
  const [activeCategory, setActiveCategory] = useState("All");
  const [historySearch, setHistorySearch] = useState("");
  const uniqueStockItems = [];
  const seenNames = new Set();
  (stocks || []).forEach(s => {
    if (s && s.name) {
      const nameLower = s.name.toLowerCase();
      if (!seenNames.has(nameLower)) {
        seenNames.add(nameLower);
        uniqueStockItems.push(s);
      }
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

  // ALL unique stock items — used by combobox search and multi-select modal
  const allStockNames = uniqueStockItems.map(s => s.name);

  // Unify the whole stock master: all items available for all departments
  const getFilteredStockItems = () => {
    return uniqueStockItems;
  };

  const filteredStockItems = getFilteredStockItems(); 
  const filteredStockNames = filteredStockItems.map(s => s.name); 

  // Get department items from JSON (plain strings) — used ONLY for Quick Add suggestion chips
  const deptJsonItems = form.dept
    ? (deptItemsMap[form.dept] || deptItemsMap[form.dept.toUpperCase()] || [])
    : [];

  // Quick-add suggestion chips: first 5 items from the JSON for the selected dept
  const suggestedChips = deptJsonItems.slice(0, 5);

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
        } else {
          const validNames = res.data.map(d => d.name);
          setForm((f) => {
            if (!f.dept || !validNames.includes(f.dept)) {
              loadLeftovers(res.data[0].name);
              return { ...f, dept: res.data[0].name };
            }
            loadLeftovers(f.dept);
            return f;
          });
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
    setForm((f) => ({ ...f, dept: val, items: [{ id: Date.now(), name: "", qty: "", unit: "kg", item_code: "", notes: "" }] }));
    loadLeftovers(val);
  };

  const addRow = () => {
    setForm((f) => ({ ...f, items: [...f.items, { id: Date.now() + Math.random(), name: "", qty: "", unit: "kg", item_code: "", notes: "" }] }));
    setActiveRowIdx(form.items.length); // Focus on the new row
  };
  const removeRow = (idx) => setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  const clearAll = () => {
    setForm((f) => ({ ...f, items: [] }));
    setActiveRowIdx(0);
  };

  // Add a suggestion chip (plain string name from dept JSON)
  const addSuggestionChip = (itemName) => {
    setForm(prev => {
      const exists = prev.items.some(it => it.name.toLowerCase() === itemName.toLowerCase());
      if (exists) {
        console.warn(`Item "${itemName}" already in list`);
        return prev;
      }
      // Try to find matching stock for code/unit, else use defaults
      const stockMatch = stocks.find(s => s.name.toLowerCase() === itemName.toLowerCase());
      const baseItems = (prev.items.length === 1 && !prev.items[0].name) ? [] : prev.items;
      const newRow = {
        id: Date.now() + Math.random(),
        name: itemName,
        qty: "",
        unit: stockMatch?.unit || "kg",
        item_code: stockMatch?.item_code || "",
        notes: ""
      };
      fetchStockLevels([itemName]);
      return { ...prev, items: [...baseItems, newRow] };
    });
  };

  // Select an item from the combobox dropdown
  const selectComboItem = (idx, itemName) => {
    const stockMatch = stocks.find(s => s.name.toLowerCase() === itemName.toLowerCase());
    setForm(f => {
      const newItems = f.items.map((it, i) => {
        if (i !== idx) return it;
        return {
          ...it,
          name: itemName,
          unit: stockMatch?.unit || it.unit || "kg",
          item_code: stockMatch?.item_code || it.item_code || "",
        };
      });
      return { ...f, items: newItems };
    });
    if (stockMatch) fetchStockLevels([itemName]);
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

  const handleScanClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoadingScan(true);
    setMsg("Uploading and scanning slip...");

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64String = reader.result.split(",")[1];
        const res = await api.scan.indent(base64String, file.type);
        if (res.success && res.data) {
          const parsed = res.data;
          
          let updatedDept = form.dept;
          if (parsed.dept) {
            const matchedDept = deptsList.find(d => d.name.toLowerCase() === parsed.dept.toLowerCase());
            if (matchedDept) {
              updatedDept = matchedDept.name;
            }
          }

          const parsedItems = (parsed.items || []).map(it => ({
            id: Date.now() + Math.random(),
            name: it.name.toUpperCase(),
            qty: (it.qty != null ? it.qty : "").toString(),
            unit: it.unit || "pcs",
            item_code: it.item_code || "KPL-NEW",
            notes: "",
            qtyMissing: it.qty == null,
          }));

          if (parsedItems.length > 0) {
            setForm(prev => {
              const baseItems = (prev.items.length === 1 && !prev.items[0].name) ? [] : prev.items;
              return {
                ...prev,
                dept: updatedDept,
                items: [...baseItems, ...parsedItems]
              };
            });
            fetchStockLevels(parsedItems.map(it => it.name));
            const missingQty = parsedItems.filter(it => it.qtyMissing).length;
            const missingMsg = missingQty > 0 ? ` — ⚠ ${missingQty} item${missingQty > 1 ? "s" : ""} need quantity` : "";
            setMsg(`Scanned: ${parsedItems.length} items added ✓${missingMsg}`);
          } else {
            setMsg("No items could be recognized from the document.");
          }
        } else {
          setMsg("Scan failed: " + (res.error || "Unknown error"));
        }
      } catch (err) {
        setMsg("Scan failed: " + err.message);
      } finally {
        setLoadingScan(false);
        e.target.value = null;
        setTimeout(() => setMsg(""), 4000);
      }
    };
    reader.readAsDataURL(file);
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

    // Replace commas, "and", and punctuation with spaces for robust tokenization
    const cleanText = normalized
      .replace(/,|\band\b/g, " ")
      .replace(/[.\/#!$%\^&\*;:{}=\-_`~()]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // Match either number (with optional units) or text sequences
    const tokenRegex = /[a-z]+(?:\s+[a-z]+)*|\d+(?:\.\d+)?(?:\s*(?:packets|packet|litres|litre|bundles|bundle|boxes|box|bottles|bottle|kgs|kg|pcs|l\b))?/gi;
    const rawTokens = cleanText.match(tokenRegex) || [];

    const parsedTokens = rawTokens.map(token => {
      if (/^\d/.test(token)) {
        const match = token.match(/^(\d+(?:\.\d+)?)\s*(.*)$/i);
        return {
          type: "number",
          qty: match[1],
          unit: match[2]?.trim().toLowerCase() || null
        };
      } else {
        return {
          type: "text",
          text: token.trim()
        };
      }
    });

    // Merge consecutive text tokens
    const mergedTokens = [];
    for (let j = 0; j < parsedTokens.length; j++) {
      const current = parsedTokens[j];
      if (current.type === "text") {
        if (mergedTokens.length > 0 && mergedTokens[mergedTokens.length - 1].type === "text") {
          mergedTokens[mergedTokens.length - 1].text += " " + current.text;
        } else {
          mergedTokens.push(current);
        }
      } else {
        mergedTokens.push(current);
      }
    }

    const normalizeUnit = (unit) => {
      if (!unit) return "kg";
      const u = unit.toLowerCase();
      if (u === "kg" || u === "kgs") return "kg";
      if (u === "g") return "g";
      if (u === "l" || u === "litre" || u === "litres") return "L";
      if (u === "ml") return "ml";
      if (u === "pcs" || u === "piece" || u === "pieces") return "pcs";
      if (u === "dozen") return "dozen";
      if (u === "box" || u === "boxes") return "box";
      if (u === "plates") return "plates";
      if (u === "portions") return "portions";
      return "kg";
    };

    const parsedPairs = [];
    let i = 0;
    while (i < mergedTokens.length) {
      const current = mergedTokens[i];
      
      if (current.type === "text") {
        const next = mergedTokens[i + 1];
        if (next && next.type === "number") {
          parsedPairs.push({
            name: current.text,
            qty: next.qty,
            unit: normalizeUnit(next.unit)
          });
          i += 2;
        } else {
          parsedPairs.push({
            name: current.text,
            qty: "1",
            unit: "kg"
          });
          i += 1;
        }
      } else if (current.type === "number") {
        const next = mergedTokens[i + 1];
        if (next && next.type === "text") {
          parsedPairs.push({
            name: next.text,
            qty: current.qty,
            unit: normalizeUnit(current.unit)
          });
          i += 2;
        } else {
          i += 1;
        }
      }
    }

    const added = [];
    parsedPairs.forEach(item => {
      const cleanName = item.name.toLowerCase();
      if (cleanName.length < 2) return;

      const matched = uniqueStockItems.find(s => 
        s.name.toLowerCase().includes(cleanName) || cleanName.includes(s.name.toLowerCase())
      );

      if (matched) {
        added.push({
          name: matched.name,
          qty: item.qty,
          unit: matched.unit,
          item_code: matched.item_code
        });
      } else {
        added.push({
          name: item.name.toUpperCase(),
          qty: item.qty,
          unit: item.unit,
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
    const typeLabel = form.indent_type === "adhoc" ? "Ad-Hoc (Emergency)" : "Routine (Nightly)";
    return `*KAPILA INVENTORY - INDENT REQUEST*\n` +
           `*Type:* ${typeLabel}\n` +
           `*Department:* ${form.dept}\n` +
           `*Date Needed:* ${form.date}\n\n` +
           `*Items Requested:*\n${itemsText}`;
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(getShareText());
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const printSlip = () => {
    const escapeHtml = (unsafe) => {
      return (unsafe || "").toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    const itemsHtml = form.items
      .filter(i => i.name && i.qty)
      .map(i => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${escapeHtml(i.item_code || "N/A")}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">${escapeHtml(i.name)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${escapeHtml(i.qty)} ${escapeHtml(i.unit || "kg")}</td>
        </tr>
      `).join("");

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Indent Slip - ${escapeHtml(form.dept)}</title>
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
            <h3 style="margin: 6px 0 0; font-size: 16px; letter-spacing: 0.05em; color: #475569; text-transform: uppercase;">Indent Slip</h3>
            <span style="display:inline-block; margin-top:4px; padding: 3px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; letter-spacing: 0.04em; background: ${form.indent_type === 'adhoc' ? '#FEF3C7' : '#DCFCE7'}; color: ${form.indent_type === 'adhoc' ? '#92400E' : '#166534'}; border: 1px solid ${form.indent_type === 'adhoc' ? '#FCD34D' : '#86EFAC'}">${form.indent_type === 'adhoc' ? '⚡ AD-HOC INDENT' : '✓ ROUTINE INDENT'}</span>
          </div>
          <div class="details">
            <p><strong>Department:</strong> ${escapeHtml(form.dept)}</p>
            <p><strong>Date Needed:</strong> ${escapeHtml(form.date)}</p>
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
      await api.indents.create({ ...form, indent_type: form.indent_type || "routine", items: validItems.map((i) => ({ ...i, qty: parseFloat(i.qty), unit: i.unit || "kg", item_code: i.item_code || "KPL-NEW" })) });
      localStorage.removeItem("kapila_indent_draft");
      setForm({ dept: deptsList[0]?.name || "", date: today(), indent_type: "routine", items: [{ name: "", qty: "", unit: "kg", item_code: "" }] });
      setMsg("Indent submitted ✓");
      setTimeout(() => setMsg(""), 2000);
      load({ page: 1 });
    } catch (e) { setMsg("Error: " + e.message); }
  };

  
  return (
    <Section 
      title="Indent Request" 
      sub="Departments submit nightly material requirements"
      onBack={isChef ? () => setCurrentScreen("chef_home") : null}
    >
      <div className="indent-page-wrapper">
        
        {/* --- TOP: NEW INDENT FORM --- */}
        <div className="indent-top-section">
          
          {/* LEFT PANEL */}
          <div className="indent-left-panel">
            <Card style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: "12px", padding: "20px 24px", height: "100%", display: "flex", flexDirection: "column" }}>
              <p style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.05em", color: "#475569", textTransform: "uppercase", marginBottom: "20px" }}>NEW INDENT FORM</p>
              
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: "12px", color: "#475569", marginBottom: "6px", display: "block", fontWeight: 500 }}>
                  Department
                </label>
                <select className="indent-field" value={form.dept} onChange={handleDeptChange}>
                  {deptsList.map((d) => <option key={d.id} value={d.name}>{d.name} ({d.code})</option>)}
                </select>
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: "12px", color: "#475569", marginBottom: "6px", display: "block", fontWeight: 500 }}>
                  Date Needed
                </label>
                <input className="indent-field" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
              </div>

              {/* Indent Type Toggle */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: "12px", color: "#475569", marginBottom: "8px", display: "block", fontWeight: 500 }}>
                  Indent Type
                </label>
                <div style={{ display: "flex", borderRadius: 10, overflow: "hidden", border: "1px solid #E2E8F0", background: "#F8FAFC" }}>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, indent_type: "routine" }))}
                    style={{
                      flex: 1, padding: "9px 0", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12,
                      transition: "all 0.18s",
                      background: form.indent_type === "routine" ? "#1e293b" : "transparent",
                      color: form.indent_type === "routine" ? "#ffffff" : "#64748b",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                    }}
                  >
                    <span style={{ fontSize: 14 }}>✓</span> Routine
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, indent_type: "adhoc" }))}
                    style={{
                      flex: 1, padding: "9px 0", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12,
                      transition: "all 0.18s",
                      background: form.indent_type === "adhoc" ? "#d97706" : "transparent",
                      color: form.indent_type === "adhoc" ? "#ffffff" : "#64748b",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                    }}
                  >
                    <span style={{ fontSize: 14 }}>⚡</span> Ad-Hoc
                  </button>
                </div>
                <p style={{ fontSize: 11, color: form.indent_type === "adhoc" ? "#92400E" : "#64748b", marginTop: 6, background: form.indent_type === "adhoc" ? "#FEF3C7" : "#F1F5F9", borderRadius: 6, padding: "5px 8px" }}>
                  {form.indent_type === "adhoc"
                    ? "⚡ Emergency indent — stock is critically low or exhausted."
                    : "✓ Regular nightly indent for tomorrow's service."}
                </p>
              </div>

              {/* Quick Add Suggestions — sourced from department_items.json */}
              {form.dept && suggestedChips.length > 0 && (
                <div style={{ marginTop: 4, marginBottom: 16 }}>
                  <p style={{ fontSize: 11, color: "#6B7280", fontWeight: 500, marginBottom: 8, letterSpacing: "0.02em" }}>Quick Add Suggestions</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {suggestedChips.map(itemName => (
                      <button
                        key={itemName}
                        onClick={() => addSuggestionChip(itemName)}
                        className="chip-suggestion"
                        title={`Add ${itemName}`}
                      >
                        <span style={{ marginRight: 3, fontSize: 12, lineHeight: 1 }}>+</span>{itemName}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "24px", marginTop: "auto" }}>
                <button className="action-btn primary-outline" onClick={addRow}>
                  <Plus size={15} /> Add Item
                </button>
                <button className="action-btn secondary-outline" onClick={() => { setSelectedItems({}); setShowModal(true); }}>
                  <Zap size={15} /> Add Multi
                </button>
                <button onClick={startListening} className={`action-btn subtle ${listening ? 'listening' : ''}`}>
                  <Mic size={15} color={listening ? "#EF4444" : "#475569"} />
                  {listening ? "Recording..." : "Voice Input"}
                </button>
                <button className="action-btn subtle" onClick={smartAutofill}>
                  <History size={15} /> Autofill History
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  style={{ display: "none" }}
                />
                <button 
                  className="action-btn subtle" 
                  onClick={handleScanClick} 
                  style={{ gridColumn: "span 2" }}
                  disabled={loadingScan}
                >
                  {loadingScan ? (
                    <>
                      <div style={{ width: 14, height: 14, border: "2px solid #475569", borderTopColor: "transparent", borderRadius: "50%", marginRight: 6, display: "inline-block", verticalAlign: "middle", animation: "spin 1s linear infinite" }} />
                      Scanning Slip...
                    </>
                  ) : (
                    <>
                      <Camera size={15} /> Scan Slip/Image
                    </>
                  )}
                </button>
              </div>

              {/* Share Order */}
              <div style={{ marginTop: "auto" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #E5E7EB" }}>
                  <span style={{ color: "#64748B", fontSize: "12px", fontWeight: 500 }}>Share Order:</span>
                  <button onClick={shareWhatsApp} className="share-btn whatsapp">
                    <WhatsAppIcon size={14} /> WhatsApp
                  </button>
                  <span style={{ color: "#E5E7EB" }}>|</span>
                  <button onClick={printSlip} className="share-btn print">
                    <Printer size={14} /> Print Slip
                  </button>
                </div>
              </div>
            </Card>
          </div>

          {/* RIGHT PANEL */}
          <div className="indent-right-panel">
            <Card style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: "12px", padding: "0", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F8FAFC" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.05em", color: "#475569", textTransform: "uppercase" }}>Indent Items</span>
                <button onClick={clearAll} style={{ background: "transparent", border: "none", color: "#EF4444", fontSize: "12px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Trash2 size={13} /> Clear All
                </button>
              </div>
              <div className="table-container resp-table-wrap" style={{ flex: 1, overflowY: "auto" }}>
                <table className="excel-table">
                  <colgroup>
                    <col style={{ width: "40px" }} />
                    <col style={{ width: "90px" }} />
                    <col style={{ width: "auto" }} />
                    <col style={{ width: "80px" }} />
                    <col style={{ width: "80px" }} />
                    <col style={{ width: "80px" }} />
                    <col style={{ width: "120px" }} />
                    <col style={{ width: "50px" }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Item Code</th>
                      <th>Item Name</th>
                      <th>Qty</th>
                      <th>Unit</th>
                      <th>Avail</th>
                      <th>Notes</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.items.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: "center", padding: "40px 20px" }}>
                          <span style={{ color: "#94a3b8", fontSize: "13px" }}>No items added yet.<br/>Click "+ Add Item" to get started.</span>
                        </td>
                      </tr>
                    ) : (
                      form.items.map((item, idx) => {
                        const cleanName = item.name.toLowerCase().trim();
                        const availObj = availableStock[cleanName];
                        const avail = availObj?.available ?? availObj;
                        const isStockCheckActive = item.name && avail !== undefined && avail !== null;
                        const isLowStock = isStockCheckActive && Number(avail) < (parseFloat(item.qty) || 0);
                        const isNewItem = item.item_code === "KPL-NEW" || !item.item_code;
                        const isActive = activeRowIdx === idx;
                        const isQtyMissing = item.qtyMissing || (item.qty === "" && item.name);

                        return (
                          <tr key={item.id || idx} className={`excel-row ${isActive ? 'active-row' : ''}`} onClick={() => setActiveRowIdx(idx)} style={isQtyMissing ? { background: "#fffbeb", borderLeft: "3px solid #f59e0b" } : {}}>
                            <td className="row-num">{idx + 1}</td>
                            <td>
                              <span className={`kpl-badge ${isNewItem ? 'new' : 'existing'}`}>
                                {item.item_code || "NEW"}
                              </span>
                            </td>
                            <td style={{ position: "relative" }}>
                              <ItemNameCombobox
                                value={item.name}
                                dept={form.dept}
                                deptItems={allStockNames}
                                deptJsonItems={deptJsonItems}
                                stocks={stocks}
                                autoFocus={isActive}
                                onChange={(val) => updateItem(idx, "name", val)}
                                onSelect={(name) => selectComboItem(idx, name)}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                value={item.qty}
                                onChange={(e) => updateItem(idx, "qty", e.target.value)}
                                className="excel-input"
                                placeholder={isQtyMissing ? "Fill qty" : ""}
                                style={isQtyMissing ? { borderColor: "#f59e0b", background: "#fef3c7", color: "#92400e" } : {}}
                              />
                            </td>
                            <td>
                              <select 
                                value={item.unit} 
                                onChange={(e) => updateItem(idx, "unit", e.target.value)}
                                className="excel-input"
                              >
                                {["kg", "g", "L", "ml", "pcs", "dozen", "box", "plates", "portions"].map(u => <option key={u} value={u}>{u}</option>)}
                              </select>
                            </td>
                            <td>
                              {isStockCheckActive ? (
                                <span className={`stock-cell ${isLowStock ? 'low' : 'ok'}`}>
                                  {Number(avail).toFixed(2)}
                                </span>
                              ) : <span style={{ color: "#cbd5e1" }}>-</span>}
                            </td>
                            <td>
                              <input
                                value={item.notes || ""}
                                onChange={(e) => updateItem(idx, "notes", e.target.value)}
                                placeholder="Notes..."
                                className="excel-input"
                              />
                            </td>
                            <td style={{ textAlign: "center", verticalAlign: "middle" }}>
                              <button onClick={(e) => { e.stopPropagation(); removeRow(idx); }} className="row-delete-btn">
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <div style={{ padding: "12px 16px", borderTop: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F8FAFC" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <button onClick={addRow} className="add-row-btn">[ + Add row ]</button>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>Total items: {form.items.filter(i => i.name).length}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  {msg && <span style={{ color: COLORS.success, fontSize: 13, fontWeight: 500 }}>{msg}</span>}
                  <button className="submit-indent-btn" onClick={submit} disabled={form.items.filter((i) => i.name && i.qty).length === 0} style={{ width: "auto", padding: "8px 24px", margin: 0 }}>
                    Submit Indent
                  </button>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* --- BOTTOM: INDENT HISTORY --- */}
        <div className="indent-history-section">
          <Card style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: "12px", padding: "20px 24px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "space-between", alignItems: "center", marginBottom: isHistoryExpanded ? "16px" : "0" }}>
              <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b", margin: 0, display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }} onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}>
                Indent History
                {isHistoryExpanded ? <ChevronUp size={16} color="#64748b" /> : <ChevronDown size={16} color="#64748b" />}
              </h2>
              {isHistoryExpanded && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                  <div style={{ position: "relative" }}>
                    <Search size={15} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
                    <input
                      value={historySearch}
                      onChange={(e) => { setHistorySearch(e.target.value); if (!e.target.value) load({ page: 1, q: "" }); }}
                      placeholder="Search items…"
                      style={{ padding: "7px 10px 7px 32px", border: "1px solid #D1D5DB", borderRadius: "8px", background: "#F9FAFB", fontSize: "12px", outline: "none", width: "180px" }}
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); load({ page: 1, status: e.target.value }); }}
                    style={{ padding: "7px 10px", border: "1px solid #D1D5DB", borderRadius: "8px", background: "#F9FAFB", fontSize: "12px", outline: "none" }}
                  >
                    <option value="">All statuses</option>
                    <option value="pending">Pending</option>
                    <option value="issued">Issued</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <button onClick={() => load({ page: 1, q: historySearch.trim() })} style={{ padding: "7px 14px", background: "#1D3557", color: "white", border: "none", borderRadius: "8px", fontSize: "12px", cursor: "pointer" }}>
                    Search
                  </button>
                </div>
              )}
            </div>

            {isHistoryExpanded && (
              <>
                {loading ? <p style={{ color: COLORS.muted, textAlign: "center", padding: 32 }}>Loading…</p> : error ? <ErrorMsg error={error} /> : (
                  <>
                    <div className="resp-table-wrap">
                      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                        <colgroup>
                          <col style={{ width: "20%" }} />
                          <col style={{ width: "10%" }} />
                          <col style={{ width: "13%" }} />
                          <col style={{ width: "41%" }} />
                          <col style={{ width: "16%" }} />
                        </colgroup>
                        <thead>
                          <tr style={{ background: "#F9FAFB" }}>
                            <th style={{ fontSize: "11px", fontWeight: 500, color: "#6B7280", textAlign: "left", padding: "8px 10px", borderBottom: "1px solid #E5E7EB", letterSpacing: "0.04em", textTransform: "uppercase" }}>DEPARTMENT</th>
                            <th style={{ fontSize: "11px", fontWeight: 500, color: "#6B7280", textAlign: "left", padding: "8px 10px", borderBottom: "1px solid #E5E7EB", letterSpacing: "0.04em", textTransform: "uppercase" }}>DATE</th>
                            <th style={{ fontSize: "11px", fontWeight: 500, color: "#6B7280", textAlign: "left", padding: "8px 10px", borderBottom: "1px solid #E5E7EB", letterSpacing: "0.04em", textTransform: "uppercase" }}>TYPE</th>
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
                                  <span style={{ fontSize: "13px", color: "#9CA3AF", marginTop: "8px" }}>No indent requests found</span>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            items.map((ind) => {
                              const statusInfo = getStatusStyleAndText(ind.status);
                              const isAdhoc = (ind.indent_type || "routine") === "adhoc";
                              return (
                                <tr key={ind.id} className="history-table-row">
                                  <td style={{ padding: "10px 8px", verticalAlign: "middle" }}><span style={{ fontWeight: 500, fontSize: "13px", color: "#111827" }}>{cleanDeptName(ind.dept)}</span></td>
                                  <td style={{ padding: "10px 8px", verticalAlign: "middle" }}><span style={{ fontSize: "12px", color: "#6B7280", whiteSpace: "nowrap" }}>{formatDate(ind.date)}</span></td>
                                  <td style={{ padding: "10px 8px", verticalAlign: "middle" }}>
                                    <span style={{
                                      display: "inline-flex", alignItems: "center", gap: 3,
                                      padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700,
                                      background: isAdhoc ? "#FEF3C7" : "#D1FAE5",
                                      color: isAdhoc ? "#92400E" : "#065F46",
                                      border: `1px solid ${isAdhoc ? "#FCD34D" : "#6EE7B7"}`,
                                      whiteSpace: "nowrap",
                                    }}>
                                      {isAdhoc ? "⚡ Ad-Hoc" : "✓ Routine"}
                                    </span>
                                  </td>
                                  <td style={{ padding: "10px 8px", verticalAlign: "middle" }}>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
                                      {(ind.items || []).map((it, i) => (
                                        <div key={i} style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                          <span style={{ background: "#F3F4F6", border: "1px solid #E5E7EB", borderRadius: "4px", padding: "2px 6px", fontSize: "10px", fontFamily: "monospace", color: "#6B7280" }}>{it.item_code}</span>
                                          <span style={{ fontSize: "11px", color: "#374151" }}>{it.name} · {it.qty} {it.unit || "kg"}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </td>
                                  <td style={{ padding: "10px 8px", textAlign: "right", verticalAlign: "middle" }}>
                                    <span style={{ background: statusInfo.bg, color: statusInfo.color, padding: "2px 10px", borderRadius: "20px", fontSize: "10px", fontWeight: 500, display: "inline-block" }}>{statusInfo.text}</span>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                    {items.length > 0 && <Pagination page={page} total={total} limit={LIMIT} onPage={(p) => load({ page: p })} />}
                  </>
                )}
              </>
            )}
          </Card>
        </div>

        {/* Modal Logic (Outside the main flow, preserving functionality) */}
        {showModal && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0, 0, 0, 0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }}>
            <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, width: 520, padding: 24, display: "flex", flexDirection: "column", maxHeight: "85vh", boxShadow: "0 10px 25px rgba(0,0,0,0.5)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, color: COLORS.accent, fontWeight: 600, margin: 0 }}>📦 Select Multiple Items</h3>
                <button onClick={() => setShowModal(false)} style={{ background: "transparent", color: COLORS.muted, fontSize: 16, border: "none", cursor: "pointer" }}>✕</button>
              </div>
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Type to filter items..." style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.text, borderRadius: 6, padding: "8px 12px", marginBottom: 16, width: "100%", fontSize: 13 }} />
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14, borderBottom: `1px solid ${COLORS.border}33`, paddingBottom: 10 }}>
                {["All", "Grocery", "Dairy", "Vegetables", "Disposables", "Others"].map(cat => (
                  <button key={cat} onClick={() => setActiveCategory(cat)} style={{ background: activeCategory === cat ? COLORS.accent + "22" : "transparent", border: `1px solid ${activeCategory === cat ? COLORS.accent : COLORS.border + "aa"}`, borderRadius: 4, padding: "4px 10px", fontSize: 11, color: activeCategory === cat ? COLORS.accent : COLORS.muted, cursor: "pointer", fontWeight: 600, transition: "all 0.15s" }}>{cat}</button>
                ))}
              </div>
              <div style={{ flex: 1, overflowY: "auto", marginBottom: 16, display: "flex", flexDirection: "column", gap: 6, maxHeight: 260, paddingRight: 6 }}>
                {uniqueStockItems.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).filter(s => activeCategory === "All" || getItemCategory(s.name) === activeCategory).map((s) => {
                  const isChecked = !!selectedItems[s.name];
                  return (
                    <label key={s.item_code} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: isChecked ? COLORS.accent + "11" : COLORS.bg + "44", border: `1px solid ${isChecked ? COLORS.accent + "44" : COLORS.border + "44"}`, borderRadius: 6, cursor: "pointer", transition: "all 0.15s" }}>
                      <input type="checkbox" checked={isChecked} onChange={() => setSelectedItems(prev => ({ ...prev, [s.name]: !prev[s.name] }))} style={{ width: "auto", cursor: "pointer" }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <p style={{ fontSize: 13, fontWeight: 500, color: COLORS.text, margin: 0 }}>{s.name}</p>
                          <span style={{ fontSize: 9, color: COLORS.muted, background: COLORS.border + "33", padding: "1px 5px", borderRadius: 3 }}>{getItemCategory(s.name)}</span>
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

      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .indent-page-wrapper {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .indent-top-section {
          display: flex;
          gap: 16px;
          min-height: 600px;
        }
        .indent-left-panel {
          width: 35%;
          min-width: 320px;
        }
        .indent-right-panel {
          width: 65%;
        }

        @media (max-width: 767px) {
          .indent-top-section {
            flex-direction: column;
            height: auto;
            min-height: unset;
          }
          .indent-left-panel, .indent-right-panel {
            width: 100%;
            min-width: 100%;
          }
        }
        .indent-history-section {
          width: 100%;
        }
        
        .indent-field {
          width: 100%; padding: 8px 12px; border: 1px solid #E2E8F0; border-radius: 8px; background: #fff; font-size: 13px; outline: none; transition: border-color 0.15s;
        }
        .indent-field:focus { border-color: #3b82f6; }
        
        .chip-suggestion {
          background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 999px; padding: 4px 12px;
          font-size: 12px; color: #15803D; cursor: pointer; font-weight: 500; transition: all 0.15s;
          display: inline-flex; align-items: center; gap: 2px;
        }
        .chip-suggestion:hover { background: #DCFCE7; border-color: #86EFAC; }

        /* Item Name Combobox */
        .item-combobox-wrap { position: relative; width: 100%; height: 100%; }
        .item-combobox-input { width: 100%; height: 100%; border: none; background: transparent; padding: 10px; font-size: 13px; color: #1e293b; outline: none; box-sizing: border-box; }
        .item-combobox-input:focus { background: white; }
        .item-combobox-dropdown {
          position: absolute; top: calc(100% + 2px); left: -1px; right: -1px;
          background: #fff; border: 1px solid #E5E7EB; border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.10); z-index: 9999;
          max-height: 200px; overflow-y: auto;
        }
        .item-combobox-option {
          padding: 8px 12px; font-size: 13px; display: flex; justify-content: space-between;
          align-items: center; cursor: pointer; transition: background 0.1s;
        }
        .item-combobox-option:hover, .item-combobox-option.active { background: #F9FAFB; }
        .item-combobox-empty { padding: 10px 12px; font-size: 12px; color: #9CA3AF; }
        
        .action-btn {
          padding: 8px 10px; border-radius: 8px; font-size: 12px; display: flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer; transition: all 0.15s; font-weight: 500; height: 40px;
        }
        .action-btn.primary-outline { border: 1px solid #1e293b; background: white; color: #1e293b; }
        .action-btn.primary-outline:hover { background: #f8fafc; }
        .action-btn.secondary-outline { border: 1px solid #cbd5e1; background: white; color: #475569; }
        .action-btn.secondary-outline:hover { background: #f8fafc; }
        .action-btn.subtle { border: 1px solid transparent; background: #f1f5f9; color: #475569; }
        .action-btn.subtle:hover { background: #e2e8f0; }
        .action-btn.subtle.listening { background: #fef2f2; color: #ef4444; border: 1px solid #fca5a5; }

        .submit-indent-btn {
          width: 100%; padding: 12px; background: #1a1a2e; color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: opacity 0.15s;
        }
        .submit-indent-btn:hover { opacity: 0.9; }
        .submit-indent-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .share-btn { background: transparent; border: none; font-size: 12px; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 4px; padding: 0; }
        .share-btn.whatsapp { color: #22c55e; }
        .share-btn.print { color: #475569; }
        
        /* Excel Table Styles */
        .table-container { scrollbar-width: thin; }
        .excel-table { width: 100%; border-collapse: collapse; }
        .excel-table th { background: #f8fafc; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; padding: 6px 10px; font-size: 11px; font-weight: 600; color: #475569; text-transform: uppercase; text-align: left; position: sticky; top: 0; z-index: 2; }
        .excel-table td { border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; padding: 0; position: relative; }
        .excel-table tr.excel-row:nth-child(even) { background-color: #fafafa; }
        .excel-table tr.excel-row:hover { background-color: #f1f5f9; }
        .excel-table tr.active-row td { border-top: 2px solid #3b82f6; border-bottom: 2px solid #3b82f6; }
        .excel-table tr.active-row td:first-child { border-left: 2px solid #3b82f6; }
        .excel-table tr.active-row td:last-child { border-right: 2px solid #3b82f6; }
        
        .row-num { padding: 8px 10px !important; color: #94a3b8; font-size: 11px; text-align: center; }
        
        .kpl-badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; margin-left: 10px; }
        .kpl-badge.existing { background: #e2e8f0; color: #475569; }
        .kpl-badge.new { background: #fef3c7; color: #d97706; }
        
        .excel-input { width: 100%; height: 100%; border: none; background: transparent; padding: 10px; font-size: 13px; color: #1e293b; outline: none; box-sizing: border-box; }
        .excel-input:focus { background: white; }
        
        .stock-cell { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 600; margin-left: 10px; }
        .stock-cell.ok { color: #16a34a; background: #dcfce7; }
        .stock-cell.low { color: #dc2626; background: #fee2e2; }

        .row-delete-btn { background: transparent; border: none; color: #ef4444; padding: 8px; cursor: pointer; opacity: 0; transition: opacity 0.15s; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
        .excel-row:hover .row-delete-btn { opacity: 1; }

        .add-row-btn { width: 100%; padding: 8px; text-align: left; background: transparent; border: 1px dashed transparent; color: #64748b; font-size: 13px; cursor: pointer; transition: all 0.15s; font-weight: 500; }
        .add-row-btn:hover { border-color: #cbd5e1; background: white; color: #1e293b; }

        @media (max-width: 1024px) {
          .indent-top-section { flex-direction: column; height: auto; }
          .indent-left-panel, .indent-right-panel { width: 100%; }
          .indent-right-panel { min-height: 400px; }
        }
      `}}/>
    </Section>
  );
}
