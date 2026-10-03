"use client";

import type { OsaIdentity } from "@osa/wallet-core";
import { useCallback, useReducer, useState } from "react";
import { AgentDistrict } from "./AgentDistrict";
import { BridgeTower } from "./BridgeTower";
import { DeFiTerminal } from "./DeFiTerminal";
import { IdentityGate } from "./IdentityGate";
import { ProofLab } from "./ProofLab";
import { ProtocolOverlay } from "./ProtocolOverlay";
import { WorldScene } from "./WorldScene";
import {
  initialWorldEvent,
  reduceWorldState,
  type DistrictId,
  type WorldEvent,
  type WorldState
} from "../lib/world";

const initialState: WorldState = {
  activeDistrict: "nexus",
  teleporting: false,
  lastEvent: initialWorldEvent
};

let eventCounter = 10;
function nextEventId(): string {
  eventCounter += 1;
  return `w_evt_${eventCounter.toString().padStart(4, "0")}`;
}

export function WorldShell() {
  const [entered, setEntered] = useState(false);
  const [identityOpen, setIdentityOpen] = useState(true);
  const [identity, setIdentity] = useState<OsaIdentity | null>(null);
  const [state, dispatch] = useReducer(reduceWorldState, initialState);

  const teleport = useCallback((district: DistrictId) => {
    dispatch({
      id: nextEventId(),
      type: "district.teleport.started",
      district,
      label: `TELEPORT / ${district.toUpperCase()}`,
      mode: "REAL"
    });
    window.setTimeout(() => {
      dispatch({
        id: nextEventId(),
        type: "district.teleport.completed",
        district,
        label: `MATERIALIZED / ${district.toUpperCase()}`,
        mode: "REAL"
      });
    }, 620);
  }, []);

  const ingestWorldEvent = useCallback((event: WorldEvent) => dispatch(event), []);

  if (!entered) {
    return (
      <main className="entry-gate">
        <div className="entry-grid" aria-hidden="true" />
        <div className="entry-orbit orbit-one" aria-hidden="true" />
        <div className="entry-orbit orbit-two" aria-hidden="true" />
        <section className="entry-copy">
          <div className="entry-kicker">OSA PROTOCOL // WORLD BOOT SEQUENCE</div>
          <h1>ENTER THE<span>AGENTIC CRYPTO WORLD</span></h1>
          <p>A living Web4 city where agents, chains, DeFi, nodes and verifiable execution become one spatial economy.</p>
          <div className="entry-actions">
            <button type="button" className="enter-button" onClick={() => { setEntered(true); setIdentityOpen(true); }}>
              <span>ENTER WORLD</span><i>↗</i>
            </button>
            <div className="entry-state"><span>ALPHA</span><b>WORLD SHELL REAL</b><i>WEB3 + AGENTS + DEFI + BRIDGE</i></div>
          </div>
        </section>
        <div className="entry-coordinate">51° // OSA NETWORK // WEB3 → WEB4</div>
      </main>
    );
  }

  const protocolPulse = [
    "transaction.confirmed",
    "defi.swap.confirmed",
    "bridge.transfer.completed",
    "agent.execution.completed",
    "proof.verified"
  ].includes(state.lastEvent.type);

  return (
    <main className={["world-shell", state.teleporting ? "teleporting" : "", protocolPulse ? "chain-confirmed" : ""].filter(Boolean).join(" ")}>
      <WorldScene activeDistrict={state.activeDistrict} onSelect={teleport} />
      <div className="world-vignette" aria-hidden="true" />
      <div className="world-scanlines" aria-hidden="true" />
      <div className="teleport-flash" aria-hidden="true" />
      <div className="chain-pulse" aria-hidden="true" />

      <ProtocolOverlay activeDistrict={state.activeDistrict} event={state.lastEvent} onTeleport={teleport} onIdentity={() => setIdentityOpen(true)} />

      <IdentityGate
        open={identityOpen}
        onClose={() => setIdentityOpen(false)}
        onWorldEvent={ingestWorldEvent}
        onIdentityChange={setIdentity}
      />

      <AgentDistrict active={!identityOpen && state.activeDistrict === "agents"} onWorldEvent={ingestWorldEvent} />
      <DeFiTerminal active={!identityOpen && state.activeDistrict === "defi"} identity={identity} onWorldEvent={ingestWorldEvent} />
      <BridgeTower active={!identityOpen && state.activeDistrict === "bridge"} identity={identity} onWorldEvent={ingestWorldEvent} />
      <ProofLab active={!identityOpen && state.activeDistrict === "proof"} onWorldEvent={ingestWorldEvent} />
    </main>
  );
}
