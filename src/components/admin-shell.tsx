"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

const ITEMS = [
  { href: "/admin", label: "Productos" },
  { href: "/admin/orders", label: "Pedidos" },
  { href: "/admin/categories", label: "Categorías" },
  { href: "/admin/settings", label: "Ajustes" },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") {
    return (
      pathname === "/admin" ||
      pathname === "/admin/new" ||
      /^\/admin\/(?!orders|categories|settings)[^/]+\/edit/.test(pathname)
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout } = useAuth();

  const itemClass = (active: boolean) =>
    `shrink-0 rounded-lg px-4 py-2 text-left text-sm font-medium transition-colors ${
      active ? "bg-accent text-white" : "hover:bg-white/70"
    }`;

  return (
    <div className="flex flex-col gap-6 md:flex-row md:gap-8">
      <nav
        aria-label="Administración"
        className="-mx-4 flex gap-1 overflow-x-auto px-4 md:sticky md:top-32 md:mx-0 md:w-48 md:shrink-0 md:flex-col md:self-start md:overflow-visible md:px-0"
      >
        {ITEMS.map(({ href, label }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={itemClass(active)}
            >
              {label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={logout}
          className={`${itemClass(false)} md:mt-4 md:border-t md:border-black/10 md:pt-4`}
        >
          Cerrar sesión
        </button>
      </nav>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
