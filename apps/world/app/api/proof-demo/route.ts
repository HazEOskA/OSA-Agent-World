import { NextResponse } from "next/server";
import { KAI_AGENT } from "@osa/agent-core";
import {
  asEventId,
  asExecutionId,
  asMissionId,
  type Execution,
  type Mission,
  type ProofReceipt,
  type ReputationEvent
} from "@osa/domain";
import { buildEvidenceRecord } from "@osa/evidence";
import { buildProofReceipt } from "@osa/proof-bridge";
import { verifyProofReceipt } from "@osa/proof-verifier";
import { SettlementService } from "@osa/settlement-service";
import { projectReputation } from "@osa/reputation-service";
import { KAI_WALLET_POLICY } from "@osa/wallet-policy";

const DEMO_SECRET = process.env.OSA_PROOF_DEMO_SECRET ?? "osa-alpha-reference-verifier";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tamper = url.searchParams.get("tamper") === "1";

  const mission: Mission = {
    missionId: asMissionId("mis_proof_demo_001"),
    issuerId: "osa:world:user",
    requirements: ["repo.read", "code.audit", "report.generate"],
    acceptanceCriteria: ["structured audit report", "execution evidence"],
    rewardAsset: "OSA_USDC_TEST",
    rewardAmount: "5",
    deadline: null,
    status: "COMPLETED",
    assignedAgentId: KAI_AGENT.agentId,
    correlationId: "cor_proof_demo_001",
    createdAt: "2026-10-03T00:00:00.000Z"
  };

  const execution: Execution = {
    executionId: asExecutionId("exe_proof_demo_001"),
    missionId: mission.missionId,
    agentId: KAI_AGENT.agentId,
    status: "COMPLETED",
    correlationId: mission.correlationId,
    causationId: null,
    startedAt: "2026-10-03T00:00:01.000Z",
    completedAt: "2026-10-03T00:00:02.000Z"
  };

  const originalEvidence = buildEvidenceRecord({
    execution,
    input: { target: "public-repository", scope: "read-only audit" },
    output: { report: "AUDIT_REPORT", severity: ["HIGH", "MEDIUM"] },
    runtime: { id: KAI_AGENT.runtimeId, authority: "read-only" },
    repository: { digestSource: "reference-repo-v1" },
    observations: ["repo.read PASS", "dependency.inspect PASS", "report.generate PASS"]
  });

  const proof = buildProofReceipt({
    agent: KAI_AGENT,
    mission,
    execution,
    evidence: originalEvidence,
    walletPolicy: KAI_WALLET_POLICY,
    signingSecret: DEMO_SECRET
  });

  const evidence = tamper
    ? { ...originalEvidence, observations: [...originalEvidence.observations, "TAMPERED_AFTER_EXECUTION"] }
    : originalEvidence;

  const verification = verifyProofReceipt({
    proof,
    evidence,
    execution,
    mission,
    agent: KAI_AGENT,
    signingSecret: DEMO_SECRET
  });

  let settlement: ReturnType<SettlementService["release"]>["settlement"] | null = null;
  const reputationEvents: ReputationEvent[] = [
    {
      eventId: asEventId("evt_proof_demo_mission"),
      agentId: KAI_AGENT.agentId,
      type: "MISSION_COMPLETED",
      missionId: mission.missionId,
      proofId: proof.proofId,
      settlementId: null,
      value: {},
      correlationId: mission.correlationId,
      createdAt: "2026-10-03T00:00:03.000Z"
    },
    {
      eventId: asEventId("evt_proof_demo_proof"),
      agentId: KAI_AGENT.agentId,
      type: verification.status === "VERIFIED" ? "PROOF_VERIFIED" : "PROOF_FAILED",
      missionId: mission.missionId,
      proofId: proof.proofId,
      settlementId: null,
      value: { reasons: verification.reasons.join(",") },
      correlationId: mission.correlationId,
      createdAt: "2026-10-03T00:00:04.000Z"
    }
  ];

  if (verification.status === "VERIFIED") {
    const verifiedProof: ProofReceipt = { ...proof, status: "VERIFIED" };
    const settlementService = new SettlementService();
    const escrow = settlementService.lock(settlementService.fund(settlementService.createEscrow(mission)));
    settlement = settlementService.release({
      escrow,
      mission,
      proof: verifiedProof,
      recipient: KAI_AGENT.walletAddress
    }).settlement;

    reputationEvents.push({
      eventId: asEventId("evt_proof_demo_settlement"),
      agentId: KAI_AGENT.agentId,
      type: "SETTLEMENT_RELEASED",
      missionId: mission.missionId,
      proofId: verifiedProof.proofId,
      settlementId: settlement.settlementId,
      value: { asset: settlement.asset, amount: Number(settlement.amount) },
      correlationId: mission.correlationId,
      createdAt: "2026-10-03T00:00:05.000Z"
    });
  }

  return NextResponse.json({
    mode: "SIMULATED",
    tamper,
    ids: {
      agentId: KAI_AGENT.agentId,
      missionId: mission.missionId,
      executionId: execution.executionId,
      evidenceId: evidence.evidenceId,
      proofId: proof.proofId,
      settlementId: settlement?.settlementId ?? null
    },
    evidenceRoot: evidence.evidenceRoot,
    verification,
    settlement,
    reputation: projectReputation(reputationEvents),
    invariant: verification.status === "VERIFIED"
      ? "VERIFIED → SETTLEMENT RELEASED"
      : "PROOF FAILURE → SETTLEMENT BLOCKED"
  });
}
