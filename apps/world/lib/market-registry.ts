import {
  materializeMarketListing,
  type MarketListing,
  type MarketListingRecord
} from "@osa/market-core";

const REGISTRY_PATH="agentsworld/market-v1.json";
const BLOB_API_URL="https://vercel.com/api/blob/";
const BLOB_API_VERSION="12";

export interface MarketRegistryDocument {
  version:1;
  updatedAt:string;
  listings:MarketListingRecord[];
}

export interface MarketRegistrySnapshot {
  status:"LIVE";
  persistence:"VERCEL_BLOB";
  updatedAt:string;
  listings:MarketListing[];
}

export class MarketRegistryUnavailableError extends Error {
  constructor(message:string){
    super(message);
    this.name="MarketRegistryUnavailableError";
  }
}

interface BlobAuth {
  token:string;
  storeId:string;
}

interface StoredDocument {
  document:MarketRegistryDocument;
  etag:string|null;
}

function readEnv(name:string):string|undefined {
  const value=process.env[name];
  return typeof value==="string"&&value.trim()?value.trim():undefined;
}

function normalizeStoreId(value:string):string {
  return value.startsWith("store_")?value.slice("store_".length):value;
}

function resolveBlobAuth():BlobAuth {
  const readWrite=readEnv("BLOB_READ_WRITE_TOKEN");
  if(readWrite){
    const parts=readWrite.split("_");
    const storeId=parts[3];
    if(!storeId)throw new MarketRegistryUnavailableError("BLOB_READ_WRITE_TOKEN nie zawiera store id");
    return {token:readWrite,storeId:normalizeStoreId(storeId)};
  }

  const oidc=readEnv("VERCEL_OIDC_TOKEN");
  const storeId=readEnv("BLOB_STORE_ID");
  if(oidc&&storeId)return {token:oidc,storeId:normalizeStoreId(storeId)};

  throw new MarketRegistryUnavailableError(
    "Brak trwałego store: wymagany BLOB_READ_WRITE_TOKEN albo VERCEL_OIDC_TOKEN + BLOB_STORE_ID"
  );
}

function emptyDocument():MarketRegistryDocument {
  return {version:1,updatedAt:new Date(0).toISOString(),listings:[]};
}

function validateDocument(value:unknown):MarketRegistryDocument {
  if(!value||typeof value!=="object")throw new MarketRegistryUnavailableError("Nieprawidłowy dokument registry");
  const candidate=value as Partial<MarketRegistryDocument>;
  if(candidate.version!==1||!Array.isArray(candidate.listings)||typeof candidate.updatedAt!=="string"){
    throw new MarketRegistryUnavailableError("Nieobsługiwana wersja dokumentu registry");
  }
  return {
    version:1,
    updatedAt:candidate.updatedAt,
    listings:candidate.listings as MarketListingRecord[]
  };
}

async function readDocument():Promise<StoredDocument> {
  const auth=resolveBlobAuth();
  const url=new URL(`https://${auth.storeId}.private.blob.vercel-storage.com/${REGISTRY_PATH}`);
  url.searchParams.set("cache","0");

  let response:Response;
  try{
    response=await fetch(url,{headers:{authorization:`Bearer ${auth.token}`},cache:"no-store"});
  }catch(cause){
    throw new MarketRegistryUnavailableError(
      `Nie można odczytać registry: ${cause instanceof Error?cause.message:String(cause)}`
    );
  }

  if(response.status===404)return {document:emptyDocument(),etag:null};
  if(!response.ok)throw new MarketRegistryUnavailableError(`Blob read HTTP ${response.status}`);

  let payload:unknown;
  try{
    payload=await response.json();
  }catch{
    throw new MarketRegistryUnavailableError("Registry nie zawiera poprawnego JSON");
  }

  return {
    document:validateDocument(payload),
    etag:response.headers.get("etag")
  };
}

async function writeDocument(document:MarketRegistryDocument,expectedEtag:string|null):Promise<void> {
  const auth=resolveBlobAuth();
  const url=new URL(BLOB_API_URL);
  url.searchParams.set("pathname",REGISTRY_PATH);

  const headers:Record<string,string>={
    authorization:`Bearer ${auth.token}`,
    "content-type":"application/json",
    "x-api-version":BLOB_API_VERSION,
    "x-api-blob-request-id":`${auth.storeId}:${Date.now()}:${crypto.randomUUID()}`,
    "x-api-blob-request-attempt":"0",
    "x-vercel-blob-store-id":auth.storeId,
    "x-vercel-blob-access":"private",
    "x-add-random-suffix":"0",
    "x-allow-overwrite":"1",
    "x-content-type":"application/json"
  };
  if(expectedEtag)headers["x-if-match"]=expectedEtag;

  let response:Response;
  try{
    response=await fetch(url,{
      method:"PUT",
      headers,
      body:JSON.stringify(document),
      cache:"no-store"
    });
  }catch(cause){
    throw new MarketRegistryUnavailableError(
      `Nie można zapisać registry: ${cause instanceof Error?cause.message:String(cause)}`
    );
  }

  if(response.status===412)throw new Error("MARKET_REGISTRY_CONFLICT");
  if(!response.ok){
    let detail="";
    try{detail=await response.text();}catch{}
    throw new MarketRegistryUnavailableError(
      `Blob write HTTP ${response.status}${detail?`: ${detail.slice(0,180)}`:""}`
    );
  }
}

async function mutate(
  update:(listings:MarketListingRecord[])=>MarketListingRecord[]
):Promise<MarketRegistrySnapshot> {
  for(let attempt=0;attempt<2;attempt+=1){
    const current=await readDocument();
    const next:MarketRegistryDocument={
      version:1,
      updatedAt:new Date().toISOString(),
      listings:update([...current.document.listings])
    };
    try{
      await writeDocument(next,current.etag);
      return {
        status:"LIVE",
        persistence:"VERCEL_BLOB",
        updatedAt:next.updatedAt,
        listings:next.listings.map(item=>materializeMarketListing(item))
      };
    }catch(cause){
      if(cause instanceof Error&&cause.message==="MARKET_REGISTRY_CONFLICT"&&attempt===0)continue;
      throw cause;
    }
  }
  throw new MarketRegistryUnavailableError("Nie udało się zapisać registry po konflikcie wersji");
}

export async function readMarketRegistry():Promise<MarketRegistrySnapshot> {
  const current=await readDocument();
  return {
    status:"LIVE",
    persistence:"VERCEL_BLOB",
    updatedAt:current.document.updatedAt,
    listings:current.document.listings.map(item=>materializeMarketListing(item))
  };
}

export async function upsertMarketListing(record:MarketListingRecord):Promise<MarketRegistrySnapshot> {
  return mutate(listings=>{
    const index=listings.findIndex(item=>item.listingId===record.listingId);
    if(index===-1)return [...listings,record];
    const existing=listings[index]!;
    const next=[...listings];
    next[index]={
      ...record,
      registeredAt:existing.registeredAt,
      lastSeenAt:record.lastSeenAt??existing.lastSeenAt
    };
    return next;
  });
}

export async function heartbeatMarketListing(listingId:string):Promise<MarketRegistrySnapshot> {
  return mutate(listings=>{
    const index=listings.findIndex(item=>item.listingId===listingId);
    if(index===-1)throw new Error("MARKET_LISTING_NOT_FOUND");
    const next=[...listings];
    next[index]={...next[index]!,lastSeenAt:new Date().toISOString()};
    return next;
  });
}
