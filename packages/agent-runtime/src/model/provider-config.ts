export interface RuntimeEnv {
  OLLAMA_BASE_URL?: string;
  XAI_API_KEY?: string;
  XAI_MODEL?: string;
}

export function readRuntimeEnv(source: NodeJS.ProcessEnv = process.env): RuntimeEnv {
  return {
    OLLAMA_BASE_URL: source.OLLAMA_BASE_URL,
    XAI_API_KEY: source.XAI_API_KEY,
    XAI_MODEL: source.XAI_MODEL
  };
}

export function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/$/, "");
}
