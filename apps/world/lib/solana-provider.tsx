"use client";

import { ClientProvider, useClient } from "@solana/react";
import { useMemo, type ReactNode } from "react";
import {
  createSolanaDevnetClient,
  type SolanaDevnetClient
} from "@osa/chain-solana";

export function SolanaProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => createSolanaDevnetClient(), []);
  return <ClientProvider client={client}>{children}</ClientProvider>;
}

export function useSolanaClient(): SolanaDevnetClient {
  return useClient<SolanaDevnetClient>();
}
