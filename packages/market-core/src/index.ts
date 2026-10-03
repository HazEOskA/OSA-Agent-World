export type ListingKind="AGENT"|"SKILL"|"API"|"COMPUTE"|"DATA";

export interface MarketListing {
  listingId:string;
  kind:ListingKind;
  sellerId:string;
  title:string;
  capabilities:readonly string[];
  priceAsset:string;
  priceAmount:string;
  reputation:number;
  availability:"AVAILABLE"|"BUSY"|"OFFLINE";
  endpoint:string|null;
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

export const REFERENCE_MARKET:readonly MarketListing[]=[
  {listingId:"lst_agent_kai",kind:"AGENT",sellerId:"agt_kai_001",title:"KAI Security Audit",capabilities:["code.audit","repo.read","report.generate"],priceAsset:"OSA_USDC_TEST",priceAmount:"5",reputation:94,availability:"AVAILABLE",endpoint:"agent://kai"},
  {listingId:"lst_skill_dep",kind:"SKILL",sellerId:"osa:skills",title:"Dependency Risk Skill",capabilities:["dependency.inspect"],priceAsset:"OSA_USDC_TEST",priceAmount:"1",reputation:90,availability:"AVAILABLE",endpoint:"skill://dependency-risk"},
  {listingId:"lst_api_model",kind:"API",sellerId:"provider:model",title:"Reasoning Model API",capabilities:["model.reasoning"],priceAsset:"OSA_USDC_TEST",priceAmount:"0.25",reputation:88,availability:"AVAILABLE",endpoint:"https://example.invalid/model"},
  {listingId:"lst_compute_gpu",kind:"COMPUTE",sellerId:"provider:compute",title:"GPU Burst 1K",capabilities:["compute.gpu"],priceAsset:"OSA_USDC_TEST",priceAmount:"2",reputation:86,availability:"AVAILABLE",endpoint:"compute://gpu-burst"},
  {listingId:"lst_data_sec",kind:"DATA",sellerId:"provider:data",title:"Security Advisory Feed",capabilities:["data.security"],priceAsset:"OSA_USDC_TEST",priceAmount:"0.5",reputation:91,availability:"AVAILABLE",endpoint:"data://security-feed"}
] as const;

export function discoverServices(
  listings:readonly MarketListing[],
  query:DiscoveryQuery
):readonly DiscoveryResult[] {
  return listings
    .filter(listing=>
      listing.availability==="AVAILABLE" &&
      listing.capabilities.includes(query.capability) &&
      Number(listing.priceAmount)<=query.maxPrice &&
      (query.kind===undefined||listing.kind===query.kind)
    )
    .map(listing=>{
      const priceRatio=Math.max(0,1-Number(listing.priceAmount)/Math.max(query.maxPrice,0.000001));
      const score=Math.round(listing.reputation*0.75+priceRatio*25);
      return {listing,score,reasons:["CAPABILITY_MATCH","PRICE_WITHIN_LIMIT","REPUTATION_SIGNAL"]};
    })
    .sort((a,b)=>b.score-a.score);
}
