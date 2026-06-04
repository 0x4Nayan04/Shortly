const SelectAllControl = ({
  allSelected,
  disabled,
  onSelectAll,
  onDeselectAll
}) => (
  <label className="dashboard-links-panel__select-all">
    <input
      type="checkbox"
      checked={allSelected}
      onChange={(e) => (e.target.checked ? onSelectAll() : onDeselectAll())}
      disabled={disabled}
      className="dashboard-links-toolbar__checkbox"
      aria-label={
        allSelected ? 'Deselect all on this page' : 'Select all on this page'
      }
    />
    <span>{allSelected ? 'Deselect all' : 'Select all'}</span>
  </label>
);

export default SelectAllControl;
