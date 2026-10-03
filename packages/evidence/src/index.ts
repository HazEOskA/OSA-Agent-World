import {
  asEvidenceId,
  type EvidenceRecord,
  type Execution
} from "@osa/domain";
import { digestPayload } from "@osa/events";

export interface BuildEvidenceInput {
  execution: Execution;
  input: unknown;
  output: unknown;
  runtime: unknown;
  repository?: unknown;
  observations: readonly string[];
}

export function buildEvidenceRecord(input: BuildEvidenceInput): EvidenceRecord {
  const inputDigest = digestPayload(input.input);
  const outputDigest = digestPayload(input.output);
  const runtimeDigest = digestPayload(input.runtime);
  const repositoryDigest =
    input.repository === undefined ? null : digestPayload(input.repository);

  const evidenceRoot = digestPayload({
    executionId: input.execution.executionId,
    inputDigest,
    outputDigest,
    runtimeDigest,
    repositoryDigest,
    observations: input.observations
  });

  return {
    evidenceId: asEvidenceId(`evd_${input.execution.executionId.slice(4)}`),
    executionId: input.execution.executionId,
    inputDigest,
    repositoryDigest,
    runtimeDigest,
    outputDigest,
    evidenceRoot,
    observations: input.observations,
    createdAt: input.execution.completedAt ?? new Date().toISOString()
  };
}

export function verifyEvidenceRoot(evidence: EvidenceRecord): boolean {
  return (
    evidence.evidenceRoot ===
    digestPayload({
      executionId: evidence.executionId,
      inputDigest: evidence.inputDigest,
      outputDigest: evidence.outputDigest,
      runtimeDigest: evidence.runtimeDigest,
      repositoryDigest: evidence.repositoryDigest,
      observations: evidence.observations
    })
  );
}
