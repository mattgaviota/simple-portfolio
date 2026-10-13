"use client";

import { useState } from "react";

export type Column<T> = {
  id: string;
  header: React.ReactNode;
  /** Plain-text header for screen readers when `header` is empty. */
  srHeader?: string;
  /** `index` is the 0-based position of the row in the sorted list, across pages. */
  cell: (row: T, index: number) => React.ReactNode;
  /** Makes the column sortable by this value. */
  sortValue?: (row: T) => string | number;
  align?: "left" | "right";
  className?: string;
};

type Props<T> = {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyMessage: string;
  pageSize?: number;
  /** Changing this value sends the table back to page 1 (e.g. when a filter changes). */
  resetKey?: string;
};

type Sort = { id: string; dir: "asc" | "desc" };

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  emptyMessage,
  pageSize = 20,
  resetKey = "",
}: Props<T>) {
  const [sort, setSort] = useState<Sort | null>(null);
  const [page, setPage] = useState(0);
  const [lastResetKey, setLastResetKey] = useState(resetKey);

  if (resetKey !== lastResetKey) {
    setLastResetKey(resetKey);
    setPage(0);
  }

  const sortColumn = columns.find((c) => c.id === sort?.id);
  const sorted =
    sort && sortColumn?.sortValue
      ? [...rows].sort((a, b) => {
          const va = sortColumn.sortValue!(a);
          const vb = sortColumn.sortValue!(b);
          const result =
            typeof va === "string" && typeof vb === "string"
              ? va.localeCompare(vb, "es", { sensitivity: "base" })
              : Number(va) - Number(vb);
          return sort.dir === "asc" ? result : -result;
        })
      : rows;

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, pageCount - 1);
  const visible = sorted.slice(current * pageSize, (current + 1) * pageSize);

  function toggleSort(id: string) {
    setSort((prev) =>
      prev?.id === id
        ? { id, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { id, dir: "asc" },
    );
    setPage(0);
  }

  const alignClass = (c: Column<T>) =>
    c.align === "right" ? "text-right" : "text-left";

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-black/10 bg-white/50">
        <table className="w-full text-sm">
          <thead className="border-b border-black/10 bg-white/60">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.id}
                  scope="col"
                  aria-sort={
                    c.sortValue
                      ? sort?.id === c.id
                        ? sort.dir === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                      : undefined
                  }
                  className={`p-3 font-semibold ${alignClass(c)}`}
                >
                  {c.sortValue ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(c.id)}
                      className="inline-flex items-center gap-1 hover:text-accent"
                    >
                      {c.header}
                      <span aria-hidden className="w-3 text-xs">
                        {sort?.id === c.id
                          ? sort.dir === "asc"
                            ? "▲"
                            : "▼"
                          : ""}
                      </span>
                    </button>
                  ) : c.srHeader ? (
                    <span className="sr-only">{c.srHeader}</span>
                  ) : (
                    c.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10">
            {visible.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="p-6 text-center text-neutral-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              visible.map((row, i) => (
                <tr key={rowKey(row)}>
                  {columns.map((c) => (
                    <td
                      key={c.id}
                      className={`p-3 ${alignClass(c)} ${c.className ?? ""}`}
                    >
                      {c.cell(row, current * pageSize + i)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {sorted.length > pageSize && (
        <div className="mt-4 flex items-center justify-between gap-3 text-sm">
          <button
            type="button"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
            className="rounded-lg border border-black/20 px-4 py-2 font-medium disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="text-neutral-600">
            Página {current + 1} de {pageCount}
          </span>
          <button
            type="button"
            disabled={current + 1 >= pageCount}
            onClick={() => setPage(current + 1)}
            className="rounded-lg border border-black/20 px-4 py-2 font-medium disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      )}
    </>
  );
}
