import { SettingsEditor } from "@/components/settings-editor";

// Admin screens wait for the client-side Firebase auth state, so they cannot render instantly.
export const instant = false;

export default function SettingsPage() {
  return <SettingsEditor />;
}
