import {
  type Agent,
  type EvidenceRecord,
  type Execution,
  type Mission,
  type ProofReceipt,
  type ProofStatus
} from "@osa/domain";
import { verifyEvidenceRoot } from "@osa/evidence";
import { proofSigningPayload, signProofPayload } from "@osa/proof-bridge";

export interface VerifyProofInput {
  proof: ProofReceipt;
  evidence: EvidenceRecord;
  execution: Execution;
  mission: Mission;
  agent: Agent;
  signingSecret: string;
}

export interface ProofVerification {
  status: Extract<ProofStatus, "VERIFIED" | "FAILED" | "INVALID">;
  reasons: readonly string[];
}

export function verifyProofReceipt(input: VerifyProofInput): ProofVerification {
  const invalid: string[] = [];
  if (input.proof.missionId !== input.mission.missionId) invalid.push("MISSION_BINDING");
  if (input.proof.executionId !== input.execution.executionId) invalid.push("EXECUTION_BINDING");
  if (input.proof.agentId !== input.agent.agentId) invalid.push("AGENT_BINDING");
  if (input.execution.missionId !== input.mission.missionId) invalid.push("EXECUTION_MISSION_BINDING");
  if (input.execution.agentId !== input.agent.agentId) invalid.push("EXECUTION_AGENT_BINDING");
  if (input.evidence.executionId !== input.execution.executionId) invalid.push("EVIDENCE_EXECUTION_BINDING");

  if (invalid.length > 0) return { status: "INVALID", reasons: invalid };

  const failed: string[] = [];
  if (!verifyEvidenceRoot(input.evidence)) failed.push("EVIDENCE_ROOT_MISMATCH");
  if (input.proof.evidenceRoot !== input.evidence.evidenceRoot) failed.push("PROOF_EVIDENCE_ROOT_MISMATCH");
  if (input.proof.resultDigest !== input.evidence.outputDigest) failed.push("RESULT_DIGEST_MISMATCH");
  if (input.proof.runtimeDigest !== input.evidence.runtimeDigest) failed.push("RUNTIME_DIGEST_MISMATCH");

  const expectedSignature = signProofPayload(
    proofSigningPayload(input.proof),
    input.signingSecret
  );
  if (expectedSignature !== input.proof.signature) failed.push("SIGNATURE_MISMATCH");

  return failed.length > 0
    ? { status: "FAILED", reasons: failed }
    : { status: "VERIFIED", reasons: [] };
}
