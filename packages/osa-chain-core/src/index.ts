export type OsaLayer = "L1" | "L2" | "L3_AGENT" | "L3_DEFI";

export interface OsaGenesisAllocation {
  address: string;
  asset: string;
  amount: string;
}

export interface OsaLayerGenesis {
  layer: OsaLayer;
  chainId: string;
  gasAsset: string;
  parentLayer: OsaLayer | null;
}

export interface OsaGenesisConfig {
  network: "OSA_DEVNET";
  protocolVersion: string;
  timestamp: string;
  layers: readonly OsaLayerGenesis[];
  allocations: readonly OsaGenesisAllocation[];
}

export interface OsaTransaction {
  txId: string;
  layer: OsaLayer;
  from: string;
  to: string;
  asset: string;
  amount: string;
  nonce: number;
  data: Readonly<Record<string, string | number | boolean>>;
}

export interface OsaBlock {
  layer: OsaLayer;
  chainId: string;
  height: number;
  parentHash: string;
  blockHash: string;
  stateRoot: string;
  timestamp: string;
  transactions: readonly OsaTransaction[];
}

export interface OsaExplorerSnapshot {
  network: "OSA_DEVNET";
  layers: Readonly<Record<OsaLayer, {
    chainId: string;
    height: number;
    latestBlockHash: string;
    txCount: number;
  }>>;
  recentBlocks: readonly OsaBlock[];
  anchors: readonly {
    sourceLayer: OsaLayer;
    sourceBlockHash: string;
    targetLayer: OsaLayer;
    targetTxId: string;
  }[];
}

export interface OsaChainRuntime {
  readonly genesis: OsaGenesisConfig;
  submit(transaction: OsaTransaction): void;
  produceBlock(layer: OsaLayer): OsaBlock;
  anchorBlock(sourceLayer: OsaLayer, targetLayer: OsaLayer): OsaTransaction;
  explorer(): OsaExplorerSnapshot;
}
