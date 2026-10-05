export type ListingKind="AGENT"|"SKILL"|"API"|"COMPUTE"|"DATA";
export type MarketAvailability="LIVE"|"OFFLINE"|"UNKNOWN";

export interface MarketListingRecord {
  listingId:string;
  kind:ListingKind;
  sellerId:string;
  title:string;
  capabilities:readonly string[];
  priceAsset:string;
  priceAmount:string;
  reputation:number;
  endpoint:string;
  registeredAt:string;
  lastSeenAt:string|null;
}

export interface MarketListing extends MarketListingRecord {
  availability:MarketAvailability;
}

export interface DiscoveryQuery {
  capability:string;
  maxPrice:number;
  kind?:ListingKind;
}

export interface DiscoveryResult {
  listing:MarketListing;
  score:number;
  reasons:readonly string[];
}

export const DEFAULT_MARKET_HEARTBEAT_TTL_MS=90_000;

export function deriveMarketAvailability(
  lastSeenAt:string|null,
  now=new Date(),
  ttlMs=DEFAULT_MARKET_HEARTBEAT_TTL_MS
):MarketAvailability {
  if(!lastSeenAt)return "UNKNOWN";
  const seenAt=new Date(lastSeenAt);
  if(Number.isNaN(seenAt.getTime()))return "UNKNOWN";
  const ageMs=now.getTime()-seenAt.getTime();
  if(ageMs<0)return "UNKNOWN";
  return ageMs<=ttlMs?"LIVE":"OFFLINE";
}

export function materializeMarketListing(
  record:MarketListingRecord,
  now=new Date(),
  ttlMs=DEFAULT_MARKET_HEARTBEAT_TTL_MS
):MarketListing {
  return {
    ...record,
    availability:deriveMarketAvailability(record.lastSeenAt,now,ttlMs)
  };
}

export function discoverServices(
  listings:readonly MarketListing[],
  query:DiscoveryQuery
):readonly DiscoveryResult[] {
  return listings
    .filter(listing=>
      listing.availability==="LIVE" &&
      listing.capabilities.includes(query.capability) &&
      Number.isFinite(Number(listing.priceAmount)) &&
      Number(listing.priceAmount)<=query.maxPrice &&
      (query.kind===undefined||listing.kind===query.kind)
    )
    .map(listing=>{
      const priceRatio=Math.max(0,1-Number(listing.priceAmount)/Math.max(query.maxPrice,0.000001));
      const score=Math.round(listing.reputation*0.75+priceRatio*25);
      return {listing,score,reasons:["CAPABILITY_MATCH","PRICE_WITHIN_LIMIT","REPUTATION_SIGNAL","HEARTBEAT_LIVE"]};
    })
    .sort((a,b)=>b.score-a.score);
}
