"use client";

import {
  executeSepoliaEthToUsdc,
  quoteSepoliaEthToUsdc,
  type UniswapSepoliaQuote
} from "@osa/defi-uniswap";
import { shortenAddress, type OsaIdentity } from "@osa/wallet-core";
import { useState } from "react";
import { CocoSwapSimulator } from "./CocoSwapSimulator";
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
  const [ethAmount, setEthAmount] = useState("0.001");
  const [liveQuote, setLiveQuote] = useState<UniswapSepoliaQuote | null>(null);
  const [liveState, setLiveState] = useState<"IDLE" | "QUOTING" | "READY" | "SUBMITTED" | "CONFIRMED" | "FAILED">("IDLE");
  const [liveTx, setLiveTx] = useState<string | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);

  const canExecuteLive = identity?.primaryWallet.kind === "EVM";

  const quoteLive = async () => {
    setLiveState("QUOTING");
    setLiveError(null);
    setLiveTx(null);
    try {
      const quote = await quoteSepoliaEthToUsdc(ethAmount, 50);
      setLiveQuote(quote);
      setLiveState("READY");
      onWorldEvent(event("defi.quote.created", "UNISWAP TESTNET QUOTE", "TESTNET"));
    } catch (error) {
      setLiveQuote(null);
      setLiveState("FAILED");
      setLiveError(message(error));
      onWorldEvent(event("defi.swap.failed", "UNISWAP QUOTE FAILED", "TESTNET"));
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
            onWorldEvent(event("defi.swap.submitted", "UNISWAP SWAP SUBMITTED", "TESTNET"));
          }
        }
      );

      setLiveTx(hash);
      setLiveState("CONFIRMED");
      onWorldEvent(event("defi.swap.confirmed", "UNISWAP SWAP CONFIRMED", "TESTNET"));
    } catch (error) {
      setLiveState("FAILED");
      setLiveError(message(error));
      onWorldEvent(event("defi.swap.failed", "UNISWAP SWAP FAILED", "TESTNET"));
    }
  };

  if (!active) return null;

  return (
    <aside className="defi-terminal" aria-label="OSA DeFi District">
      <div className="defi-terminal-head">
        <div>
          <span>DEFI DISTRICT // ALPHA</span>
          <h2>LIQUIDITY ENGINE</h2>
        </div>
        <div className="defi-mode-legend">
          <b>SIMULATED</b>
          <i>+</i>
          <strong>TESTNET</strong>
        </div>
      </div>

      <div className="defi-columns">
        <CocoSwapSimulator onWorldEvent={onWorldEvent} />

        <section className="defi-module live-module">
          <div className="module-title">
            <span>02</span>
            <strong>UNISWAP V3</strong>
            <i>SEPOLIA TESTNET</i>
          </div>

          <div className="swap-pair">
            <label>
              <span>FROM</span>
              <strong>ETH</strong>
            </label>
            <input
              value={ethAmount}
              onChange={(e) => setEthAmount(e.target.value)}
              inputMode="decimal"
            />
            <div className="swap-arrow">↓</div>
            <label>
              <span>TO</span>
              <strong>USDC</strong>
            </label>
          </div>

          <div className="live-wallet-state">
            <span>IDENTITY</span>
            <b>
              {canExecuteLive && identity
                ? shortenAddress(identity.primaryWallet.address, 6)
                : "EVM WALLET REQUIRED"}
            </b>
          </div>

          {liveQuote ? (
            <div className="quote-result testnet-result">
              <span>LIVE QUOTE</span>
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
              {liveState === "QUOTING" ? "QUOTING..." : "GET LIVE QUOTE"}
            </button>
            <button
              type="button"
              className="defi-action execute"
              onClick={() => void executeLive()}
              disabled={!canExecuteLive || !liveQuote || liveState === "SUBMITTED"}
            >
              EXECUTE TESTNET SWAP
            </button>
          </div>

          <div className="live-status">
            <span>STATE</span>
            <strong>{liveState}</strong>
            <i>{liveTx ? shortenAddress(liveTx, 8) : "NO TRANSACTION"}</i>
          </div>

          {liveError ? <div className="defi-error">{liveError}</div> : null}
        </section>
      </div>

    </aside>
  );
}
