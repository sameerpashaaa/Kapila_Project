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
    <div className="resp-panel-layout" style={{ marginBottom: 20 }}>
      {/* LEFT — form panel, ~30% */}
      <div className="resp-panel-left">
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
      <div className="resp-panel-right">
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
