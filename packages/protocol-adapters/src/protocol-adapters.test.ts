import { describe, expect, it } from "vitest";
import type { BridgeAdapter, BridgeRoute, ProtocolReceipt } from "./index.js";

class SimulationBridge implements BridgeAdapter {
  readonly mode = "SIMULATED" as const;

  async route(input: Omit<BridgeRoute, "routeId" | "estimatedSeconds" | "securityModel">): Promise<BridgeRoute> {
    return { ...input, routeId: "route_001", estimatedSeconds: 12, securityModel: "simulation" };
  }

  async transfer(route: BridgeRoute): Promise<ProtocolReceipt> {
    return { operationId: route.routeId, mode: this.mode, status: "CONFIRMED", detail: "No value moved" };
  }

  async status(operationId: string): Promise<ProtocolReceipt> {
    return { operationId, mode: this.mode, status: "CONFIRMED" };
  }
}

describe("protocol adapters", () => {
  it("keeps simulation state explicit", async () => {
    const adapter = new SimulationBridge();
    const route = await adapter.route({
      sourceChainId: "osa:alpha",
      destinationChainId: "eth:test",
      asset: "OSA_TEST",
      amount: "5"
    });
    const receipt = await adapter.transfer(route);
    expect(adapter.mode).toBe("SIMULATED");
    expect(receipt.mode).toBe("SIMULATED");
    expect(receipt.status).toBe("CONFIRMED");
  });
});
