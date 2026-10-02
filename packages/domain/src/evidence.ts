import type { EvidenceId, ExecutionId } from "./ids.js";

export interface EvidenceRecord {
  evidenceId: EvidenceId;
  executionId: ExecutionId;
  inputDigest: string;
  repositoryDigest: string | null;
  runtimeDigest: string;
  outputDigest: string;
  evidenceRoot: string;
  observations: readonly string[];
  createdAt: string;
}
