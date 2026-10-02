export type AdapterMode = "REAL" | "TESTNET" | "SIMULATED" | "FUTURE";

export type ProtocolStatus =
  | "IDLE"
  | "PENDING"
  | "CONFIRMED"
  | "FAILED"
  | "BLOCKED"
  | "APPROVAL_REQUIRED";

export interface ProtocolReceipt {
  operationId: string;
  mode: AdapterMode;
  status: ProtocolStatus;
  txId?: string;
  detail?: string;
}

export interface WalletIntent {
  actorId: string;
  chainId: string;
  action: string;
  asset?: string;
  amount?: string;
  destination?: string;
}

export interface WalletAdapter {
  readonly mode: AdapterMode;
  connect(): Promise<{ address: string; chainId: string }>;
  disconnect(): Promise<void>;
  signIntent(intent: WalletIntent): Promise<ProtocolReceipt>;
}

export interface SwapQuote {
  quoteId: string;
  chainId: string;
  assetIn: string;
  assetOut: string;
  amountIn: string;
  minAmountOut: string;
  fee: string;
  priceImpactBps: number;
}

export interface DexAdapter {
  readonly mode: AdapterMode;
  quote(input: Omit<SwapQuote, "quoteId" | "minAmountOut" | "fee" | "priceImpactBps">): Promise<SwapQuote>;
  execute(quote: SwapQuote): Promise<ProtocolReceipt>;
}

export interface BridgeRoute {
  routeId: string;
  sourceChainId: string;
  destinationChainId: string;
  asset: string;
  amount: string;
  estimatedSeconds: number;
  securityModel: string;
}

export interface BridgeAdapter {
  readonly mode: AdapterMode;
  route(input: Omit<BridgeRoute, "routeId" | "estimatedSeconds" | "securityModel">): Promise<BridgeRoute>;
  transfer(route: BridgeRoute): Promise<ProtocolReceipt>;
  status(operationId: string): Promise<ProtocolReceipt>;
}

export interface NodeSnapshot {
  nodeId: string;
  nodeType: "RPC" | "INDEXER" | "RELAYER" | "PROOF" | "AGENT" | "VALIDATOR" | "SEQUENCER";
  mode: AdapterMode;
  status: "ONLINE" | "DEGRADED" | "OFFLINE" | "SIMULATED";
  latencyMs?: number;
}

export interface NodeAdapter {
  list(): Promise<readonly NodeSnapshot[]>;
}
