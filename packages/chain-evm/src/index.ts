import { createPublicClient, formatEther, http, type Address, type Hash } from "viem";
import { sepolia } from "viem/chains";
import type { WalletConnection } from "@osa/wallet-core";

export const EVM_TESTNET = {
  chainId: sepolia.id,
  chainHex: "0xaa36a7",
  name: "Ethereum Sepolia",
  nativeAsset: "ETH",
  explorerBaseUrl: "https://sepolia.etherscan.io"
} as const;

interface Eip1193Request {
  method: string;
  params?: readonly unknown[] | object;
}

interface Eip1193Provider {
  request(request: Eip1193Request): Promise<unknown>;
}

function providerFromWindow(): Eip1193Provider {
  if (typeof window === "undefined") {
    throw new Error("EVM wallet is only available in the browser");
  }

  const candidate = (window as unknown as { ethereum?: Eip1193Provider }).ethereum;
  if (!candidate) throw new Error("No injected EVM wallet detected");
  return candidate;
}

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http()
});

async function ensureSepolia(provider: Eip1193Provider): Promise<void> {
  const chainId = await provider.request({ method: "eth_chainId" });
  if (chainId === EVM_TESTNET.chainHex) return;

  await provider.request({
    method: "wallet_switchEthereumChain",
    params: [{ chainId: EVM_TESTNET.chainHex }]
  });
}

export async function connectEvmTestnet(): Promise<WalletConnection> {
  const provider = providerFromWindow();
  await ensureSepolia(provider);

  const accounts = await provider.request({ method: "eth_requestAccounts" });
  if (!Array.isArray(accounts) || typeof accounts[0] !== "string") {
    throw new Error("EVM wallet returned no account");
  }

  const address = accounts[0] as Address;
  const balance = await publicClient.getBalance({ address });

  return {
    kind: "EVM",
    address,
    chainId: String(EVM_TESTNET.chainId),
    network: EVM_TESTNET.name,
    nativeAsset: EVM_TESTNET.nativeAsset,
    balance: formatEther(balance),
    mode: "TESTNET"
  };
}

export async function sendEvmSelfTestTransaction(
  address: string,
  hooks?: {
    onSubmitted?: (hash: string) => void;
  }
): Promise<Hash> {
  const provider = providerFromWindow();
  await ensureSepolia(provider);

  const hash = await provider.request({
    method: "eth_sendTransaction",
    params: [
      {
        from: address,
        to: address,
        value: "0x0"
      }
    ]
  });

  if (typeof hash !== "string" || !hash.startsWith("0x")) {
    throw new Error("EVM wallet returned an invalid transaction hash");
  }

  hooks?.onSubmitted?.(hash);
  await publicClient.waitForTransactionReceipt({ hash: hash as Hash });
  return hash as Hash;
}
