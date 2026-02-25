"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "./LoadingSpinner";
import EmptyState from "./EmptyState";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
  hideOnMobile?: boolean;
}

export type SortDirection = "asc" | "desc";

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  keyExtractor: (row: T) => string | number;
  sortableKeys?: string[];
  sortKey?: string;
  sortDir?: SortDirection;
  onSort?: (key: string) => void;
  pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 20;

export default function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyTitle,
  emptyDescription,
  keyExtractor,
  sortableKeys,
  sortKey,
  sortDir = "asc",
  onSort,
  pageSize = DEFAULT_PAGE_SIZE,
}: DataTableProps<T>) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const start = (page - 1) * pageSize;
  const paginatedData = data.slice(start, start + pageSize);

  useEffect(() => {
    setPage(1);
  }, [data.length]);

  const isSortable = (key: string) => sortableKeys?.includes(key) && onSort;
  const handleSort = (key: string) => {
    if (isSortable(key)) onSort!(key);
  };
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg">
        <LoadingSpinner size="md" className="py-16" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg">
        <EmptyState title={emptyTitle} description={emptyDescription} />
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto -mx-px">
        <table className="w-full text-sm min-w-[500px]">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {columns.map((col) => {
                const sortable = isSortable(col.key);
                const isActive = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className={`px-3 sm:px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap ${col.hideOnMobile ? "hidden sm:table-cell" : ""} ${col.className || ""} ${sortable ? "cursor-pointer hover:bg-gray-100 select-none" : ""}`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.header}
                      {sortable && isActive && (
                        <span className="text-gray-400" aria-hidden>{sortDir === "asc" ? "▲" : "▼"}</span>
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedData.map((row) => (
              <tr key={keyExtractor(row)} className="hover:bg-gray-50 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className={`px-3 sm:px-4 py-3 text-gray-700 ${col.hideOnMobile ? "hidden sm:table-cell" : ""} ${col.className || ""}`}>
                    {col.render ? col.render(row) : (row as Record<string, unknown>)[col.key] as React.ReactNode}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pageSize > 0 && data.length > pageSize && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-t border-gray-200 bg-gray-50 text-sm text-gray-600">
          <span>
            نمایش {start + 1} تا {Math.min(start + pageSize, data.length)} از {data.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              قبلی
            </button>
            <span className="px-2">
              صفحه {page} از {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              بعدی
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
