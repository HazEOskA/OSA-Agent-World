import { describe, expect, it } from "vitest";
import {
  asAgentId,
  asMissionId,
  assertMissionTransition,
  canReleaseSettlement,
  canTransitionMission
} from "./index.js";

describe("domain invariants", () => {
  it("accepts canonical prefixed IDs", () => {
    expect(asAgentId("agt_kai_01")).toBe("agt_kai_01");
    expect(asMissionId("mis_01")).toBe("mis_01");
  });

  it("rejects malformed canonical IDs", () => {
    expect(() => asAgentId("agent-kai")).toThrow(/expected prefix agt_/);
  });

  it("allows only legal mission transitions", () => {
    expect(canTransitionMission("CREATED", "FUNDED")).toBe(true);
    expect(canTransitionMission("CREATED", "COMPLETED")).toBe(false);
    expect(() => assertMissionTransition("CREATED", "COMPLETED")).toThrow(/Illegal mission transition/);
  });

  it("releases settlement only for completed + verified + locked", () => {
    expect(canReleaseSettlement("COMPLETED", "VERIFIED", "LOCKED")).toBe(true);
    expect(canReleaseSettlement("COMPLETED", "FAILED", "LOCKED")).toBe(false);
    expect(canReleaseSettlement("VERIFYING", "VERIFIED", "LOCKED")).toBe(false);
  });
});
