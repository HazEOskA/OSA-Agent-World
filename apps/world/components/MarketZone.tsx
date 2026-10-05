"use client";

import { useEffect,useState } from "react";
import type { WorldEvent } from "../lib/world";

type MarketMode="LIVE"|"UNAVAILABLE";

interface MarketData {
  mode:MarketMode;
  truth:string;
  registry:{
    status:"LIVE"|"UNAVAILABLE";
    persistence:string;
    reason?:string;
    updatedAt?:string;
    listingCount?:number;
  };
  listings:Array<{
    listingId:string;
    kind:string;
    sellerId:string;
    title:string;
    capabilities:string[];
    priceAsset:string;
    priceAmount:string;
    reputation:number;
    availability:"LIVE"|"OFFLINE"|"UNKNOWN";
    endpoint:string;
    lastSeenAt:string|null;
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
    setError(null);
    void fetch("/api/market?capability=dependency.inspect&maxPrice=2",{cache:"no-store"})
      .then(async response=>{
        const payload=await response.json() as MarketData;
        if(response.status!==503&&!response.ok)throw new Error("Odczyt Real Market nie powiódł się");
        return payload;
      })
      .then(snapshot=>{
        if(cancelled)return;
        setData(snapshot);
        onWorldEvent({
          id:"w_evt_"+Date.now().toString(36),
          type:"market.snapshot.loaded",
          district:"market",
          label:snapshot.mode==="LIVE"?"MARKET REGISTRY LIVE":"MARKET REGISTRY UNAVAILABLE",
          mode:"REAL"
        });
      })
      .catch(cause=>{if(!cancelled)setError(cause instanceof Error?cause.message:String(cause));});
    return()=>{cancelled=true;};
  },[active,onWorldEvent]);

  if(!active)return null;

  return (
    <aside className="market-terminal" aria-label="Real Market OSA">
      <div className="market-head">
        <div><span>RYNEK // REAL MARKET V1</span><h2>AGENTY / USŁUGI / API / COMPUTE / DATA</h2></div>
        <strong>{data?.mode==="LIVE"?"REGISTRY LIVE":"REGISTRY UNAVAILABLE"}</strong>
      </div>

      {!data ? <div className="market-loading">{error??"ODCZYT TRWAŁEGO REGISTRY..."}</div> : data.mode==="UNAVAILABLE" ? (
        <>
          <div className="market-truth">{data.truth}</div>
          <div className="market-loading">
            <strong>BRAK TRWAŁEGO STORE</strong><br/>
            {data.registry.reason??"Market Registry nie jest skonfigurowany."}<br/>
            Nie pokazuję żadnych listingów zastępczych ani danych demo.
          </div>
        </>
      ) : (
        <>
          <div className="market-truth">
            {data.truth} · {data.registry.listingCount??data.listings.length} LISTINGÓW · {data.registry.persistence}
          </div>

          {data.listings.length===0 ? (
            <div className="market-loading">
              <strong>REGISTRY DZIAŁA / 0 LISTINGÓW</strong><br/>
              Pierwszy realny agent lub serwis musi zostać zarejestrowany i wysłać heartbeat.
            </div>
          ) : (
            <div className="market-listings">
              {data.listings.map(listing=>(
                <section key={listing.listingId}>
                  <div><span>{listing.kind}</span><i>REP {listing.reputation}</i></div>
                  <strong>{listing.title}</strong>
                  <code>{listing.capabilities.join(" / ")}</code>
                  <code>{listing.endpoint}</code>
                  <footer>
                    <b>{listing.priceAmount} {listing.priceAsset}</b>
                    <em>{listing.availability}</em>
                  </footer>
                </section>
              ))}
            </div>
          )}

          <div className="market-discovery">
            <span>DISCOVERY // dependency.inspect ≤ 2 // TYLKO LIVE</span>
            <strong>{data.discovery[0]?.listing.title??"BRAK DOPASOWANIA"}</strong>
            <i>SCORE {data.discovery[0]?.score??0}</i>
          </div>

          <div className="market-payment">
            <span>POLITYKA PŁATNOŚCI // INTENCJA AGENT → USŁUGA</span>
            <strong>{data.payment?.decision??"BRAK INTENCJI"}</strong>
            <code>{data.payment?.intent.intentId??"NONE"}</code>
            <i>{data.payment?data.payment.intent.amount+" "+data.payment.intent.asset+" → "+data.payment.intent.sellerId:"BRAK LIVE ROUTE"}</i>
          </div>
        </>
      )}
    </aside>
  );
}
