import { CategoryManager } from "@/components/category-manager";

// Admin screens wait for the client-side Firebase auth state, so they cannot render instantly.
export const instant = false;

export default function CategoriesPage() {
  return <CategoryManager />;
}
