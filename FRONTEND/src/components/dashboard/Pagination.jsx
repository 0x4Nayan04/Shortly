import { memo } from 'react';

const Pagination = memo(
  ({ currentPage, totalPages, onPageChange, disabled }) => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages = [];
      const pagesSet = new Set();
      const showEllipsisStart = currentPage > 3;
      const showEllipsisEnd = currentPage < totalPages - 2;

      const addPage = (p) => {
        if (!pagesSet.has(p)) {
          pagesSet.add(p);
          pages.push(p);
        }
      };

      if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) addPage(i);
      } else {
        addPage(1);
        if (showEllipsisStart) pages.push('...');
        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);
        for (let i = start; i <= end; i++) addPage(i);
        if (showEllipsisEnd) pages.push('...');
        addPage(totalPages);
      }
      return pages;
    };

    return (
      <nav
        className="mt-4 flex flex-col items-center justify-between gap-4 border-t border-border pt-4 sm:flex-row"
        aria-label="Pagination"
      >
        {currentPage > 1 && (
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={disabled}
            className="sm-btn sm-btn-secondary w-full sm:w-auto"
            aria-label="Previous page"
          >
            Previous
          </button>
        )}

        <div className="flex flex-wrap items-center justify-center gap-1">
          {getPageNumbers().map((page, index) =>
            page === '...' ? (
              <span key={`ellipsis-${index}`} className="px-2 py-1 text-muted">
                …
              </span>
            ) : (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                disabled={disabled}
                className={`sm-btn min-w-[2.5rem] px-3 ${
                  currentPage === page ? 'sm-btn-primary' : 'sm-btn-secondary'
                }`}
                aria-label={`Page ${page}`}
                aria-current={currentPage === page ? 'page' : undefined}
              >
                {page}
              </button>
            )
          )}
        </div>

        {currentPage < totalPages && (
          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={disabled}
            className="sm-btn sm-btn-secondary w-full sm:w-auto"
            aria-label="Next page"
          >
            Next
          </button>
        )}
      </nav>
    );
  }
);

Pagination.displayName = 'Pagination';

export default Pagination;
