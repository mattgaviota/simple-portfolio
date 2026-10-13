"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { ImageCarousel } from "@/components/image-carousel";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/format";
import { getProduct } from "@/lib/products";
import { useSettings } from "@/lib/settings-context";
import { whatsappMessageUrl } from "@/lib/social";
import { FaWhatsapp } from "react-icons/fa6";
import type { Product } from "@/types/product";

export function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { settings } = useSettings();
  const { add } = useCart();
  const [product, setProduct] = useState<Product | null | undefined>();
  const [colorName, setColorName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

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
  const selectedColor = colorName || product.colors[0]?.name || "";
  const whatsappUrl = whatsappMessageUrl(
    settings.whatsapp,
    `Hola, quisiera consultar por el producto "${product.name}": ${window.location.href}`,
  );

  return (
    <>
      {backLink}
      <article className="grid gap-8 md:grid-cols-2">
        <ImageCarousel
          images={[product.imageUrl, ...product.extraImages.map((i) => i.url)]}
          alt={product.name}
          dimmed={soldOut}
        >
          {soldOut && (
            <span className="absolute left-4 top-4 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white">
              Agotado
            </span>
          )}
        </ImageCarousel>

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
            <fieldset>
              <legend className="mb-2 text-sm font-medium">Colores</legend>
              <div className="flex flex-wrap gap-3">
                {product.colors.map((color) => (
                  <label
                    key={color.name}
                    className="flex cursor-pointer items-center gap-2 rounded-full border border-black/10 bg-white/70 py-1 pl-1.5 pr-3 text-sm has-checked:border-accent has-checked:ring-2 has-checked:ring-accent/40"
                  >
                    <input
                      type="radio"
                      name="color"
                      value={color.name}
                      checked={selectedColor === color.name}
                      onChange={() => setColorName(color.name)}
                      className="sr-only"
                    />
                    <span
                      className="h-5 w-5 rounded-full border border-black/20"
                      style={{ backgroundColor: color.hex }}
                    />
                    {color.name}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {!soldOut && (
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                Cantidad
                <input
                  type="number"
                  min={1}
                  max={product.amount}
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(
                      Math.min(
                        product.amount,
                        Math.max(1, Math.floor(Number(e.target.value)) || 1),
                      ),
                    )
                  }
                  className="w-20 rounded-lg border border-black/20 bg-white px-3 py-2"
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  add({ productId: product.id, colorName: selectedColor, quantity });
                  setAdded(true);
                }}
                className="rounded-lg bg-accent px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
              >
                Agregar al carrito
              </button>
            </div>
          )}
          {added && (
            <p role="status" className="text-sm text-neutral-700">
              Agregado.{" "}
              <Link href="/cart" className="font-medium text-accent underline">
                Ver carrito
              </Link>
            </p>
          )}

          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center justify-center gap-2 self-start rounded-lg border border-black/20 px-6 py-3 text-sm font-medium transition-colors hover:bg-white/70"
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
