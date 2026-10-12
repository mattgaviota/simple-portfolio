import { ProductAdminList } from "@/components/product-admin-list";

// Admin screens wait for the client-side Firebase auth state, so they cannot render instantly.
export const instant = false;

export default function AdminPage() {
  return <ProductAdminList />;
}
