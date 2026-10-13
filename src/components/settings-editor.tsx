"use client";

import { useEffect, useState } from "react";
import { ImagePicker } from "@/components/image-picker";
import { socialUrl } from "@/lib/social";
import { saveSettings } from "@/lib/settings";
import { useSettings } from "@/lib/settings-context";
import {
  DEFAULT_SETTINGS,
  HEX_RE,
  MOCK_LOGO,
  type ColorKey,
  type SocialKey,
  type StoreSettings,
} from "@/types/settings";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const inputClass =
  "w-full rounded-lg border border-black/20 bg-white/80 px-3 py-2 text-sm";

const COLOR_FIELDS: { key: ColorKey; label: string }[] = [
  { key: "accentColor", label: "Acento (botones y título)" },
  { key: "backgroundColor", label: "Fondo" },
  { key: "foregroundColor", label: "Texto" },
];

const SOCIAL_FIELDS: { key: SocialKey; label: string; hint: string }[] = [
  { key: "instagram", label: "Instagram", hint: "Usuario o URL, ej. mitienda" },
  { key: "facebook", label: "Facebook", hint: "Usuario o URL, ej. mitienda" },
  {
    key: "whatsapp",
    label: "WhatsApp",
    hint: "Número con código de país, ej. 56912345678",
  },
  { key: "tiktok", label: "TikTok", hint: "Usuario o URL, ej. mitienda" },
];

export function SettingsEditor() {
  const { settings, loading } = useSettings();

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">Ajustes de la tienda</h1>
      {loading ? (
        <p className="text-neutral-500">Cargando...</p>
      ) : (
        <SettingsForm initial={settings} />
      )}
    </>
  );
}

function SettingsForm({ initial }: { initial: StoreSettings }) {
  const { setSettings } = useSettings();
  const [title, setTitle] = useState(initial.title);
  const [slogan, setSlogan] = useState(initial.slogan);
  const [gallerySubtitle, setGallerySubtitle] = useState(initial.gallerySubtitle);
  const [social, setSocial] = useState<Record<SocialKey, string>>({
    instagram: initial.instagram,
    facebook: initial.facebook,
    whatsapp: initial.whatsapp,
    tiktok: initial.tiktok,
  });
  const [colors, setColors] = useState<Record<ColorKey, string>>({
    accentColor: initial.accentColor,
    backgroundColor: initial.backgroundColor,
    foregroundColor: initial.foregroundColor,
  });
  const [logo, setLogo] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const preview = removeLogo
    ? MOCK_LOGO
    : (localPreview ?? (initial.logoUrl || MOCK_LOGO));

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  function onLogoChange(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("El archivo debe ser una imagen.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("La imagen debe pesar 5 MB o menos.");
      return;
    }
    setError(null);
    setSaved(false);
    setLogo(file);
    setRemoveLogo(false);
    setLocalPreview(URL.createObjectURL(file));
  }

  function restoreMockLogo() {
    setLogo(null);
    setLocalPreview(null);
    setRemoveLogo(true);
    setSaved(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    if (!title.trim()) return setError("El título es obligatorio.");
    for (const { key, label } of COLOR_FIELDS) {
      if (!HEX_RE.test(colors[key])) {
        return setError(`El color "${label}" necesita un código hex válido, como #1a2b3c.`);
      }
    }
    for (const { key, label } of SOCIAL_FIELDS) {
      if (social[key].trim() && !socialUrl(key, social[key])) {
        return setError(`El valor de ${label} no es válido.`);
      }
    }

    setSaving(true);
    try {
      const next = await saveSettings(
        initial,
        {
          title: title.trim(),
          slogan: slogan.trim(),
          gallerySubtitle: gallerySubtitle.trim(),
          accentColor: colors.accentColor.toLowerCase(),
          backgroundColor: colors.backgroundColor.toLowerCase(),
          foregroundColor: colors.foregroundColor.toLowerCase(),
          instagram: social.instagram.trim(),
          facebook: social.facebook.trim(),
          whatsapp: social.whatsapp.trim(),
          tiktok: social.tiktok.trim(),
        },
        logo,
        removeLogo,
      );
      setSettings(next);
      setSaved(true);
    } catch {
      setError("No se pudieron guardar los ajustes. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-xl flex-col gap-5">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Título de la tienda
        <input
          className={inputClass}
          value={title}
          maxLength={60}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Eslogan
        <input
          className={inputClass}
          value={slogan}
          maxLength={120}
          onChange={(e) => setSlogan(e.target.value)}
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Subtítulo de la galería
        <input
          className={inputClass}
          value={gallerySubtitle}
          maxLength={160}
          onChange={(e) => setGallerySubtitle(e.target.value)}
        />
      </label>

      <div className="flex flex-col gap-1.5 text-sm font-medium">
        Logo
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Vista previa del logo"
            className="h-20 w-20 shrink-0 rounded-full border border-white/70 bg-white/60 object-cover shadow-sm"
          />
          <div className="flex flex-col items-start gap-2">
            <ImagePicker
              hasImage={!!initial.logoUrl}
              onChange={onLogoChange}
            />
            {(initial.logoUrl || logo) && !removeLogo && (
              <button
                type="button"
                onClick={restoreMockLogo}
                className="text-xs font-normal text-accent underline"
              >
                Usar el logo de ejemplo
              </button>
            )}
          </div>
        </div>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-medium">Colores</legend>
        {COLOR_FIELDS.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-3">
            <input
              type="color"
              aria-label={`Selector: ${label}`}
              value={HEX_RE.test(colors[key]) ? colors[key] : "#000000"}
              onChange={(e) => {
                setColors((prev) => ({ ...prev, [key]: e.target.value }));
                setSaved(false);
              }}
              className="h-9 w-10 shrink-0 cursor-pointer rounded border border-black/20 bg-transparent p-0.5"
            />
            <input
              aria-label={`Código hex: ${label}`}
              className={`${inputClass} w-28 shrink-0 font-mono`}
              value={colors[key]}
              maxLength={7}
              onChange={(e) => {
                setColors((prev) => ({ ...prev, [key]: e.target.value.trim() }));
                setSaved(false);
              }}
            />
            <span className="text-sm font-medium">{label}</span>
          </div>
        ))}
        <button
          type="button"
          onClick={() => {
            setColors({
              accentColor: DEFAULT_SETTINGS.accentColor,
              backgroundColor: DEFAULT_SETTINGS.backgroundColor,
              foregroundColor: DEFAULT_SETTINGS.foregroundColor,
            });
            setSaved(false);
          }}
          className="self-start text-xs font-normal text-accent underline"
        >
          Restaurar colores originales
        </button>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-medium">
          Redes sociales{" "}
          <span className="font-normal text-neutral-500">
            (las que dejes vacías no aparecen en el pie de página)
          </span>
        </legend>
        {SOCIAL_FIELDS.map(({ key, label, hint }) => (
          <label key={key} className="flex flex-col gap-1 text-sm font-medium">
            {label}
            <input
              className={inputClass}
              value={social[key]}
              placeholder={hint}
              maxLength={200}
              onChange={(e) => {
                setSocial((prev) => ({ ...prev, [key]: e.target.value }));
                setSaved(false);
              }}
            />
          </label>
        ))}
      </fieldset>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-green-700">Ajustes guardados.</p>}

      <div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar ajustes"}
        </button>
      </div>
    </form>
  );
}
