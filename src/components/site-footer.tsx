"use client";

import {
  FaFacebookF,
  FaInstagram,
  FaTiktok,
  FaWhatsapp,
} from "react-icons/fa6";
import { activeSocials } from "@/lib/social";
import { useSettings } from "@/lib/settings-context";
import type { SocialKey } from "@/types/settings";

const SOCIALS: Record<SocialKey, { label: string; Icon: typeof FaInstagram }> = {
  instagram: { label: "Instagram", Icon: FaInstagram },
  facebook: { label: "Facebook", Icon: FaFacebookF },
  whatsapp: { label: "WhatsApp", Icon: FaWhatsapp },
  tiktok: { label: "TikTok", Icon: FaTiktok },
};

export function SiteFooter() {
  const { settings, loading } = useSettings();

  return (
    <footer className="mt-12 border-t border-black/10 bg-white/40 backdrop-blur">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 text-sm text-neutral-600 sm:px-6 lg:px-8">
        {loading ? null : (
          <>
            <p>
              &copy; {new Date().getFullYear()} {settings.title}
            </p>
            <ul className="flex items-center gap-4">
              {activeSocials(settings).map(({ key, url }) => {
                const { label, Icon } = SOCIALS[key];
                return (
                  <li key={key}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      title={label}
                      className="block text-accent transition-colors hover:text-accent-hover"
                    >
                      <Icon className="h-5 w-5" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </footer>
  );
}
