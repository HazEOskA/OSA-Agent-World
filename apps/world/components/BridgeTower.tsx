"use client";

import {
  createSimulatedBridgeRoute,
  runSimulatedBridge,
  type BridgeTrace
} from "@osa/bridge-core";
import {
  executeWormholeTestnetTransfer,
  quoteWormholeTestnetTransfer,
  type WormholeTestnetQuote
} from "@osa/bridge-wormhole";
import type { OsaIdentity } from "@osa/wallet-core";
import { useState } from "react";
import type { WorldEvent } from "../lib/world";

export function BridgeTower({
  active,
  identity,
  onWorldEvent
}: {
  active: boolean;
  identity: OsaIdentity | null;
  onWorldEvent: (event: WorldEvent) => void;
}) {
  const [simTrace, setSimTrace] = useState<BridgeTrace | null>(null);
  const [liveTrace, setLiveTrace] = useState<BridgeTrace | null>(null);
  const [liveQuote, setLiveQuote] = useState<WormholeTestnetQuote | null>(null);
  const [amount, setAmount] = useState("0.001");
  const [error, setError] = useState<string | null>(null);

  const emit = (type: WorldEvent["type"], label: string, mode: WorldEvent["mode"]) =>
    onWorldEvent({
      id: `w_evt_${Date.now().toString(36)}`,
      type,
      district: "bridge",
      label,
      mode
    });

  const runSimulation = async () => {
    const route = createSimulatedBridgeRoute({
      sourceChain: "OSA_ALPHA",
      destinationChain: "ETH_TEST",
      asset: "OSA_TEST",
      amount: "25",
      recipient: "osa:observer"
    });
    emit("bridge.transfer.started", "SYMULOWANY BRIDGE ROZPOCZĘTY", "SIMULATED");
    await runSimulatedBridge(route, setSimTrace);
    emit("bridge.transfer.completed", "SYMULOWANY BRIDGE ZAKOŃCZONY", "SIMULATED");
  };

  const quoteLive = async () => {
    setError(null);
    if (!identity || identity.primaryWallet.kind !== "EVM") {
      setError("Wymagana tożsamość EVM na ścieżce Sepolia");
      return;
    }
    try {
      const quote = await quoteWormholeTestnetTransfer(amount, identity.primaryWallet.address);
      setLiveQuote(quote);
      emit("bridge.route.created", "TRASA WORMHOLE TESTNET GOTOWA", "TESTNET");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
      emit("bridge.transfer.failed", "TRASA WORMHOLE NIEUDANA", "TESTNET");
    }
  };

  const executeLive = async () => {
    if (!identity || identity.primaryWallet.kind !== "EVM") return;
    setError(null);
    emit("bridge.transfer.started", "TRANSFER WORMHOLE ROZPOCZĘTY", "TESTNET");
    try {
      await executeWormholeTestnetTransfer(amount, identity.primaryWallet.address, setLiveTrace);
      emit("bridge.transfer.completed", "TRANSFER WORMHOLE ZAKOŃCZONY", "TESTNET");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
      emit("bridge.transfer.failed", "TRANSFER WORMHOLE NIEUDANY", "TESTNET");
    }
  };

  if (!active) return null;

  return (
    <aside className="bridge-terminal" aria-label="Panel Bridge OSA">
      <div className="bridge-head">
        <div>
          <span>BRIDGE // CROSS-CHAIN</span>
          <h2>TRANSFER MIĘDZY SIECIAMI</h2>
        </div>
        <strong>WORMHOLE WTT / TESTNET</strong>
      </div>

      <div className="bridge-grid">
        <section>
          <div className="bridge-module-title">ŚLAD SYMULACJI</div>
          <button type="button" onClick={() => void runSimulation()}>
            URUCHOM SYMULACJĘ BRIDGE
          </button>
          <Trace trace={simTrace} />
        </section>

        <section>
          <div className="bridge-module-title">TRASA TESTNET</div>
          <div className="bridge-route">
            <b>ARBITRUM SEPOLIA</b>
            <span>→</span>
            <b>BASE SEPOLIA</b>
          </div>
          <label>
            <span>KWOTA</span>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" />
          </label>
          <div className="bridge-actions">
            <button type="button" onClick={() => void quoteLive()}>POBIERZ WYCENĘ WORMHOLE</button>
            <button type="button" disabled={!liveQuote} onClick={() => void executeLive()}>
              WYKONAJ BRIDGE TESTNET
            </button>
          </div>
          {liveQuote ? (
            <div className="bridge-quote">
              <span>DESTINATION KWOTA</span>
              <strong>{liveQuote.destinationAmount}</strong>
              <i>{liveQuote.route.securityModel}</i>
            </div>
          ) : null}
          <Trace trace={liveTrace} />
        </section>
      </div>

      {error ? <div className="bridge-error">{error}</div> : null}
    </aside>
  );
}

function Trace({ trace }: { trace: BridgeTrace | null }) {
  if (!trace) return <div className="trace-empty">BRAK ŚLADU</div>;
  return (
    <div className="cross-chain-trace">
      {trace.steps.map((step, index) => (
        <div key={`${step.stage}-${index}`} className="trace-step">
          <span>{String(index + 1).padStart(2, "0")}</span>
          <strong>{step.stage}</strong>
          <i>{step.label}</i>
          {step.txId ? <code>{step.txId}</code> : null}
        </div>
      ))}
    </div>
  );
}
