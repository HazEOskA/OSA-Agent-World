"use client";

import { useEffect,useState } from "react";
import type { WorldEvent } from "../lib/world";

interface MarketData {
  mode:"SIMULATED";
  truth:string;
  listings:Array<{
    listingId:string;kind:string;sellerId:string;title:string;capabilities:string[];
    priceAsset:string;priceAmount:string;reputation:number;availability:string;
  }>;
  discovery:Array<{listing:{listingId:string;title:string};score:number;reasons:string[]}>;
  payment:{decision:string;reasons:string[];intent:{intentId:string;amount:string;asset:string;sellerId:string}}|null;
}

export function MarketZone({
  active,
  onWorldEvent
}:{
  active:boolean;
  onWorldEvent:(event:WorldEvent)=>void;
}) {
  const [data,setData]=useState<MarketData|null>(null);
  const [error,setError]=useState<string|null>(null);

  useEffect(()=>{
    if(!active)return;
    let cancelled=false;
    void fetch("/api/market-demo",{cache:"no-store"})
      .then(async response=>{
        if(!response.ok)throw new Error("Snapshot rynku nie powiódł się");
        return response.json() as Promise<MarketData>;
      })
      .then(snapshot=>{
        if(cancelled)return;
        setData(snapshot);
        onWorldEvent({
          id:"w_evt_"+Date.now().toString(36),
          type:"market.snapshot.loaded",
          district:"market",
          label:"RYNEK AGENTÓW ONLINE",
          mode:"SIMULATED"
        });
      })
      .catch(cause=>{if(!cancelled)setError(cause instanceof Error?cause.message:String(cause));});
    return()=>{cancelled=true;};
  },[active,onWorldEvent]);

  if(!active)return null;

  return (
    <aside className="market-terminal" aria-label="Rynek agentów OSA">
      <div className="market-head">
        <div><span>RYNEK // EKONOMIA AGENTÓW</span><h2>USŁUGI / SKILLE / COMPUTE</h2></div>
        <strong>EKONOMIA SYMULOWANA</strong>
      </div>

      {!data ? <div className="market-loading">{error ?? "WYSZUKIWANIE USŁUG..."}</div> : (
        <>
          <div className="market-truth">{data.truth}</div>
          <div className="market-listings">
            {data.listings.map(listing=>(
              <section key={listing.listingId}>
                <div><span>{listing.kind}</span><i>REP {listing.reputation}</i></div>
                <strong>{listing.title}</strong>
                <code>{listing.capabilities.join(" / ")}</code>
                <footer><b>{listing.priceAmount} {listing.priceAsset}</b><em>{listing.availability}</em></footer>
              </section>
            ))}
          </div>

          <div className="market-discovery">
            <span>WYSZUKIWANIE USŁUG // dependency.inspect ≤ 2</span>
            <strong>{data.discovery[0]?.listing.title ?? "BRAK DOPASOWANIA"}</strong>
            <i>SCORE {data.discovery[0]?.score ?? 0}</i>
          </div>

          <div className="market-payment">
            <span>INTENCJA PŁATNOŚCI AGENT → AGENT</span>
            <strong>{data.payment?.decision ?? "BRAK INTENCJI"}</strong>
            <code>{data.payment?.intent.intentId ?? "NONE"}</code>
            <i>{data.payment ? data.payment.intent.amount+" "+data.payment.intent.asset+" → "+data.payment.intent.sellerId : "BRAK TRASY"}</i>
          </div>
        </>
      )}
    </aside>
  );
}
