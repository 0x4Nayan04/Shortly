import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, SortAsc, SortDesc } from 'lucide-react';
import { formCompoundClass } from '../utils/designFormClasses';

const SORT_OPTIONS = [
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

const SortSelect = memo(({ value, onChange, options, disabled, id, label }) => {
  const [open, setOpen] = useState(false);
  const [focusIdx, setFocusIdx] = useState(-1);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);

  const currentLabel = options.find((o) => o.value === value)?.label || '';

  const selectedIdx = options.findIndex((o) => o.value === value);
  const activeIdx =
    focusIdx >= 0 ? focusIdx : selectedIdx >= 0 ? selectedIdx : 0;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const select = useCallback(
    (nextVal) => {
      onChange(nextVal);
      setOpen(false);
      setFocusIdx(-1);
      triggerRef.current?.focus();
    },
    [onChange]
  );

  const onKeyDown = useCallback(
    (e) => {
      if (!open) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault();
          setFocusIdx(selectedIdx >= 0 ? selectedIdx : 0);
          setOpen(true);
        }
        return;
      }

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          setOpen(false);
          setFocusIdx(-1);
          triggerRef.current?.focus();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setFocusIdx((prev) => (prev < options.length - 1 ? prev + 1 : 0));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusIdx((prev) => (prev > 0 ? prev - 1 : options.length - 1));
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (activeIdx >= 0 && activeIdx < options.length) {
            select(options[activeIdx].value);
          }
          break;
        case 'Tab':
          setOpen(false);
          setFocusIdx(-1);
          break;
      }
    },
    [open, activeIdx, options, select, selectedIdx]
  );

  const onTriggerClick = useCallback(() => {
    if (disabled) return;
    setOpen((prev) => {
      const nextOpen = !prev;
      setFocusIdx(nextOpen ? (selectedIdx >= 0 ? selectedIdx : 0) : -1);
      return nextOpen;
    });
  }, [disabled, selectedIdx]);

  return (
    <section ref={containerRef} className="sort-select">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-listbox`}
        aria-label={label}
        disabled={disabled}
        className="dashboard-toolbar-compound__select outline-none"
        onClick={onTriggerClick}
        onKeyDown={onKeyDown}
      >
        <span className="sort-select__label">{currentLabel}</span>
        <ChevronDown
          className={`sort-select__chevron${open ? ' sort-select__chevron--open' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <ul
          id={`${id}-listbox`}
          aria-label={label}
          className="sort-select__panel"
        >
          {options.map((opt, idx) => (
            <li
              key={opt.value}
              className={`sort-select__option${opt.value === value ? ' sort-select__option--selected' : ''}${idx === activeIdx ? ' sort-select__option--focused' : ''}`}
              onPointerDown={() => select(opt.value)}
              onMouseEnter={() => setFocusIdx(idx)}
            >
              <span className="sort-select__option-check">
                {opt.value === value && (
                  <Check
                    className="sort-select__option-check-icon"
                    aria-hidden="true"
                  />
                )}
              </span>
              <span className="sort-select__option-label">{opt.label}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
});

SortSelect.displayName = 'SortSelect';

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
      <div className="dashboard-links-toolbar">
        <div className={`${formCompoundClass()} dashboard-toolbar-compound`}>
          <div className="hero-cli-bar dashboard-toolbar-compound__bar">
            <span className="hero-cli-prefix" aria-hidden="true">
              filter
            </span>
            <input
              type="text"
              inputMode="search"
              enterKeyHint="search"
              value={search}
              onChange={handleSearchChange}
              onKeyDown={preventEmptyBackspaceNav}
              placeholder="Search links…"
              disabled={disabled}
              className="hero-cli-input dashboard-toolbar-compound__search"
              aria-label="Search links"
              autoComplete="off"
              spellCheck={false}
            />

            <div
              className="dashboard-toolbar-compound__sort"
              aria-label="Sort links"
            >
              <div className="dashboard-toolbar-compound__select-wrap">
                <SortSelect
                  id="dashboard-sort-by"
                  value={sortBy}
                  onChange={onSortByChange}
                  options={SORT_OPTIONS}
                  disabled={disabled}
                  label="Sort by"
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  onSortOrderChange(sortOrder === 'desc' ? 'asc' : 'desc')
                }
                disabled={disabled}
                className="dashboard-toolbar-compound__order outline-none"
                aria-label={
                  sortOrder === 'desc' ? 'Sort descending' : 'Sort ascending'
                }
                title={
                  sortOrder === 'desc' ? 'Sort descending' : 'Sort ascending'
                }
              >
                {sortOrder === 'desc' ? (
                  <SortDesc className="size-[1.125rem]" aria-hidden="true" />
                ) : (
                  <SortAsc className="size-[1.125rem]" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {showBulk && (
          <section
            className="dashboard-links-toolbar__bulk"
            aria-label="Bulk actions"
          >
            <p className="dashboard-links-toolbar__bulk-count">
              {selectedCount} selected
            </p>
            <div className="dashboard-links-toolbar__bulk-actions">
              <button
                type="button"
                onClick={onDeselectAll}
                disabled={disabled || isBulkDeleting}
                className="sm-btn sm-btn-secondary dashboard-links-toolbar__bulk-deselect"
              >
                Clear selection
              </button>
              <button
                type="button"
                onClick={onBulkDelete}
                disabled={disabled || isBulkDeleting}
                className="sm-btn sm-btn-secondary dashboard-links-toolbar__bulk-delete"
              >
                Delete selected ({selectedCount})
              </button>
            </div>
          </section>
        )}
      </div>
    );
  }
);

DashboardLinksToolbar.displayName = 'DashboardLinksToolbar';

export default DashboardLinksToolbar;
