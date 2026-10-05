"use client";

import { KAI_AGENT, matchCapabilities } from "@osa/agent-core";
import { ReferenceOsaRuntime } from "@osa/execution-service";
import { MissionService } from "@osa/mission-service";
import {
  KAI_WALLET_POLICY,
  evaluateWalletPolicy
} from "@osa/wallet-policy";
import { useMemo, useState } from "react";
import type { WorldEvent } from "../lib/world";

interface AgentDistrictProps {
  active: boolean;
  onWorldEvent: (event: WorldEvent) => void;
}

type MissionUiState =
  | "READY"
  | "FUNDED"
  | "ACCEPTED"
  | "AUTHORIZED"
  | "EXECUTING"
  | "SUBMITTED"
  | "FAILED";

function emit(
  onWorldEvent: (event: WorldEvent) => void,
  type: WorldEvent["type"],
  label: string
) {
  onWorldEvent({
    id: `w_evt_${Date.now().toString(36)}`,
    type,
    district: "agents",
    label,
    mode: "REAL"
  });
}

export function AgentDistrict({ active, onWorldEvent }: AgentDistrictProps) {
  const service = useMemo(() => new MissionService(), []);
  const runtime = useMemo(() => new ReferenceOsaRuntime(), []);
  const [missionState, setMissionState] = useState<MissionUiState>("READY");
  const [trace, setTrace] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const capabilityMatch = matchCapabilities(KAI_AGENT, [
    "repo.read",
    "code.audit",
    "report.generate"
  ]);

  const walletDecision = evaluateWalletPolicy(KAI_WALLET_POLICY, {
    operation: "receive_reward",
    asset: "OSA_USDC_TEST",
    amount: "5",
    destination: "mission_escrow",
    spentToday: "0"
  });

  const runMission = async () => {
    setError(null);
    setTrace([]);
    try {
      const mission = service.create({
        missionId: "mis_kai_alpha_001",
        issuerId: "osa:world:user",
        requirements: ["repo.read", "code.audit", "report.generate"],
        acceptanceCriteria: ["structured audit report", "execution evidence"],
        rewardAsset: "OSA_USDC_TEST",
        rewardAmount: "5",
        correlationId: "cor_kai_alpha_001"
      });
      setTrace((current) => [...current, "MISJA UTWORZONA"]);

      service.transition(mission.missionId, "FUNDED");
      setMissionState("FUNDED");
      setTrace((current) => [...current, "NAGRODA ZABLOKOWANA / 5 OSA_USDC_TEST"]);

      service.transition(mission.missionId, "OPEN");
      service.assign(mission.missionId, KAI_AGENT.agentId);
      service.transition(mission.missionId, "ACCEPTED");
      setMissionState("ACCEPTED");
      setTrace((current) => [...current, "KAI PRZYJĄŁ MISJĘ"]);

      if (!capabilityMatch.accepted) throw new Error("Capability match failed");
      if (walletDecision.decision === "DENY") throw new Error("Wallet policy denied reward");
      setMissionState("AUTHORIZED");
      setTrace((current) => [
        ...current,
        `AUTORYZACJA / CAPABILITIES PASS / PORTFEL ${walletDecision.decision}`
      ]);

      service.transition(mission.missionId, "EXECUTING");
      setMissionState("EXECUTING");
      emit(onWorldEvent, "agent.execution.started", "KAI / WYKONANIE ROZPOCZĘTE");

      const currentMission = service.get(mission.missionId);
      const result = await runtime.execute(KAI_AGENT, currentMission);
      setTrace((current) => [
        ...current,
        ...result.actions.map((action) => `ALLOW / ${action.operation}`),
        ...result.observations
      ]);

      service.transition(mission.missionId, "SUBMITTED");
      setMissionState("SUBMITTED");
      emit(onWorldEvent, "agent.execution.completed", "KAI / WYNIK PRZESŁANY");
    } catch (cause) {
      setMissionState("FAILED");
      const value = cause instanceof Error ? cause.message : String(cause);
      setError(value);
      emit(onWorldEvent, "agent.execution.failed", "KAI / WYKONANIE NIEUDANE");
    }
  };

  if (!active) return null;

  return (
    <aside className="agent-terminal" aria-label="Panel agentów OSA">
      <div className="agent-head">
        <div>
          <span>AGENTY // RUNTIME I AUTORYZACJA</span>
          <h2>KAI / AUDYTOR BEZPIECZEŃSTWA KODU</h2>
        </div>
        <strong>{KAI_AGENT.status}</strong>
      </div>

      <div className="agent-grid">
        <section>
          <div className="agent-core-visual" aria-hidden="true">
            <div className="agent-core-ring" />
            <div className="agent-core-ring inner" />
            <div className="agent-core-node">K</div>
          </div>
          <dl className="agent-identity">
            <div><dt>AGENT ID</dt><dd>{KAI_AGENT.agentId}</dd></div>
            <div><dt>RUNTIME</dt><dd>{KAI_AGENT.runtimeId}</dd></div>
            <div><dt>POLICY</dt><dd>{KAI_AGENT.policyId}</dd></div>
            <div><dt>WALLET</dt><dd>{KAI_AGENT.walletAddress}</dd></div>
          </dl>
        </section>

        <section>
          <div className="agent-module-title">MACIERZ MOŻLIWOŚCI</div>
          <div className="capability-list">
            {KAI_AGENT.capabilities.map((capability) => (
              <span key={capability}>{capability}</span>
            ))}
          </div>

          <div className="agent-status-row">
            <span>ZGODNOŚĆ MISJI</span>
            <strong>{capabilityMatch.accepted ? "PASS" : "FAIL"}</strong>
          </div>
          <div className="agent-status-row">
            <span>POLITYKA PORTFELA</span>
            <strong>{walletDecision.decision}</strong>
          </div>
          <div className="agent-status-row">
            <span>UPRAWNIENIA</span>
            <strong>REFERENCYJNE / TYLKO ODCZYT</strong>
          </div>

          <button
            type="button"
            className="agent-run"
            onClick={() => void runMission()}
            disabled={missionState !== "READY" && missionState !== "FAILED"}
          >
            URUCHOM MISJĘ REFERENCYJNĄ
          </button>
        </section>
      </div>

      <section className="mission-trace">
        <div className="agent-module-title">
          ŚLAD MISJI <b>{missionState}</b>
        </div>
        {trace.length === 0 ? (
          <div className="agent-empty">BRAK WYKONANIA</div>
        ) : (
          trace.map((item, index) => (
            <div className="agent-trace-step" key={`${item}-${index}`}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{item}</strong>
            </div>
          ))
        )}
        {error ? <div className="agent-error">{error}</div> : null}
      </section>
    </aside>
  );
}
