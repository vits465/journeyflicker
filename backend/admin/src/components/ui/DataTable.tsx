import React from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  onRowClick?: (row: T) => void;
  search?: {
    placeholder: string;
    value: string;
    onChange: (val: string) => void;
  };
  actions?: React.ReactNode;
}

export function DataTable<T extends { id?: string | number; _id?: string }>({
  columns,
  data,
  isLoading,
  onRowClick,
  search,
  actions
}: DataTableProps<T>) {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-surface rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden">
      {/* Header Bar */}
      {(search || actions) && (
        <div className="p-4 flex items-center justify-between border-b border-outline-variant/30 gap-4">
          {search && (
            <div className="relative flex-1 max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface/40">search</span>
              <input
                type="text"
                placeholder={search.placeholder}
                value={search.value}
                onChange={(e) => search.onChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background dark:bg-[#1A1A1A] border border-outline-variant/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
              />
            </div>
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}

      {/* Table Area */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-background dark:bg-[#1A1A1A] sticky top-0 z-10 border-b border-outline-variant/30 shadow-sm">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="px-6 py-4 font-medium text-on-surface/70">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-on-surface/50">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="material-symbols-outlined animate-spin text-2xl">progress_activity</span>
                    <p>Loading data...</p>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-on-surface/50">
                  No records found.
                </td>
              </tr>
            ) : (
              data.map((row, idx) => {
                const rowKey = row.id || row._id || idx;
                return (
                  <tr 
                    key={rowKey as React.Key} 
                    onClick={() => onRowClick?.(row)}
                    className={`group transition-colors ${onRowClick ? 'cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02]' : ''}`}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className="px-6 py-4 text-on-surface">
                        {col.render ? col.render(row) : (row as any)[col.key]}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
