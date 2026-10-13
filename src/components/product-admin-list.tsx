"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DataTable, type Column } from "@/components/data-table";
import { useAuth } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { deleteProduct, listProducts } from "@/lib/products";
import type { Product } from "@/types/product";

const columns = (onDelete: (p: Product) => void): Column<Product>[] => [
  {
    id: "index",
    header: "#",
    className: "w-10 text-neutral-500",
    cell: (_p, i) => i + 1,
  },
  {
    id: "image",
    header: null,
    srHeader: "Imagen",
    className: "w-16",
    cell: (p) => (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={p.imageUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />
    ),
  },
  {
    id: "name",
    header: "Nombre",
    sortValue: (p) => p.name,
    className: "max-w-56 font-medium",
    cell: (p) => <span className="block truncate">{p.name}</span>,
  },
  {
    id: "price",
    header: "Precio",
    align: "right",
    sortValue: (p) => p.price,
    className: "whitespace-nowrap",
    cell: (p) => formatPrice(p.price),
  },
  {
    id: "amount",
    header: "Stock",
    align: "right",
    sortValue: (p) => p.amount,
    cell: (p) => (
      <span className={p.amount <= 0 ? "font-medium text-red-600" : ""}>
        {p.amount}
      </span>
    ),
  },
  {
    id: "category",
    header: "Categoría",
    className: "text-neutral-600",
    cell: (p) => p.categoryName,
  },
  {
    id: "actions",
    header: null,
    srHeader: "Acciones",
    align: "right",
    className: "whitespace-nowrap",
    cell: (p) => (
      <>
        <Link
          href={`/admin/${p.id}/edit`}
          className="mr-4 font-medium underline-offset-2 hover:underline"
        >
          Editar
        </Link>
        <button
          type="button"
          onClick={() => onDelete(p)}
          className="font-medium text-red-600 underline-offset-2 hover:underline"
        >
          Eliminar
        </button>
      </>
    ),
  },
];

export function ProductAdminList() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [categoryFilter, setCategoryFilter] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    listProducts()
      .then(setProducts)
      .catch(() => setError("No se pudieron cargar los productos."));
  }, [reloadKey]);

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of products ?? []) {
      if (p.categoryId && p.categoryName) map.set(p.categoryId, p.categoryName);
    }
    return [...map].sort((a, b) => a[1].localeCompare(b[1]));
  }, [products]);

  const rows = useMemo(
    () =>
      categoryFilter
        ? (products ?? []).filter((p) => p.categoryId === categoryFilter)
        : (products ?? []),
    [products, categoryFilter],
  );

  async function confirmDelete() {
    if (!pendingDelete) return;
    setBusy(true);
    try {
      await deleteProduct(pendingDelete);
      setPendingDelete(null);
      setReloadKey((k) => k + 1);
    } catch {
      setError("No se pudo eliminar el producto.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Productos</h1>
          <p className="text-xs text-neutral-500">{user?.email}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/new"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
          >
            Nuevo producto
          </Link>
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {!products ? (
        <p className="text-neutral-500">Cargando...</p>
      ) : products.length === 0 ? (
        <p className="text-neutral-500">Aún no hay productos.</p>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
            <label className="flex items-center gap-2 font-medium">
              Categoría
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-lg border border-black/20 bg-white/80 px-3 py-2 font-normal"
              >
                <option value="">Todas</option>
                {categories.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <span className="text-neutral-500">
              {rows.length} {rows.length === 1 ? "producto" : "productos"}
            </span>
          </div>

          <DataTable
            columns={columns(setPendingDelete)}
            rows={rows}
            rowKey={(p) => p.id}
            emptyMessage="No hay productos en esta categoría."
            resetKey={categoryFilter}
          />
        </>
      )}

      {pendingDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="w-full max-w-sm rounded-xl bg-[var(--background)] p-6">
            <h2 className="text-lg font-semibold">Eliminar producto</h2>
            <p className="mt-2 text-sm text-neutral-600">
              ¿Eliminar &quot;{pendingDelete.name}&quot;? También se borrará su
              imagen y no se puede deshacer.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => setPendingDelete(null)}
                className="rounded-lg border border-black/20 px-4 py-2 text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={confirmDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {busy ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
