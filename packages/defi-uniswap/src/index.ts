import {
  createPublicClient,
  decodeFunctionResult,
  encodeFunctionData,
  formatUnits,
  http,
  parseAbi,
  parseEther,
  type Address,
  type Hex
} from "viem";
import { sepolia } from "viem/chains";
import { EVM_TESTNET } from "@osa/chain-evm";

export const UNISWAP_SEPOLIA = {
  factory: "0x0227628f3F023bb0B980b67D528571c95c6DaC1c" as Address,
  quoterV2: "0xEd1f6473345F45b75F8179591dd5bA1888cf2FB3" as Address,
  swapRouter02: "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E" as Address,
  weth9: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14" as Address,
  usdc: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" as Address
} as const;

export const UNISWAP_FEE_TIERS = [100, 500, 3000, 10_000] as const;

const FACTORY_ABI = parseAbi([
  "function getPool(address tokenA,address tokenB,uint24 fee) view returns (address pool)"
]);

const QUOTER_ABI = parseAbi([
  "function quoteExactInputSingle((address tokenIn,address tokenOut,uint256 amountIn,uint24 fee,uint160 sqrtPriceLimitX96) params) returns (uint256 amountOut,uint160 sqrtPriceX96After,uint32 initializedTicksCrossed,uint256 gasEstimate)"
]);

const SWAP_ROUTER_ABI = parseAbi([
  "function exactInputSingle((address tokenIn,address tokenOut,uint24 fee,address recipient,uint256 amountIn,uint256 amountOutMinimum,uint160 sqrtPriceLimitX96) params) payable returns (uint256 amountOut)"
]);

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http()
});

interface Eip1193Provider {
  request(input: { method: string; params?: readonly unknown[] | object }): Promise<unknown>;
}

function providerFromWindow(): Eip1193Provider {
  if (typeof window === "undefined") throw new Error("Browser wallet required");
  const provider = (window as unknown as { ethereum?: Eip1193Provider }).ethereum;
  if (!provider) throw new Error("No injected EVM wallet detected");
  return provider;
}

export interface UniswapSepoliaQuote {
  mode: "TESTNET";
  protocol: "UNISWAP_V3";
  pool: Address;
  fee: number;
  tokenIn: Address;
  tokenOut: Address;
  amountInWei: bigint;
  amountOut: bigint;
  amountOutFormatted: string;
  minimumOut: bigint;
  minimumOutFormatted: string;
  slippageBps: number;
  gasEstimate: bigint;
}

async function findPool(): Promise<{ pool: Address; fee: number }> {
  for (const fee of UNISWAP_FEE_TIERS) {
    const pool = await publicClient.readContract({
      address: UNISWAP_SEPOLIA.factory,
      abi: FACTORY_ABI,
      functionName: "getPool",
      args: [UNISWAP_SEPOLIA.weth9, UNISWAP_SEPOLIA.usdc, fee]
    });

    if (pool !== "0x0000000000000000000000000000000000000000") {
      return { pool, fee };
    }
  }

  throw new Error("No WETH/USDC Uniswap V3 pool found on Sepolia");
}

export async function quoteSepoliaEthToUsdc(
  amountEth: string,
  slippageBps = 50
): Promise<UniswapSepoliaQuote> {
  const amountInWei = parseEther(amountEth);
  if (amountInWei <= 0n) throw new Error("Amount must be positive");
  if (slippageBps < 0 || slippageBps > 5000) throw new Error("Invalid slippage");

  const { pool, fee } = await findPool();
  const data = encodeFunctionData({
    abi: QUOTER_ABI,
    functionName: "quoteExactInputSingle",
    args: [
      {
        tokenIn: UNISWAP_SEPOLIA.weth9,
        tokenOut: UNISWAP_SEPOLIA.usdc,
        amountIn: amountInWei,
        fee,
        sqrtPriceLimitX96: 0n
      }
    ]
  });

  const call = await publicClient.call({
    to: UNISWAP_SEPOLIA.quoterV2,
    data
  });

  if (!call.data) throw new Error("Uniswap quote returned no data");

  const [amountOut, , , gasEstimate] = decodeFunctionResult({
    abi: QUOTER_ABI,
    functionName: "quoteExactInputSingle",
    data: call.data
  });

  const minimumOut = (amountOut * BigInt(10_000 - slippageBps)) / 10_000n;

  return {
    mode: "TESTNET",
    protocol: "UNISWAP_V3",
    pool,
    fee,
    tokenIn: UNISWAP_SEPOLIA.weth9,
    tokenOut: UNISWAP_SEPOLIA.usdc,
    amountInWei,
    amountOut,
    amountOutFormatted: formatUnits(amountOut, 6),
    minimumOut,
    minimumOutFormatted: formatUnits(minimumOut, 6),
    slippageBps,
    gasEstimate
  };
}

export async function executeSepoliaEthToUsdc(
  recipient: Address,
  quote: UniswapSepoliaQuote,
  hooks?: { onSubmitted?: (hash: string) => void }
): Promise<Hex> {
  const provider = providerFromWindow();
  const chainId = await provider.request({ method: "eth_chainId" });
  if (chainId !== EVM_TESTNET.chainHex) {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: EVM_TESTNET.chainHex }]
    });
  }

  const data = encodeFunctionData({
    abi: SWAP_ROUTER_ABI,
    functionName: "exactInputSingle",
    args: [
      {
        tokenIn: quote.tokenIn,
        tokenOut: quote.tokenOut,
        fee: quote.fee,
        recipient,
        amountIn: quote.amountInWei,
        amountOutMinimum: quote.minimumOut,
        sqrtPriceLimitX96: 0n
      }
    ]
  });

  const hash = await provider.request({
    method: "eth_sendTransaction",
    params: [
      {
        from: recipient,
        to: UNISWAP_SEPOLIA.swapRouter02,
        data,
        value: `0x${quote.amountInWei.toString(16)}`
      }
    ]
  });

  if (typeof hash !== "string" || !hash.startsWith("0x")) {
    throw new Error("Wallet returned an invalid swap transaction hash");
  }

  hooks?.onSubmitted?.(hash);
  await publicClient.waitForTransactionReceipt({ hash: hash as Hex });
  return hash as Hex;
}
