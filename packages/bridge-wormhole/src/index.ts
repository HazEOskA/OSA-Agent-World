import {
  TokenTransfer,
  Wormhole,
  amount,
  wormhole,
  type SignAndSendSigner,
  type TxHash,
  type UnsignedTransaction
} from "@wormhole-foundation/sdk";
import evm from "@wormhole-foundation/sdk/evm";
import {
  BrowserProvider,
  type Eip1193Provider,
  type TransactionRequest
} from "ethers";
import {
  appendBridgeTrace,
  createBridgeTrace,
  type BridgeRoute,
  type BridgeTrace
} from "@osa/bridge-core";

export type OsaBridgeEvmChain = "ArbitrumSepolia" | "BaseSepolia";

export const OSA_WORMHOLE_TESTNET = {
  source: {
    chain: "ArbitrumSepolia" as const,
    chainIdHex: "0x66eee",
    chainId: 421614,
    name: "Arbitrum Sepolia",
    rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
    explorerUrl: "https://sepolia.arbiscan.io"
  },
  destination: {
    chain: "BaseSepolia" as const,
    chainIdHex: "0x14a34",
    chainId: 84532,
    name: "Base Sepolia",
    rpcUrl: "https://sepolia.base.org",
    explorerUrl: "https://sepolia.basescan.org"
  }
} as const;

interface SwitchableEip1193Provider extends Eip1193Provider {
  request(input: { method: string; params?: readonly unknown[] | object }): Promise<unknown>;
}

function injectedProvider(): SwitchableEip1193Provider {
  if (typeof window === "undefined") throw new Error("Browser wallet required");
  const provider = (window as unknown as { ethereum?: SwitchableEip1193Provider }).ethereum;
  if (!provider) throw new Error("No injected EVM wallet detected");
  return provider;
}

function configFor(chain: OsaBridgeEvmChain) {
  return chain === "ArbitrumSepolia"
    ? OSA_WORMHOLE_TESTNET.source
    : OSA_WORMHOLE_TESTNET.destination;
}

async function ensureWalletChain(
  provider: SwitchableEip1193Provider,
  chain: OsaBridgeEvmChain
): Promise<void> {
  const config = configFor(chain);
  const current = await provider.request({ method: "eth_chainId" });
  if (current === config.chainIdHex) return;

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: config.chainIdHex }]
    });
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? Number((error as { code: unknown }).code)
        : null;

    if (code !== 4902) throw error;

    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: config.chainIdHex,
          chainName: config.name,
          nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
          rpcUrls: [config.rpcUrl],
          blockExplorerUrls: [config.explorerUrl]
        }
      ]
    });
  }
}

async function browserWormholeSigner<C extends OsaBridgeEvmChain>(
  chain: C
): Promise<SignAndSendSigner<"Testnet", C>> {
  const injected = injectedProvider();
  await ensureWalletChain(injected, chain);

  const provider = new BrowserProvider(injected);
  const signer = await provider.getSigner();
  const signerAddress = await signer.getAddress();

  return {
    chain: () => chain,
    address: () => signerAddress,
    signAndSend: async (
      txs: UnsignedTransaction<"Testnet", C>[]
    ): Promise<TxHash[]> => {
      const txids: TxHash[] = [];

      for (const tx of txs) {
        const sent = await signer.sendTransaction(tx.transaction as TransactionRequest);
        await sent.wait();
        txids.push(sent.hash);
      }

      return txids;
    }
  };
}

async function wormholeTestnet() {
  return wormhole("Testnet", [evm]);
}

export interface WormholeTestnetQuote {
  route: BridgeRoute;
  destinationAmount: string;
  sourceToken: string;
  destinationToken: string;
}

