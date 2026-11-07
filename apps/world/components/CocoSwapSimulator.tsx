"use client";

import {
  addCocoLiquidity,
  createCocoPool,
  executeCocoSwap,
  quoteCocoSwap,
  removeCocoLiquidity,
  type CocoPool,
  type CocoQuote
} from "@osa/defi-core";
import { useState } from "react";
import type { WorldEvent } from "../lib/world";

const DECIMALS_A = 18;
const DECIMALS_B = 6;
const initialPool = createCocoPool(1_250_000n * 10n ** 18n, 625_000n * 10n ** 6n).pool;
type Direction = "A_TO_B" | "B_TO_A";
type SimulationReply = {
  mode: "SIMULATED";
  persistence: "TEMPORARY";
  pool: { reserveA: string; reserveB: string; totalLp: string; feeBps: number };
  ownedLp: string;
  amountA: string;
  amountB: string;
  chain: { txId: string; layer: "L3_DEFI"; blockHash: string };
};
type Quote = { direction: Direction; quote: CocoQuote; impactBps: bigint };

function parseUnits(input: string, decimals: number): bigint {
  const normalized = input.trim().replace(",", ".");
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) throw new Error("Wpisz prawidłową dodatnią kwotę");
  const [whole = "0", fraction = ""] = normalized.split(".");
  if (fraction.length > decimals || whole.length + decimals > 77) throw new Error("Zbyt duża dokładność lub kwota");
  return BigInt(whole) * 10n ** BigInt(decimals) + BigInt(fraction.padEnd(decimals, "0"));
}

function formatUnits(value: bigint, decimals: number): string {
  const scale = 10n ** BigInt(decimals);
  const whole = value / scale;
  const fraction = (value % scale).toString().padStart(decimals, "0").replace(/0+$/, "");
  return fraction ? `${whole},${fraction}` : whole.toString();
}

function share(value: bigint, total: bigint): string {
  const scaled = value * 1_000_000n / total;
  return `${scaled / 10_000n},${(scaled % 10_000n).toString().padStart(4, "0")}%`;
}

