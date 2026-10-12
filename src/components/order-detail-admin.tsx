"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { CancelDialog } from "@/components/order-admin-list";
import { OrderStatusBadges } from "@/components/order-status";
import { formatPrice } from "@/lib/format";
import { orderLabel } from "@/types/order";
import { cancelOrder, getOrder, setOrderShipped } from "@/lib/orders";
import type { Order } from "@/types/order";

export function OrderDetailAdmin({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getOrder(id)
      .then(setOrder)
      .catch(() => setOrder(null));
  }, [id]);

  if (order === undefined) return <p className="text-neutral-500">Cargando...</p>;
  if (order === null) {
    return (
      <>
        <Link
          href="/admin/orders"
          className="inline-block rounded-lg border border-black/20 px-4 py-2 text-sm font-medium"
        >
          Volver a pedidos
        </Link>
        <p className="mt-4 text-neutral-500">Pedido no encontrado.</p>
      </>
    );
  }

  const s = order.shipping;

  async function toggleShipped(current: Order) {
    setError(null);
    try {
      const shippedAt = await setOrderShipped(current.id, !current.shippedAt);
      setOrder({ ...current, shippedAt });
    } catch {
      setError("No se pudo actualizar el pedido.");
    }
  }

  async function confirmCancel() {
    setBusy(true);
    setError(null);
    try {
      await cancelOrder(id);
      setOrder(await getOrder(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cancelar el pedido.");
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">
          Pedido {orderLabel(order)} de {s.name}
        </h1>
        <Link
          href="/admin/orders"
          className="shrink-0 rounded-lg border border-black/20 px-4 py-2 text-sm font-medium"
        >
          Volver a pedidos
        </Link>
      </div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-neutral-500">
          {id} · {new Date(order.createdAt).toLocaleString("es-AR")}
        </p>
        <OrderStatusBadges order={order} />
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {order.stockIssue && (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">
          El stock era insuficiente al aprobarse el pago: revisar manualmente.
        </p>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-black/10 bg-white/70 p-4">
          <h2 className="mb-3 font-semibold">Productos</h2>
          <ul className="divide-y divide-black/10 text-sm">
            {order.items.map((i, idx) => (
              <li key={idx} className="flex justify-between gap-3 py-2">
                <span>
                  {i.quantity} x {i.name}
                  {i.colorName && ` (${i.colorName})`}
                </span>
                <span>{formatPrice(i.unitPrice * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 flex justify-between border-t border-black/10 pt-3 font-semibold">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </p>
          {order.status === "approved" && (
            <p className="mt-2 text-xs text-neutral-500">
              {order.emailSentAt
                ? `Email de confirmación enviado el ${new Date(order.emailSentAt).toLocaleString("es-AR")}`
                : "Email de confirmación no enviado"}
            </p>
          )}
          {order.mpPaymentId && (
            <p className="mt-2 text-xs text-neutral-500">
              Pago de Mercado Pago: {order.mpPaymentId}
            </p>
          )}
        </section>

        <section className="rounded-xl border border-black/10 bg-white/70 p-4 text-sm">
          <h2 className="mb-3 font-semibold">Contacto</h2>
          <p>{s.name}</p>
          <p>{s.phone}</p>
          <p>{s.email}</p>
          {s.street && (
            <p className="mt-2">
              {s.street}, {s.city}, {s.province} ({s.postalCode})
            </p>
          )}
          {s.notes && <p className="mt-2 text-neutral-600">Notas: {s.notes}</p>}
          <p className="mt-3 text-neutral-500">
            El envío se coordina personalmente con el comprador.
          </p>
          {order.cancelledAt > 0 && (
            <p className="mt-3 font-medium text-red-700">
              Cancelado el {new Date(order.cancelledAt).toLocaleString("es-AR")}
            </p>
          )}
          {order.shippedAt > 0 && (
            <p className="mt-3 font-medium text-green-800">
              Enviado el {new Date(order.shippedAt).toLocaleString("es-AR")}
            </p>
          )}
        </section>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {order.status === "approved" && (
          <button
            type="button"
            onClick={() => toggleShipped(order)}
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
          >
            {order.shippedAt ? "Desmarcar envío" : "Marcar como enviado"}
          </button>
        )}
        {(order.status === "approved" || order.status === "pending") && (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="rounded-lg border border-red-600 px-5 py-2.5 text-sm font-medium text-red-600"
          >
            Cancelar pedido
          </button>
        )}
      </div>

      {confirming && (
        <CancelDialog
          order={order}
          busy={busy}
          onCancel={() => setConfirming(false)}
          onConfirm={confirmCancel}
        />
      )}
    </>
  );
}
