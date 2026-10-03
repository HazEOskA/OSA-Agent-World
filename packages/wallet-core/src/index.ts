export type WalletKind = "EVM" | "SOLANA";
export type WalletMode = "TESTNET" | "MAINNET";

export interface WalletConnection {
  kind: WalletKind;
  address: string;
  chainId: string;
  network: string;
  nativeAsset: string;
  balance: string;
  mode: WalletMode;
}

export interface OsaIdentity {
  identityId: string;
  primaryWallet: WalletConnection;
  createdAt: string;
}

export interface TestAssetDefinition {
  symbol: "ETH_TEST" | "SOL_TEST" | "OSA_TEST";
  network: string;
  backing: "NATIVE_TESTNET" | "SIMULATED";
}

export const TEST_ASSETS: readonly TestAssetDefinition[] = [
  { symbol: "ETH_TEST", network: "Ethereum Sepolia", backing: "NATIVE_TESTNET" },
  { symbol: "SOL_TEST", network: "Solana Devnet", backing: "NATIVE_TESTNET" },
  { symbol: "OSA_TEST", network: "OSA Alpha", backing: "SIMULATED" }
] as const;

export type TransactionStatus =
  | "IDLE"
  | "AWAITING_SIGNATURE"
  | "SUBMITTED"
  | "CONFIRMED"
  | "FAILED"
  | "BLOCKED";

export interface TransactionLifecycle {
  status: TransactionStatus;
  walletKind: WalletKind | null;
  txId: string | null;
  message: string | null;
}

export type TransactionEvent =
  | { type: "REQUEST_SIGNATURE"; walletKind: WalletKind }
  | { type: "SUBMITTED"; txId: string }
  | { type: "CONFIRMED"; txId: string }
  | { type: "FAILED"; message: string }
  | { type: "BLOCKED"; message: string }
  | { type: "RESET" };

export const initialTransactionLifecycle: TransactionLifecycle = {
  status: "IDLE",
  walletKind: null,
  txId: null,
  message: null
};

export function reduceTransactionLifecycle(
  state: TransactionLifecycle,
  event: TransactionEvent
): TransactionLifecycle {
  switch (event.type) {
    case "REQUEST_SIGNATURE":
      return {
        status: "AWAITING_SIGNATURE",
        walletKind: event.walletKind,
        txId: null,
        message: "Wallet approval required"
      };
    case "SUBMITTED":
      if (state.status !== "AWAITING_SIGNATURE") {
        throw new Error("Transaction can only be submitted after wallet approval");
      }
      return { ...state, status: "SUBMITTED", txId: event.txId, message: "Transaction submitted" };
    case "CONFIRMED":
      if (state.status !== "SUBMITTED") {
        throw new Error("Transaction can only confirm after submission");
      }
      return { ...state, status: "CONFIRMED", txId: event.txId, message: "Transaction confirmed" };
    case "FAILED":
      return { ...state, status: "FAILED", message: event.message };
    case "BLOCKED":
      return { ...state, status: "BLOCKED", message: event.message };
    case "RESET":
      return initialTransactionLifecycle;
  }
}

export function createOsaIdentity(wallet: WalletConnection, now = new Date()): OsaIdentity {
  const address = wallet.kind === "EVM" ? wallet.address.toLowerCase() : wallet.address;
  return {
    identityId: `osa:${wallet.kind.toLowerCase()}:${address}`,
    primaryWallet: wallet,
    createdAt: now.toISOString()
  };
}

export function shortenAddress(address: string, edge = 5): string {
  if (address.length <= edge * 2 + 3) return address;
  return `${address.slice(0, edge)}...${address.slice(-edge)}`;
}