export function CocoSwapSimulator({ onWorldEvent }: { onWorldEvent: (event: WorldEvent) => void }) {
  const [pool, setPool] = useState<CocoPool>(initialPool);
  const [ownedLp, setOwnedLp] = useState(0n);
  const [direction, setDirection] = useState<Direction>("A_TO_B");
  const [amount, setAmount] = useState("1000");
  const [slippage, setSlippage] = useState(50);
  const [maxA, setMaxA] = useState("10000");
  const [maxB, setMaxB] = useState("5000");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("Stan puli istnieje tylko w tej sesji przeglądarki.");
  const [chain, setChain] = useState<SimulationReply["chain"] | null>(null);

  function updateQuote() {
    try {
      const amountIn = parseUnits(amount, direction === "A_TO_B" ? DECIMALS_A : DECIMALS_B);
      const result = quoteCocoSwap(pool, direction, amountIn, slippage);
      const reserveIn = direction === "A_TO_B" ? pool.reserveA : pool.reserveB;
      const reserveOut = direction === "A_TO_B" ? pool.reserveB : pool.reserveA;
      const impactBps = (reserveOut * amountIn - result.amountOut * reserveIn) * 10_000n / (reserveOut * amountIn);
      setQuote({ direction, quote: result, impactBps });
      setError("");
      onWorldEvent({ id: `w_coco_quote_${Date.now()}`, type: "defi.quote.created", district: "defi", label: "COCO WYCENA — SYMULACJA", mode: "SIMULATED" });
    } catch (cause) {
      setQuote(null);
      setError(cause instanceof Error ? cause.message : "Nie udało się obliczyć wyceny");
    }
  }

  async function perform(action: Record<string, string>) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/coco-simulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...action,
          ownedLp: ownedLp.toString(),
          pool: {
            reserveA: pool.reserveA.toString(),
            reserveB: pool.reserveB.toString(),
            totalLp: pool.totalLp.toString(),
            feeBps: pool.feeBps
          }
        })
      });
      const reply = await response.json() as SimulationReply & { error?: string };
      if (!response.ok) throw new Error(reply.error || "Nie udało się wykonać symulacji");
      if (reply.mode !== "SIMULATED" || reply.persistence !== "TEMPORARY" || reply.chain.layer !== "L3_DEFI") throw new Error("Nieprawidłowa odpowiedź symulacji");
      setPool({
        reserveA: BigInt(reply.pool.reserveA),
        reserveB: BigInt(reply.pool.reserveB),
        totalLp: BigInt(reply.pool.totalLp),
        feeBps: reply.pool.feeBps
      });
      setOwnedLp(BigInt(reply.ownedLp));
      setChain(reply.chain);
      setQuote(null);
      const label = action.action === "swap" ? "SWAP WYKONANY" : action.action === "add" ? "DODANO PŁYNNOŚĆ" : "WYCOFANO PŁYNNOŚĆ";
      setNotice(`${label}: ${formatUnits(BigInt(reply.amountA), DECIMALS_A)} OSA_TEST · ${formatUnits(BigInt(reply.amountB), DECIMALS_B)} USDC_TEST`);
      onWorldEvent({
        id: reply.chain.txId,
        type: action.action === "swap" ? "defi.swap.simulated" : action.action === "add" ? "defi.liquidity.position.created" : "defi.liquidity.position.removed",
        district: "defi",
        label: `COCO ${label} — SYMULACJA`,
        mode: "SIMULATED"
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Błąd symulacji");
    } finally {
      setBusy(false);
    }
  }

  function swap() {
    if (!quote) return;
    try {
      executeCocoSwap(pool, quote.direction, quote.quote.amountIn, quote.quote.minimumOut);
      void perform({ action: "swap", direction: quote.direction, amountIn: quote.quote.amountIn.toString(), minimumOut: quote.quote.minimumOut.toString() });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Nie udało się wykonać swapu");
    }
  }

  function add() {
    try {
      const a = parseUnits(maxA, DECIMALS_A);
      const b = parseUnits(maxB, DECIMALS_B);
      const preview = addCocoLiquidity(pool, a, b, 1n);
      const minimumLp = preview.mintedLp * BigInt(10_000 - slippage) / 10_000n;
      void perform({ action: "add", maxA: a.toString(), maxB: b.toString(), minimumLp: minimumLp.toString() });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Nie udało się dodać płynności");
    }
  }

  function remove() {
    try {
      const preview = removeCocoLiquidity(pool, ownedLp, 0n, 0n);
      const factor = BigInt(10_000 - slippage);
      void perform({
        action: "remove",
        liquidity: ownedLp.toString(),
        minimumA: (preview.amountA * factor / 10_000n).toString(),
        minimumB: (preview.amountB * factor / 10_000n).toString()
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Nie udało się wycofać płynności");
    }
  }

  return (
    <section className="defi-module simulation-module coco-simulator" aria-label="Coco Swap — symulacja">
      <div className="module-title"><span>01</span><strong>COCO SWAP</strong><i>SYMULACJA</i></div>
      <p className="coco-intro">Wirtualna pula · bez portfela i prawdziwych środków</p>
      <div className="swap-pair">
        <label htmlFor="coco-amount"><span>WYMIENIASZ</span><strong>{direction === "A_TO_B" ? "OSA_TEST" : "USDC_TEST"}</strong></label>
        <input id="coco-amount" value={amount} inputMode="decimal" onChange={e => { setAmount(e.target.value); setQuote(null); }} />
        <button className="coco-reverse" type="button" disabled={busy} onClick={() => { setDirection(direction === "A_TO_B" ? "B_TO_A" : "A_TO_B"); setQuote(null); }} aria-label="Zmień kierunek wymiany">↓ ZMIEŃ KIERUNEK</button>
        <label><span>OTRZYMUJESZ</span><strong>{direction === "A_TO_B" ? "USDC_TEST" : "OSA_TEST"}</strong></label>
      </div>
      <div className="coco-controls">
        <label htmlFor="coco-slippage">Maks. poślizg</label>
        <select id="coco-slippage" value={slippage} onChange={e => { setSlippage(Number(e.target.value)); setQuote(null); }}>
          <option value={10}>0,1%</option><option value={50}>0,5%</option><option value={100}>1%</option>
        </select>
        <span>Opłata 0,3%</span>
      </div>
      {quote && <div className="quote-result" aria-live="polite">
        <span>SZACOWANA KWOTA</span>
        <strong>{formatUnits(quote.quote.amountOut, direction === "A_TO_B" ? DECIMALS_B : DECIMALS_A)} {direction === "A_TO_B" ? "USDC_TEST" : "OSA_TEST"}</strong>
        <i>MIN. {formatUnits(quote.quote.minimumOut, direction === "A_TO_B" ? DECIMALS_B : DECIMALS_A)} · WPŁYW + OPŁATA: {Number(quote.impactBps) / 100}%</i>
      </div>}
      <div className="coco-actions">
        <button type="button" className="defi-action" disabled={busy} onClick={updateQuote}>OBLICZ WYCENĘ</button>
        <button type="button" className="defi-action execute" disabled={busy || !quote} onClick={swap}>WYKONAJ SYMULACJĘ</button>
      </div>
      <div className="coco-liquidity">
        <div className="module-title"><span>02</span><strong>PŁYNNOŚĆ</strong><i>SYMULACJA</i></div>
        <div className="coco-amounts">
          <label htmlFor="coco-liquidity-a">OSA_TEST <input id="coco-liquidity-a" inputMode="decimal" value={maxA} onChange={e => setMaxA(e.target.value)} /></label>
          <label htmlFor="coco-liquidity-b">USDC_TEST <input id="coco-liquidity-b" inputMode="decimal" value={maxB} onChange={e => setMaxB(e.target.value)} /></label>
        </div>
        <div className="coco-actions">
          <button type="button" className="defi-action" disabled={busy} onClick={add}>DODAJ PŁYNNOŚĆ</button>
          <button type="button" className="defi-action" disabled={busy || ownedLp === 0n} onClick={remove}>WYCOFAJ CAŁOŚĆ</button>
        </div>
        <div className="coco-meta">TWÓJ UDZIAŁ: {share(ownedLp, pool.totalLp)}<br />PULA: {formatUnits(pool.reserveA, DECIMALS_A)} OSA_TEST · {formatUnits(pool.reserveB, DECIMALS_B)} USDC_TEST</div>
      </div>
      {error && <div className="defi-error" role="alert">{error}</div>}
      <div className="coco-status" role="status">{busy ? "TRWA SYMULACJA…" : notice}</div>
      {chain && <div className="coco-chain">L3_DEFI · JEDNORAZOWY MODEL BLOKU<br />{chain.txId}<br />HASH BLOKU: {chain.blockHash}</div>}
    </section>
  );
}
