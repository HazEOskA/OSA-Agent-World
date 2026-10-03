import { describe, expect, it } from "vitest";
import { KAI_AGENT, matchCapabilities } from "./index.js";

describe("agent core", () => {
  it("matches KAI against a code audit mission", () => {
    const result = matchCapabilities(KAI_AGENT, ["repo.read", "code.audit", "report.generate"]);
    expect(result.accepted).toBe(true);
    expect(result.missing).toEqual([]);
  });

  it("rejects capabilities KAI does not have", () => {
    const result = matchCapabilities(KAI_AGENT, ["wallet.unlimited"]);
    expect(result.accepted).toBe(false);
    expect(result.missing).toEqual(["wallet.unlimited"]);
  });
});
