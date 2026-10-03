import type { ReputationEvent } from "@osa/domain";

export interface ReputationProjection {
  missionsCompleted: number;
  missionsFailed: number;
  proofsVerified: number;
  proofsFailed: number;
  settlementsReleased: number;
  disputes: number;
  earned: Readonly<Record<string, number>>;
}

export const EMPTY_REPUTATION: ReputationProjection = {
  missionsCompleted:0,missionsFailed:0,proofsVerified:0,proofsFailed:0,
  settlementsReleased:0,disputes:0,earned:{}
};

export function projectReputation(events: readonly ReputationEvent[]): ReputationProjection {
  let projection: ReputationProjection = EMPTY_REPUTATION;
  for (const event of events) {
    const earned = { ...projection.earned };
    if (event.type === "SETTLEMENT_RELEASED") {
      const asset=String(event.value.asset ?? "UNKNOWN");
      const amount=Number(event.value.amount ?? 0);
      earned[asset]=(earned[asset] ?? 0)+amount;
    }
    projection = {
      missionsCompleted: projection.missionsCompleted + (event.type==="MISSION_COMPLETED"?1:0),
      missionsFailed: projection.missionsFailed + (event.type==="MISSION_FAILED"?1:0),
      proofsVerified: projection.proofsVerified + (event.type==="PROOF_VERIFIED"?1:0),
      proofsFailed: projection.proofsFailed + (event.type==="PROOF_FAILED"?1:0),
      settlementsReleased: projection.settlementsReleased + (event.type==="SETTLEMENT_RELEASED"?1:0),
      disputes: projection.disputes + (event.type==="DISPUTE_OPENED"?1:0),
      earned
    };
  }
  return projection;
}
