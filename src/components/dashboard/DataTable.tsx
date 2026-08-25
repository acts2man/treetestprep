import type { ReactNode } from "react";

export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
};

export function DataTable<T extends { id: string }>({
  rows,
  columns,
  empty = "Nothing here yet.",
  isLoading,
}: {
  rows: T[];
  columns: Column<T>[];
  empty?: string;
  isLoading?: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 bg-gradient-to-br from-[#0a1228] to-[#05070d]">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/50">
            {columns.map((column) => (
              <th key={column.key} className={`px-4 py-3 font-medium ${column.className ?? ""}`}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-white/50">
                Loading...
              </td>
            </tr>
          )}
          {!isLoading &&
            rows.map((row) => (
              <tr key={row.id} className="border-b border-white/5 last:border-0">
                {columns.map((column) => (
                  <td key={column.key} className={`px-4 py-3 text-white/80 ${column.className ?? ""}`}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          {!isLoading && rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-white/50">
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold text-white">{title}</h1>
        {description && <p className="mt-1 text-sm text-white/60">{description}</p>}
      </div>
      {action}
    </header>
  );
}

export function StatusBadge({ value }: { value: string }) {
  const tone =
    value === "confirmed" || value === "paid" || value === "published" || value === "resolved"
      ? "bg-emerald-500/15 text-emerald-300"
      : value === "cancelled" || value === "refunded" || value === "archived"
        ? "bg-rose-500/15 text-rose-300"
        : value === "new" || value === "pending" || value === "unpaid"
          ? "bg-amber-500/15 text-amber-300"
          : "bg-white/10 text-white/70";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${tone}`}>
      {value.replace(/_/g, " ")}
    </span>
  );
}

export const inputClass =
  "w-full rounded-lg border border-white/15 bg-[#0a0f1e] px-3 py-2 text-sm text-white outline-none focus:border-[#349e49]";

export const buttonClass =
  "inline-flex items-center gap-2 rounded-lg bg-[#349e49] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2c8b3f] disabled:opacity-60";

export const ghostButtonClass =
  "inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10";
