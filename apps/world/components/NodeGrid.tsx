"use client";

import { useEffect,useState } from "react";
import type { WorldEvent } from "../lib/world";

interface NetworkSnapshot {
  mode:"SIMULATED";
  truth:string;
  topology:{
    nodes:Array<{nodeId:string;type:string;layer:string;status:string;latencyMs:number;endpoint:string|null}>;
    edges:Array<{from:string;to:string;channel:string}>;
  };
  finality:{validators:number;approvals:number;required:number;finalized:boolean}|null;
  rpc:{chainId:{result?:unknown};blockNumber:{result?:unknown}};
  index:{entities:number};
  relayer:{status:string;relayId:string};
}

export function NodeGrid({
  active,
  onWorldEvent
}:{
  active:boolean;
  onWorldEvent:(event:WorldEvent)=>void;
}) {
  const [data,setData]=useState<NetworkSnapshot|null>(null);
  const [error,setError]=useState<string|null>(null);

  useEffect(()=>{
    if(!active)return;
    let cancelled=false;
    void fetch("/api/network-demo",{cache:"no-store"})
      .then(async response=>{
        if(!response.ok)throw new Error("Snapshot sieci nie powiódł się");
        return response.json() as Promise<NetworkSnapshot>;
      })
      .then(snapshot=>{
        if(cancelled)return;
        setData(snapshot);
        onWorldEvent({
          id:"w_evt_"+Date.now().toString(36),
          type:"network.snapshot.loaded",
          district:"nodes",
          label:"TOPOLOGIA WĘZŁÓW ZSYNCHRONIZOWANA",
          mode:"SIMULATED"
        });
      })
      .catch(cause=>{if(!cancelled)setError(cause instanceof Error?cause.message:String(cause));});
    return()=>{cancelled=true;};
  },[active,onWorldEvent]);

  if(!active)return null;

  return (
    <aside className="node-terminal" aria-label="Topologia infrastruktury OSA">
      <div className="node-head">
        <div><span>INFRA // TOPOLOGIA SIECI</span><h2>SIATKA INFRASTRUKTURY</h2></div>
        <strong>SIEĆ SYMULOWANA</strong>
      </div>

      {!data ? <div className="node-loading">{error ?? "SYNCHRONIZACJA WĘZŁÓW..."}</div> : (
        <>
          <div className="node-truth">{data.truth}</div>
          <div className="node-summary">
            <div><span>RPC / CHAIN</span><strong>{String(data.rpc.chainId.result)}</strong></div>
            <div><span>WYSOKOŚĆ L1</span><strong>{String(data.rpc.blockNumber.result)}</strong></div>
            <div><span>ZAINDEKSOWANE</span><strong>{data.index.entities}</strong></div>
            <div><span>RELAYER</span><strong>{data.relayer.status}</strong></div>
          </div>

          <div className="node-map">
            {data.topology.nodes.map((node,index)=>(
              <div className="node-orb" key={node.nodeId} style={{"--node-index":index} as React.CSSProperties}>
                <span>{node.type}</span>
                <strong>{node.nodeId}</strong>
                <i>{node.layer} / {node.latencyMs}ms</i>
                <b>{node.status}</b>
              </div>
            ))}
          </div>

          <div className="finality-panel">
            <span>FINALNOŚĆ WALIDATORÓW</span>
            <strong>{data.finality?.finalized ? "FINALNE" : "NOT FINALNE"}</strong>
            <i>{data.finality ? data.finality.approvals+"/"+data.finality.required+" zatwierdzeń" : "BRAK BLOKU"}</i>
          </div>

          <div className="topology-links">
            {data.topology.edges.map((edge,index)=>(
              <code key={edge.from+"-"+edge.to+"-"+index}>{edge.from} —[{edge.channel}]→ {edge.to}</code>
            ))}
          </div>
        </>
      )}
    </aside>
  );
}
