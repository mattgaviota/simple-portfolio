import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { getAuthClient, getDb } from "@/lib/firebase";
import type { Order } from "@/types/order";

const COLLECTION = "orders";

function toOrder(id: string, data: Record<string, unknown>): Order {
  return { id, shippedAt: 0, cancelledAt: 0, ...data } as Order;
}

export async function listOrders(): Promise<Order[]> {
  const snap = await getDocs(
    query(collection(getDb(), COLLECTION), orderBy("createdAt", "desc")),
  );
  return snap.docs.map((d) => toOrder(d.id, d.data()));
}

export async function getOrder(id: string): Promise<Order | null> {
  const snap = await getDoc(doc(getDb(), COLLECTION, id));
  return snap.exists() ? toOrder(snap.id, snap.data()) : null;
}

export async function setOrderShipped(id: string, shipped: boolean) {
  const now = Date.now();
  const shippedAt = shipped ? now : 0;
  await updateDoc(doc(getDb(), COLLECTION, id), { shippedAt, updatedAt: now });
  return shippedAt;
}

/** Cancels an order through the server (refunds or cancels the payment in Mercado Pago). */
export async function cancelOrder(id: string) {
  const token = await getAuthClient().currentUser?.getIdToken();
  const res = await fetch(`/api/orders/${encodeURIComponent(id)}/cancel`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token ?? ""}` },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "No se pudo cancelar el pedido.");
  }
}
