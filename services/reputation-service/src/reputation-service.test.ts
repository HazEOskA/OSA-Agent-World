import { describe, expect, it } from "vitest";
import { asAgentId, asEventId, type ReputationEvent } from "@osa/domain";
import { projectReputation } from "./index.js";

describe("reputation projection", () => {
  it("derives reputation from immutable events", () => {
    const base={agentId:asAgentId("agt_kai_001"),missionId:null,proofId:null,settlementId:null,correlationId:"cor",createdAt:"2026-10-03T00:00:00Z"};
    const events: ReputationEvent[]=[
      {...base,eventId:asEventId("evt_1"),type:"MISSION_COMPLETED",value:{}},
      {...base,eventId:asEventId("evt_2"),type:"PROOF_VERIFIED",value:{}},
      {...base,eventId:asEventId("evt_3"),type:"SETTLEMENT_RELEASED",value:{asset:"OSA_USDC_TEST",amount:5}}
    ];
    const projection=projectReputation(events);
    expect(projection.missionsCompleted).toBe(1);
    expect(projection.proofsVerified).toBe(1);
    expect(projection.earned.OSA_USDC_TEST).toBe(5);
  });
});
