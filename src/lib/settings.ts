import { doc, getDoc, setDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { removeImage, uploadImage } from "@/lib/products";
import { DEFAULT_SETTINGS, type StoreSettings } from "@/types/settings";

const REF = ["settings", "store"] as const;

export async function getSettings(): Promise<StoreSettings> {
  const snap = await getDoc(doc(getDb(), ...REF));
  const data = snap.exists() ? snap.data() : {};
  const pick = (key: keyof StoreSettings) =>
    typeof data[key] === "string" ? (data[key] as string) : DEFAULT_SETTINGS[key];
  return {
    title: pick("title") || DEFAULT_SETTINGS.title,
    slogan: data.slogan === undefined ? DEFAULT_SETTINGS.slogan : pick("slogan"),
    logoUrl: pick("logoUrl"),
    logoPath: pick("logoPath"),
    instagram: pick("instagram"),
    facebook: pick("facebook"),
    whatsapp: pick("whatsapp"),
    tiktok: pick("tiktok"),
  };
}

export async function saveSettings(
  current: StoreSettings,
  next: Omit<StoreSettings, "logoUrl" | "logoPath">,
  newLogo: File | null,
  removeLogo: boolean,
): Promise<StoreSettings> {
  const uploaded = newLogo ? await uploadImage(newLogo, "settings") : null;
  const logo = uploaded
    ? { logoUrl: uploaded.imageUrl, logoPath: uploaded.imagePath }
    : removeLogo
      ? { logoUrl: "", logoPath: "" }
      : { logoUrl: current.logoUrl, logoPath: current.logoPath };
  const saved: StoreSettings = { ...next, ...logo };

  try {
    await setDoc(doc(getDb(), ...REF), saved);
  } catch (error) {
    if (uploaded) await removeImage(uploaded.imagePath);
    throw error;
  }
  if ((uploaded || removeLogo) && current.logoPath) {
    await removeImage(current.logoPath);
  }
  return saved;
}
