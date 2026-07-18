"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Search, Filter } from "lucide-react";

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  onRowClick?: (item: T) => void;
  actions?: (item: T) => React.ReactNode;
  pageSize?: number;
  loading?: boolean;
}

export default function DataTable<T extends { id: string }>({
  data,
  columns,
  searchPlaceholder = "Search...",
  onSearch,
  onRowClick,
  actions,
  pageSize = 10,
  loading = false,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = data.slice(startIndex, startIndex + pageSize);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    onSearch?.(query);
  };

  if (loading) {
    return (
      <div className="card p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
          <input
            type="search"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-secondary-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-50 border-b border-secondary-200">
              <tr>
                {columns.map((col) => (
                  <th
                    key={String(col.key)}
                    className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider"
                  >
                    {col.header}
                  </th>
                ))}
                {actions && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (actions ? 1 : 0)}
                    className="px-6 py-12 text-center text-secondary-500"
                  >
                    No results found
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-secondary-50 transition-colors ${
                      onRowClick ? "cursor-pointer" : ""
                    }`}
                    onClick={() => onRowClick?.(item)}
                  >
                    {columns.map((col) => (
                      <td key={String(col.key)} className="px-6 py-4 whitespace-nowrap">
                        {col.render
                          ? col.render(item)
                          : String((item as Record<string, unknown>)[col.key as string] ?? "-")}
                      </td>
                    ))}
                    {actions && (
                      <td className="px-6 py-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                        {actions(item)}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-secondary-200 flex items-center justify-between">
            <p className="text-sm text-secondary-500">
              Showing {startIndex + 1} to {Math.min(startIndex + pageSize, data.length)} of {data.length} results
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-secondary-200 hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-secondary-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-secondary-200 hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
