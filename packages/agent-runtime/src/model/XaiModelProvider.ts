import type { ModelCompletionRequest, ModelGatewayResult, ModelProvider } from "../types.js";

export interface XaiModelProviderOptions {
  apiKey?: string;
  defaultModel?: string;
}

/**
 * Deliberately env-gated skeleton. It never makes a network request until
 * an xAI API adapter is explicitly enabled and reviewed for this runtime.
 */
export class XaiModelProvider implements ModelProvider {
  readonly id = "xai" as const;
  private readonly apiKey?: string;
  private readonly defaultModel?: string;

  constructor(options: XaiModelProviderOptions = {}) {
    this.apiKey = options.apiKey;
    this.defaultModel = options.defaultModel;
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.defaultModel);
  }

  async complete(request: ModelCompletionRequest): Promise<ModelGatewayResult> {
    if (!this.isConfigured()) {
      return {
        ok: false,
        code: "provider_not_configured",
        provider: this.id,
        message: "XAI_API_KEY and XAI_MODEL must be configured before xAI can be used.",
        retryable: false,
        correlationId: request.correlationId
      };
    }

    return {
      ok: false,
      code: "provider_not_supported",
      provider: this.id,
      message: "xAI is configured but its production HTTP adapter has not been enabled in this runtime yet.",
      retryable: false,
      correlationId: request.correlationId
    };
  }
}
