import type { AgentId, EventId, MissionId, ProofId, SettlementId } from "./ids.js";

export type ReputationEventType =
  | "MISSION_COMPLETED"
  | "MISSION_FAILED"
  | "PROOF_VERIFIED"
  | "PROOF_FAILED"
  | "SETTLEMENT_RELEASED"
  | "DISPUTE_OPENED";

export interface ReputationEvent {
  eventId: EventId;
  agentId: AgentId;
  type: ReputationEventType;
  missionId: MissionId | null;
  proofId: ProofId | null;
  settlementId: SettlementId | null;
  value: Readonly<Record<string, string | number | boolean>>;
  correlationId: string;
  createdAt: string;
}
