"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { OrderStatusBadges } from "@/components/order-status";
import { formatPrice } from "@/lib/format";
import { orderLabel } from "@/types/order";
import { cancelOrder, listOrders, setOrderShipped } from "@/lib/orders";
import type { Order } from "@/types/order";

export function OrderAdminList() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"active" | "cancelled">("active");
  const [pendingCancel, setPendingCancel] = useState<Order | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listOrders()
      .then(setOrders)
      .catch(() => setError("No se pudieron cargar los pedidos."));
  }, []);

  async function toggleShipped(order: Order) {
    setError(null);
    try {
      const shippedAt = await setOrderShipped(order.id, !order.shippedAt);
      setOrders((prev) =>
        prev?.map((o) => (o.id === order.id ? { ...o, shippedAt } : o)) ?? null,
      );
    } catch {
      setError("No se pudo actualizar el pedido.");
    }
  }

  async function confirmCancel() {
    if (!pendingCancel) return;
    setBusy(true);
    setError(null);
    try {
      await cancelOrder(pendingCancel.id);
      setPendingCancel(null);
      setOrders(await listOrders());
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cancelar el pedido.");
      setPendingCancel(null);
    } finally {
      setBusy(false);
    }
  }

  const isCancelled = (o: Order) => o.status === "cancelled" || o.status === "refunded";
  const visible = orders?.filter((o) => (tab === "cancelled") === isCancelled(o));

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <Link
          href="/admin"
          className="rounded-lg border border-black/20 px-4 py-2 text-sm font-medium"
        >
          Volver a productos
        </Link>
      </div>
      <div role="tablist" className="mb-4 flex gap-2">
        {(["active", "cancelled"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              tab === t ? "bg-accent text-white" : "border border-black/20"
            }`}
          >
            {t === "active" ? "Pedidos" : "Cancelados"}
          </button>
        ))}
      </div>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {!visible ? (
        <p className="text-neutral-500">Cargando...</p>
      ) : visible.length === 0 ? (
        <p className="text-neutral-500">
          {tab === "active" ? "Aún no hay pedidos." : "No hay pedidos cancelados."}
        </p>
      ) : (
        <ul className="divide-y divide-black/10 rounded-xl border border-black/10 bg-white/70">
          {visible.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4 text-sm">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {orderLabel(o)} · {o.shipping.name} · {formatPrice(o.total)}
                </p>
                <p className="text-neutral-500">
                  {new Date(o.createdAt).toLocaleString("es-AR")} ·{" "}
                  {o.items.reduce((n, i) => n + i.quantity, 0)} productos
                </p>
                {o.stockIssue && (
                  <p className="font-medium text-red-600">Revisar stock</p>
                )}
              </div>
              <OrderStatusBadges order={o} />
              <div className="flex gap-3">
                <Link
                  href={`/admin/orders/${o.id}`}
                  className="font-medium underline-offset-2 hover:underline"
                >
                  Ver
                </Link>
                {o.status === "approved" && (
                  <button
                    type="button"
                    onClick={() => toggleShipped(o)}
                    className="font-medium underline-offset-2 hover:underline"
                  >
                    {o.shippedAt ? "Desmarcar envío" : "Marcar enviado"}
                  </button>
                )}
                {(o.status === "approved" || o.status === "pending") && (
                  <button
                    type="button"
                    onClick={() => setPendingCancel(o)}
                    className="font-medium text-red-600 underline-offset-2 hover:underline"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {pendingCancel && (
        <CancelDialog
          order={pendingCancel}
          busy={busy}
          onCancel={() => setPendingCancel(null)}
          onConfirm={confirmCancel}
        />
      )}
    </>
  );
}

export function CancelDialog({
  order,
  busy,
  onCancel,
  onConfirm,
}: {
  order: Order;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const approved = order.status === "approved";
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="w-full max-w-sm rounded-xl bg-[var(--background)] p-6">
        <h2 className="text-lg font-semibold">Cancelar pedido</h2>
        <p className="mt-2 text-sm text-neutral-600">
          {approved
            ? `Se reembolsará el pago completo (${formatPrice(order.total)}) a ${order.shipping.name} en Mercado Pago y el stock volverá a los productos.`
            : `Se cancelará el pago pendiente de ${order.shipping.name} en Mercado Pago.`}{" "}
          No se puede deshacer.
        </p>
        {approved && order.shippedAt > 0 && (
          <p className="mt-2 text-sm font-medium text-red-600">
            Este pedido ya figura como enviado.
          </p>
        )}
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="rounded-lg border border-black/20 px-4 py-2 text-sm"
          >
            Volver
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {busy ? "Cancelando..." : "Cancelar pedido"}
          </button>
        </div>
      </div>
    </div>
  );
}
