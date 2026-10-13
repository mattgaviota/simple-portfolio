"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DataTable, type Column } from "@/components/data-table";
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

  const columns: Column<Order>[] = [
    {
      id: "number",
      header: "Pedido",
      sortValue: (o) => o.createdAt,
      className: "whitespace-nowrap font-medium",
      cell: (o) => orderLabel(o),
    },
    {
      id: "customer",
      header: "Cliente",
      sortValue: (o) => o.shipping.name,
      className: "max-w-48",
      cell: (o) => <span className="block truncate">{o.shipping.name}</span>,
    },
    {
      id: "date",
      header: "Fecha",
      sortValue: (o) => o.createdAt,
      className: "whitespace-nowrap text-neutral-600",
      cell: (o) => new Date(o.createdAt).toLocaleString("es-AR"),
    },
    {
      id: "items",
      header: "Productos",
      align: "right",
      sortValue: (o) => o.items.reduce((n, i) => n + i.quantity, 0),
      cell: (o) => o.items.reduce((n, i) => n + i.quantity, 0),
    },
    {
      id: "total",
      header: "Total",
      align: "right",
      sortValue: (o) => o.total,
      className: "whitespace-nowrap",
      cell: (o) => formatPrice(o.total),
    },
    {
      id: "status",
      header: "Estado",
      cell: (o) => (
        <div className="flex flex-wrap items-center gap-2">
          <OrderStatusBadges order={o} />
          {o.stockIssue && (
            <span className="font-medium text-red-600">Revisar stock</span>
          )}
        </div>
      ),
    },
    {
      id: "actions",
      header: null,
      srHeader: "Acciones",
      align: "right",
      className: "whitespace-nowrap",
      cell: (o) => (
        <div className="flex justify-end gap-3">
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
      ),
    },
  ];

  const isCancelled = (o: Order) => o.status === "cancelled" || o.status === "refunded";
  const visible = orders?.filter((o) => (tab === "cancelled") === isCancelled(o));

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Pedidos</h1>
        
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
        <DataTable
          columns={columns}
          rows={visible}
          rowKey={(o) => o.id}
          emptyMessage="No hay pedidos."
          resetKey={tab}
        />
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
