import { useState, useEffect } from "react";
import Section from "../../components/Section";
import Card from "../../components/Card";
import ErrorMsg from "../../components/ErrorMsg";
import { COLORS } from "../../styles/colors";
import * as api from "../../api";
import { useAppContext } from "../../context/AppContext";

export default function WasteAnalyticsScreen({ noSection }) {
  const { stocks } = useAppContext();
  const [productionList, setProductionList] = useState([]);
  const [leftoversList, setLeftoversList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const prodRes = await api.production.list({ limit: 100 });
      const leftRes = await api.leftovers.list({ limit: 100 });
      if (prodRes.success) setProductionList(prodRes.data || []);
      if (leftRes.success) setLeftoversList(leftRes.data || []);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute metrics
  // Group production & waste by department
  const deptStats = {};
  productionList.forEach(p => {
    const d = p.dept || "Unknown";
    if (!deptStats[d]) {
      deptStats[d] = { plates: 0, issuances: 0, leftovers: 0, wastePct: 0, cost: 0 };
    }
    deptStats[d].plates += parseFloat(p.plates_made || p.plates || 0);
  });

  leftoversList.forEach(l => {
    const d = l.dept || "Unknown";
    if (!deptStats[d]) {
      deptStats[d] = { plates: 0, issuances: 0, leftovers: 0, wastePct: 0, cost: 0 };
    }
    deptStats[d].leftovers += parseFloat(l.qty || 0);
  });

  Object.values(deptStats).forEach(stats => {
    stats.wastePct = stats.plates > 0 ? (stats.leftovers / stats.plates) * 100 : 0;
  });

  // Calculate waste cost
  // Fetch pricing from stock master or fallback to approximate pricing
  let totalLeftoverCost = 0;
  leftoversList.forEach(l => {
    let price = 0; // Default to 0 instead of arbitrary 50
    const name = l.item?.toLowerCase() || "";
    const stockMatch = stocks.find(s => s.name?.toLowerCase() === name);
    
    if (stockMatch && stockMatch.price) {
      price = parseFloat(stockMatch.price);
    }
    
    totalLeftoverCost += parseFloat(l.qty || 0) * price;
  });

  const totalPlates = productionList.reduce((acc, curr) => acc + parseFloat(curr.plates_made || curr.plates || 0), 0);
  const totalLeftovers = leftoversList.reduce((acc, curr) => acc + parseFloat(curr.qty || 0), 0);
  const averageWastePct = totalPlates > 0 ? (totalLeftovers / totalPlates) * 100 : 0;

  const content = loading ? (
    <p style={{ color: COLORS.muted, textAlign: "center", padding: 32 }}>Loading metrics…</p>
  ) : error ? (
    <ErrorMsg error={error} />
  ) : (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Key Metrics Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
        <Card>
          <p style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>Total Plates Cooked</p>
          <h2 style={{ fontSize: 28, color: COLORS.accent, fontWeight: 700, margin: 0 }}>{totalPlates} <span style={{ fontSize: 13, color: COLORS.muted, fontWeight: 400 }}>plates</span></h2>
        </Card>

        <Card>
          <p style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>Average Plates Wasted / Leftover</p>
          <h2 style={{ fontSize: 28, color: COLORS.coral, fontWeight: 700, margin: 0 }}>
            {averageWastePct.toFixed(1)}% 
            <span style={{ fontSize: 13, color: COLORS.muted, fontWeight: 400, marginLeft: 8 }}>({totalLeftovers} plates total)</span>
          </h2>
        </Card>

        <Card>
          <p style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>Estimated Raw Leftovers Value</p>
          <h2 style={{ fontSize: 28, color: COLORS.success, fontWeight: 700, margin: 0 }}>₹{totalLeftoverCost.toLocaleString()}</h2>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        {/* Department Waste Cost Visualizer */}
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${COLORS.border}` }}>
            <h3 style={{ fontSize: 14, color: COLORS.text, fontWeight: 600, margin: 0 }}>Department Waste Percentages</h3>
          </div>
          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
            {Object.keys(deptStats).length === 0 ? (
              <p style={{ color: COLORS.muted, textAlign: "center", margin: 20 }}>No department production logs found yet</p>
            ) : (
              Object.keys(deptStats).map(deptName => {
                const stats = deptStats[deptName];
                const pct = Math.min(100, stats.wastePct);
                return (
                  <div key={deptName} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                      <span style={{ fontWeight: 600, color: COLORS.text }}>{deptName}</span>
                      <span style={{ color: COLORS.muted }}>
                        {stats.leftovers} of {stats.plates} leftovers (<strong>{stats.wastePct.toFixed(1)}%</strong>)
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div style={{ width: "100%", height: 8, background: COLORS.bg, borderRadius: 4, overflow: "hidden", border: `1px solid ${COLORS.border}55` }}>
                      <div style={{
                        width: `${pct}%`, height: "100%",
                        background: pct > 15 ? COLORS.coral : pct > 8 ? COLORS.accent : COLORS.success,
                        transition: "width 0.3s"
                      }}/>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Leftover Raw Materials Log */}
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${COLORS.border}` }}>
            <h3 style={{ fontSize: 14, color: COLORS.text, fontWeight: 600, margin: 0 }}>Leftover Material Inventory</h3>
          </div>
          <div style={{ maxHeight: 300, overflowY: "auto" }}>
            {leftoversList.length === 0 ? (
              <p style={{ color: COLORS.muted, textAlign: "center", padding: 24 }}>No leftover materials registered</p>
            ) : (
              leftoversList.map(l => (
                <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 20px", borderBottom: `1px solid ${COLORS.border}22` }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: COLORS.text, margin: 0 }}>{l.item}</p>
                    <p style={{ fontSize: 10, color: COLORS.muted, margin: 0 }}>Dept: {l.dept} | Date: {l.date.slice(0, 10)}</p>
                  </div>
                  <span style={{ fontSize: 12, background: COLORS.border + "44", borderRadius: 4, padding: "2px 8px", fontWeight: 600 }}>
                    {l.qty} {l.unit}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );

  if (noSection) return content;

  return (
    <Section title="Waste & Leftovers Cost Analytics" sub="Monetary cost analysis of kitchen waste and leftovers logs">
      {content}
    </Section>
  );
}
