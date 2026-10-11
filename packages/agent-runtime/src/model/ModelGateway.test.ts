import { describe, expect, it } from "vitest";
import { DisabledModelProvider } from "./DisabledModelProvider.js";
import { RuntimeModelGateway } from "./ModelGateway.js";
import { OllamaModelProvider } from "./OllamaModelProvider.js";
import { XaiModelProvider } from "./XaiModelProvider.js";

const request = {
  correlationId: "corr_test_001",
  messages: [{ role: "user" as const, content: "Hello" }]
};

describe("RuntimeModelGateway", () => {
  it("returns provider_not_configured instead of fabricating a disabled response", async () => {
    const gateway = new RuntimeModelGateway([new DisabledModelProvider()]);
    const result = await gateway.complete("disabled", request);

    expect(result).toMatchObject({
      ok: false,
      code: "provider_not_configured",
      provider: "disabled",
      correlationId: "corr_test_001"
    });
  });

  it("reports missing Ollama configuration", async () => {
    const gateway = new RuntimeModelGateway([new OllamaModelProvider()]);
    const result = await gateway.complete("ollama", { ...request, model: "llama3" });

    expect(result).toMatchObject({
      ok: false,
      code: "provider_not_configured",
      provider: "ollama"
    });
  });

  it("reports a configured but intentionally inactive xAI adapter", async () => {
    const gateway = new RuntimeModelGateway([
      new XaiModelProvider({ apiKey: "test-only-key", defaultModel: "grok-test" })
    ]);
    const result = await gateway.complete("xai", request);

    expect(result).toMatchObject({
      ok: false,
      code: "provider_not_supported",
      provider: "xai"
    });
  });

  it("reports unregistered providers without throwing", async () => {
    const gateway = new RuntimeModelGateway([]);
    const result = await gateway.complete("openai", request);

    expect(result).toMatchObject({
      ok: false,
      code: "provider_not_supported",
      provider: "openai"
    });
  });
});
