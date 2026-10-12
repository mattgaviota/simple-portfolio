import "server-only";
import type { Shipping } from "@/types/order";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const str = (v: unknown, max: number) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

export type CartLine = { productId: string; colorName: string; quantity: number };

export function parseCart(value: unknown): CartLine[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 50) {
    return null;
  }
  const lines: CartLine[] = [];
  for (const raw of value) {
    const productId = str(raw?.productId, 128);
    const quantity = Number(raw?.quantity);
    if (!productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      return null;
    }
    lines.push({ productId, colorName: str(raw?.colorName, 60), quantity });
  }
  return lines;
}

export function parseShipping(value: unknown): Shipping | null {
  const v = (value ?? {}) as Record<string, unknown>;
  const contact: Shipping = {
    name: str(v.name, 100),
    email: str(v.email, 120),
    phone: str(v.phone, 40),
  };
  if (!contact.name || !contact.phone || !EMAIL_RE.test(contact.email)) {
    return null;
  }
  return contact;
}
