import { createHmac } from "node:crypto";
import {
  asProofId,
  type Agent,
  type EvidenceRecord,
  type Execution,
  type Mission,
  type ProofReceipt
} from "@osa/domain";
import { canonicalize, digestPayload } from "@osa/events";

export interface BuildProofInput {
  agent: Agent;
  mission: Mission;
  execution: Execution;
  evidence: EvidenceRecord;
  walletPolicy: unknown;
  signingSecret: string;
}

function unsignedProof(input: BuildProofInput) {
  return {
    proofId: asProofId(`prf_${input.execution.executionId.slice(4)}`),
    missionId: input.mission.missionId,
    executionId: input.execution.executionId,
    agentId: input.agent.agentId,
    evidenceRoot: input.evidence.evidenceRoot,
    resultDigest: input.evidence.outputDigest,
    runtimeDigest: input.evidence.runtimeDigest,
    policyDigest: digestPayload(input.walletPolicy),
    status: "CREATED" as const,
    createdAt: input.evidence.createdAt
  };
}

export function signProofPayload(value: unknown, secret: string): string {
  return createHmac("sha256", secret).update(canonicalize(value)).digest("hex");
}

export function buildProofReceipt(input: BuildProofInput): ProofReceipt {
  const unsigned = unsignedProof(input);
  return {
    ...unsigned,
    signature: signProofPayload(unsigned, input.signingSecret)
  };
}

export function proofSigningPayload(proof: ProofReceipt) {
  const { signature, ...unsigned } = proof;
  void signature;
  return unsigned;
}
