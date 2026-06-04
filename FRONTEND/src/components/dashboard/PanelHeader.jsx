import RefreshButton from './RefreshButton';
import SelectAllControl from './SelectAllControl';

const PanelHeader = ({
  linkTab,
  loading,
  totalCount,
  selection,
  onSelectAll,
  onDeselectAll,
  onRefresh
}) => {
  const onLinksTab = linkTab === 'links';
  const { allSelected, bulkDeleting } = selection;

  return (
    <div className="dashboard-links-panel__header-actions">
      {onLinksTab && !loading && totalCount > 0 && (
        <SelectAllControl
          allSelected={allSelected}
          disabled={loading || bulkDeleting}
          onSelectAll={onSelectAll}
          onDeselectAll={onDeselectAll}
        />
      )}
      {onLinksTab && <RefreshButton loading={loading} onRefresh={onRefresh} />}
    </div>
  );
};

export default PanelHeader;
