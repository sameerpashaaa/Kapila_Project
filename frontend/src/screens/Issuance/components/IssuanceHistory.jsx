import { useState } from "react";
import Pagination from "../../../components/Pagination";
import ErrorMsg from "../../../components/ErrorMsg";
import { COLORS } from "../../../styles/colors";
import SourceBadge from "../../../components/SourceBadge";
import KplCodeBadge from "../../../components/KplCodeBadge";
import { Search, ChevronDown, ChevronUp, Eye } from "lucide-react";

const formatIssuanceDate = (isoString) => {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return isoString;
  }
};

const TH = ({ children, style = {} }) => (
  <th
    style={{
      padding: "11px 16px",
      fontSize: 11,
      fontWeight: 600,
      color: COLORS.muted,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      textAlign: "left",
      backgroundColor: "#f8fafc",
      borderBottom: "1px solid #e2e8f0",
      ...style,
    }}
  >
    {children}
  </th>
);

export default function IssuanceHistory({ items, total, page, loading, error, onPageChange, LIMIT }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");

  const filteredItems = items.filter((iss) => {
    const matchesSearch =
      !searchQuery ||
      iss.dept?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      iss.items?.some((it) => it.name?.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSource =
      sourceFilter === "all" ||
      (sourceFilter === "scanned" && iss.scanned) ||
      (sourceFilter === "manual" && !iss.scanned);

    return matchesSearch && matchesSource;
  });

  return (
    <div
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        backgroundColor: "#ffffff",
        overflow: "hidden",
      }}
    >
      {/* Header — matches Indent History header exactly */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 20px",
          borderBottom: isExpanded ? "1px solid #e2e8f0" : "none",
          backgroundColor: "#ffffff",
        }}
      >
        <button
          onClick={() => setIsExpanded((v) => !v)}
          style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, padding: 0 }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, margin: 0 }}>
            Issuance History
          </h2>
          {isExpanded ? <ChevronUp size={16} color="#64748b" /> : <ChevronDown size={16} color="#64748b" />}
        </button>

        {isExpanded && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* Search */}
            <div style={{ position: "relative" }}>
              <Search
                size={14}
                style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", pointerEvents: "none" }}
              />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items..."
                style={{
                  padding: "7px 10px 7px 30px",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  background: "#f8fafc",
                  fontSize: 12,
                  outline: "none",
                  width: 180,
                  color: COLORS.text,
                }}
              />
            </div>

            {/* Source filter */}
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              style={{
                padding: "7px 28px 7px 10px",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                background: "#f8fafc",
                fontSize: 12,
                outline: "none",
                color: COLORS.text,
                appearance: "none",
                cursor: "pointer",
              }}
            >
              <option value="all">All Sources</option>
              <option value="manual">Manual</option>
              <option value="scanned">Scanned</option>
            </select>
          </div>
        )}
      </div>

      {/* Body */}
      {isExpanded && (
        <>
          {loading ? (
            <p style={{ color: COLORS.muted, textAlign: "center", padding: 32, margin: 0 }}>Loading…</p>
          ) : error ? (
            <div style={{ padding: 20 }}>
              <ErrorMsg error={error} />
            </div>
          ) : filteredItems.length === 0 ? (
            <p style={{ color: COLORS.muted, textAlign: "center", padding: 32, margin: 0, fontSize: 13 }}>
              No issuances recorded{searchQuery ? " matching your search" : ""}
            </p>
          ) : (
            <>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <TH>Date</TH>
                      <TH>Department</TH>
                      <TH>Items Issued</TH>
                      <TH>Issued Qty</TH>
                      <TH>Source</TH>
                      <TH style={{ textAlign: "center" }}>Action</TH>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((iss) => {
                      const totalQty = (iss.items || []).reduce(
                        (acc, it) => acc + (parseFloat(it.issued) || 0),
                        0
                      );
                      const source = iss.scanned ? "scanned" : "manual";

                      return (
                        <tr
                          key={iss.id}
                          style={{ borderBottom: "1px solid #f1f5f9" }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                        >
                          <td style={{ padding: "12px 16px", fontSize: 13, color: COLORS.text, whiteSpace: "nowrap" }}>
                            {formatIssuanceDate(iss.date)}
                          </td>
                          <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 500, color: COLORS.text }}>
                            {iss.dept}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                              {(iss.items || []).slice(0, 3).map((it, i) => (
                                <div
                                  key={i}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 4,
                                    background: "#f8fafc",
                                    border: "1px solid #e2e8f0",
                                    padding: "2px 8px",
                                    borderRadius: 6,
                                    fontSize: 12,
                                    color: COLORS.text,
                                  }}
                                >
                                  <KplCodeBadge code={it.item_code} />
                                  {it.name}
                                </div>
                              ))}
                              {(iss.items || []).length > 3 && (
                                <span style={{ fontSize: 12, color: COLORS.muted, padding: "2px 4px" }}>
                                  +{iss.items.length - 3} more
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 500, color: COLORS.text }}>
                            {totalQty}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <SourceBadge source={source} />
                          </td>
                          <td style={{ padding: "12px 16px", textAlign: "center" }}>
                            <button
                              style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", padding: 4 }}
                              title="View details"
                            >
                              <Eye size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} total={total} limit={LIMIT} onPage={onPageChange} />
            </>
          )}
        </>
      )}
    </div>
  );
}
