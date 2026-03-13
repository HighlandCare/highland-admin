"use client";

import { useState, useEffect } from "react";

const DEFAULT_PAGE_SIZE = 10;

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
}

interface AdminTableProps<T extends Record<string, unknown>> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  className?: string;
  pageSize?: number;
}

export function AdminTable<T extends Record<string, unknown>>({
  columns,
  data,
  emptyMessage = "No data",
  className = "",
  pageSize = DEFAULT_PAGE_SIZE,
}: AdminTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalItems = data.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = (currentPage - 1) * pageSize;

  useEffect(() => {
    setCurrentPage(1);
  }, [data.length]);
  const end = start + pageSize;
  const pageData = data.slice(start, end);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <div className={className}>
      <div className="overflow-x-auto rounded-lg border border-[var(--content-card-border)]">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--content-card-border)] bg-[var(--content-card-bg)]">
              {columns.map((col) => (
                <th key={String(col.key)} className="px-4 py-3 font-medium">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              pageData.map((row, i) => (
                <tr key={start + i} className="border-b border-[var(--content-card-border)] last:border-0">
                  {columns.map((col) => (
                    <td key={String(col.key)} className="px-4 py-3">
                      {col.render
                        ? col.render(row)
                        : String((row as Record<string, unknown>)[col.key as string] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalItems > pageSize && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm">
            Showing {start + 1}–{Math.min(end, totalItems)} of {totalItems}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="rounded border border-[var(--content-card-border)] bg-transparent px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => goToPage(p)}
                className={`rounded px-3 py-1.5 text-sm ${
                  p === currentPage
                    ? "bg-[var(--highland-primary)] text-white"
                    : "border border-[var(--content-card-border)] bg-transparent"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="rounded border border-[var(--content-card-border)] bg-transparent px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
