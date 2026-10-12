import { ORDER_STATUS_LABEL, type Order } from "@/types/order";

export function OrderStatusBadges({ order }: { order: Order }) {
  return (
    <span className="flex flex-wrap gap-2">
      <span className="rounded-full bg-black/5 px-3 py-0.5 text-xs font-semibold">
        {ORDER_STATUS_LABEL[order.status]}
      </span>
      {order.status === "approved" && (
        <span
          className={`rounded-full px-3 py-0.5 text-xs font-semibold ${
            order.shippedAt
              ? "bg-green-100 text-green-800"
              : "bg-amber-100 text-amber-800"
          }`}
        >
          {order.shippedAt ? "Enviado" : "Por enviar"}
        </span>
      )}
    </span>
  );
}
