import type { ModelCompletionRequest, ModelGatewayResult, ModelProvider } from "../types.js";
import { normalizeBaseUrl } from "./provider-config.js";

interface OllamaChatResponse {
  model?: string;
  message?: { content?: string };
  done_reason?: string;
  prompt_eval_count?: number;
  eval_count?: number;
}

export interface OllamaModelProviderOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

export class OllamaModelProvider implements ModelProvider {
  readonly id = "ollama" as const;
  private readonly baseUrl?: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: OllamaModelProviderOptions = {}) {
    this.baseUrl = options.baseUrl ? normalizeBaseUrl(options.baseUrl) : undefined;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  isConfigured(): boolean {
    return Boolean(this.baseUrl);
  }

  async complete(request: ModelCompletionRequest): Promise<ModelGatewayResult> {
    if (!this.baseUrl) {
      return {
        ok: false,
        code: "provider_not_configured",
        provider: this.id,
        message: "OLLAMA_BASE_URL is not configured.",
        retryable: false,
        correlationId: request.correlationId
      };
    }

    const model = request.model;
    if (!model) {
      return {
        ok: false,
        code: "provider_not_configured",
        provider: this.id,
        message: "An Ollama model must be selected for this agent run.",
        retryable: false,
        correlationId: request.correlationId
      };
    }

    try {
      const response = await this.fetchImpl(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model,
          messages: request.messages,
          stream: false,
          options: {
            ...(request.temperature === undefined ? {} : { temperature: request.temperature }),
            ...(request.maxTokens === undefined ? {} : { num_predict: request.maxTokens })
          }
        })
      });

      if (!response.ok) {
        return {
          ok: false,
          code: "provider_request_failed",
          provider: this.id,
          message: `Ollama request failed with HTTP ${response.status}.`,
          retryable: response.status >= 500,
          correlationId: request.correlationId
        };
      }

      const payload = (await response.json()) as OllamaChatResponse;
      const content = payload.message?.content;
      if (typeof content !== "string") {
        return {
          ok: false,
          code: "provider_response_invalid",
          provider: this.id,
          message: "Ollama returned no assistant message content.",
          retryable: false,
          correlationId: request.correlationId
        };
      }

      const inputTokens = payload.prompt_eval_count;
      const outputTokens = payload.eval_count;
      return {
        ok: true,
        completion: {
          provider: this.id,
          model: payload.model ?? model,
          content,
          finishReason: payload.done_reason,
          usage: {
            inputTokens,
            outputTokens,
            totalTokens: (inputTokens ?? 0) + (outputTokens ?? 0)
          },
          raw: payload
        }
      };
    } catch (error) {
      return {
        ok: false,
        code: "provider_request_failed",
        provider: this.id,
        message: "Ollama request could not be completed.",
        retryable: true,
        correlationId: request.correlationId,
        cause: error instanceof Error ? error.message : String(error)
      };
    }
  }
}
