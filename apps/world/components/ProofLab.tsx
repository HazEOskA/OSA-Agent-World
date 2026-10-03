"use client";

import { useState } from "react";
import type { WorldEvent } from "../lib/world";

interface ProofDemoResponse {
  mode: "SIMULATED";
  tamper: boolean;
  ids: Record<string, string | null>;
  evidenceRoot: string;
  verification: { status: "VERIFIED" | "FAILED" | "INVALID"; reasons: string[] };
  settlement: { status: string; asset: string; amount: string } | null;
  reputation: {
    missionsCompleted: number;
    proofsVerified: number;
    proofsFailed: number;
    settlementsReleased: number;
    earned: Record<string, number>;
  };
  invariant: string;
}

export function ProofLab({
  active,
  onWorldEvent
}: {
  active: boolean;
  onWorldEvent: (event: WorldEvent) => void;
}) {
  const [result, setResult] = useState<ProofDemoResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async (tamper: boolean) => {
    setLoading(true);
    onWorldEvent({
      id: `w_evt_${Date.now().toString(36)}`,
      type: "proof.verification.started",
      district: "proof",
      label: tamper ? "TAMPER TEST STARTED" : "PROOF VERIFICATION STARTED",
      mode: "SIMULATED"
    });
    try {
      const response = await fetch(`/api/proof-demo?tamper=${tamper ? "1" : "0"}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Proof demo request failed");
      const data = (await response.json()) as ProofDemoResponse;
      setResult(data);
      onWorldEvent({
        id: `w_evt_${Date.now().toString(36)}`,
        type: data.verification.status === "VERIFIED" ? "proof.verified" : "proof.failed",
        district: "proof",
        label: data.invariant,
        mode: "SIMULATED"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!active) return null;

  return (
    <aside className="proof-terminal" aria-label="OSA Proof Lab">
      <div className="proof-head">
        <div><span>PROOF LAB // CLAIM ≠ PROOF</span><h2>EXECUTION VERIFICATION</h2></div>
        <strong>APR / EVIDENCE / SETTLEMENT</strong>
      </div>

      <div className="proof-actions">
        <button type="button" onClick={() => void run(false)} disabled={loading}>VERIFY CLEAN EXECUTION</button>
        <button type="button" className="tamper" onClick={() => void run(true)} disabled={loading}>TAMPER EVIDENCE</button>
      </div>

      {!result ? (
        <div className="proof-empty">RUN A VERIFICATION PATH</div>
      ) : (
        <>
          <div className={`proof-core-result ${result.verification.status.toLowerCase()}`}>
            <span>VERIFICATION</span>
            <strong>{result.verification.status}</strong>
            <i>{result.invariant}</i>
          </div>

          <div className="proof-id-grid">
            {Object.entries(result.ids).map(([key,value]) => (
              <div key={key}><span>{key}</span><code>{value ?? "BLOCKED"}</code></div>
            ))}
          </div>

          <div className="proof-root"><span>EVIDENCE ROOT</span><code>{result.evidenceRoot}</code></div>

          <div className="proof-economy-grid">
            <div><span>SETTLEMENT</span><strong>{result.settlement?.status ?? "BLOCKED"}</strong></div>
            <div><span>PROOFS VERIFIED</span><strong>{result.reputation.proofsVerified}</strong></div>
            <div><span>PROOFS FAILED</span><strong>{result.reputation.proofsFailed}</strong></div>
            <div><span>EARNED</span><strong>{result.reputation.earned.OSA_USDC_TEST ?? 0} OSA_USDC_TEST</strong></div>
          </div>

          {result.verification.reasons.length > 0 ? (
            <div className="proof-reasons">{result.verification.reasons.join(" / ")}</div>
          ) : null}
        </>
      )}
    </aside>
  );
}
