import type { AgentId, PolicyId } from "./ids.js";

export type AgentStatus = "ACTIVE" | "SUSPENDED";

export interface Agent {
  agentId: AgentId;
  ownerId: string;
  publicKey: string;
  walletAddress: string;
  capabilities: readonly string[];
  policyId: PolicyId;
  runtimeId: string;
  createdAt: string;
  status: AgentStatus;
}
