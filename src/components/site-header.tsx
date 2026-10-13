"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaCartShopping } from "react-icons/fa6";
import { useCart } from "@/lib/cart-context";
import { useSettings } from "@/lib/settings-context";
import { MOCK_LOGO } from "@/types/settings";

export function SiteHeader() {
  const { settings, loading } = useSettings();
  const { count } = useCart();
  const isAdmin = usePathname().startsWith("/admin");

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-[var(--background)]/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
      <Link href="/" className="flex min-w-0 items-center gap-4 sm:gap-6">
        {loading ? (
          <>
            <span className="h-14 w-14 shrink-0 animate-pulse rounded-full bg-white/60 sm:h-20 sm:w-20" />
            <span className="h-8 w-48 animate-pulse rounded bg-white/60 sm:h-10 sm:w-72" />
          </>
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={settings.logoUrl || MOCK_LOGO}
              alt={`Logo de ${settings.title}`}
              className="h-14 w-14 shrink-0 rounded-full border-2 border-white/80 sm:h-20 sm:w-20 bg-white/60 object-cover shadow-sm"
            />
            <span className="min-w-0">
              <span className="block text-2xl font-extrabold leading-tight tracking-tight text-accent sm:text-4xl">
                {settings.title}
              </span>
              {settings.slogan && (
                <span className="block text-sm text-neutral-600 sm:text-lg">
                  {settings.slogan}
                </span>
              )}
            </span>
          </>
        )}
      </Link>
      {!isAdmin && (
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
      )}
      </div>
    </header>
  );
}
