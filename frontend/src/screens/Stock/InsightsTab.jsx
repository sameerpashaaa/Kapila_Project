import React from "react";
import { COLORS } from "../../styles/colors";
import PriceTrendChart from "./PriceTrendChart";

const InsightsTab = ({ insightsLoading, insightsData, chartItem, setChartItem }) => {
  if (insightsLoading) {
    return <p style={{ color: COLORS.muted, textAlign: "center", padding: 32 }}>Loading insights…</p>;
  }

  if (!insightsData) {
    return <p style={{ color: COLORS.muted, textAlign: "center", padding: 40 }}>No insights available</p>;
  }

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
};

export default InsightsTab;
