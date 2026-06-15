import React from 'react';
import { Button } from './Button';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
}) => {
  // Sanitize props against NaN and undefined to prevent rendering errors
  const current = Number.isNaN(currentPage) || !currentPage ? 1 : currentPage;
  const items =
    Number.isNaN(totalItems) || totalItems === undefined || totalItems === null ? 0 : totalItems;
  const perPage = Number.isNaN(itemsPerPage) || !itemsPerPage ? 5 : itemsPerPage;

  const totalPages = Math.ceil(items / perPage);
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-slate-50/50 dark:bg-slate-900/10 border-t border-slate-200/50 dark:border-slate-700/30 rounded-b-2xl mt-2 select-none">
      <div className="flex flex-1 justify-between sm:hidden">
        <Button
          onClick={() => onPageChange(Math.max(current - 1, 1))}
          disabled={current === 1}
          variant="secondary"
          size="sm"
        >
          Previous
        </Button>
        <Button
          onClick={() => onPageChange(Math.min(current + 1, totalPages))}
          disabled={current === totalPages}
          variant="secondary"
          size="sm"
        >
          Next
        </Button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-widest">
            Showing{' '}
            <span className="text-slate-900 dark:text-white">{(current - 1) * perPage + 1}</span> to{' '}
            <span className="text-slate-900 dark:text-white">
              {Math.min(current * perPage, items)}
            </span>{' '}
            of <span className="text-slate-900 dark:text-white">{items}</span> entries
          </p>
        </div>
        <div>
          <nav
            className="isolate inline-flex -space-x-px rounded-xl shadow-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-0.5"
            aria-label="Pagination"
          >
            <button
              onClick={() => onPageChange(Math.max(current - 1, 1))}
              disabled={current === 1}
              className="relative inline-flex items-center rounded-l-lg p-2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
            >
              <span className="sr-only">Previous</span>
              &larr;
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`relative inline-flex items-center px-3.5 py-1.5 text-xs font-black rounded-lg transition-all ${
                  current === page
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'text-slate-650 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => onPageChange(Math.min(current + 1, totalPages))}
              disabled={current === totalPages}
              className="relative inline-flex items-center rounded-r-lg p-2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
            >
              <span className="sr-only">Next</span>
              &rarr;
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};
