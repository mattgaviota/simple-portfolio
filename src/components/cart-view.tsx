"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/format";
import { getProduct } from "@/lib/products";
import type { Product } from "@/types/product";

const SHIPPING_COUNTRY = (process.env.NEXT_PUBLIC_SHIPPING_COUNTRY ?? "").trim();

const FIELDS = [
  { key: "name", label: "Nombre y apellido", type: "text", autoComplete: "name" },
  { key: "email", label: "Email", type: "email", autoComplete: "email" },
  { key: "phone", label: "Teléfono", type: "tel", autoComplete: "tel" },
] as const;

export function CartView() {
  const { lines, ready, setQuantity, remove } = useCart();
  const [products, setProducts] = useState<Record<string, Product | null>>({});
  const [form, setForm] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const missing = [...new Set(lines.map((l) => l.productId))].filter(
      (id) => !(id in products),
    );
    missing.forEach((id) =>
      getProduct(id)
        .catch(() => null)
        .then((p) => setProducts((prev) => ({ ...prev, [id]: p }))),
    );
  }, [lines, products]);

  if (!ready) {
    return <p className="py-16 text-center text-neutral-500">Cargando...</p>;
  }

  if (lines.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-neutral-600">Tu carrito está vacío.</p>
        <Link href="/" className="mt-4 inline-block font-medium text-accent underline">
          Ver productos
        </Link>
      </div>
    );
  }

  const loaded = lines.every((l) => l.productId in products);
  const unavailable = lines.some((l) => {
    const p = products[l.productId];
    return p === null || (p && p.amount < l.quantity);
  });
  const total = lines.reduce(
    (sum, l) => sum + (products[l.productId]?.price ?? 0) * l.quantity,
    0,
  );

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines,
          shipping: form,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "No se pudo iniciar el pago.");
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar el pago.");
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <ul className="divide-y divide-black/10 self-start rounded-xl border border-black/10 bg-white/70">
        {lines.map((l) => {
          const p = products[l.productId];
          return (
            <li key={`${l.productId}-${l.colorName}`} className="flex gap-4 p-4">
              {p ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.imageUrl} alt={p.name} className="h-20 w-20 rounded-lg object-cover" />
              ) : (
                <div className="h-20 w-20 animate-pulse rounded-lg bg-white/60" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {p === null ? "Producto no disponible" : (p?.name ?? "...")}
                </p>
                {l.colorName && (
                  <p className="text-sm text-neutral-500">{l.colorName}</p>
                )}
                {p && p.amount < l.quantity && (
                  <p className="text-sm text-red-600">
                    Solo quedan {p.amount} en stock.
                  </p>
                )}
                <div className="mt-2 flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={p?.amount ?? 99}
                    aria-label="Cantidad"
                    value={l.quantity}
                    onChange={(e) =>
                      setQuantity(
                        l.productId,
                        l.colorName,
                        Math.max(1, Math.floor(Number(e.target.value)) || 1),
                      )
                    }
                    className="w-20 rounded-lg border border-black/20 bg-white px-2 py-1"
                  />
                  <button
                    type="button"
                    onClick={() => remove(l.productId, l.colorName)}
                    className="text-sm text-red-600 underline-offset-2 hover:underline"
                  >
                    Quitar
                  </button>
                </div>
              </div>
              {p && (
                <span className="font-semibold">
                  {formatPrice(p.price * l.quantity)}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      <form
        onSubmit={pay}
        className="flex flex-col gap-3 self-start rounded-xl border border-black/10 bg-white/70 p-4"
      >
        <h2 className="font-semibold">Datos de contacto</h2>
        {FIELDS.map((f) => (
          <label key={f.key} className="flex flex-col gap-1 text-sm">
            {f.label}
            <input
              required
              type={f.type}
              autoComplete={f.autoComplete}
              value={form[f.key] ?? ""}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              className="rounded-lg border border-black/20 bg-white px-3 py-2"
            />
          </label>
        ))}
        <p className="flex justify-between border-t border-black/10 pt-3 font-semibold">
          <span>Total</span>
          <span>{loaded ? formatPrice(total) : "..."}</span>
        </p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy || !loaded || unavailable}
          className="rounded-lg bg-accent px-5 py-3 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {busy ? "Redirigiendo..." : "Pagar con Mercado Pago"}
        </button>
        <p className="text-xs text-neutral-500">
          El envío se coordina después de la compra, de forma personal, con los
          datos de contacto que nos dejes. Su costo no está incluido en el total.
          {SHIPPING_COUNTRY && ` Solo realizamos envíos dentro de ${SHIPPING_COUNTRY}.`}
        </p>
      </form>
    </div>
  );
}
