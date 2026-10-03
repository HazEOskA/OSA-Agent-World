import {
  asAgentId,
  asPolicyId,
  type Agent
} from "@osa/domain";

export const KAI_AGENT: Agent = {
  agentId: asAgentId("agt_kai_001"),
  ownerId: "osa:world:operator",
  publicKey: "did:osa:kai:001",
  walletAddress: "osa-wallet:kai:001",
  capabilities: [
    "repo.read",
    "code.audit",
    "dependency.inspect",
    "report.generate",
    "proof.request"
  ],
  policyId: asPolicyId("pol_kai_guarded_001"),
  runtimeId: "runtime_osa_v1",
  createdAt: "2026-10-03T00:00:00.000Z",
  status: "ACTIVE"
};

export interface CapabilityMatch {
  matched: readonly string[];
  missing: readonly string[];
  accepted: boolean;
}

export function matchCapabilities(
  agent: Agent,
  required: readonly string[]
): CapabilityMatch {
  const capabilities = new Set(agent.capabilities);
  const matched = required.filter((capability) => capabilities.has(capability));
  const missing = required.filter((capability) => !capabilities.has(capability));

  return {
    matched,
    missing,
    accepted: missing.length === 0
  };
}
