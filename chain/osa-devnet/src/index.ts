import { createHash } from "node:crypto";
import type {
  OsaBlock,
  OsaChainRuntime,
  OsaExplorerSnapshot,
  OsaGenesisConfig,
  OsaLayer,
  OsaTransaction
} from "@osa/osa-chain-core";

export const OSA_DEVNET_GENESIS: OsaGenesisConfig = {
  network: "OSA_DEVNET",
  protocolVersion: "0.1.0",
  timestamp: "2026-10-03T00:00:00.000Z",
  layers: [
    { layer:"L1",chainId:"osa-l1-devnet-91001",gasAsset:"OSA_GAS_TEST",parentLayer:null },
    { layer:"L2",chainId:"osa-l2-economy-91002",gasAsset:"OSA_GAS_TEST",parentLayer:"L1" },
    { layer:"L3_AGENT",chainId:"osa-l3-agent-91003",gasAsset:"OSA_GAS_TEST",parentLayer:"L2" },
    { layer:"L3_DEFI",chainId:"osa-l3-defi-91004",gasAsset:"OSA_GAS_TEST",parentLayer:"L2" }
  ],
  allocations: [
    { address:"osa:treasury",asset:"OSA_GAS_TEST",amount:"1000000" },
    { address:"osa:agent:kai",asset:"OSA_GAS_TEST",amount:"1000" }
  ]
};

function digest(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

interface LayerState {
  height: number;
  lastHash: string;
  mempool: OsaTransaction[];
  blocks: OsaBlock[];
  txCount: number;
}

export class OsaDevnet implements OsaChainRuntime {
  readonly genesis: OsaGenesisConfig;
  #layers = new Map<OsaLayer, LayerState>();
  #anchors: OsaExplorerSnapshot["anchors"] = [];

  constructor(genesis: OsaGenesisConfig = OSA_DEVNET_GENESIS) {
    this.genesis = genesis;
    for (const layer of genesis.layers) {
      this.#layers.set(layer.layer, {
        height: 0,
        lastHash: digest({ genesis: genesis.network, layer: layer.layer, chainId: layer.chainId }),
        mempool: [],
        blocks: [],
        txCount: 0
      });
    }
  }

  submit(transaction: OsaTransaction): void {
    const state = this.#state(transaction.layer);
    if (!transaction.txId.startsWith("otx_")) throw new Error("Invalid OSA transaction id");
    if (Number(transaction.amount) < 0) throw new Error("Negative amount");
    state.mempool.push(transaction);
  }

  produceBlock(layer: OsaLayer): OsaBlock {
    const state = this.#state(layer);
    const config = this.#layerConfig(layer);
    const transactions = [...state.mempool];
    const height = state.height + 1;
    const stateRoot = digest({
      previous: state.lastHash,
      transactions,
      genesis: this.genesis.protocolVersion
    });
    const timestamp = new Date(Date.parse(this.genesis.timestamp) + height * 1000).toISOString();
    const blockHash = digest({
      layer,
      chainId: config.chainId,
      height,
      parentHash: state.lastHash,
      stateRoot,
      timestamp
    });
    const block: OsaBlock = {
      layer,
      chainId: config.chainId,
      height,
      parentHash: state.lastHash,
      blockHash,
      stateRoot,
      timestamp,
      transactions
    };

    state.height = height;
    state.lastHash = blockHash;
    state.mempool = [];
    state.blocks.push(block);
    state.txCount += transactions.length;
    return block;
  }

  anchorBlock(sourceLayer: OsaLayer, targetLayer: OsaLayer): OsaTransaction {
    const source = this.#state(sourceLayer);
    const latest = source.blocks.at(-1);
    if (!latest) throw new Error("Source layer has no block to anchor");

    const expectedParent = this.#layerConfig(sourceLayer).parentLayer;
    if (expectedParent !== targetLayer) {
      throw new Error(`Invalid settlement route: ${sourceLayer} -> ${targetLayer}`);
    }

    const tx: OsaTransaction = {
      txId: `otx_anchor_${latest.blockHash.slice(0, 16)}`,
      layer: targetLayer,
      from: `system:${sourceLayer}`,
      to: `system:${targetLayer}:settlement`,
      asset: "OSA_GAS_TEST",
      amount: "0",
      nonce: latest.height,
      data: {
        kind: "LAYER_ANCHOR",
        sourceLayer,
        sourceBlockHash: latest.blockHash,
        sourceHeight: latest.height
      }
    };

    this.submit(tx);
    this.#anchors = [
      ...this.#anchors,
      {
        sourceLayer,
        sourceBlockHash: latest.blockHash,
        targetLayer,
        targetTxId: tx.txId
      }
    ];
    return tx;
  }

  explorer(): OsaExplorerSnapshot {
    const layers = {} as OsaExplorerSnapshot["layers"];
    const allBlocks: OsaBlock[] = [];

    for (const layer of this.genesis.layers) {
      const state = this.#state(layer.layer);
      layers[layer.layer] = {
        chainId: layer.chainId,
        height: state.height,
        latestBlockHash: state.lastHash,
        txCount: state.txCount
      };
      allBlocks.push(...state.blocks);
    }

    return {
      network: "OSA_DEVNET",
      layers,
      recentBlocks: allBlocks.sort((a,b)=>b.timestamp.localeCompare(a.timestamp)).slice(0,12),
      anchors: this.#anchors
    };
  }

  #state(layer: OsaLayer): LayerState {
    const state = this.#layers.get(layer);
    if (!state) throw new Error(`Unknown OSA layer: ${layer}`);
    return state;
  }

  #layerConfig(layer: OsaLayer) {
    const config = this.genesis.layers.find((candidate)=>candidate.layer===layer);
    if (!config) throw new Error(`Missing genesis layer: ${layer}`);
    return config;
  }
}

export function buildReferenceDevnet(): OsaDevnet {
  const devnet = new OsaDevnet();
  devnet.submit({
    txId:"otx_agent_mission_001",
    layer:"L3_AGENT",
    from:"osa:user",
    to:"osa:agent:kai",
    asset:"OSA_USDC_TEST",
    amount:"5",
    nonce:1,
    data:{kind:"MISSION_REWARD",missionId:"mis_kai_alpha_001"}
  });
  devnet.produceBlock("L3_AGENT");
  devnet.anchorBlock("L3_AGENT","L2");
  devnet.produceBlock("L2");
  devnet.anchorBlock("L2","L1");
  devnet.produceBlock("L1");

  devnet.submit({
    txId:"otx_defi_swap_001",
    layer:"L3_DEFI",
    from:"osa:user",
    to:"osa:defi:swap",
    asset:"OSA_TEST",
    amount:"25",
    nonce:1,
    data:{kind:"SWAP_SIMULATION"}
  });
  devnet.produceBlock("L3_DEFI");
  devnet.anchorBlock("L3_DEFI","L2");
  devnet.produceBlock("L2");
  devnet.anchorBlock("L2","L1");
  devnet.produceBlock("L1");
  return devnet;
}
