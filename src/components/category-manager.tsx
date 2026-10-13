"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/data-table";
import {
  createCategory,
  deleteCategory,
  isCategoryInUse,
  listCategories,
} from "@/lib/categories";
import type { Category } from "@/types/product";

export function CategoryManager() {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    listCategories()
      .then(setCategories)
      .catch(() => setError("No se pudieron cargar las categorías."));
  }, [reloadKey]);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return setError("Ingresa un nombre de categoría.");
    if (categories?.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      return setError("Esa categoría ya existe.");
    }
    setBusy(true);
    setError(null);
    try {
      await createCategory(trimmed);
      setName("");
      setReloadKey((k) => k + 1);
    } catch {
      setError("No se pudo crear la categoría.");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(category: Category) {
    setBusy(true);
    setError(null);
    try {
      if (await isCategoryInUse(category.id)) {
        setError(
          `"${category.name}" está en uso por productos. Reasígnalos o elimínalos primero.`,
        );
        return;
      }
      await deleteCategory(category.id);
      setReloadKey((k) => k + 1);
    } catch {
      setError("No se pudo eliminar la categoría.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Categorías</h1>
        
      </div>

      <form onSubmit={onAdd} className="mb-6 flex max-w-md gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre de la nueva categoría"
          maxLength={60}
          className="w-full rounded-lg border border-black/20 bg-white/80 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={busy}
          className="shrink-0 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
        >
          Agregar
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {!categories ? (
        <p className="text-neutral-500">Cargando...</p>
      ) : categories.length === 0 ? (
        <p className="text-neutral-500">Aún no hay categorías.</p>
      ) : (
        <div className="max-w-xl">
          <DataTable
            columns={[
              {
                id: "name",
                header: "Nombre",
                sortValue: (c) => c.name,
                cell: (c) => c.name,
              },
              {
                id: "actions",
                header: null,
                srHeader: "Acciones",
                align: "right",
                cell: (c) => (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onDelete(c)}
                    className="font-medium text-red-600 underline-offset-2 hover:underline disabled:opacity-50"
                  >
                    Eliminar
                  </button>
                ),
              },
            ]}
            rows={categories}
            rowKey={(c) => c.id}
            emptyMessage="Aún no hay categorías."
          />
        </div>
      )}
    </>
  );
}
