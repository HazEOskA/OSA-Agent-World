import { describe, expect, it } from "vitest";
import {
  asAgentId,
  asExecutionId,
  asMissionId,
  asPolicyId,
  type Agent,
  type EvidenceRecord,
  type Execution,
  type Mission
} from "@osa/domain";
import { buildProofReceipt } from "./index.js";

describe("proof bridge", () => {
  it("binds mission, execution and agent into one receipt", () => {
    const agent: Agent = {
      agentId: asAgentId("agt_kai_001"), ownerId:"owner", publicKey:"pk",
      walletAddress:"wallet", capabilities:[], policyId:asPolicyId("pol_kai_001"),
      runtimeId:"runtime", createdAt:"2026-10-03T00:00:00Z", status:"ACTIVE"
    };
    const mission: Mission = {
      missionId:asMissionId("mis_proof_001"),issuerId:"issuer",requirements:[],
      acceptanceCriteria:[],rewardAsset:"OSA_USDC_TEST",rewardAmount:"5",deadline:null,
      status:"COMPLETED",assignedAgentId:agent.agentId,correlationId:"cor",createdAt:"2026-10-03T00:00:00Z"
    };
    const execution: Execution = {
      executionId:asExecutionId("exe_proof_001"),missionId:mission.missionId,agentId:agent.agentId,
      status:"COMPLETED",correlationId:"cor",causationId:null,startedAt:null,completedAt:"2026-10-03T00:00:01Z"
    };
    const evidence: EvidenceRecord = {
      evidenceId:"evd_proof_001" as EvidenceRecord["evidenceId"],executionId:execution.executionId,
      inputDigest:"in",repositoryDigest:null,runtimeDigest:"rt",outputDigest:"out",evidenceRoot:"root",
      observations:[],createdAt:"2026-10-03T00:00:01Z"
    };
    const proof = buildProofReceipt({agent,mission,execution,evidence,walletPolicy:{limit:5},signingSecret:"secret"});
    expect(proof.agentId).toBe(agent.agentId);
    expect(proof.executionId).toBe(execution.executionId);
    expect(proof.signature).toHaveLength(64);
  });
});
