import "server-only";
import { MercadoPagoConfig, Payment, PaymentRefund, Preference } from "mercadopago";

function getClient() {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) throw new Error("MP_ACCESS_TOKEN is not set");
  return new MercadoPagoConfig({ accessToken });
}

export const preferences = () => new Preference(getClient());
export const paymentRefunds = () => new PaymentRefund(getClient());
export const payments = () => new Payment(getClient());

export function appUrl() {
  const url = process.env.APP_URL;
  if (!url) throw new Error("APP_URL is not set");
  return url.replace(/\/$/, "");
}

const AR_OFFSET_MS = 3 * 60 * 60 * 1000;

// ISO 8601 with the Argentina offset (-03:00, no daylight saving), as in the API reference examples.
const toArgentinaIso = (ms: number) =>
  new Date(ms - AR_OFFSET_MS).toISOString().replace("Z", "-03:00");

/**
 * Preference expiration from CHECKOUT_EXPIRATION_HOURS (default 24).
 * After it the payment link stops working. 0 disables the expiration.
 */
export function preferenceExpiration(now = Date.now()) {
  const raw = process.env.CHECKOUT_EXPIRATION_HOURS?.trim();
  const hours = raw ? Number(raw) : 24;
  if (!Number.isFinite(hours) || hours <= 0) return { expires: false };
  return {
    expires: true,
    expiration_date_from: toArgentinaIso(now),
    expiration_date_to: toArgentinaIso(now + hours * 60 * 60 * 1000),
  };
}
