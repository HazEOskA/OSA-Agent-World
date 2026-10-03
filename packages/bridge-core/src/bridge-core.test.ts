import { describe, expect, it } from "vitest";
import {
  appendBridgeTrace,
  createBridgeTrace,
  createSimulatedBridgeRoute,
  runSimulatedBridge
} from "./index.js";

describe("bridge core", () => {
  it("rejects same-chain routes", () => {
    expect(() =>
      createSimulatedBridgeRoute({
        sourceChain: "A",
        destinationChain: "A",
        asset: "OSA_TEST",
        amount: "1",
        recipient: "user"
      })
    ).toThrow("two different chains");
  });

  it("builds a deterministic complete simulated cross-chain trace", async () => {
    const route = createSimulatedBridgeRoute({
      sourceChain: "OSA_ALPHA",
      destinationChain: "ETH_TEST",
      asset: "OSA_TEST",
      amount: "25",
      recipient: "osa:user"
    });

    const result = await runSimulatedBridge(route);
    expect(result.stage).toBe("COMPLETED");
    expect(result.steps.map((step) => step.stage)).toContain("ATTESTED");
    expect(result.steps.map((step) => step.stage)).toContain("DESTINATION_SUBMITTED");
  });

  it("appends failure state without rewriting prior evidence", () => {
    const route = createSimulatedBridgeRoute({
      sourceChain: "A",
      destinationChain: "B",
      asset: "TEST",
      amount: "1",
      recipient: "user"
    });
    const trace = createBridgeTrace(route, new Date("2026-10-03T00:00:00Z"));
    const failed = appendBridgeTrace(trace, {
      stage: "FAILED",
      mode: "SIMULATED",
      label: "FAIL"
    });

    expect(trace.stage).toBe("ROUTED");
    expect(failed.stage).toBe("FAILED");
    expect(failed.steps).toHaveLength(2);
  });
});
