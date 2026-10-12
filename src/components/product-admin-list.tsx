"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { deleteProduct, listProducts } from "@/lib/products";
import type { Product } from "@/types/product";

export function ProductAdminList() {
  const { user, logout } = useAuth();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    listProducts()
      .then(setProducts)
      .catch(() => setError("No se pudieron cargar los productos."));
  }, [reloadKey]);

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
            href="/admin/orders"
            className="rounded-lg border border-black/20 px-4 py-2 text-sm font-medium"
          >
            Pedidos
          </Link>
          <Link
            href="/admin/settings"
            className="rounded-lg border border-black/20 px-4 py-2 text-sm font-medium"
          >
            Ajustes
          </Link>
          <Link
            href="/admin/categories"
            className="rounded-lg border border-black/20 px-4 py-2 text-sm font-medium"
          >
            Categorías
          </Link>
          <Link
            href="/admin/new"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
          >
            Nuevo producto
          </Link>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg border border-black/20 px-4 py-2 text-sm font-medium"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {!products ? (
        <p className="text-neutral-500">Cargando...</p>
      ) : products.length === 0 ? (
        <p className="text-neutral-500">Aún no hay productos.</p>
      ) : (
        <ul className="divide-y divide-black/10 rounded-xl border border-black/10">
          {products.map((p) => (
            <li key={p.id} className="flex items-center gap-4 p-3 sm:p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.imageUrl}
                alt={p.name}
                className="h-14 w-14 shrink-0 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{p.name}</p>
                <p className="text-sm text-neutral-500">
                  {formatPrice(p.price)} · {p.amount} en stock
                  {p.categoryName && ` · ${p.categoryName}`}
                </p>
              </div>
              <Link
                href={`/admin/${p.id}/edit`}
                className="text-sm font-medium underline-offset-2 hover:underline"
              >
                Editar
              </Link>
              <button
                type="button"
                onClick={() => setPendingDelete(p)}
                className="text-sm font-medium text-red-600 underline-offset-2 hover:underline"
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
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
