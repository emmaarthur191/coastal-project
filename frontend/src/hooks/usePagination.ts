import { useState, useMemo } from 'react';

export function usePagination<T>(items: T[], itemsPerPage: number = 5) {
  const [currentPage, setCurrentPage] = useState(1);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  }, [items, currentPage, itemsPerPage]);

  const resetPage = () => setCurrentPage(1);

  return {
    currentPage,
    setCurrentPage,
    paginatedItems,
    totalItems: items.length,
    itemsPerPage,
    resetPage,
  };
}
