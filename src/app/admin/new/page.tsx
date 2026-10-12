import { ProductForm } from "@/components/product-form";

// Admin screens wait for the client-side Firebase auth state, so they cannot render instantly.
export const instant = false;

export default function NewProductPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">Nuevo producto</h1>
      <ProductForm />
    </>
  );
}
