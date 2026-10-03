import { describe, expect, it } from "vitest";
import { KAI_AGENT } from "@osa/agent-core";
import {
  asMissionId,
  asProofId,
  type Mission,
  type ProofReceipt
} from "@osa/domain";
import { SettlementService } from "./index.js";

const mission: Mission = {
  missionId:asMissionId("mis_settle_001"),issuerId:"issuer",requirements:[],acceptanceCriteria:[],
  rewardAsset:"OSA_USDC_TEST",rewardAmount:"5",deadline:null,status:"COMPLETED",
  assignedAgentId:KAI_AGENT.agentId,correlationId:"cor",createdAt:"2026-10-03T00:00:00Z"
};
const proof: ProofReceipt = {
  proofId:asProofId("prf_settle_001"),missionId:mission.missionId,
  executionId:"exe_settle_001" as ProofReceipt["executionId"],agentId:KAI_AGENT.agentId,
  evidenceRoot:"root",resultDigest:"out",runtimeDigest:"rt",policyDigest:"pol",
  status:"VERIFIED",createdAt:"2026-10-03T00:00:01Z",signature:"sig"
};

describe("settlement service", () => {
  it("releases only verified completed missions", () => {
    const service=new SettlementService();
    const locked=service.lock(service.fund(service.createEscrow(mission)));
    const result=service.release({escrow:locked,mission,proof,recipient:KAI_AGENT.walletAddress});
    expect(result.escrow.state).toBe("RELEASED");
    expect(result.settlement.status).toBe("RELEASED");
  });

  it("blocks failed proofs", () => {
    const service=new SettlementService();
    const locked=service.lock(service.fund(service.createEscrow(mission)));
    expect(()=>service.release({
      escrow:locked,mission,proof:{...proof,status:"FAILED"},recipient:KAI_AGENT.walletAddress
    })).toThrow("Settlement gate rejected");
  });
});
