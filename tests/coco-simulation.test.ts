import { describe, expect, it } from "vitest";
import { createCocoPool, executeCocoSwap, quoteCocoSwap, removeCocoLiquidity } from "../packages/defi-core/src/coco.js";
import { runCocoSimulation } from "../apps/world/lib/coco-simulation.js";
import { POST } from "../apps/world/app/api/coco-simulation/route.js";

const toWire = (pool: ReturnType<typeof createCocoPool>["pool"]) => ({
  reserveA: pool.reserveA.toString(),
  reserveB: pool.reserveB.toString(),
  totalLp: pool.totalLp.toString(),
  feeBps: pool.feeBps
});

describe("Coco Swap — symulacja i ślad L3", () => {
  const pool = createCocoPool(100_000n * 10n ** 18n, 100_000n * 10n ** 6n).pool;

  it("wykonuje swap z limitem i zapisuje zdarzenie w modelu L3_DEFI", () => {
    const amount = 1000n * 10n ** 18n;
    const quote = quoteCocoSwap(pool, "A_TO_B", amount, 50);
    expect(quote.amountOut).toBe(987_158034n);
    const result = runCocoSimulation({
      action: "swap",
      pool: toWire(pool),
      ownedLp: "0",
      direction: "A_TO_B",
      amountIn: amount.toString(),
      minimumOut: quote.minimumOut.toString()
    }, "otx_coco_test");
    expect(result.mode).toBe("SIMULATED");
    expect(result.persistence).toBe("TEMPORARY");
    expect(result.chain.layer).toBe("L3_DEFI");
    expect(result.chain.kind).toBe("COCO_SWAP_A_TO_B_SIMULATION");
    expect(result.amountB).toBe(quote.amountOut.toString());
    expect(BigInt(result.pool.reserveA) * BigInt(result.pool.reserveB)).toBeGreaterThanOrEqual(pool.reserveA * pool.reserveB);
    expect(result.chain.blockHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("zachowuje niezmiennik puli dla obu kierunków i blokuje bazowe LP", () => {
    for (const direction of ["A_TO_B", "B_TO_A"] as const) {
      for (let i = 1n; i < 200n; i++) {
        const input = i * 10n ** BigInt(direction === "A_TO_B" ? 18 : 6);
        const next = executeCocoSwap(pool, direction, input, 0n).pool;
        expect(next.reserveA * next.reserveB).toBeGreaterThanOrEqual(pool.reserveA * pool.reserveB);
      }
    }
    expect(() => removeCocoLiquidity(pool, pool.totalLp, 0n, 0n)).toThrow();
  });

  it("dodaje i wycofuje należące do sesji LP", () => {
    const added = runCocoSimulation({
      action: "add", pool: toWire(pool), ownedLp: "0",
      maxA: (2000n * 10n ** 18n).toString(),
      maxB: (1000n * 10n ** 6n).toString(),
      minimumLp: "1"
    }, "otx_coco_add");
    expect(added.amountA).toBe((1000n * 10n ** 18n).toString());
    expect(added.amountB).toBe((1000n * 10n ** 6n).toString());
    const removed = runCocoSimulation({
      action: "remove", pool: added.pool, ownedLp: added.ownedLp,
      liquidity: added.ownedLp, minimumA: "1", minimumB: "1"
    }, "otx_coco_remove");
    expect(removed.ownedLp).toBe("0");
    expect(removed.chain.kind).toBe("COCO_LIQUIDITY_REMOVE_SIMULATION");
  });

  it("odrzuca nieosiągalne minimum i próbę wycofania cudzych LP", () => {
    expect(() => runCocoSimulation({
      action: "swap", pool: toWire(pool), ownedLp: "0", direction: "A_TO_B",
      amountIn: (1000n * 10n ** 18n).toString(), minimumOut: (2000n * 10n ** 6n).toString()
    }, "otx_coco_fail")).toThrow("poślizgu");
    expect(() => runCocoSimulation({
      action: "remove", pool: toWire(pool), ownedLp: "0",
      liquidity: "1000", minimumA: "0", minimumB: "0"
    }, "otx_coco_fail")).toThrow("Za mało posiadanych LP");
  });

  it("obsługuje rzeczywisty handler HTTP i odrzuca zbyt duże dane", async () => {
    const input = {
      action: "swap", pool: toWire(pool), ownedLp: "0", direction: "A_TO_B",
      amountIn: (1000n * 10n ** 18n).toString(), minimumOut: "1"
    };
    const response = await POST(new Request("http://localhost/api/coco-simulation", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input)
    }));
    expect(response.status).toBe(200);
    const body = await response.json() as { mode: string; chain: { layer: string } };
    expect(body.mode).toBe("SIMULATED");
    expect(body.chain.layer).toBe("L3_DEFI");
    const tooLarge = await POST(new Request("http://localhost/api/coco-simulation", {
      method: "POST", body: "x".repeat(4097)
    }));
    expect(tooLarge.status).toBe(413);
  });
});
