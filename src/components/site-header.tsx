"use client";

import Link from "next/link";
import { FaCartShopping } from "react-icons/fa6";
import { useCart } from "@/lib/cart-context";
import { useSettings } from "@/lib/settings-context";
import { MOCK_LOGO } from "@/types/settings";

export function SiteHeader() {
  const { settings, loading } = useSettings();
  const { count } = useCart();

  return (
    <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <Link href="/" className="flex min-w-0 items-center gap-4 sm:gap-6">
        {loading ? (
          <>
            <span className="h-20 w-20 shrink-0 animate-pulse rounded-full bg-white/60 sm:h-28 sm:w-28" />
            <span className="h-10 w-56 animate-pulse rounded bg-white/60 sm:h-14 sm:w-80" />
          </>
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={settings.logoUrl || MOCK_LOGO}
              alt={`Logo de ${settings.title}`}
              className="h-20 w-20 shrink-0 rounded-full border-2 border-white/80 sm:h-28 sm:w-28 bg-white/60 object-cover shadow-sm"
            />
            <span className="min-w-0">
              <span className="block text-3xl font-extrabold leading-tight tracking-tight text-accent sm:text-5xl">
                {settings.title}
              </span>
              {settings.slogan && (
                <span className="mt-1 block text-base text-neutral-600 sm:text-xl">
                  {settings.slogan}
                </span>
              )}
            </span>
          </>
        )}
      </Link>
      <Link
        href="/cart"
        aria-label={`Carrito, ${count} productos`}
        className="relative shrink-0 rounded-full border border-black/10 bg-white/80 p-3 text-accent shadow-sm hover:bg-white"
      >
        <FaCartShopping className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-semibold text-white">
            {count}
          </span>
        )}
      </Link>
    </header>
  );
}
