import { describe, expect, it } from "vitest";
import {
  createOsaIdentity,
  initialTransactionLifecycle,
  reduceTransactionLifecycle,
  shortenAddress,
  type WalletConnection
} from "./index.js";

describe("wallet core", () => {
  it("enforces signature -> submitted -> confirmed ordering", () => {
    const awaiting = reduceTransactionLifecycle(initialTransactionLifecycle, {
      type: "REQUEST_SIGNATURE",
      walletKind: "EVM"
    });
    const submitted = reduceTransactionLifecycle(awaiting, {
      type: "SUBMITTED",
      txId: "0xabc"
    });
    const confirmed = reduceTransactionLifecycle(submitted, {
      type: "CONFIRMED",
      txId: "0xabc"
    });

    expect(confirmed.status).toBe("CONFIRMED");
    expect(confirmed.txId).toBe("0xabc");
  });

  it("rejects confirmation without submission", () => {
    expect(() =>
      reduceTransactionLifecycle(initialTransactionLifecycle, {
        type: "CONFIRMED",
        txId: "0xabc"
      })
    ).toThrow("only confirm after submission");
  });

  it("creates deterministic wallet-bound identity ids", () => {
    const wallet: WalletConnection = {
      kind: "EVM",
      address: "0xABCDEF",
      chainId: "11155111",
      network: "Ethereum Sepolia",
      nativeAsset: "ETH",
      balance: "0",
      mode: "TESTNET"
    };

    const identity = createOsaIdentity(wallet, new Date("2026-10-03T00:00:00.000Z"));
    expect(identity.identityId).toBe("osa:evm:0xabcdef");
    expect(shortenAddress("0x1234567890abcdef", 4)).toBe("0x12...cdef");
  });
});
