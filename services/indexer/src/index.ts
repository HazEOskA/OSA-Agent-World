import type { OsaExplorerSnapshot } from "@osa/osa-chain-core";

export interface IndexedEntity {
  kind:"BLOCK"|"TRANSACTION"|"ANCHOR";
  id:string;
  layer:string;
  data:unknown;
}

export function indexSnapshot(snapshot:OsaExplorerSnapshot):readonly IndexedEntity[] {
  const entities:IndexedEntity[]=[];
  for(const block of snapshot.recentBlocks){
    entities.push({kind:"BLOCK",id:block.blockHash,layer:block.layer,data:block});
    for(const tx of block.transactions){
      entities.push({kind:"TRANSACTION",id:tx.txId,layer:tx.layer,data:tx});
    }
  }
  for(const anchor of snapshot.anchors){
    entities.push({kind:"ANCHOR",id:anchor.targetTxId,layer:anchor.targetLayer,data:anchor});
  }
  return entities;
}

export function searchIndex(index:readonly IndexedEntity[],query:string):readonly IndexedEntity[] {
  const normalized=query.toLowerCase();
  return index.filter(entity=>entity.id.toLowerCase().includes(normalized)||entity.layer.toLowerCase().includes(normalized));
}