export async function quoteWormholeTestnetTransfer(
  amountText: string,
  recipient: string
): Promise<WormholeTestnetQuote> {
  const wh = await wormholeTestnet();
  const source = wh.getChain(OSA_WORMHOLE_TESTNET.source.chain);
  const destination = wh.getChain(OSA_WORMHOLE_TESTNET.destination.chain);

  const token = await source.getNativeWrappedTokenId();
  const decimals = Number(await wh.getDecimals(token.chain, token.address));
  const transferAmount = amount.units(amount.parse(amountText, decimals));

  const from = Wormhole.chainAddress(source.chain, recipient);
  const to = Wormhole.chainAddress(destination.chain, recipient);

  const transfer = await wh.tokenTransfer(
    token,
    transferAmount,
    from,
    to,
    false
  );

  const quote = await TokenTransfer.quoteTransfer(
    wh,
    source,
    destination,
    transfer.transfer
  );

  const destinationToken = Wormhole.canonicalAddress(quote.destinationToken.token);
  const sourceToken = Wormhole.canonicalAddress(quote.sourceToken.token);

  const destinationDecimals = Number(
    await wh.getDecimals(quote.destinationToken.token.chain, quote.destinationToken.token.address)
  );
  const destinationDisplay = amount.display(
    amount.fromBaseUnits(quote.destinationToken.amount, destinationDecimals)
  );

  return {
    route: {
      routeId: `wtt_${source.chain.toLowerCase()}_${destination.chain.toLowerCase()}`,
      mode: "TESTNET",
      protocol: "WORMHOLE_WTT",
      sourceChain: source.chain,
      destinationChain: destination.chain,
      asset: sourceToken,
      amount: amountText,
      recipient,
      estimatedSeconds: 90,
      securityModel: "Wormhole Token Bridge / Guardian attestation"
    },
    destinationAmount: destinationDisplay,
    sourceToken,
    destinationToken
  };
}

export async function executeWormholeTestnetTransfer(
  amountText: string,
  recipient: string,
  onTrace?: (trace: BridgeTrace) => void
): Promise<BridgeTrace> {
  const quoted = await quoteWormholeTestnetTransfer(amountText, recipient);
  let trace = createBridgeTrace(quoted.route);
  onTrace?.(trace);

  try {
    const wh = await wormholeTestnet();
    const source = wh.getChain(OSA_WORMHOLE_TESTNET.source.chain);
    const destination = wh.getChain(OSA_WORMHOLE_TESTNET.destination.chain);
    const token = await source.getNativeWrappedTokenId();
    const decimals = Number(await wh.getDecimals(token.chain, token.address));
    const transferAmount = amount.units(amount.parse(amountText, decimals));
    const from = Wormhole.chainAddress(source.chain, recipient);
    const to = Wormhole.chainAddress(destination.chain, recipient);

    const transfer = await wh.tokenTransfer(
      token,
      transferAmount,
      from,
      to,
      false
    );

    const sourceSigner = await browserWormholeSigner("ArbitrumSepolia");
    trace = appendBridgeTrace(trace, {
      stage: "SOURCE_SUBMITTED",
      mode: "TESTNET",
      label: "SOURCE WALLET APPROVED"
    });
    onTrace?.(trace);

    const sourceTxids = await transfer.initiateTransfer(sourceSigner);
    const sourceTx = sourceTxids.at(-1);
    trace = appendBridgeTrace(trace, {
      stage: "SOURCE_CONFIRMED",
      mode: "TESTNET",
      label: "ARBITRUM SEPOLIA FINALIZED",
      ...(sourceTx ? { txId: sourceTx } : {})
    });
    onTrace?.(trace);

    trace = appendBridgeTrace(trace, {
      stage: "ATTESTING",
      mode: "TESTNET",
      label: "WAITING FOR WORMHOLE VAA"
    });
    onTrace?.(trace);

    await transfer.fetchAttestation(180_000);
    trace = appendBridgeTrace(trace, {
      stage: "ATTESTED",
      mode: "TESTNET",
      label: "GUARDIAN ATTESTATION READY"
    });
    onTrace?.(trace);

    const destinationSigner = await browserWormholeSigner("BaseSepolia");
    trace = appendBridgeTrace(trace, {
      stage: "DESTINATION_SUBMITTED",
      mode: "TESTNET",
      label: "BASE SEPOLIA REDEEM APPROVED"
    });
    onTrace?.(trace);

    const destinationTxids = await transfer.completeTransfer(destinationSigner);
    const destinationTx = destinationTxids.at(-1);

    trace = appendBridgeTrace(trace, {
      stage: "COMPLETED",
      mode: "TESTNET",
      label: "WORMHOLE TRANSFER COMPLETE",
      ...(destinationTx ? { txId: destinationTx } : {})
    });
    onTrace?.(trace);

    return trace;
  } catch (error) {
    const label = error instanceof Error ? error.message : String(error);
    trace = appendBridgeTrace(trace, {
      stage: "FAILED",
      mode: "TESTNET",
      label
    });
    onTrace?.(trace);
    throw error;
  }
}
