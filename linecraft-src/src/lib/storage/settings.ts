import { AppSettings, getDefaultSettings } from "@/types/settings";

const SETTINGS_KEY = "linecraft-settings";

export function getSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const saved = { ...getDefaultSettings(), ...JSON.parse(raw) } as AppSettings;
      // Safari treats localhost more reliably as a trustworthy loopback origin
      // when an HTTPS page calls a local HTTP development service.
      if (saved.proxyUrl === "http://127.0.0.1:8787") {
        saved.proxyUrl = "http://localhost:8787";
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(saved));
      }
      return saved;
    }
  } catch {
    // corrupt data, fall through
  }
  return getDefaultSettings();
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function getApiKey(): string | null {
  const settings = getSettings();
  if (settings.apiKeyStorageMode === "session") {
    return sessionStorage.getItem("linecraft-api-key");
  }
  if (settings.apiKeyStorageMode === "local") {
    return localStorage.getItem("linecraft-api-key");
  }
  return null;
}

export function saveApiKey(key: string): void {
  const settings = getSettings();
  if (settings.apiKeyStorageMode === "session") {
    sessionStorage.setItem("linecraft-api-key", key);
    localStorage.removeItem("linecraft-api-key");
  } else if (settings.apiKeyStorageMode === "local") {
    localStorage.setItem("linecraft-api-key", key);
    sessionStorage.removeItem("linecraft-api-key");
  }
}

export function clearApiKey(): void {
  sessionStorage.removeItem("linecraft-api-key");
  localStorage.removeItem("linecraft-api-key");
}
