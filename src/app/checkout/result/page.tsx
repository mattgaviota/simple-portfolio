import { Suspense } from "react";
import { CheckoutResult } from "@/components/checkout-result";

export default function CheckoutResultPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
      <Suspense fallback={<p className="py-16 text-center">Cargando...</p>}>
        <CheckoutResult />
      </Suspense>
    </main>
  );
}
