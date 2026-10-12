import { Suspense } from "react";
import { EditProduct } from "@/components/edit-product";

// Admin screens wait for the client-side Firebase auth state, so they cannot render instantly.
export const instant = false;

export default function EditProductPage({
  params,
}: PageProps<"/admin/[id]/edit">) {
  return (
    <Suspense fallback={<p className="text-neutral-500">Cargando...</p>}>
      <EditProduct params={params} />
    </Suspense>
  );
}
