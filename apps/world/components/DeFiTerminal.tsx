"use client";

import {
  ALPHA_LIQUIDITY_POOL,
  createSimulatedLiquidityPosition,
  quoteConstantProductSwap,
  type LiquidityPosition,
  type SimulatedSwapQuote
} from "@osa/defi-core";
import {
  executeSepoliaEthToUsdc,
  quoteSepoliaEthToUsdc,
  type UniswapSepoliaQuote
} from "@osa/defi-uniswap";
import { shortenAddress, type OsaIdentity } from "@osa/wallet-core";
import { useMemo, useState } from "react";
import type { WorldEvent } from "../lib/world";

interface DeFiTerminalProps {
  active: boolean;
  identity: OsaIdentity | null;
  onWorldEvent: (event: WorldEvent) => void;
}

function event(
  type: WorldEvent["type"],
  label: string,
  mode: WorldEvent["mode"]
): WorldEvent {
  return {
    id: `w_evt_${Date.now().toString(36)}`,
    type,
    district: "defi",
    label,
    mode
  };
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function DeFiTerminal({ active, identity, onWorldEvent }: DeFiTerminalProps) {
  const [simulationAmount, setSimulationAmount] = useState("1000");
  const [simulationQuote, setSimulationQuote] = useState<SimulatedSwapQuote | null>(null);
  const [position, setPosition] = useState<LiquidityPosition | null>(null);

  const [ethAmount, setEthAmount] = useState("0.001");
  const [liveQuote, setLiveQuote] = useState<UniswapSepoliaQuote | null>(null);
  const [liveState, setLiveState] = useState<"IDLE" | "QUOTING" | "READY" | "SUBMITTED" | "CONFIRMED" | "FAILED">("IDLE");
  const [liveTx, setLiveTx] = useState<string | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);

  const canExecuteLive = identity?.primaryWallet.kind === "EVM";

  const poolPrice = useMemo(
    () => ALPHA_LIQUIDITY_POOL.reserveB / ALPHA_LIQUIDITY_POOL.reserveA,
    []
  );

  const simulate = () => {
    const amount = Number(simulationAmount);
    try {
      const quote = quoteConstantProductSwap(ALPHA_LIQUIDITY_POOL, "OSA_TEST", amount, 50);
      setSimulationQuote(quote);
      onWorldEvent(event("defi.quote.created", "SYMULOWANA WYCENA SWAP", "SYMULACJA"));
    } catch (error) {
      setSimulationQuote(null);
      setLiveError(message(error));
    }
  };

  const addSimulatedLiquidity = () => {
    const next = createSimulatedLiquidityPosition(ALPHA_LIQUIDITY_POOL, 10_000, 5_000);
    setPosition(next);
    onWorldEvent(event("defi.liquidity.position.created", "POZYCJA PŁYNNOŚCI UTWORZONA", "SYMULACJA"));
  };

  const quoteLive = async () => {
    setLiveState("QUOTING");
    setLiveError(null);
    setLiveTx(null);
    try {
      const quote = await quoteSepoliaEthToUsdc(ethAmount, 50);
      setLiveQuote(quote);
      setLiveState("READY");
      onWorldEvent(event("defi.quote.created", "WYCENA UNISWAP TESTNET", "TESTNET"));
    } catch (error) {
      setLiveQuote(null);
      setLiveState("FAILED");
      setLiveError(message(error));
      onWorldEvent(event("defi.swap.failed", "WYCENA UNISWAP NIEUDANA", "TESTNET"));
    }
  };

  const executeLive = async () => {
    if (!identity || identity.primaryWallet.kind !== "EVM" || !liveQuote) return;

    setLiveError(null);
    setLiveState("READY");

    try {
      const hash = await executeSepoliaEthToUsdc(
        identity.primaryWallet.address as `0x${string}`,
        liveQuote,
        {
          onSubmitted: (submittedHash) => {
            setLiveTx(submittedHash);
            setLiveState("SUBMITTED");
            onWorldEvent(event("defi.swap.submitted", "SWAP UNISWAP PRZESŁANY", "TESTNET"));
          }
        }
      );

      setLiveTx(hash);
      setLiveState("CONFIRMED");
      onWorldEvent(event("defi.swap.confirmed", "SWAP UNISWAP POTWIERDZONY", "TESTNET"));
    } catch (error) {
      setLiveState("FAILED");
      setLiveError(message(error));
      onWorldEvent(event("defi.swap.failed", "SWAP UNISWAP NIEUDANY", "TESTNET"));
    }
  };

  if (!active) return null;

  return (
    <aside className="defi-terminal" aria-label="Panel DeFi OSA">
      <div className="defi-terminal-head">
        <div>
          <span>DEFI // ALPHA</span>
          <h2>SILNIK PŁYNNOŚCI</h2>
        </div>
        <div className="defi-mode-legend">
          <b>SYMULACJA</b>
          <i>+</i>
          <strong>TESTNET</strong>
        </div>
      </div>

      <div className="defi-columns">
        <section className="defi-module simulation-module">
          <div className="module-title">
            <span>01</span>
            <strong>OSA SWAP / SYMULACJA</strong>
            <i>SYMULACJA</i>
          </div>

          <div className="swap-pair">
            <label>
              <span>Z</span>
              <strong>OSA_TEST</strong>
            </label>
            <input
              value={simulationAmount}
              onChange={(e) => setSimulationAmount(e.target.value)}
              inputMode="decimal"
            />
            <div className="swap-arrow">↓</div>
            <label>
              <span>DO</span>
              <strong>USDC_TEST</strong>
            </label>
          </div>

          <div className="quote-strip">
            <span>POOL</span>
            <b>{ALPHA_LIQUIDITY_POOL.poolId}</b>
            <span>CENA ŚRODKOWA</span>
            <b>{poolPrice.toFixed(4)}</b>
          </div>

          {simulationQuote ? (
            <div className="quote-result">
              <span>SZACOWANY ODBIÓR</span>
              <strong>{simulationQuote.amountOut.toFixed(4)} USDC_TEST</strong>
              <i>MIN {simulationQuote.minimumReceived.toFixed(4)}</i>
            </div>
          ) : null}

          <button type="button" className="defi-action" onClick={simulate}>
            URUCHOM SYMULACJĘ
          </button>
        </section>

        <section className="defi-module live-module">
          <div className="module-title">
            <span>02</span>
            <strong>UNISWAP V3</strong>
            <i>SEPOLIA TESTNET</i>
          </div>

          <div className="swap-pair">
            <label>
              <span>Z</span>
              <strong>ETH</strong>
            </label>
            <input
              value={ethAmount}
              onChange={(e) => setEthAmount(e.target.value)}
              inputMode="decimal"
            />
            <div className="swap-arrow">↓</div>
            <label>
              <span>DO</span>
              <strong>USDC</strong>
            </label>
          </div>

          <div className="live-wallet-state">
            <span>TOŻSAMOŚĆ</span>
            <b>
              {canExecuteLive && identity
                ? shortenAddress(identity.primaryWallet.address, 6)
                : "WYMAGANY PORTFEL EVM"}
            </b>
          </div>

          {liveQuote ? (
            <div className="quote-result testnet-result">
              <span>WYCENA LIVE</span>
              <strong>{liveQuote.amountOutFormatted} USDC</strong>
              <i>
                FEE TIER {liveQuote.fee / 10_000}% · MIN {liveQuote.minimumOutFormatted}
              </i>
            </div>
          ) : null}

          <div className="live-actions">
            <button
              type="button"
              className="defi-action"
              onClick={() => void quoteLive()}
              disabled={liveState === "QUOTING" || liveState === "SUBMITTED"}
            >
              {liveState === "QUOTING" ? "QUOTING..." : "GET WYCENA LIVE"}
            </button>
            <button
              type="button"
              className="defi-action execute"
              onClick={() => void executeLive()}
              disabled={!canExecuteLive || !liveQuote || liveState === "SUBMITTED"}
            >
              WYKONAJ SWAP TESTNET
            </button>
          </div>

          <div className="live-status">
            <span>STAN</span>
            <strong>{liveState}</strong>
            <i>{liveTx ? shortenAddress(liveTx, 8) : "BRAK TRANSAKCJI"}</i>
          </div>

          {liveError ? <div className="defi-error">{liveError}</div> : null}
        </section>
      </div>

      <section className="liquidity-core">
        <div className="module-title">
          <span>03</span>
          <strong>RDZEŃ PŁYNNOŚCI</strong>
          <i>SYMULACJA POSITION MODEL</i>
        </div>

        {position ? (
          <div className="position-visual">
            <div className="position-orbit" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div className="position-data">
              <span>{position.positionId}</span>
              <strong>
                {position.amountA.toLocaleString()} {position.assetA}
              </strong>
              <strong>
                {position.amountB.toLocaleString()} {position.assetB}
              </strong>
              <i>POOL SHARE {position.shareBps / 100}%</i>
            </div>
          </div>
        ) : (
          <button type="button" className="liquidity-create" onClick={addSimulatedLiquidity}>
            UTWÓRZ POZYCJĘ
          </button>
        )}
      </section>
    </aside>
  );
}
