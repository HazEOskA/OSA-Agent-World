import { describe, expect, it } from "vitest";
import { asAgentId, asExecutionId, asMissionId, type Execution } from "@osa/domain";
import { buildEvidenceRecord, verifyEvidenceRoot } from "./index.js";

const execution: Execution = {
  executionId: asExecutionId("exe_proof_001"),
  missionId: asMissionId("mis_proof_001"),
  agentId: asAgentId("agt_kai_001"),
  status: "COMPLETED",
  correlationId: "cor_proof",
  causationId: null,
  startedAt: "2026-10-03T00:00:00.000Z",
  completedAt: "2026-10-03T00:00:01.000Z"
};

describe("evidence", () => {
  it("builds and verifies a deterministic evidence root", () => {
    const record = buildEvidenceRecord({
      execution,
      input: { repo: "public" },
      output: { report: "ok" },
      runtime: { id: "runtime_osa_v1" },
      observations: ["read-only"]
    });
    expect(verifyEvidenceRoot(record)).toBe(true);
  });

  it("detects modified observations", () => {
    const record = buildEvidenceRecord({
      execution,
      input: { repo: "public" },
      output: { report: "ok" },
      runtime: { id: "runtime_osa_v1" },
      observations: ["read-only"]
    });
    const tampered = { ...record, observations: ["changed"] };
    expect(verifyEvidenceRoot(tampered)).toBe(false);
  });
});
