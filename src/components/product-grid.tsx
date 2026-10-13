"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ProductCard } from "@/components/product-card";
import { listProducts } from "@/lib/products";
import type { Product } from "@/types/product";

const PAGE_SIZE = 20;

const gridClass =
  "grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 xl:grid-cols-4";

export function ProductGrid() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [count, setCount] = useState(PAGE_SIZE);
  const sentinel = useRef<HTMLDivElement>(null);
  const hasMore =
    !!products &&
    count <
      (selected
        ? products.filter((p) => p.categoryId === selected).length
        : products.length);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setCount((c) => c + PAGE_SIZE);
      },
      { rootMargin: "400px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, count]);

  useEffect(() => {
    listProducts().then(setProducts).catch(() => setError(true));
  }, []);

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of products ?? []) {
      if (p.categoryId && p.categoryName) map.set(p.categoryId, p.categoryName);
    }
    return [...map].sort((a, b) => a[1].localeCompare(b[1]));
  }, [products]);

  if (error) {
    return (
      <p className="py-16 text-center text-neutral-500">
        No se pudieron cargar los productos. Inténtalo de nuevo más tarde.
      </p>
    );
  }

  if (!products) {
    return (
      <div className={gridClass}>
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={i}
            className="aspect-square animate-pulse rounded-xl bg-white/60"
          />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <p className="py-16 text-center text-neutral-500">
        Aún no hay productos. Vuelve pronto.
      </p>
    );
  }

  const visible = selected
    ? products.filter((p) => p.categoryId === selected)
    : products;

  const chipClass = (active: boolean) =>
    `shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
      active
        ? "border-accent bg-accent text-white"
        : "border-black/20 bg-white/60 hover:bg-white"
    }`;

  return (
    <>
      {categories.length > 0 && (
        <div
          role="group"
          aria-label="Filtrar por categoría"
          className="-mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
        >
          <button
            type="button"
            aria-pressed={selected === null}
            onClick={() => {
              setSelected(null);
              setCount(PAGE_SIZE);
            }}
            className={chipClass(selected === null)}
          >
            Todos
          </button>
          {categories.map(([id, name]) => (
            <button
              key={id}
              type="button"
              aria-pressed={selected === id}
              onClick={() => {
                setSelected(id);
                setCount(PAGE_SIZE);
              }}
              className={chipClass(selected === id)}
            >
              {name}
            </button>
          ))}
        </div>
      )}
      <div className={gridClass}>
        {visible.slice(0, count).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      {hasMore && <div ref={sentinel} aria-hidden className="h-10" />}
    </>
  );
}
