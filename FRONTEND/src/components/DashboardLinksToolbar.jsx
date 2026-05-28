import { memo, useCallback } from 'react';
import { ChevronDown, SortAsc, SortDesc } from 'lucide-react';
import { formCompoundClass } from '../utils/designFormClasses';

export const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Date created' },
  { value: 'click', label: 'Clicks' },
  { value: 'short_url', label: 'Short URL' },
  { value: 'full_url', label: 'Destination' }
];

const preventEmptyBackspaceNav = (event) => {
  if (event.key !== 'Backspace' && event.key !== 'Delete') return;
  if (event.currentTarget.value !== '') return;
  event.preventDefault();
};

const DashboardLinksToolbar = memo(
  ({
    search,
    onSearchChange,
    sortBy,
    onSortByChange,
    sortOrder,
    onSortOrderChange,
    disabled,
    selectedCount,
    onDeselectAll,
    onBulkDelete,
    isBulkDeleting
  }) => {
    const showBulk = selectedCount > 0;

    const handleSearchChange = useCallback(
      (event) => onSearchChange(event.target.value),
      [onSearchChange]
    );

    return (
      <div className='dashboard-links-toolbar'>
        <div className={`${formCompoundClass()} dashboard-toolbar-compound`}>
          <div className='hero-cli-bar dashboard-toolbar-compound__bar'>
            <span
              className='hero-cli-prefix'
              aria-hidden='true'>
              filter
            </span>
            <input
              type='text'
              role='searchbox'
              inputMode='search'
              enterKeyHint='search'
              value={search}
              onChange={handleSearchChange}
              onKeyDown={preventEmptyBackspaceNav}
              placeholder='Search links…'
              disabled={disabled}
              className='hero-cli-input dashboard-toolbar-compound__search'
              aria-label='Search links'
              autoComplete='off'
              spellCheck={false}
            />

            <div
              className='dashboard-toolbar-compound__sort'
              aria-label='Sort links'>
              <div className='dashboard-toolbar-compound__select-wrap'>
                <label
                  htmlFor='dashboard-sort-by'
                  className='sr-only'>
                  Sort by
                </label>
                <select
                  id='dashboard-sort-by'
                  value={sortBy}
                  onChange={(e) => onSortByChange(e.target.value)}
                  disabled={disabled}
                  className='dashboard-toolbar-compound__select'
                  aria-label='Sort by'>
                  {SORT_OPTIONS.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className='dashboard-toolbar-compound__select-chevron'
                  aria-hidden='true'
                />
              </div>
              <button
                type='button'
                onClick={() =>
                  onSortOrderChange(sortOrder === 'desc' ? 'asc' : 'desc')
                }
                disabled={disabled}
                className='dashboard-toolbar-compound__order'
                aria-label={
                  sortOrder === 'desc' ? 'Sort descending' : 'Sort ascending'
                }
                title={
                  sortOrder === 'desc' ? 'Sort descending' : 'Sort ascending'
                }>
                {sortOrder === 'desc' ? (
                  <SortDesc
                    className='h-[1.125rem] w-[1.125rem]'
                    aria-hidden='true'
                  />
                ) : (
                  <SortAsc
                    className='h-[1.125rem] w-[1.125rem]'
                    aria-hidden='true'
                  />
                )}
              </button>
            </div>
          </div>
        </div>

        {showBulk && (
          <div
            className='dashboard-links-toolbar__bulk'
            role='region'
            aria-label='Bulk actions'>
            <p className='dashboard-links-toolbar__bulk-count'>
              {selectedCount} selected
            </p>
            <div className='dashboard-links-toolbar__bulk-actions'>
              <button
                type='button'
                onClick={onDeselectAll}
                disabled={disabled || isBulkDeleting}
                className='sm-btn sm-btn-secondary dashboard-links-toolbar__bulk-deselect'>
                Clear selection
              </button>
              <button
                type='button'
                onClick={onBulkDelete}
                disabled={disabled || isBulkDeleting}
                className='sm-btn sm-btn-secondary dashboard-links-toolbar__bulk-delete'>
                Delete selected ({selectedCount})
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
);

DashboardLinksToolbar.displayName = 'DashboardLinksToolbar';

export default DashboardLinksToolbar;
