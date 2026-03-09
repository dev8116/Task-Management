import { useState, useMemo } from 'react';

export function usePagination(data = [], itemsPerPage = 10) {
  const [currentPage, setCurrentPage] = useState(1);
  const safeItemsPerPage = Math.max(1, itemsPerPage);

  const totalItems = data.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / safeItemsPerPage));

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * safeItemsPerPage;
    return data.slice(start, start + safeItemsPerPage);
  }, [data, currentPage, safeItemsPerPage]);

  return { currentPage, setCurrentPage, paginatedData, totalPages, totalItems };
}
