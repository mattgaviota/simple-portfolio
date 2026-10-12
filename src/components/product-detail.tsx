"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { formatPrice } from "@/lib/format";
import { getProduct } from "@/lib/products";
import { useSettings } from "@/lib/settings-context";
import { whatsappMessageUrl } from "@/lib/social";
import { FaWhatsapp } from "react-icons/fa6";
import type { Product } from "@/types/product";

export function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { settings } = useSettings();
  const [product, setProduct] = useState<Product | null | undefined>();

  useEffect(() => {
    getProduct(id)
      .then(setProduct)
      .catch(() => setProduct(null));
  }, [id]);

  const backLink = (
    <Link
      href="/"
      className="mb-6 inline-block text-sm font-medium text-accent underline-offset-2 hover:underline"
    >
      &larr; Volver a los productos
    </Link>
  );

  if (product === undefined) {
    return (
      <>
        {backLink}
        <div className="grid gap-8 md:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-xl bg-white/60" />
          <div className="h-48 animate-pulse rounded-xl bg-white/60" />
        </div>
      </>
    );
  }

  if (product === null) {
    return (
      <>
        {backLink}
        <p className="py-16 text-center text-neutral-500">
          Producto no encontrado.
        </p>
      </>
    );
  }

  const soldOut = product.amount <= 0;
  const whatsappUrl = whatsappMessageUrl(
    settings.whatsapp,
    `Hola, quisiera consultar por el producto "${product.name}": ${window.location.href}`,
  );

  return (
    <>
      {backLink}
      <article className="grid gap-8 md:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-xl border border-black/10 bg-white/50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.imageUrl}
            alt={product.name}
            className={`h-full w-full object-cover ${soldOut ? "opacity-60" : ""}`}
          />
          {soldOut && (
            <span className="absolute left-4 top-4 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white">
              Agotado
            </span>
          )}
        </div>

        <div className="flex flex-col gap-5">
          {product.categoryName && (
            <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              {product.categoryName}
            </span>
          )}
          <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
          <p className="text-2xl font-semibold text-accent">
            {formatPrice(product.price)}
          </p>
          <p className="whitespace-pre-line text-neutral-700">
            {product.description}
          </p>

          {product.colors.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-medium">Colores</h2>
              <ul className="flex flex-wrap gap-3">
                {product.colors.map((color, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 rounded-full border border-black/10 bg-white/70 py-1 pl-1.5 pr-3 text-sm"
                  >
                    <span
                      className="h-5 w-5 rounded-full border border-black/20"
                      style={{ backgroundColor: color.hex }}
                    />
                    {color.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center justify-center gap-2 self-start rounded-lg bg-accent px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              <FaWhatsapp className="h-5 w-5" />
              Consultar con el vendedor
            </a>
          )}
        </div>
      </article>
    </>
  );
}
