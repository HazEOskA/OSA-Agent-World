import { NextResponse } from "next/server";
import { KAI_AGENT } from "@osa/agent-core";
import {
  discoverServices,
  type ListingKind,
  type MarketListingRecord
} from "@osa/market-core";
import { KAI_WALLET_POLICY } from "@osa/wallet-policy";
import { authorizeAgentPayment,createAgentPaymentIntent } from "@osa/agent-payment-service";
import {
  heartbeatMarketListing,
  MarketRegistryUnavailableError,
  readMarketRegistry,
  upsertMarketListing
} from "../../../lib/market-registry";

export const runtime="nodejs";
export const dynamic="force-dynamic";

const LISTING_KINDS=new Set<ListingKind>(["AGENT","SKILL","API","COMPUTE","DATA"]);
const ID_PATTERN=/^[A-Za-z0-9:_-]{3,96}$/;
const CAPABILITY_PATTERN=/^[A-Za-z0-9._:-]{1,80}$/;

function unavailable(cause:unknown){
  const reason=cause instanceof Error?cause.message:String(cause);
  return NextResponse.json({
    mode:"UNAVAILABLE",
    registry:{status:"UNAVAILABLE",persistence:"NOT_CONFIGURED",reason},
    listings:[],
    discovery:[],
    payment:null,
    truth:"BRAK TRWAŁEGO REGISTRY — BRAK FALLBACKU DO DANYCH DEMO"
  },{status:503});
}

function adminAuth(request:Request):{ok:true}|{ok:false;response:NextResponse} {
  const expected=process.env.MARKET_REGISTRY_ADMIN_TOKEN?.trim();
  if(!expected){
    return {
      ok:false,
      response:NextResponse.json(
        {error:"REGISTRY_ADMIN_NOT_CONFIGURED",message:"MARKET_REGISTRY_ADMIN_TOKEN nie jest ustawiony"},
        {status:503}
      )
    };
  }
  if(request.headers.get("authorization")!==`Bearer ${expected}`){
    return {ok:false,response:NextResponse.json({error:"UNAUTHORIZED"},{status:401})};
  }
  return {ok:true};
}

function asText(value:unknown,name:string,max:number):string {
  if(typeof value!=="string")throw new Error(`${name} musi być tekstem`);
  const normalized=value.trim();
  if(!normalized||normalized.length>max)throw new Error(`${name} ma nieprawidłową długość`);
  return normalized;
}

function validateListing(input:unknown):MarketListingRecord {
  if(!input||typeof input!=="object")throw new Error("listing musi być obiektem");
  const data=input as Record<string,unknown>;
  const listingId=asText(data.listingId,"listingId",96);
  const sellerId=asText(data.sellerId,"sellerId",96);
  if(!ID_PATTERN.test(listingId)||!ID_PATTERN.test(sellerId))throw new Error("listingId/sellerId zawiera niedozwolone znaki");

  const kind=asText(data.kind,"kind",16) as ListingKind;
  if(!LISTING_KINDS.has(kind))throw new Error("Nieobsługiwany kind");

  if(!Array.isArray(data.capabilities)||data.capabilities.length<1||data.capabilities.length>32){
    throw new Error("capabilities musi zawierać 1-32 elementów");
  }
  const capabilities=data.capabilities.map((value,index)=>{
    const capability=asText(value,`capabilities[${index}]`,80);
    if(!CAPABILITY_PATTERN.test(capability))throw new Error("Nieprawidłowa capability");
    return capability;
  });

  const priceAmount=asText(data.priceAmount,"priceAmount",32);
  const numericPrice=Number(priceAmount);
  if(!Number.isFinite(numericPrice)||numericPrice<0||numericPrice>1_000_000_000){
    throw new Error("Nieprawidłowa cena");
  }

  const reputation=Number(data.reputation);
  if(!Number.isFinite(reputation)||reputation<0||reputation>100)throw new Error("reputation musi być 0-100");

  const endpoint=asText(data.endpoint,"endpoint",2048);
  let parsed:URL;
  try{parsed=new URL(endpoint);}catch{throw new Error("endpoint musi być poprawnym URL");}
  if(parsed.protocol!=="https:")throw new Error("Real Market V1 akceptuje wyłącznie endpointy HTTPS");

  return {
    listingId,
    kind,
    sellerId,
    title:asText(data.title,"title",120),
    capabilities,
    priceAsset:asText(data.priceAsset,"priceAsset",48),
    priceAmount,
    reputation:Math.round(reputation),
    endpoint:parsed.toString(),
    registeredAt:new Date().toISOString(),
    lastSeenAt:null
  };
}

