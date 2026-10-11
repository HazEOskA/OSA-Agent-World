export type ModelProviderId = "disabled" | "ollama" | "xai" | "anthropic" | "openai";

export type ChatRole = "system" | "user" | "assistant";

export interface ModelMessage {
  role: ChatRole;
  content: string;
}

export interface ModelCompletionRequest {
  model?: string;
  messages: readonly ModelMessage[];
  temperature?: number;
  maxTokens?: number;
  correlationId: string;
}

export interface ModelUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

export interface ModelCompletion {
  provider: ModelProviderId;
  model: string;
  content: string;
  finishReason?: string;
  usage?: ModelUsage;
  providerRequestId?: string;
  raw?: unknown;
}

export interface ModelGatewayFailure {
  ok: false;
  code: "provider_not_configured" | "provider_not_supported" | "provider_request_failed" | "provider_response_invalid";
  provider: ModelProviderId;
  message: string;
  retryable: boolean;
  correlationId: string;
  cause?: string;
}

export interface ModelGatewaySuccess {
  ok: true;
  completion: ModelCompletion;
}

export type ModelGatewayResult = ModelGatewaySuccess | ModelGatewayFailure;

export interface ModelProvider {
  readonly id: ModelProviderId;
  isConfigured(): boolean;
  complete(request: ModelCompletionRequest): Promise<ModelGatewayResult>;
}

export interface ModelGateway {
  complete(provider: ModelProviderId, request: ModelCompletionRequest): Promise<ModelGatewayResult>;
  isConfigured(provider: ModelProviderId): boolean;
}
