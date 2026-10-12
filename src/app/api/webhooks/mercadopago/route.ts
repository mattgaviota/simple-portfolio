import { createHmac, timingSafeEqual } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/server/firebase-admin";
import { paymentRefunds, payments } from "@/lib/server/mercadopago";
import { sendOrderConfirmation } from "@/lib/server/email";
import type { Order, OrderItem, OrderStatus } from "@/types/order";

/**
 * Validates the x-signature header of a Mercado Pago webhook:
 * HMAC-SHA256 of "id:<data.id>;request-id:<x-request-id>;ts:<ts>;" with the
 * webhook secret. Parts missing from the request are left out of the manifest.
 */
function validSignature(request: Request, dataId: string) {
  const secret = process.env.MP_WEBHOOK_SECRET?.trim();
  const header = request.headers.get("x-signature");
  const requestId = request.headers.get("x-request-id");
  if (!secret) {
    // Without a secret the signature is not checked. This is safe because the
    // payment is always re-fetched from Mercado Pago with our access token.
    console.warn("Webhook signature not verified: MP_WEBHOOK_SECRET is not set");
    return true;
  }
  if (!header) {
    console.error("Webhook rejected: missing x-signature header");
    return false;
  }

  const parts = Object.fromEntries(
    header.split(",").map((p) => {
      const [k, ...v] = p.trim().split("=");
      return [k, v.join("=")];
    }),
  );
  if (!parts.ts || !parts.v1) {
    console.error("Webhook rejected: malformed x-signature header");
    return false;
  }

  const manifest =
    (dataId ? `id:${dataId.toLowerCase()};` : "") +
    (requestId ? `request-id:${requestId};` : "") +
    `ts:${parts.ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(parts.v1);
  const ok = a.length === b.length && timingSafeEqual(a, b);
  if (!ok && process.env.NODE_ENV !== "production") {
    // Dev-only diagnosis: which manifest variant (if any) matches this secret.
    const variants: Record<string, string> = {
      "id+request-id+ts": `id:${dataId};request-id:${requestId};ts:${parts.ts};`,
      "id-lower+request-id+ts": `id:${dataId.toLowerCase()};request-id:${requestId};ts:${parts.ts};`,
      "id+ts": `id:${dataId};ts:${parts.ts};`,
      "request-id+ts": `request-id:${requestId};ts:${parts.ts};`,
      "ts": `ts:${parts.ts};`,
    };
    const matched = Object.entries(variants)
      .filter(([, m]) => createHmac("sha256", secret).update(m).digest("hex") === parts.v1)
      .map(([name]) => name);
    console.error("Webhook signature debug " + JSON.stringify({
      url: request.url.replace(/^https?:\/\/[^/]+/, ""),
      headers: [...request.headers.keys()].filter((h) => h.startsWith("x-") || h.startsWith("cf-")),
      dataId,
      requestId,
      ts: parts.ts,
      v1: parts.v1,
      secretLength: secret.length,
      matchedVariants: matched,
    }));
  }
  if (!ok) {
    console.error(
      "Webhook rejected: signature mismatch. Check that MP_WEBHOOK_SECRET is the secret of the same application and mode (test/production) that sends this notification.",
      { dataId, hasRequestId: Boolean(requestId) },
    );
  }
  return ok;
}

function mapStatus(mp: string | undefined, refunded: boolean): OrderStatus {
  if (refunded) return "refunded";
  switch (mp) {
    case "approved":
      return "approved";
    case "rejected":
      return "rejected";
    case "cancelled":
      return "cancelled";
    case "refunded":
    case "charged_back":
      return "refunded";
    default:
      return "pending";
  }
}

async function processPayment(paymentId: string) {
  // Never trust the notification: fetch the payment from Mercado Pago.
  const payment = await payments().get({ id: paymentId });
  const orderId = payment.external_reference;
  if (!orderId) return;

  const db = getAdminDb();
  const orderRef = db.collection("orders").doc(orderId);

  // The admin cancelled this order. Its status is final, and a payment that
  // still got approved afterwards (the buyer paid late) is refunded.
  const existing = await orderRef.get();
  if (existing.exists && Number(existing.data()!.cancelledAt ?? 0) > 0) {
    if (
      payment.status === "approved" &&
      Number(payment.transaction_amount_refunded ?? 0) === 0
    ) {
      await paymentRefunds().total({ payment_id: String(payment.id) });
    }
    return;
  }

  // Set only by the one transaction that moves the order to approved, so the
  // confirmation email is sent once even if Mercado Pago notifies repeatedly.
  let confirmed: Order | null = null;

  await db.runTransaction(async (tx) => {
    confirmed = null;
    const orderSnap = await tx.get(orderRef);
    if (!orderSnap.exists) return;
    const order = orderSnap.data()!;

    // A later failed attempt must not overwrite an order already paid by another payment.
    if (
      order.status === "approved" &&
      order.mpPaymentId &&
      order.mpPaymentId !== String(payment.id)
    ) {
      return;
    }

    // Mismatched amount or currency means this payment is not for this order.
    if (
      payment.currency_id !== "ARS" ||
      Math.abs(Number(payment.transaction_amount) - Number(order.total)) > 0.01
    ) {
      console.error("Payment/order mismatch", { orderId, paymentId });
      return;
    }

    const refunded = Number(payment.transaction_amount_refunded ?? 0) > 0;
    const status = mapStatus(payment.status, refunded);
    const items = order.items as OrderItem[];

    const productRefs = items.map((i) =>
      db.collection("products").doc(i.productId),
    );
    const productSnaps = await Promise.all(productRefs.map((r) => tx.get(r)));

    const update: Record<string, unknown> = {
      status,
      mpPaymentId: String(payment.id),
      updatedAt: Date.now(),
    };

    // Stock moves exactly once on approval and is restored on refund.
    if (status === "approved" && !order.stockApplied) {
      let issue = false;
      items.forEach((item, idx) => {
        const snap = productSnaps[idx];
        if (!snap.exists) {
          issue = true;
          return;
        }
        const stock = Number(snap.data()!.amount ?? 0);
        if (stock < item.quantity) issue = true;
        tx.update(productRefs[idx], {
          amount: Math.max(0, stock - item.quantity),
        });
      });
      update.stockApplied = true;
      update.stockIssue = issue;
      confirmed = { id: orderSnap.id, ...order } as Order;
    } else if (status === "refunded" && order.stockApplied) {
      items.forEach((item, idx) => {
        if (productSnaps[idx].exists) {
          tx.update(productRefs[idx], {
            amount: FieldValue.increment(item.quantity),
          });
        }
      });
      update.stockApplied = false;
    }

    tx.update(orderRef, update);
  });

  if (confirmed) {
    const sent = await sendOrderConfirmation(confirmed);
    if (sent) await orderRef.update({ emailSentAt: Date.now() });
  }
}

// Mercado Pago Webhooks receiver: POST ?data.id=<payment id>&type=payment with
// a signed x-signature header. Only payment events matter: the payment is
// always re-fetched from Mercado Pago with our access token, so nothing in the
// request body is trusted.
export async function POST(request: Request) {
  const params = new URL(request.url).searchParams;
  const body = await request.json().catch(() => null);
  const type = String(params.get("type") ?? body?.type ?? "");
  const dataId = String(params.get("data.id") ?? body?.data?.id ?? "");

  // Other topics (merchant orders, etc.) trigger no action, so acknowledge them
  // without retries. Signatures are enforced for the payment events that do.
  if (type !== "payment" || !dataId) return new Response(null, { status: 200 });
  if (!validSignature(request, params.get("data.id") ?? "")) {
    return new Response("Invalid signature", { status: 401 });
  }

  try {
    await processPayment(dataId);
  } catch (error) {
    const status = (error as { status?: number })?.status;
    // Unknown ids (e.g. the panel's "simulate" button) must not make Mercado Pago retry.
    if (status === 404 || status === 400) return new Response(null, { status: 200 });
    console.error("Webhook processing failed", error);
    return new Response("Error", { status: 500 });
  }

  return new Response(null, { status: 200 });
}
