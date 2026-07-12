export type KeyStorageMode = "none" | "session" | "local";

export type AppSettings = {
  provider: "opencode-go";
  apiKeyStorageMode: KeyStorageMode;
  selectedModel: string;
  proxyUrl: string;
};

export type ModelOption = {
  id: string;
  label: string;
};

export const DEFAULT_PROXY_URL = "http://127.0.0.1:8787";
export const OPENCODE_GO_MODELS: ModelOption[] = [
  { id: "kimi-k2.7-code", label: "Kimi K2.7 Code" },
  { id: "kimi-k2.6", label: "Kimi K2.6" },
  { id: "glm-5.2", label: "GLM 5.2" },
  { id: "glm-5.1", label: "GLM 5.1" },
  { id: "deepseek-v4-pro", label: "DeepSeek V4 Pro" },
  { id: "deepseek-v4-flash", label: "DeepSeek V4 Flash" },
  { id: "mimo-v2.5-pro", label: "MiMo V2.5 Pro" },
  { id: "mimo-v2.5", label: "MiMo V2.5" },
] as const;

export const DEFAULT_MODEL = "kimi-k2.7-code";

export function getDefaultSettings(): AppSettings {
  return {
    provider: "opencode-go",
    apiKeyStorageMode: "session",
    selectedModel: DEFAULT_MODEL,
    proxyUrl: DEFAULT_PROXY_URL,
  };
}
