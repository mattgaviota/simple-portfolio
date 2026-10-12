import { OrderAdminList } from "@/components/order-admin-list";

// Admin screens wait for the client-side Firebase auth state, so they cannot render instantly.
export const instant = false;

export default function AdminOrdersPage() {
  return <OrderAdminList />;
}
