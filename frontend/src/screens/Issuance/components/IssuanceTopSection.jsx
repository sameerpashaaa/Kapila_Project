import IssuanceLeftPanel from "./IssuanceLeftPanel";
import IssuanceItemsGrid from "./IssuanceItemsGrid";

export default function IssuanceTopSection({
  onScan,
  scanning,
  scanText,
  msg,
  pendingIndents,
  selectedIndent,
  onSelectIndent,
  onIssue,
  issueQtys,
  availableStock,
  onQtyChange,
  onShowHistory,
  confirmedItems,
  onToggleConfirm,
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 20,
        marginBottom: 20,
        /* Height is driven by the taller of the two columns — left panel is
           content-driven; right panel has a min-height to avoid collapsing */
        alignItems: "stretch",
      }}
    >
      {/* LEFT — form panel, ~30% */}
      <div style={{ width: "30%", minWidth: 280, flexShrink: 0 }}>
        <IssuanceLeftPanel
          pendingIndents={pendingIndents}
          selected={selectedIndent}
          onSelect={onSelectIndent}
          onIssue={onIssue}
          issueQtys={issueQtys}
          availableStock={availableStock}
          onScan={onScan}
          scanning={scanning}
          scanText={scanText}
          msg={msg}
          onShowHistory={onShowHistory}
        />
      </div>

      {/* RIGHT — items grid, ~70% */}
      <div style={{ flex: 1, minHeight: 360 }}>
        <IssuanceItemsGrid
          selectedIndent={selectedIndent}
          issueQtys={issueQtys}
          availableStock={availableStock}
          onQtyChange={onQtyChange}
          confirmedItems={confirmedItems}
          onToggleConfirm={onToggleConfirm}
          onIssue={onIssue}
        />
      </div>
    </div>
  );
}
