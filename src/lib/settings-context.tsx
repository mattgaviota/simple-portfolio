"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getSettings } from "@/lib/settings";
import {
  DEFAULT_SETTINGS,
  MOCK_LOGO,
  type StoreSettings,
} from "@/types/settings";

type SettingsState = {
  settings: StoreSettings;
  loading: boolean;
  setSettings: (next: StoreSettings) => void;
};

const SettingsContext = createContext<SettingsState | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading) document.title = settings.title;
  }, [loading, settings.title]);

  useEffect(() => {
    if (loading) return;
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.removeAttribute("type");
    link.href = settings.logoUrl || MOCK_LOGO;
  }, [loading, settings.logoUrl]);

  useEffect(() => {
    const style = document.documentElement.style;
    style.setProperty("--accent", settings.accentColor);
    style.setProperty("--background", settings.backgroundColor);
    style.setProperty("--foreground", settings.foregroundColor);
  }, [settings.accentColor, settings.backgroundColor, settings.foregroundColor]);

  const value = useMemo(
    () => ({ settings, loading, setSettings }),
    [settings, loading],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
}
