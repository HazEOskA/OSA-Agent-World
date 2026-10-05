"use client";

import type { OsaIdentity } from "@osa/wallet-core";
import { useCallback, useReducer, useState } from "react";
import { AgentDistrict } from "./AgentDistrict";
import { BridgeTower } from "./BridgeTower";
import { ChainExplorer } from "./ChainExplorer";
import { DeFiTerminal } from "./DeFiTerminal";
import { IdentityGate } from "./IdentityGate";
import { NodeGrid } from "./NodeGrid";
import { MarketZone } from "./MarketZone";
import { ProofLab } from "./ProofLab";
import { ReleasePanel } from "./ReleasePanel";
import { ProtocolOverlay } from "./ProtocolOverlay";
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
  const [identityOpen, setIdentityOpen] = useState(false);
  const [identity, setIdentity] = useState<OsaIdentity | null>(null);
  const [state, dispatch] = useReducer(reduceWorldState, initialState);

  const selectModule = useCallback((district: DistrictId) => {
    dispatch({
      id: nextEventId(),
      type: "district.teleport.started",
      district,
      label: `OTWIERANIE MODUŁU / ${district.toUpperCase()}`,
      mode: "REAL"
    });
    window.setTimeout(() => {
      dispatch({
        id: nextEventId(),
        type: "district.teleport.completed",
        district,
        label: `MODUŁ AKTYWNY / ${district.toUpperCase()}`,
        mode: "REAL"
      });
    }, 80);
  }, []);

  const ingestWorldEvent = useCallback((event: WorldEvent) => dispatch(event), []);

  return (
    <main className="world-shell">
      <ProtocolOverlay
        activeDistrict={state.activeDistrict}
        event={state.lastEvent}
        onTeleport={selectModule}
        onIdentity={() => setIdentityOpen(true)}
      />

      <section className="world-content" aria-label="OSA Agent World Control Plane">
        <ReleasePanel active={!identityOpen && state.activeDistrict === "nexus"} onWorldEvent={ingestWorldEvent} />
        <AgentDistrict active={!identityOpen && state.activeDistrict === "agents"} onWorldEvent={ingestWorldEvent} />
        <DeFiTerminal active={!identityOpen && state.activeDistrict === "defi"} identity={identity} onWorldEvent={ingestWorldEvent} />
        <BridgeTower active={!identityOpen && state.activeDistrict === "bridge"} identity={identity} onWorldEvent={ingestWorldEvent} />
        <ProofLab active={!identityOpen && state.activeDistrict === "proof"} onWorldEvent={ingestWorldEvent} />
        <ChainExplorer active={!identityOpen && state.activeDistrict === "chain"} onWorldEvent={ingestWorldEvent} />
        <NodeGrid active={!identityOpen && state.activeDistrict === "nodes"} onWorldEvent={ingestWorldEvent} />
        <MarketZone active={!identityOpen && state.activeDistrict === "market"} onWorldEvent={ingestWorldEvent} />
      </section>

      <IdentityGate
        open={identityOpen}
        onClose={() => setIdentityOpen(false)}
        onWorldEvent={ingestWorldEvent}
        onIdentityChange={setIdentity}
      />
    </main>
  );
}
