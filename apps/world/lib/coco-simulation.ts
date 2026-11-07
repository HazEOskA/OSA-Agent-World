import {
  addCocoLiquidity,
  executeCocoSwap,
  removeCocoLiquidity,
  type CocoPool
} from "@osa/defi-core";
import { OsaDevnet } from "@osa/osa-devnet";

type JsonObject = Record<string, unknown>;

function object(value: unknown): JsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Nieprawidłowe dane");
  return value as JsonObject;
}

function integer(value: unknown): bigint {
  if (typeof value !== "string" || !/^(0|[1-9][0-9]{0,77})$/.test(value)) {
    throw new Error("Nieprawidłowa kwota");
  }
  return BigInt(value);
}

function poolFrom(value: unknown): CocoPool {
  const input = object(value);
  if (input.feeBps !== 30) throw new Error("Nieprawidłowa opłata symulacji");
  return {
    reserveA: integer(input.reserveA),
    reserveB: integer(input.reserveB),
    totalLp: integer(input.totalLp),
    feeBps: 30
  };
}

function serializePool(pool: CocoPool) {
  return {
    reserveA: pool.reserveA.toString(),
    reserveB: pool.reserveB.toString(),
    totalLp: pool.totalLp.toString(),
    feeBps: pool.feeBps
  };
}

/**
 * One in-memory devnet per call. Inputs and LP ownership are supplied by the
 * browser, so this is a demonstrator, not an authoritative ledger.
 */
export function runCocoSimulation(payload: unknown, txId: string) {
  const request = object(payload);
  const pool = poolFrom(request.pool);
  const ownedLp = integer(request.ownedLp);
  if (ownedLp > pool.totalLp - 1000n) throw new Error("Nieprawidłowa pozycja LP");
  if (!/^otx_coco_[a-zA-Z0-9-]{1,64}$/.test(txId)) throw new Error("Nieprawidłowy identyfikator");

  let nextPool: CocoPool;
  let nextOwnedLp = ownedLp;
  let amountA = 0n;
  let amountB = 0n;
  let kind: string;
  let asset: string;
  let amount: bigint;

  if (request.action === "swap") {
    if (request.direction !== "A_TO_B" && request.direction !== "B_TO_A") throw new Error("Nieprawidłowy kierunek");
    const amountIn = integer(request.amountIn);
    const result = executeCocoSwap(pool, request.direction, amountIn, integer(request.minimumOut));
    nextPool = result.pool;
    amountA = request.direction === "A_TO_B" ? amountIn : result.amountOut;
    amountB = request.direction === "A_TO_B" ? result.amountOut : amountIn;
    kind = request.direction === "A_TO_B" ? "COCO_SWAP_A_TO_B_SIMULATION" : "COCO_SWAP_B_TO_A_SIMULATION";
    asset = request.direction === "A_TO_B" ? "OSA_TEST" : "USDC_TEST";
    amount = amountIn;
  } else if (request.action === "add") {
    const result = addCocoLiquidity(pool, integer(request.maxA), integer(request.maxB), integer(request.minimumLp));
    nextPool = result.pool;
    nextOwnedLp += result.mintedLp;
    amountA = result.usedA;
    amountB = result.usedB;
    kind = "COCO_LIQUIDITY_ADD_SIMULATION";
    asset = "COCO_LP_TEST";
    amount = result.mintedLp;
  } else if (request.action === "remove") {
    const liquidity = integer(request.liquidity);
    if (liquidity > ownedLp) throw new Error("Za mało posiadanych LP");
    const result = removeCocoLiquidity(pool, liquidity, integer(request.minimumA), integer(request.minimumB));
    nextPool = result.pool;
    nextOwnedLp -= liquidity;
    amountA = result.amountA;
    amountB = result.amountB;
    kind = "COCO_LIQUIDITY_REMOVE_SIMULATION";
    asset = "COCO_LP_TEST";
    amount = liquidity;
  } else {
    throw new Error("Nieznana operacja");
  }

  const devnet = new OsaDevnet();
  devnet.submit({
    txId,
    layer: "L3_DEFI",
    from: "simulation:browser",
    to: "osa:defi:coco",
    asset,
    amount: amount.toString(),
    nonce: 1,
    data: {
      kind,
      mode: "SIMULATED",
      amountA: amountA.toString(),
      amountB: amountB.toString()
    }
  });
  const block = devnet.produceBlock("L3_DEFI");
  const recorded = block.transactions[0];
  if (!recorded || recorded.txId !== txId || recorded.data.kind !== kind) {
    throw new Error("Nie udało się zapisać zdarzenia w modelu bloku");
  }
  return {
    mode: "SIMULATED" as const,
    persistence: "TEMPORARY" as const,
    pool: serializePool(nextPool),
    ownedLp: nextOwnedLp.toString(),
    amountA: amountA.toString(),
    amountB: amountB.toString(),
    chain: { txId: recorded.txId, layer: block.layer, blockHash: block.blockHash, kind: recorded.data.kind }
  };
}
