"use client";

import { useAuth } from "@/lib/auth";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { loading, isAdmin, error, login } = useAuth();

  if (loading) {
    return <p className="py-24 text-center text-neutral-500">Cargando...</p>;
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto flex max-w-sm flex-col items-center gap-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Administración</h1>
        <p className="text-sm text-neutral-600">
          Inicia sesión con la cuenta de Google autorizada para gestionar los productos.
        </p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="button"
          onClick={login}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
        >
          Iniciar sesión con Google
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
