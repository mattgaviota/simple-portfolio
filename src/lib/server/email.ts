import "server-only";
import { Resend } from "resend";
import { getAdminDb } from "@/lib/server/firebase-admin";
import { orderLabel, type Order } from "@/types/order";

const priceFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
});

const esc = (v: string) =>
  v.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

type Brand = { title: string; slogan: string; logoUrl: string };

async function loadBrand(): Promise<Brand> {
  const fallback = { title: "Mi Tienda", slogan: "", logoUrl: "" };
  try {
    const snap = await getAdminDb().collection("settings").doc("store").get();
    const data = snap.data() ?? {};
    const str = (v: unknown) => (typeof v === "string" ? v : "");
    return {
      title: str(data.title) || fallback.title,
      slogan: str(data.slogan),
      logoUrl: /^https:\/\//.test(str(data.logoUrl)) ? str(data.logoUrl) : "",
    };
  } catch {
    return fallback;
  }
}

const httpsOnly = (v: unknown) =>
  typeof v === "string" && /^https:\/\//.test(v) ? v : "";

/** Image per item: the one saved with the order, or the product's current one for older orders. */
async function itemImages(order: Order): Promise<string[]> {
  const db = getAdminDb();
  return Promise.all(
    order.items.map(async (i) => {
      const saved = httpsOnly(i.imageUrl);
      if (saved) return saved;
      try {
        const snap = await db.collection("products").doc(i.productId).get();
        return httpsOnly(snap.data()?.imageUrl);
      } catch {
        return "";
      }
    }),
  );
}

/** Sends the purchase confirmation. Returns true if Resend accepted it; never throws. */
export async function sendOrderConfirmation(order: Order): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    console.warn("Confirmation email skipped: RESEND_API_KEY or EMAIL_FROM is not set");
    return false;
  }

  const country = (process.env.NEXT_PUBLIC_SHIPPING_COUNTRY ?? "").trim();
  const scope = country ? ` (solo dentro de ${country})` : "";
  const brand = await loadBrand();
  const store = brand.title;
  const label = orderLabel(order);
  const images = await itemImages(order);
  const lines = order.items.map((i, idx) => ({
    image: images[idx],
    text: `${i.quantity} x ${i.name}${i.colorName ? ` (${i.colorName})` : ""}`,
    price: priceFormatter.format(i.unitPrice * i.quantity),
  }));
  const total = priceFormatter.format(order.total);

  const text = [
    store,
    ...(brand.slogan ? [brand.slogan] : []),
    "",
    `Hola ${order.shipping.name},`,
    "",
    `Recibimos tu pago. Tu pedido ${label} está confirmado.`,
    "",
    ...lines.map((l) => `- ${l.text}: ${l.price}`),
    "",
    `Total: ${total}`,
    "",
    `Para coordinar el envío${scope}, respondé este email con:`,
    "- Dirección",
    "- Ciudad",
    "- Provincia",
    "- Código postal",
    "- Una nota (opcional)",
    "",
    "El envío se acuerda de forma personal después de la compra.",
  ].join("\n");

  const header = `<table style="width:100%;border-collapse:collapse;margin-bottom:20px"><tr>
${brand.logoUrl ? `<td style="width:64px;padding-right:14px"><img src="${esc(brand.logoUrl)}" alt="${esc(store)}" width="56" height="56" style="border-radius:50%;object-fit:cover;display:block"></td>` : ""}
<td><div style="font-size:20px;font-weight:bold;color:#6b5ca5">${esc(store)}</div>${brand.slogan ? `<div style="font-size:14px;color:#666">${esc(brand.slogan)}</div>` : ""}</td>
</tr></table>`;

  const html = `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#3a3350">
${header}
<h1 style="font-size:20px">Pedido ${esc(label)} confirmado</h1>
<p>Hola ${esc(order.shipping.name)}, recibimos tu pago. Esto es lo que compraste:</p>
<table style="width:100%;border-collapse:collapse">
${lines
  .map(
    (l) =>
      `<tr><td style="padding:8px 12px 8px 0;border-bottom:1px solid #eee;width:72px">${l.image ? `<img src="${esc(l.image)}" alt="" width="64" height="64" style="display:block;width:64px;height:64px;object-fit:cover;border-radius:8px">` : ""}</td><td style="padding:8px 0;border-bottom:1px solid #eee">${esc(l.text)}</td><td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;white-space:nowrap">${esc(l.price)}</td></tr>`,
  )
  .join("\n")}
<tr><td colspan="2" style="padding:10px 0;font-weight:bold">Total</td><td style="padding:10px 0;text-align:right;font-weight:bold">${esc(total)}</td></tr>
</table>
<div style="margin-top:20px;padding:14px;background:#f6f3fc;border-radius:8px">
<p style="margin:0 0 8px;font-weight:bold">Para coordinar el envío${esc(scope)}, respondé este email con:</p>
<ul style="margin:0 0 8px;padding-left:20px">
<li>Dirección</li><li>Ciudad</li><li>Provincia</li><li>Código postal</li><li>Una nota (opcional)</li>
</ul>
<p style="margin:0;color:#666">El envío se acuerda de forma personal después de la compra.</p>
</div>
</div>`;

  try {
    const { error } = await new Resend(apiKey).emails.send(
      {
        from,
        to: order.shipping.email,
        replyTo: process.env.EMAIL_REPLY_TO || undefined,
        subject: `Pedido ${label} confirmado - ${store}`,
        text,
        html,
      },
      { idempotencyKey: `order-confirmation/${order.id}` },
    );
    if (error) {
      console.error("Resend rejected the confirmation email", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Confirmation email failed", error);
    return false;
  }
}
