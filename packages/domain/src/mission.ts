import type { AgentId, MissionId } from "./ids.js";

export const MISSION_STATUSES = [
  "CREATED",
  "FUNDED",
  "OPEN",
  "ACCEPTED",
  "EXECUTING",
  "SUBMITTED",
  "VERIFYING",
  "COMPLETED",
  "FAILED",
  "REJECTED",
  "EXPIRED",
  "DISPUTED",
  "CANCELLED"
] as const;

export type MissionStatus = (typeof MISSION_STATUSES)[number];

const transitions: Readonly<Record<MissionStatus, readonly MissionStatus[]>> = {
  CREATED: ["FUNDED", "CANCELLED"],
  FUNDED: ["OPEN", "CANCELLED"],
  OPEN: ["ACCEPTED", "EXPIRED", "CANCELLED"],
  ACCEPTED: ["EXECUTING", "CANCELLED"],
  EXECUTING: ["SUBMITTED", "FAILED"],
  SUBMITTED: ["VERIFYING", "REJECTED"],
  VERIFYING: ["COMPLETED", "REJECTED", "DISPUTED"],
  COMPLETED: ["DISPUTED"],
  FAILED: [],
  REJECTED: ["DISPUTED"],
  EXPIRED: [],
  DISPUTED: [],
  CANCELLED: []
};

export function canTransitionMission(from: MissionStatus, to: MissionStatus): boolean {
  return transitions[from].includes(to);
}

export function assertMissionTransition(from: MissionStatus, to: MissionStatus): void {
  if (!canTransitionMission(from, to)) {
    throw new Error(`Illegal mission transition: ${from} -> ${to}`);
  }
}

export interface Mission {
  missionId: MissionId;
  issuerId: string;
  requirements: readonly string[];
  acceptanceCriteria: readonly string[];
  rewardAsset: string;
  rewardAmount: string;
  deadline: string | null;
  status: MissionStatus;
  assignedAgentId: AgentId | null;
  correlationId: string;
  createdAt: string;
}
