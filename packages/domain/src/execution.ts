import type { AgentId, ExecutionId, MissionId } from "./ids.js";

export type ExecutionStatus = "CREATED" | "RUNNING" | "COMPLETED" | "FAILED";

export interface Execution {
  executionId: ExecutionId;
  missionId: MissionId;
  agentId: AgentId;
  status: ExecutionStatus;
  correlationId: string;
  causationId: string | null;
  startedAt: string | null;
  completedAt: string | null;
}
