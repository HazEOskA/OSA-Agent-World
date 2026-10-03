import { describe, expect, it } from "vitest";
import { KAI_AGENT } from "@osa/agent-core";
import { asMissionId, type Mission } from "@osa/domain";
import { ReferenceOsaRuntime, authorityGate } from "./index.js";

const mission: Mission = {
  missionId: asMissionId("mis_runtime_001"),
  issuerId: "osa:issuer",
  requirements: ["repo.read", "code.audit"],
  acceptanceCriteria: ["report"],
  rewardAsset: "OSA_USDC_TEST",
  rewardAmount: "5",
  deadline: null,
  status: "EXECUTING",
  assignedAgentId: KAI_AGENT.agentId,
  correlationId: "cor_runtime",
  createdAt: "2026-10-03T00:00:00.000Z"
};

describe("execution service", () => {
  it("denies mutating actions in the reference authority gate", () => {
    expect(
      authorityGate(KAI_AGENT, {
        operation: "repo.read",
        target: "repo",
        mutatesTarget: true
      }).decision
    ).toBe("DENY");
  });

  it("executes an authorized read-only mission", async () => {
    const result = await new ReferenceOsaRuntime().execute(KAI_AGENT, mission);
    expect(result.execution.status).toBe("COMPLETED");
    expect(result.actions).toHaveLength(4);
  });
});
