/** Symulacja AMM w jednostkach całkowitych. Nie przechowuje ani nie przenosi aktywów. */
export interface CocoPool {
  readonly reserveA: bigint;
  readonly reserveB: bigint;
  readonly totalLp: bigint;
  readonly feeBps: number;
}

export interface CocoQuote {
  readonly mode: "SIMULATED";
  readonly amountIn: bigint;
  readonly amountOut: bigint;
  readonly minimumOut: bigint;
  readonly feeBps: number;
}

const BPS = 10_000n;
const LOCKED_LP = 1_000n;

function validatePool(pool: CocoPool): void {
  if (pool.reserveA <= 0n || pool.reserveB <= 0n || pool.totalLp <= 0n) throw new Error("Nieprawidłowa pula");
  if (!Number.isInteger(pool.feeBps) || pool.feeBps < 0 || pool.feeBps >= 10_000) throw new Error("Nieprawidłowa opłata");
}

function sqrt(n: bigint): bigint {
  if (n < 2n) return n;
  let x = n;
  let y = (x + 1n) / 2n;
  while (y < x) { x = y; y = (x + n / x) / 2n; }
  return x;
}

export function createCocoPool(amountA: bigint, amountB: bigint, feeBps = 30): { pool: CocoPool; mintedLp: bigint; lockedLp: bigint } {
  if (amountA <= 0n || amountB <= 0n) throw new Error("Kwoty muszą być dodatnie");
  const totalLp = sqrt(amountA * amountB);
  if (totalLp <= LOCKED_LP) throw new Error("Za mała początkowa płynność");
  const pool = { reserveA: amountA, reserveB: amountB, totalLp, feeBps };
  validatePool(pool);
  return { pool, mintedLp: totalLp - LOCKED_LP, lockedLp: LOCKED_LP };
}

export function quoteCocoSwap(pool: CocoPool, direction: "A_TO_B" | "B_TO_A", amountIn: bigint, slippageBps: number): CocoQuote {
  validatePool(pool);
  if (direction !== "A_TO_B" && direction !== "B_TO_A") throw new Error("Nieprawidłowy kierunek");
  if (amountIn <= 0n) throw new Error("Kwota musi być dodatnia");
  if (!Number.isInteger(slippageBps) || slippageBps < 0 || slippageBps > 10_000) throw new Error("Nieprawidłowy poślizg");
  const [reserveIn, reserveOut] = direction === "A_TO_B" ? [pool.reserveA, pool.reserveB] : [pool.reserveB, pool.reserveA];
  const effective = amountIn * (BPS - BigInt(pool.feeBps));
  const amountOut = reserveOut * effective / (reserveIn * BPS + effective);
  if (amountOut <= 0n) throw new Error("Kwota wyjściowa jest za mała");
  return { mode: "SIMULATED", amountIn, amountOut, minimumOut: amountOut * (BPS - BigInt(slippageBps)) / BPS, feeBps: pool.feeBps };
}

export function executeCocoSwap(pool: CocoPool, direction: "A_TO_B" | "B_TO_A", amountIn: bigint, minimumOut: bigint): { pool: CocoPool; amountOut: bigint; event: { mode: "SIMULATED"; kind: "SWAP_SIMULATION" } } {
  if (minimumOut < 0n) throw new Error("Nieprawidłowe minimum");
  const quote = quoteCocoSwap(pool, direction, amountIn, 0);
  if (quote.amountOut < minimumOut) throw new Error("Przekroczony limit poślizgu");
  const next = direction === "A_TO_B"
    ? { ...pool, reserveA: pool.reserveA + amountIn, reserveB: pool.reserveB - quote.amountOut }
    : { ...pool, reserveA: pool.reserveA - quote.amountOut, reserveB: pool.reserveB + amountIn };
  return { pool: next, amountOut: quote.amountOut, event: { mode: "SIMULATED", kind: "SWAP_SIMULATION" } };
}

export function addCocoLiquidity(pool: CocoPool, maxA: bigint, maxB: bigint, minimumLp: bigint): { pool: CocoPool; usedA: bigint; usedB: bigint; mintedLp: bigint } {
  validatePool(pool);
  if (maxA <= 0n || maxB <= 0n || minimumLp < 0n) throw new Error("Nieprawidłowe kwoty");
  const lpA = maxA * pool.totalLp / pool.reserveA;
  const lpB = maxB * pool.totalLp / pool.reserveB;
  const mintedLp = lpA < lpB ? lpA : lpB;
  if (mintedLp <= 0n || mintedLp < minimumLp) throw new Error("Nieosiągnięte minimum LP");
  // Zaokrąglenie w górę chroni istniejących dostawców płynności.
  const usedA = (mintedLp * pool.reserveA + pool.totalLp - 1n) / pool.totalLp;
  const usedB = (mintedLp * pool.reserveB + pool.totalLp - 1n) / pool.totalLp;
  return { pool: { ...pool, reserveA: pool.reserveA + usedA, reserveB: pool.reserveB + usedB, totalLp: pool.totalLp + mintedLp }, usedA, usedB, mintedLp };
}

export function removeCocoLiquidity(pool: CocoPool, liquidity: bigint, minimumA: bigint, minimumB: bigint): { pool: CocoPool; amountA: bigint; amountB: bigint } {
  validatePool(pool);
  if (liquidity <= 0n || liquidity > pool.totalLp - LOCKED_LP || minimumA < 0n || minimumB < 0n) throw new Error("Nieprawidłowa płynność");
  const amountA = liquidity * pool.reserveA / pool.totalLp;
  const amountB = liquidity * pool.reserveB / pool.totalLp;
  if (amountA <= 0n || amountB <= 0n || amountA < minimumA || amountB < minimumB) throw new Error("Nieosiągnięte minimum wypłaty");
  return { pool: { ...pool, reserveA: pool.reserveA - amountA, reserveB: pool.reserveB - amountB, totalLp: pool.totalLp - liquidity }, amountA, amountB };
}
