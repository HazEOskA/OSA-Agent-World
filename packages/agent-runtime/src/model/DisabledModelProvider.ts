import type { ModelCompletionRequest, ModelGatewayResult, ModelProvider } from "../types.js";

export class DisabledModelProvider implements ModelProvider {
  readonly id = "disabled" as const;

  isConfigured(): boolean {
    return false;
  }

  async complete(request: ModelCompletionRequest): Promise<ModelGatewayResult> {
    return {
      ok: false,
      code: "provider_not_configured",
      provider: this.id,
      message: "No model provider is configured for this agent run.",
      retryable: false,
      correlationId: request.correlationId
    };
  }
}
