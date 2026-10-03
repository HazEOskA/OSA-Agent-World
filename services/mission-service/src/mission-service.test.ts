import { describe, expect, it } from "vitest";
import { MissionService } from "./index.js";

describe("mission service", () => {
  it("enforces the legal mission state machine", () => {
    const service = new MissionService();
    const mission = service.create({
      missionId: "mis_reference_001",
      issuerId: "osa:issuer",
      requirements: ["repo.read", "code.audit"],
      acceptanceCriteria: ["report"],
      rewardAsset: "OSA_USDC_TEST",
      rewardAmount: "5",
      correlationId: "cor_reference"
    });

    service.transition(mission.missionId, "FUNDED");
    service.transition(mission.missionId, "OPEN");
    service.assign(mission.missionId, "agt_kai_001");
    expect(service.transition(mission.missionId, "ACCEPTED").status).toBe("ACCEPTED");
  });

  it("rejects illegal transitions", () => {
    const service = new MissionService();
    const mission = service.create({
      issuerId: "osa:issuer",
      requirements: [],
      acceptanceCriteria: [],
      rewardAsset: "OSA_USDC_TEST",
      rewardAmount: "5",
      correlationId: "cor_illegal"
    });
    expect(() => service.transition(mission.missionId, "COMPLETED")).toThrow(
      "Illegal mission transition"
    );
  });
});
