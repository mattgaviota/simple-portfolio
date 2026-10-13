export type StoreSettings = {
  title: string;
  slogan: string;
  gallerySubtitle: string;
  accentColor: string;
  backgroundColor: string;
  foregroundColor: string;
  logoUrl: string;
  logoPath: string;
  instagram: string;
  facebook: string;
  whatsapp: string;
  tiktok: string;
};

export const DEFAULT_SETTINGS: StoreSettings = {
  title: "Mi Tienda",
  slogan: "Hecho con cariño",
  gallerySubtitle: "Una selección de mi trabajo.",
  accentColor: "#6b5ca5",
  backgroundColor: "#fdf6fb",
  foregroundColor: "#3a3350",
  logoUrl: "",
  logoPath: "",
  instagram: "",
  facebook: "",
  whatsapp: "",
  tiktok: "",
};

export type ColorKey = "accentColor" | "backgroundColor" | "foregroundColor";

export const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export const MOCK_LOGO = "/logo-mock.svg";

export type SocialKey = "instagram" | "facebook" | "whatsapp" | "tiktok";
