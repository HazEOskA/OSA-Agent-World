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
        if(!response.ok)throw new Error("Network snapshot failed");
        return response.json() as Promise<NetworkSnapshot>;
      })
      .then(snapshot=>{
        if(cancelled)return;
        setData(snapshot);
        onWorldEvent({
          id:"w_evt_"+Date.now().toString(36),
          type:"network.snapshot.loaded",
          district:"nodes",
          label:"NODE GRID SYNCHRONIZED",
          mode:"SIMULATED"
        });
      })
      .catch(cause=>{if(!cancelled)setError(cause instanceof Error?cause.message:String(cause));});
    return()=>{cancelled=true;};
  },[active,onWorldEvent]);

  if(!active)return null;

  return (
    <aside className="node-terminal" aria-label="OSA Node Grid">
      <div className="node-head">
        <div><span>NODE GRID // NETWORK TOPOLOGY</span><h2>INFRASTRUCTURE MESH</h2></div>
        <strong>SIMULATED NETWORK</strong>
      </div>

      {!data ? <div className="node-loading">{error ?? "SYNCHRONIZING NODES..."}</div> : (
        <>
          <div className="node-truth">{data.truth}</div>
          <div className="node-summary">
            <div><span>RPC CHAIN</span><strong>{String(data.rpc.chainId.result)}</strong></div>
            <div><span>L1 HEIGHT</span><strong>{String(data.rpc.blockNumber.result)}</strong></div>
            <div><span>INDEXED</span><strong>{data.index.entities}</strong></div>
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
            <span>VALIDATOR FINALITY</span>
            <strong>{data.finality?.finalized ? "FINALIZED" : "NOT FINALIZED"}</strong>
            <i>{data.finality ? data.finality.approvals+"/"+data.finality.required+" approvals" : "NO BLOCK"}</i>
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
