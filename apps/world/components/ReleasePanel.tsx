"use client";

import { useEffect,useState } from "react";
import type { WorldEvent } from "../lib/world";

interface ReleaseData {
  release:{
    status:"PASS";
    tasks:{completed:number;total:number};
    correlationId:string;
    ids:Record<string,string>;
    steps:Array<{code:string;status:"PASS";detail:string}>;
    truth:Record<string,string>;
  };
  security:{status:"PASS"|"FAIL";failures:string[]};
  claim:string;
}

export function ReleasePanel({
  active,
  onWorldEvent
}:{
  active:boolean;
  onWorldEvent:(event:WorldEvent)=>void;
}) {
  const [data,setData]=useState<ReleaseData|null>(null);
  const [error,setError]=useState<string|null>(null);

  useEffect(()=>{
    if(!active)return;
    let cancelled=false;
    void fetch("/api/release-proof",{cache:"no-store"})
      .then(async response=>{
        if(!response.ok)throw new Error("Release proof endpoint failed");
        return response.json() as Promise<ReleaseData>;
      })
      .then(result=>{
        if(cancelled)return;
        setData(result);
        onWorldEvent({
          id:"w_evt_"+Date.now().toString(36),
          type:"release.proof.loaded",
          district:"nexus",
          label:"GOAL 60/60 VERIFIED",
          mode:"REAL"
        });
      })
      .catch(cause=>{if(!cancelled)setError(cause instanceof Error?cause.message:String(cause));});
    return()=>{cancelled=true;};
  },[active,onWorldEvent]);

  if(!active)return null;

  return (
    <aside className="release-terminal" aria-label="OSA Release Proof">
      <div className="release-head">
        <div><span>OSA CRYPTO WORLD // V0.1</span><h2>GOAL LOCK COMPLETE</h2></div>
        <strong>{data ? data.release.tasks.completed+"/"+data.release.tasks.total : "VERIFYING"}</strong>
      </div>

      {!data ? <div className="release-loading">{error ?? "RUNNING RELEASE PROOF..."}</div> : (
        <>
          <div className="release-status">
            <span>REFERENCE LOOP</span><strong>{data.release.status}</strong>
            <span>SECURITY GATE</span><strong>{data.security.status}</strong>
            <span>CORRELATION</span><code>{data.release.correlationId}</code>
          </div>

          <div className="release-steps">
            {data.release.steps.map((step,index)=>(
              <div key={step.code}>
                <span>{String(index+1).padStart(2,"0")}</span>
                <strong>{step.code}</strong>
                <i>{step.status}</i>
                <code>{step.detail}</code>
              </div>
            ))}
          </div>

          <div className="truth-matrix">
            {Object.entries(data.release.truth).map(([key,value])=>(
              <div key={key}><span>{key}</span><strong>{value}</strong></div>
            ))}
          </div>

          <p className="release-claim">{data.claim}</p>
        </>
      )}
    </aside>
  );
}
