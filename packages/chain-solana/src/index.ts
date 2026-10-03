import { createClient } from "@solana/kit";
import { solanaRpc } from "@solana/kit-plugin-rpc";
import { walletSigner } from "@solana/kit-plugin-wallet";
import { systemProgram } from "@solana-program/system";

export const SOLANA_DEVNET = {
  chain: "solana:devnet" as const,
  name: "Solana Devnet",
  rpcUrl: "https://api.devnet.solana.com",
  rpcSubscriptionsUrl: "wss://api.devnet.solana.com",
  nativeAsset: "SOL",
  explorerBaseUrl: "https://explorer.solana.com"
} as const;

export function createSolanaDevnetClient() {
  return createClient()
    .use(walletSigner({ chain: SOLANA_DEVNET.chain }))
    .use(
      solanaRpc({
        rpcUrl: SOLANA_DEVNET.rpcUrl,
        rpcSubscriptionsUrl: SOLANA_DEVNET.rpcSubscriptionsUrl
      })
    )
    .use(systemProgram());
}

export type SolanaDevnetClient = ReturnType<typeof createSolanaDevnetClient>;

export async function getSolanaDevnetBalance(address: string): Promise<string> {
  const response = await fetch(SOLANA_DEVNET.rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getBalance",
      params: [address, { commitment: "confirmed" }]
    })
  });

  if (!response.ok) throw new Error("Solana RPC balance request failed");
  const payload = (await response.json()) as {
    result?: { value?: number };
    error?: { message?: string };
  };

  if (payload.error?.message) throw new Error(payload.error.message);
  const lamports = payload.result?.value;
  if (typeof lamports !== "number") throw new Error("Solana RPC returned no balance");
  return (lamports / 1_000_000_000).toFixed(9).replace(/0+$/, "").replace(/\.$/, "");
}

export async function waitForSolanaConfirmation(
  signature: string,
  maxAttempts = 24
): Promise<void> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const response = await fetch(SOLANA_DEVNET.rpcUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getSignatureStatuses",
        params: [[signature], { searchTransactionHistory: true }]
      })
    });

    if (!response.ok) throw new Error("Solana RPC confirmation request failed");
    const payload = (await response.json()) as {
      result?: {
        value?: Array<
          | {
              err: unknown;
              confirmationStatus?: "processed" | "confirmed" | "finalized" | null;
            }
          | null
        >;
      };
      error?: { message?: string };
    };

    if (payload.error?.message) throw new Error(payload.error.message);
    const status = payload.result?.value?.[0];

    if (status?.err) throw new Error("Solana transaction failed");
    if (status?.confirmationStatus === "confirmed" || status?.confirmationStatus === "finalized") return;

    await new Promise((resolve) => setTimeout(resolve, 750));
  }

  throw new Error("Solana transaction confirmation timed out");
}
