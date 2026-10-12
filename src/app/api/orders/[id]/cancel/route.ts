import { getAdminDb } from "@/lib/server/firebase-admin";
import { isAdminRequest } from "@/lib/server/admin-auth";
import { paymentRefunds, payments } from "@/lib/server/mercadopago";
import type { OrderItem } from "@/types/order";

// Admin cancels an order:
//  - approved: the payment is fully refunded in Mercado Pago and the stock is restored.
//  - pending: the payment (if the buyer already started one) is cancelled in Mercado Pago.
// The order is kept and marked as cancelled.
export async function POST(
  request: Request,
  ctx: RouteContext<"/api/orders/[id]/cancel">,
) {
  if (!(await isAdminRequest(request))) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await ctx.params;
  const db = getAdminDb();
  const orderRef = db.collection("orders").doc(id);
  const snap = await orderRef.get();
  if (!snap.exists) {
    return Response.json({ error: "Pedido no encontrado." }, { status: 404 });
  }
  const order = snap.data()!;
  if (order.status !== "approved" && order.status !== "pending") {
    return Response.json(
      { error: "Solo se pueden cancelar pedidos pendientes o aprobados." },
      { status: 409 },
    );
  }

  const paymentId = String(order.mpPaymentId ?? "");
  try {
    if (order.status === "approved") {
      if (!paymentId) throw new Error("Approved order without payment id");
      await paymentRefunds().total({ payment_id: paymentId });
    } else if (paymentId) {
      await payments().cancel({ id: paymentId });
    }
  } catch (error) {
    console.error("Mercado Pago cancel/refund failed", error);
    const cause = (error as { cause?: { description?: string }[] })?.cause;
    const detail =
      (error as { causes?: { description?: string }[] })?.causes?.[0]?.description ??
      (Array.isArray(cause) ? cause[0]?.description : undefined);
    return Response.json(
      {
        error: `Mercado Pago no pudo procesar la cancelación${detail ? ` (${detail})` : ""}. El pedido no se modificó.`,
      },
      { status: 502 },
    );
  }

  await db.runTransaction(async (tx) => {
    const fresh = await tx.get(orderRef);
    const current = fresh.data()!;
    const items = current.items as OrderItem[];
    const refs = items.map((i) => db.collection("products").doc(i.productId));
    const snaps = current.stockApplied
      ? await Promise.all(refs.map((r) => tx.get(r)))
      : [];

    if (current.stockApplied) {
      items.forEach((item, idx) => {
        if (snaps[idx].exists) {
          tx.update(refs[idx], {
            amount: Number(snaps[idx].data()!.amount ?? 0) + item.quantity,
          });
        }
      });
    }
    tx.update(orderRef, {
      status: "cancelled",
      cancelledAt: Date.now(),
      stockApplied: false,
      updatedAt: Date.now(),
    });
  });

  return Response.json({ ok: true });
}
