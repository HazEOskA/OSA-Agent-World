import { describe, expect, it } from "vitest";
import { childTrace, createTraceContext } from "./index.js";

describe("observability", () => {
  it("preserves correlation across child traces", () => {
    const root = createTraceContext({ correlationId: "cor_demo", actorId: "agt_kai_01" });
    const child = childTrace(root, "evt_001");
    expect(child.correlationId).toBe("cor_demo");
    expect(child.actorId).toBe("agt_kai_01");
    expect(child.causationId).toBe("evt_001");
    expect(child.traceId).not.toBe(root.traceId);
  });
});
