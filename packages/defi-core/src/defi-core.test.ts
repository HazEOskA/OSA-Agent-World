import { describe, expect, it } from "vitest";
import {
  ALPHA_LIQUIDITY_POOL,
  createSimulatedLiquidityPosition,
  quoteConstantProductSwap
} from "./index.js";

describe("defi core", () => {
  it("preserves constant product quote direction and slippage floor", () => {
    const quote = quoteConstantProductSwap(ALPHA_LIQUIDITY_POOL, "OSA_TEST", 1000, 50);
    expect(quote.mode).toBe("SIMULATED");
    expect(quote.assetOut).toBe("USDC_TEST");
    expect(quote.amountOut).toBeGreaterThan(0);
    expect(quote.minimumReceived).toBeLessThan(quote.amountOut);
    expect(quote.priceImpactBps).toBeGreaterThanOrEqual(0);
  });

  it("creates a deterministic simulated liquidity position", () => {
    const position = createSimulatedLiquidityPosition(ALPHA_LIQUIDITY_POOL, 1000, 500);
    expect(position.positionId).toMatch(/^lpos_/);
    expect(position.mode).toBe("SIMULATED");
    expect(position.shareBps).toBeGreaterThan(0);
  });
});
