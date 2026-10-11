import type { ModelCompletionRequest, ModelGateway, ModelGatewayResult, ModelProvider, ModelProviderId } from "../types.js";

export class RuntimeModelGateway implements ModelGateway {
  private readonly providers: ReadonlyMap<ModelProviderId, ModelProvider>;

  constructor(providers: readonly ModelProvider[]) {
    this.providers = new Map(providers.map((provider) => [provider.id, provider]));
  }

  isConfigured(provider: ModelProviderId): boolean {
    return this.providers.get(provider)?.isConfigured() ?? false;
  }

  async complete(provider: ModelProviderId, request: ModelCompletionRequest): Promise<ModelGatewayResult> {
    const adapter = this.providers.get(provider);
    if (!adapter) {
      return {
        ok: false,
        code: "provider_not_supported",
        provider,
        message: `No adapter is registered for provider: ${provider}.`,
        retryable: false,
        correlationId: request.correlationId
      };
    }

    return adapter.complete(request);
  }
}
