import { Suspense } from "react";
import { OrderDetailAdmin } from "@/components/order-detail-admin";

// Admin screens wait for the client-side Firebase auth state, so they cannot render instantly.
export const instant = false;

export default function AdminOrderPage({
  params,
}: PageProps<"/admin/orders/[id]">) {
  return (
    <Suspense fallback={<p className="text-neutral-500">Cargando...</p>}>
      <OrderDetailAdmin params={params} />
    </Suspense>
  );
}
