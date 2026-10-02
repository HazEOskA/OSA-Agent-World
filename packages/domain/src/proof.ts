import type { AgentId, ExecutionId, MissionId, ProofId } from "./ids.js";

export type ProofStatus = "CREATED" | "VERIFIED" | "FAILED" | "INVALID" | "REVOKED" | "DISPUTED";

export interface ProofReceipt {
  proofId: ProofId;
  missionId: MissionId;
  executionId: ExecutionId;
  agentId: AgentId;
  evidenceRoot: string;
  resultDigest: string;
  runtimeDigest: string;
  policyDigest: string;
  status: ProofStatus;
  createdAt: string;
  signature: string;
}
