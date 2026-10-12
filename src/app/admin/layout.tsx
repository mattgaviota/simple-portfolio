import { AuthProvider } from "@/lib/auth";
import { AuthGuard } from "@/components/auth-guard";

// Admin screens wait for the client-side Firebase auth state, so they cannot render instantly.
export const instant = false;

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <AuthProvider>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
        <AuthGuard>{children}</AuthGuard>
      </main>
    </AuthProvider>
  );
}
