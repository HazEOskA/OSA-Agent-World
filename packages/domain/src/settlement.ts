import type { MissionId, ProofId, SettlementId } from "./ids.js";
import type { MissionStatus } from "./mission.js";
import type { ProofStatus } from "./proof.js";

export type EscrowState = "UNFUNDED" | "FUNDED" | "LOCKED" | "RELEASED" | "REFUNDED" | "DISPUTED";
export type SettlementStatus = "REQUESTED" | "RELEASED" | "FAILED" | "REFUNDED";

export interface Settlement {
  settlementId: SettlementId;
  missionId: MissionId;
  proofId: ProofId;
  recipient: string;
  asset: string;
  amount: string;
  status: SettlementStatus;
  chainTxId: string | null;
  createdAt: string;
}

export function canReleaseSettlement(
  missionStatus: MissionStatus,
  proofStatus: ProofStatus,
  escrowState: EscrowState
): boolean {
  return missionStatus === "COMPLETED" && proofStatus === "VERIFIED" && escrowState === "LOCKED";
}
