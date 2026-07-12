import { getSettings } from "../storage/settings";
import type { OpenCodeGoCall } from "./types";

const DIRECT_ENDPOINT =
  "https://opencode.ai/zen/go/v1/chat/completions";
const MODELS_ENDPOINT = "https://opencode.ai/zen/go/v1/models";
const VITE_PROXY_PATH = "/api/openai/chat/completions";

function getProxyUrl(): string {
  const settings = getSettings();
  return settings.proxyUrl?.trim() || "";
}

function getEndpoint(): string {
  const proxyUrl = getProxyUrl();

  if (proxyUrl) {
    const url = proxyUrl.replace(/\/+$/, "");
    return `${url}/chat/completions`;
  }

  if (import.meta.env.DEV) {
    return VITE_PROXY_PATH;
  }

  return DIRECT_ENDPOINT;
}

function buildBody(params: OpenCodeGoCall): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: params.model ?? "kimi-k2.7-code",
    messages: params.messages,
    temperature: params.temperature ?? 0.7,
  };
  if (params.stream) body.stream = true;
  if (params.maxTokens) body.max_tokens = params.maxTokens;
  return body;
}

function connectionError(endpoint: string, err: unknown): Error {
  if (getProxyUrl()) {
    return new Error(
      `Could not reach proxy at ${endpoint}. Verify the proxy URL is correct and reachable. (${String(err)})`
    );
  }

  return new Error(
    "CORS: The browser blocked the request to OpenCode Go. " +
      "LineCraft is running as a static GitHub Pages app, and frontend JavaScript cannot bypass server CORS rules. " +
      "AI generation will work browser-only if OpenCode Go allows CORS for chat completions from web origins."
  );
}

async function readError(response: Response): Promise<string> {
  let errorText = `HTTP ${response.status}`;
  try {
    const text = await response.text();
    if (text) errorText += ` - ${text.slice(0, 500)}`;
  } catch {
    // Use status-only message.
  }
  return errorText;
}

export async function callOpenCodeGo({
  apiKey,
  model = "kimi-k2.7-code",
  messages,
  temperature = 0.7,
  maxTokens,
}: OpenCodeGoCall): Promise<string> {
  const endpoint = getEndpoint();

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        buildBody({ apiKey, model, messages, temperature, maxTokens })
      ),
    });
  } catch (err) {
    throw connectionError(endpoint, err);
  }

  if (!response.ok) {
    throw new Error(`OpenCode Go API error: ${await readError(response)}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "";
}

export async function* callOpenCodeGoStream(
  params: OpenCodeGoCall
): AsyncGenerator<string, void, unknown> {
  const endpoint = getEndpoint();
  const body = buildBody({ ...params, stream: true });

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${params.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw connectionError(endpoint, err);
  }

  if (!response.ok) {
    throw new Error(`OpenCode Go API error: ${await readError(response)}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Streaming not supported in this browser.");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === "data: [DONE]") continue;
        if (!trimmed.startsWith("data:")) continue;

        const jsonStr = trimmed.slice(5).trim();
        try {
          const parsed = JSON.parse(jsonStr);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            yield delta as string;
          }
        } catch {
          // Partial JSON can complete in the next chunk.
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function testOpenCodeGoConnection(
  apiKey: string,
  model: string
): Promise<boolean> {
  const result = await callOpenCodeGo({
    apiKey,
    model,
    temperature: 0,
    messages: [
      {
        role: "user",
        content: "Reply with only: ok",
      },
    ],
  });

  return result.trim().toLowerCase().includes("ok");
}

export type OpenCodeGoModel = {
  id: string;
  label: string;
};

function supportsChatCompletions(modelId: string): boolean {
  return (
    modelId.startsWith("kimi-") ||
    modelId.startsWith("glm-") ||
    modelId.startsWith("deepseek-") ||
    modelId.startsWith("mimo-")
  );
}

export async function fetchOpenCodeGoModels(): Promise<OpenCodeGoModel[]> {
  const response = await fetch(MODELS_ENDPOINT);

  if (!response.ok) {
    throw new Error(`Could not load OpenCode Go models: ${await readError(response)}`);
  }

  const data = await response.json();
  const models = Array.isArray(data.data) ? data.data : [];

  return models
    .map((model: { id?: unknown }) => {
      if (typeof model.id !== "string") return null;
      if (!supportsChatCompletions(model.id)) return null;
      return {
        id: model.id,
        label: model.id
          .split("-")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" "),
      };
    })
    .filter((model: OpenCodeGoModel | null): model is OpenCodeGoModel => model !== null);
}
