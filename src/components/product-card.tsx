import Link from "next/link";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/types/product";

export function ProductCard({ product }: { product: Product }) {
  const soldOut = product.amount <= 0;

  return (
    <Link
      href={`/products/${product.id}`}
      className="group block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <article className="flex h-full flex-col overflow-hidden transition-shadow group-hover:shadow-md rounded-xl border border-black/10 bg-white/80 shadow-sm backdrop-blur">
        <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-white/50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            className={`absolute inset-0 h-full w-full object-cover ${soldOut ? "opacity-60" : ""}`}
          />
          {soldOut && (
            <span className="absolute left-3 top-3 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white">
              Agotado
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1.5 p-3 sm:gap-2 sm:p-4">
          <div className="flex flex-col items-start gap-0.5 sm:flex-row sm:justify-between sm:gap-3">
            <h2 className="text-sm font-semibold leading-tight sm:text-base">{product.name}</h2>
            <span className="shrink-0 font-semibold">
              {formatPrice(product.price)}
            </span>
          </div>
          <p className="line-clamp-3 text-sm text-neutral-600">
            {product.description}
          </p>
          {(product.categoryName || product.colors.length > 0) && (
            <div className="mt-auto flex items-center justify-between gap-3 pt-2">
              <span className="truncate text-xs font-medium uppercase tracking-wide text-neutral-500">
                {product.categoryName}
              </span>
              <ul
                className="flex shrink-0 gap-1.5"
                aria-label="Colores disponibles"
              >
                {product.colors.map((color, i) => (
                  <li
                    key={i}
                    title={color.name}
                    aria-label={color.name}
                    className="h-4 w-4 rounded-full border border-black/20"
                    style={{ backgroundColor: color.hex }}
                  />
                ))}
              </ul>
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
