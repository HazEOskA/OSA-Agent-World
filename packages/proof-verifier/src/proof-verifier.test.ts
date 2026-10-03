import { describe, expect, it } from "vitest";
import { KAI_AGENT } from "@osa/agent-core";
import { KAI_WALLET_POLICY } from "@osa/wallet-policy";
import { asExecutionId, asMissionId, type Execution, type Mission } from "@osa/domain";
import { buildEvidenceRecord } from "@osa/evidence";
import { buildProofReceipt } from "@osa/proof-bridge";
import { verifyProofReceipt } from "./index.js";

const mission: Mission = {
  missionId:asMissionId("mis_verify_001"),issuerId:"issuer",requirements:[],
  acceptanceCriteria:[],rewardAsset:"OSA_USDC_TEST",rewardAmount:"5",deadline:null,
  status:"COMPLETED",assignedAgentId:KAI_AGENT.agentId,correlationId:"cor_verify",createdAt:"2026-10-03T00:00:00Z"
};
const execution: Execution = {
  executionId:asExecutionId("exe_verify_001"),missionId:mission.missionId,agentId:KAI_AGENT.agentId,
  status:"COMPLETED",correlationId:"cor_verify",causationId:null,startedAt:null,completedAt:"2026-10-03T00:00:01Z"
};

function fixture() {
  const evidence = buildEvidenceRecord({
    execution,input:{repo:"public"},output:{report:"ok"},
    runtime:{id:"runtime_osa_v1"},observations:["read-only"]
  });
  const proof = buildProofReceipt({
    agent:KAI_AGENT,mission,execution,evidence,walletPolicy:KAI_WALLET_POLICY,signingSecret:"demo-secret"
  });
  return { evidence, proof };
}

describe("proof verifier", () => {
  it("verifies a bound untampered receipt", () => {
    const {evidence,proof}=fixture();
    expect(verifyProofReceipt({proof,evidence,execution,mission,agent:KAI_AGENT,signingSecret:"demo-secret"}).status).toBe("VERIFIED");
  });

  it("fails when evidence is modified", () => {
    const {evidence,proof}=fixture();
    const tampered={...evidence,observations:["tampered"]};
    const result=verifyProofReceipt({proof,evidence:tampered,execution,mission,agent:KAI_AGENT,signingSecret:"demo-secret"});
    expect(result.status).toBe("FAILED");
    expect(result.reasons).toContain("EVIDENCE_ROOT_MISMATCH");
  });
});
