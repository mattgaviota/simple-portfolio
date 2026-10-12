"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart-context";

const MESSAGES: Record<string, string> = {
  approved: "Pago aprobado. Gracias por tu compra. Nos pondremos en contacto con vos para coordinar el envío.",
  pending: "Tu pago está pendiente de confirmación. Te avisaremos cuando se acredite.",
  rejected: "El pago fue rechazado. Podés volver al carrito e intentar de nuevo.",
  cancelled: "El pago fue cancelado.",
  refunded: "Este pago fue reembolsado.",
};

export function CheckoutResult() {
  const orderId = useSearchParams().get("order");
  const { clear } = useCart();
  const [status, setStatus] = useState<string | null>(null);
  const cleared = useRef(false);

  useEffect(() => {
    if (!orderId) return;
    let tries = 0;
    let timer: ReturnType<typeof setTimeout>;
    // The webhook is the source of truth and may land after the redirect, so poll briefly.
    const poll = async () => {
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`);
        const data = res.ok ? await res.json() : null;
        setStatus(data?.status ?? "unknown");
        if (data?.status === "pending" && ++tries < 10) {
          timer = setTimeout(poll, 3000);
        }
      } catch {
        setStatus("unknown");
      }
    };
    poll();
    return () => clearTimeout(timer);
  }, [orderId]);

  useEffect(() => {
    if (status === "approved" && !cleared.current) {
      cleared.current = true;
      clear();
    }
  }, [status, clear]);

  return (
    <div className="py-16 text-center">
      <p className="text-lg">
        {!orderId
          ? "Pedido no encontrado."
          : status === null
            ? "Verificando el pago..."
            : (MESSAGES[status] ?? "No pudimos verificar el estado del pago.")}
      </p>
      <Link href="/" className="mt-6 inline-block font-medium text-accent underline">
        Volver a la tienda
      </Link>
    </div>
  );
}
