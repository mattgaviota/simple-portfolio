export type OrderStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "refunded";

export type OrderItem = {
  productId: string;
  name: string;
  colorName: string;
  unitPrice: number;
  quantity: number;
  /** Product image at purchase time, used in the confirmation email. Missing on older orders. */
  imageUrl?: string;
};

/** Buyer contact. Shipping is arranged personally after the purchase. */
export type Shipping = {
  name: string;
  email: string;
  phone: string;
  /** Address fields only exist on orders created before shipping moved outside the site. */
  street?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  notes?: string;
};

export type Order = {
  id: string;
  /** Sequential, human-friendly number. Missing on orders created before it existed. */
  orderNumber?: number;
  items: OrderItem[];
  shipping: Shipping;
  total: number;
  status: OrderStatus;
  mpPaymentId: string;
  stockApplied: boolean;
  stockIssue: boolean;
  /** Epoch ms when the order was marked as shipped, 0 if not shipped yet. */
  shippedAt: number;
  /** Epoch ms when the admin cancelled the order, 0 otherwise. */
  cancelledAt: number;
  /** Epoch ms when the confirmation email was sent, 0 if not sent. */
  emailSentAt?: number;
  createdAt: number;
  updatedAt: number;
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
};

export function orderLabel(order: Pick<Order, "id" | "orderNumber">) {
  return order.orderNumber ? `#${order.orderNumber}` : `#${order.id.slice(0, 6).toUpperCase()}`;
}
