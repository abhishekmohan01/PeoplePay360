import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './Pagination.css';

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize = 25,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [25, 50, 100],
  itemLabel = 'entries',
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endItem = Math.min(safePage * pageSize, totalItems);

  // Generate page numbers with intelligent truncation (e.g. 1 2 3 ... 12)
  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (safePage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (safePage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', safePage - 1, safePage, safePage + 1, '...', totalPages);
      }
    }

    return pages;
  }, [safePage, totalPages]);

  if (totalItems === 0) {
    return null;
  }

  return (
    <div className="pagination-container">
      {/* Range Info & Optional Size Selector */}
      <div className="pagination-info">
        <span>
          Showing <strong className="pagination-info-bold">{startItem}–{endItem}</strong> of{' '}
          <strong className="pagination-info-bold">{totalItems}</strong> {itemLabel}
        </span>
        {onPageSizeChange && (
          <select
            className="pagination-size-select ml-2"
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(1);
            }}
            aria-label="Items per page"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt} per page
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Floating Pill Controls matching screenshot */}
      <div className="pagination-pill">
        <button
          type="button"
          className="pagination-btn"
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage === 1}
          title="Previous page"
        >
          <ChevronLeft size={16} />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-1">
          {pageNumbers.map((num, idx) => {
            if (typeof num === 'string') {
              return (
                <span key={`ellipsis-${idx}`} className="pagination-ellipsis">
                  {num}
                </span>
              );
            }

            const isActive = num === safePage;
            return (
              <button
                key={`page-${num}`}
                type="button"
                className={`pagination-badge ${
                  isActive ? 'pagination-badge-active' : 'pagination-badge-inactive'
                }`}
                onClick={() => onPageChange(num)}
                aria-current={isActive ? 'page' : undefined}
              >
                {num}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="pagination-btn"
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage === totalPages}
          title="Next page"
        >
          <span>Next</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
