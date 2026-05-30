import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react';
import { Check, ChevronDown, SortAsc, SortDesc } from 'lucide-react';
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

const SortSelect = memo(
  ({ value, onChange, options, disabled, id, label }) => {
    const [open, setOpen] = useState(false);
    const [focusIdx, setFocusIdx] = useState(-1);
    const containerRef = useRef(null);
    const triggerRef = useRef(null);

    const currentLabel =
      options.find((o) => o.value === value)?.label || '';

    useEffect(() => {
      if (!open) {
        setFocusIdx(-1);
        return;
      }
      const idx = options.findIndex((o) => o.value === value);
      setFocusIdx(idx >= 0 ? idx : 0);
    }, [open, options, value]);

    useEffect(() => {
      if (!open) return;
      const onPointerDown = (e) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(e.target)
        ) {
          setOpen(false);
        }
      };
      document.addEventListener('pointerdown', onPointerDown);
      return () =>
        document.removeEventListener('pointerdown', onPointerDown);
    }, [open]);

    const select = useCallback(
      (nextVal) => {
        onChange(nextVal);
        setOpen(false);
        triggerRef.current?.focus();
      },
      [onChange]
    );

    const onKeyDown = useCallback(
      (e) => {
        if (!open) {
          if (
            e.key === 'Enter' ||
            e.key === ' ' ||
            e.key === 'ArrowDown'
          ) {
            e.preventDefault();
            setOpen(true);
          }
          return;
        }

        switch (e.key) {
          case 'Escape':
            e.preventDefault();
            setOpen(false);
            triggerRef.current?.focus();
            break;
          case 'ArrowDown':
            e.preventDefault();
            setFocusIdx((prev) =>
              prev < options.length - 1 ? prev + 1 : 0
            );
            break;
          case 'ArrowUp':
            e.preventDefault();
            setFocusIdx((prev) =>
              prev > 0 ? prev - 1 : options.length - 1
            );
            break;
          case 'Enter':
          case ' ':
            e.preventDefault();
            if (focusIdx >= 0 && focusIdx < options.length) {
              select(options[focusIdx].value);
            }
            break;
          case 'Tab':
            setOpen(false);
            break;
        }
      },
      [open, focusIdx, options, select]
    );

    const onTriggerClick = useCallback(() => {
      if (disabled) return;
      setOpen((prev) => !prev);
    }, [disabled]);

    return (
      <div
        ref={containerRef}
        className='sort-select'
        onKeyDown={onKeyDown}>
        <label
          htmlFor={id}
          className='sr-only'>
          {label}
        </label>
        <button
          ref={triggerRef}
          id={id}
          type='button'
          role='combobox'
          aria-haspopup='listbox'
          aria-expanded={open}
          aria-controls={`${id}-listbox`}
          aria-label={label}
          disabled={disabled}
          className='dashboard-toolbar-compound__select outline-none'
          onClick={onTriggerClick}>
          <span className='sort-select__label'>{currentLabel}</span>
          <ChevronDown
            className={`sort-select__chevron${open ? ' sort-select__chevron--open' : ''}`}
            aria-hidden='true'
          />
        </button>

        {open && (
          <ul
            id={`${id}-listbox`}
            role='listbox'
            aria-label={label}
            className='sort-select__panel'>
            {options.map((opt, idx) => (
              <li
                key={opt.value}
                role='option'
                aria-selected={opt.value === value}
                className={`sort-select__option${opt.value === value ? ' sort-select__option--selected' : ''}${idx === focusIdx ? ' sort-select__option--focused' : ''}`}
                onPointerDown={() => select(opt.value)}
                onMouseEnter={() => setFocusIdx(idx)}>
                <span className='sort-select__option-check'>
                  {opt.value === value && (
                    <Check
                      className='sort-select__option-check-icon'
                      aria-hidden='true'
                    />
                  )}
                </span>
                <span className='sort-select__option-label'>
                  {opt.label}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
);

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
                <SortSelect
                  id='dashboard-sort-by'
                  value={sortBy}
                  onChange={onSortByChange}
                  options={SORT_OPTIONS}
                  disabled={disabled}
                  label='Sort by'
                />
              </div>
              <button
                type='button'
                onClick={() =>
                  onSortOrderChange(sortOrder === 'desc' ? 'asc' : 'desc')
                }
                disabled={disabled}
                className='dashboard-toolbar-compound__order outline-none'
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
