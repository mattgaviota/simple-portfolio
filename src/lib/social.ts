import type { SocialKey, StoreSettings } from "@/types/settings";

const HANDLE_RE = /^[A-Za-z0-9._]{1,60}$/;
const URL_RE = /^https?:\/\/\S+$/i;

/** Builds the public link for a social network from a handle, phone number or URL. Returns null if empty or invalid. */
export function socialUrl(key: SocialKey, raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  if (URL_RE.test(value)) return value;

  if (key === "whatsapp") {
    const digits = value.replace(/[\s+()-]/g, "");
    return /^\d{8,15}$/.test(digits) ? `https://wa.me/${digits}` : null;
  }

  const handle = value.replace(/^@/, "");
  if (!HANDLE_RE.test(handle)) return null;
  switch (key) {
    case "instagram":
      return `https://instagram.com/${handle}`;
    case "facebook":
      return `https://facebook.com/${handle}`;
    case "tiktok":
      return `https://www.tiktok.com/@${handle}`;
  }
}

export const SOCIAL_KEYS: SocialKey[] = [
  "instagram",
  "facebook",
  "whatsapp",
  "tiktok",
];

export function activeSocials(settings: StoreSettings) {
  return SOCIAL_KEYS.flatMap((key) => {
    const url = socialUrl(key, settings[key]);
    return url ? [{ key, url }] : [];
  });
}

/** WhatsApp link with a prefilled message, or null if no valid WhatsApp contact is configured. */
export function whatsappMessageUrl(raw: string, message: string): string | null {
  const base = socialUrl("whatsapp", raw);
  if (!base) return null;
  try {
    const url = new URL(base);
    url.searchParams.set("text", message);
    return url.toString();
  } catch {
    return base;
  }
}
