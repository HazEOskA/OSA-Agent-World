import { describe, expect, it } from "vitest";
import { canonicalize, createProtocolEvent, digestPayload } from "./index.js";

describe("protocol events", () => {
  it("canonicalizes object keys deterministically", () => {
    expect(canonicalize({ b: 2, a: 1 })).toBe(canonicalize({ a: 1, b: 2 }));
  });

  it("produces reproducible payload digests", () => {
    expect(digestPayload({ agentId: "agt_kai_01", n: 1 })).toBe(
      digestPayload({ n: 1, agentId: "agt_kai_01" })
    );
  });

  it("builds an event with correlation and causation metadata", () => {
    const event = createProtocolEvent({
      eventId: "evt_01",
      type: "agent.created",
      aggregateType: "agent",
      aggregateId: "agt_kai_01",
      correlationId: "corr_01",
      causationId: null,
      schemaVersion: 1,
      occurredAt: "2026-10-03T00:00:00.000Z",
      payload: { agentId: "agt_kai_01" }
    });

    expect(event.payloadDigest).toHaveLength(64);
    expect(event.correlationId).toBe("corr_01");
  });
});
