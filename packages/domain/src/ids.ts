export type Brand<T, TBrand extends string> = T & { readonly __brand: TBrand };

export type AgentId = Brand<string, "AgentId">;
export type MissionId = Brand<string, "MissionId">;
export type ExecutionId = Brand<string, "ExecutionId">;
export type EvidenceId = Brand<string, "EvidenceId">;
export type ProofId = Brand<string, "ProofId">;
export type SettlementId = Brand<string, "SettlementId">;
export type EventId = Brand<string, "EventId">;
export type PolicyId = Brand<string, "PolicyId">;

const prefixes = {
  agent: "agt_",
  mission: "mis_",
  execution: "exe_",
  evidence: "evd_",
  proof: "prf_",
  settlement: "stl_",
  event: "evt_",
  policy: "pol_"
} as const;

function assertId(value: string, prefix: string): string {
  if (!value.startsWith(prefix) || value.length <= prefix.length) {
    throw new Error(`Invalid canonical ID: expected prefix ${prefix}`);
  }
  return value;
}

export const asAgentId = (value: string) => assertId(value, prefixes.agent) as AgentId;
export const asMissionId = (value: string) => assertId(value, prefixes.mission) as MissionId;
export const asExecutionId = (value: string) => assertId(value, prefixes.execution) as ExecutionId;
export const asEvidenceId = (value: string) => assertId(value, prefixes.evidence) as EvidenceId;
export const asProofId = (value: string) => assertId(value, prefixes.proof) as ProofId;
export const asSettlementId = (value: string) => assertId(value, prefixes.settlement) as SettlementId;
export const asEventId = (value: string) => assertId(value, prefixes.event) as EventId;
export const asPolicyId = (value: string) => assertId(value, prefixes.policy) as PolicyId;
