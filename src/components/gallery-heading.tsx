"use client";

import { useSettings } from "@/lib/settings-context";

export function GalleryHeading() {
  const { settings, loading } = useSettings();

  return (
    <header className="mb-8">
      <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
        Productos
      </h1>
      {loading ? (
        <span className="mt-1 block h-5 w-48 animate-pulse rounded bg-white/60" />
      ) : (
        settings.gallerySubtitle && (
          <p className="mt-1 text-sm text-neutral-600">
            {settings.gallerySubtitle}
          </p>
        )
      )}
    </header>
  );
}
