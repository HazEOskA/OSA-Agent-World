export type DefiMode = "SIMULATED" | "TESTNET";

export interface SimulatedPool {
  poolId: string;
  assetA: string;
  assetB: string;
  reserveA: number;
  reserveB: number;
  feeBps: number;
}

export interface SimulatedSwapQuote {
  quoteId: string;
  mode: "SIMULATED";
  assetIn: string;
  assetOut: string;
  amountIn: number;
  amountOut: number;
  minimumReceived: number;
  feeAmount: number;
  priceImpactBps: number;
}

export interface LiquidityPosition {
  positionId: string;
  mode: "SIMULATED";
  poolId: string;
  assetA: string;
  assetB: string;
  amountA: number;
  amountB: number;
  shareBps: number;
  status: "ACTIVE";
}

function stableId(prefix: string, value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `${prefix}_${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function quoteConstantProductSwap(
  pool: SimulatedPool,
  assetIn: string,
  amountIn: number,
  slippageBps = 50
): SimulatedSwapQuote {
  if (!Number.isFinite(amountIn) || amountIn <= 0) throw new Error("Swap amount must be positive");
  if (slippageBps < 0 || slippageBps > 5000) throw new Error("Invalid slippage");

  const inputIsA = assetIn === pool.assetA;
  if (!inputIsA && assetIn !== pool.assetB) throw new Error("Asset not in pool");

  const reserveIn = inputIsA ? pool.reserveA : pool.reserveB;
  const reserveOut = inputIsA ? pool.reserveB : pool.reserveA;
  const assetOut = inputIsA ? pool.assetB : pool.assetA;

  const feeMultiplier = (10_000 - pool.feeBps) / 10_000;
  const amountAfterFee = amountIn * feeMultiplier;
  const amountOut = (reserveOut * amountAfterFee) / (reserveIn + amountAfterFee);
  const midPrice = reserveOut / reserveIn;
  const executionPrice = amountOut / amountIn;
  const priceImpactBps = Math.max(0, Math.round((1 - executionPrice / midPrice) * 10_000));
  const minimumReceived = amountOut * (1 - slippageBps / 10_000);

  return {
    quoteId: stableId("simq", `${pool.poolId}:${assetIn}:${amountIn}:${slippageBps}`),
    mode: "SIMULATED",
    assetIn,
    assetOut,
    amountIn,
    amountOut,
    minimumReceived,
    feeAmount: amountIn - amountAfterFee,
    priceImpactBps
  };
}

export function createSimulatedLiquidityPosition(
  pool: SimulatedPool,
  amountA: number,
  amountB: number
): LiquidityPosition {
  if (amountA <= 0 || amountB <= 0) throw new Error("Liquidity amounts must be positive");

  const contributionA = amountA / pool.reserveA;
  const contributionB = amountB / pool.reserveB;
  const limitingContribution = Math.min(contributionA, contributionB);
  const shareBps = Math.max(1, Math.min(10_000, Math.round(limitingContribution * 10_000)));

  return {
    positionId: stableId("lpos", `${pool.poolId}:${amountA}:${amountB}`),
    mode: "SIMULATED",
    poolId: pool.poolId,
    assetA: pool.assetA,
    assetB: pool.assetB,
    amountA,
    amountB,
    shareBps,
    status: "ACTIVE"
  };
}

export const ALPHA_LIQUIDITY_POOL: SimulatedPool = {
  poolId: "pool_osa_usdc_alpha",
  assetA: "OSA_TEST",
  assetB: "USDC_TEST",
  reserveA: 1_250_000,
  reserveB: 625_000,
  feeBps: 30
};
