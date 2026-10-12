import { getAdminDb } from "@/lib/server/firebase-admin";
import { appUrl, preferenceExpiration, preferences } from "@/lib/server/mercadopago";
import { parseCart, parseShipping } from "@/lib/server/validate";
import type { OrderItem } from "@/types/order";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const cart = parseCart(body?.items);
  const shipping = parseShipping(body?.shipping);
  if (!cart || !shipping) {
    return Response.json({ error: "Datos inválidos." }, { status: 400 });
  }

  const db = getAdminDb();

  // Prices and names always come from Firestore, never from the client.
  const items: OrderItem[] = [];
  for (const line of cart) {
    const snap = await db.collection("products").doc(line.productId).get();
    if (!snap.exists) {
      return Response.json(
        { error: "Un producto ya no está disponible." },
        { status: 409 },
      );
    }
    const data = snap.data()!;
    const stock = Number(data.amount ?? 0);
    if (stock < line.quantity) {
      return Response.json(
        { error: `Sin stock suficiente de "${data.name}".` },
        { status: 409 },
      );
    }
    const colors: { name: string }[] = Array.isArray(data.colors) ? data.colors : [];
    if (colors.length > 0 && !colors.some((c) => c.name === line.colorName)) {
      return Response.json({ error: "Color inválido." }, { status: 400 });
    }
    items.push({
      productId: snap.id,
      name: String(data.name),
      colorName: line.colorName,
      unitPrice: Number(data.price),
      imageUrl: String(data.imageUrl ?? ""),
      quantity: line.quantity,
    });
  }

  const total = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const now = Date.now();
  const orderRef = db.collection("orders").doc();
  const counterRef = db.collection("counters").doc("orders");
  await db.runTransaction(async (tx) => {
    const counter = await tx.get(counterRef);
    const orderNumber = Number(counter.data()?.value ?? 0) + 1;
    tx.set(counterRef, { value: orderNumber });
    tx.set(orderRef, {
      orderNumber,
      items,
      shipping,
      total,
      status: "pending",
      mpPaymentId: "",
      stockApplied: false,
      stockIssue: false,
      shippedAt: 0,
      cancelledAt: 0,
      createdAt: now,
      updatedAt: now,
    });
  });

  try {
    const base = appUrl();
    const result = await preferences().create({
      body: {
        items: items.map((i) => ({
          id: i.productId,
          title: i.colorName ? `${i.name} (${i.colorName})` : i.name,
          quantity: i.quantity,
          unit_price: i.unitPrice,
          currency_id: "ARS",
        })),
        payer: { name: shipping.name, email: shipping.email },
        external_reference: orderRef.id,
        back_urls: {
          success: `${base}/checkout/result?order=${orderRef.id}`,
          pending: `${base}/checkout/result?order=${orderRef.id}`,
          failure: `${base}/checkout/result?order=${orderRef.id}`,
        },
        auto_return: "approved",
        ...preferenceExpiration(),
      },
    });
    if (!result.init_point) throw new Error("Missing init_point");
    return Response.json({ url: result.init_point });
  } catch (error) {
    console.error("Mercado Pago preference failed", error);
    await orderRef.update({ status: "cancelled", updatedAt: Date.now() });
    return Response.json(
      { error: "No se pudo iniciar el pago." },
      { status: 502 },
    );
  }
}
