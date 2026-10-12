export type StoreSettings = {
  title: string;
  slogan: string;
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
  logoUrl: "",
  logoPath: "",
  instagram: "",
  facebook: "",
  whatsapp: "",
  tiktok: "",
};

export const MOCK_LOGO = "/logo-mock.svg";

export type SocialKey = "instagram" | "facebook" | "whatsapp" | "tiktok";