export async function GET(request:Request) {
  try{
    const snapshot=await readMarketRegistry();
    const url=new URL(request.url);
    const capability=url.searchParams.get("capability")?.trim()||null;
    const kindRaw=url.searchParams.get("kind")?.trim()||null;
    const maxPriceRaw=url.searchParams.get("maxPrice");
    const maxPrice=maxPriceRaw===null?null:Number(maxPriceRaw);
    const kind=kindRaw&&LISTING_KINDS.has(kindRaw as ListingKind)?kindRaw as ListingKind:undefined;

    const discovery=capability&&maxPrice!==null&&Number.isFinite(maxPrice)&&maxPrice>=0
      ? discoverServices(snapshot.listings,{capability,maxPrice,kind})
      : [];
    const selected=discovery[0]?.listing??null;
    const payment=selected
      ? authorizeAgentPayment(KAI_WALLET_POLICY,createAgentPaymentIntent(KAI_AGENT.agentId,selected))
      : null;

    return NextResponse.json({
      mode:"LIVE",
      registry:{
        status:snapshot.status,
        persistence:snapshot.persistence,
        updatedAt:snapshot.updatedAt,
        listingCount:snapshot.listings.length
      },
      listings:snapshot.listings,
      discovery,
      payment,
      truth:"TRWAŁY REGISTRY; STATUS LIVE WYNIKA Z HEARTBEATU; BRAK DANYCH DEMO"
    });
  }catch(cause){
    if(cause instanceof MarketRegistryUnavailableError)return unavailable(cause);
    throw cause;
  }
}

export async function POST(request:Request) {
  const auth=adminAuth(request);
  if(!auth.ok)return auth.response;

  let body:unknown;
  try{body=await request.json();}catch{
    return NextResponse.json({error:"INVALID_JSON"},{status:400});
  }
  if(!body||typeof body!=="object")return NextResponse.json({error:"INVALID_BODY"},{status:400});
  const input=body as Record<string,unknown>;

  try{
    if(input.action==="upsert"){
      const listing=validateListing(input.listing);
      const snapshot=await upsertMarketListing(listing);
      return NextResponse.json({
        ok:true,
        action:"upsert",
        listing:snapshot.listings.find(item=>item.listingId===listing.listingId)??null,
        registry:{status:snapshot.status,updatedAt:snapshot.updatedAt,listingCount:snapshot.listings.length}
      });
    }

    if(input.action==="heartbeat"){
      const listingId=asText(input.listingId,"listingId",96);
      if(!ID_PATTERN.test(listingId))throw new Error("Nieprawidłowy listingId");
      const snapshot=await heartbeatMarketListing(listingId);
      return NextResponse.json({
        ok:true,
        action:"heartbeat",
        listing:snapshot.listings.find(item=>item.listingId===listingId)??null,
        registry:{status:snapshot.status,updatedAt:snapshot.updatedAt,listingCount:snapshot.listings.length}
      });
    }

    return NextResponse.json({error:"UNKNOWN_ACTION"},{status:400});
  }catch(cause){
    if(cause instanceof MarketRegistryUnavailableError)return unavailable(cause);
    if(cause instanceof Error&&cause.message==="MARKET_LISTING_NOT_FOUND"){
      return NextResponse.json({error:"LISTING_NOT_FOUND"},{status:404});
    }
    return NextResponse.json(
      {error:"INVALID_MARKET_OPERATION",message:cause instanceof Error?cause.message:String(cause)},
      {status:400}
    );
  }
}
