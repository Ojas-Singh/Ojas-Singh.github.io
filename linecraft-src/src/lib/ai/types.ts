export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type OpenCodeGoCall = {
  apiKey: string;
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  stream?: boolean;
  maxTokens?: number;
};
