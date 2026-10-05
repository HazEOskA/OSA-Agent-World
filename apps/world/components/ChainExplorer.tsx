"use client";

import { useEffect, useState } from "react";
import type { WorldEvent } from "../lib/world";

interface Snapshot {
  network: "OSA_DEVNET";
  mode: "SIMULATED";
  truth: string;
  genesis: {
    protocolVersion: string;
    layers: Array<{ layer:string; chainId:string; gasAsset:string; parentLayer:string|null }>;
  };
  explorer: {
    layers: Record<string,{chainId:string;height:number;latestBlockHash:string;txCount:number}>;
    recentBlocks: Array<{layer:string;height:number;blockHash:string;stateRoot:string;transactions:Array<{txId:string}>}>;
    anchors: Array<{sourceLayer:string;targetLayer:string;sourceBlockHash:string;targetTxId:string}>;
  };
}

export function ChainExplorer({
  active,
  onWorldEvent
}: {
  active:boolean;
  onWorldEvent:(event:WorldEvent)=>void;
}) {
  const [snapshot,setSnapshot]=useState<Snapshot|null>(null);
  const [error,setError]=useState<string|null>(null);

  useEffect(()=>{
    if(!active) return;
    let cancelled=false;
    void fetch("/api/chain-demo",{cache:"no-store"})
      .then(async response=>{
        if(!response.ok) throw new Error("OSA devnet snapshot failed");
        return response.json() as Promise<Snapshot>;
      })
      .then(data=>{
        if(cancelled) return;
        setSnapshot(data);
        onWorldEvent({
          id:"w_evt_"+Date.now().toString(36),
          type:"chain.snapshot.loaded",
          district:"chain",
          label:"OSA DEVNET / EXPLORER ONLINE",
          mode:"SIMULATED"
        });
      })
      .catch(cause=>{if(!cancelled)setError(cause instanceof Error?cause.message:String(cause));});
    return()=>{cancelled=true;};
  },[active,onWorldEvent]);

  if(!active) return null;

  return (
    <aside className="chain-terminal" aria-label="Explorer łańcucha OSA">
      <div className="chain-head">
        <div><span>CHAIN // OSA DEVNET</span><h2>L1 → L2 → L3</h2></div>
        <strong>SYMULOWANY DEVNET</strong>
      </div>

      {!snapshot ? (
        <div className="chain-loading">{error ?? "URUCHAMIANIE GENESIS..."}</div>
      ) : (
        <>
          <div className="chain-truth">{snapshot.truth}</div>
          <div className="layer-grid">
            {snapshot.genesis.layers.map(layer=>{
              const state=snapshot.explorer.layers[layer.layer];
              return (
                <section key={layer.layer}>
                  <span>{layer.layer}</span>
                  <strong>{layer.chainId}</strong>
                  <i>{layer.parentLayer ? "ROZLICZA → "+layer.parentLayer : "WARSTWA BAZOWA"}</i>
                  <div><b>WYSOKOŚĆ {state?.height ?? 0}</b><b>TX {state?.txCount ?? 0}</b></div>
                </section>
              );
            })}
          </div>

          <div className="chain-section-title">OSTATNIE BLOKI</div>
          <div className="block-stream">
            {snapshot.explorer.recentBlocks.map(block=>(
              <div key={block.blockHash}>
                <span>{block.layer} / #{block.height}</span>
                <code>{block.blockHash.slice(0,24)}…</code>
                <i>TX {block.transactions.length}</i>
              </div>
            ))}
          </div>

          <div className="chain-section-title">ANCHORY ROZLICZENIOWE</div>
          <div className="anchor-stream">
            {snapshot.explorer.anchors.map((anchor,index)=>(
              <div key={anchor.targetTxId+"-"+index}>
                <strong>{anchor.sourceLayer} → {anchor.targetLayer}</strong>
                <code>{anchor.sourceBlockHash.slice(0,18)}…</code>
                <i>{anchor.targetTxId}</i>
              </div>
            ))}
          </div>
        </>
      )}
    </aside>
  );
}
