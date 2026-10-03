"use client";

import { address, lamports } from "@solana/kit";
import {
  useConnect,
  useConnectedWallet,
  useDisconnect,
  useIsWalletReady,
  useWallets
} from "@solana/kit-plugin-wallet/react";
import {
  createOsaIdentity,
  initialTransactionLifecycle,
  reduceTransactionLifecycle,
  shortenAddress,
  type OsaIdentity,
  type TransactionEvent,
  type WalletConnection
} from "@osa/wallet-core";
import {
  connectEvmTestnet,
  EVM_TESTNET,
  sendEvmSelfTestTransaction
} from "@osa/chain-evm";
import {
  getSolanaDevnetBalance,
  SOLANA_DEVNET,
  waitForSolanaConfirmation
} from "@osa/chain-solana";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useSolanaClient } from "../lib/solana-provider";
import type { WorldEvent } from "../lib/world";

interface IdentityGateProps {
  open: boolean;
  onClose: () => void;
  onWorldEvent: (event: WorldEvent) => void;
  onIdentityChange: (identity: OsaIdentity | null) => void;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function buildWorldEvent(
  type: WorldEvent["type"],
  label: string,
  district: WorldEvent["district"] = "nexus"
): WorldEvent {
  return {
    id: `w_evt_${Date.now().toString(36)}`,
    type,
    district,
    label,
    mode: "TESTNET"
  };
}

export function IdentityGate({
  open,
  onClose,
  onWorldEvent,
  onIdentityChange
}: IdentityGateProps) {
  const client = useSolanaClient();
  const wallets = useWallets(client);
  const connectedSolana = useConnectedWallet(client);
  const isSolanaReady = useIsWalletReady(client);
  const { dispatchAsync: connectSolana, isRunning: isConnectingSolana } = useConnect(client);
  const { dispatchAsync: disconnectSolana } = useDisconnect(client);

  const [identity, setIdentity] = useState<OsaIdentity | null>(null);
  const [evmBusy, setEvmBusy] = useState(false);
  const [uiError, setUiError] = useState<string | null>(null);
  const [tx, txDispatch] = useReducer(reduceTransactionLifecycle, initialTransactionLifecycle);
  const boundSolanaAddress = useRef<string | null>(null);

  const setConnectedIdentity = useCallback(
    (wallet: WalletConnection) => {
      const next = createOsaIdentity(wallet);
      setIdentity(next);
      onIdentityChange(next);
      setUiError(null);
      onWorldEvent(buildWorldEvent("identity.wallet.connected", `${wallet.kind} WALLET CONNECTED`));
    },
    [onIdentityChange, onWorldEvent]
  );

  useEffect(() => {
    const walletAddress = connectedSolana?.account.address;
    if (!walletAddress || boundSolanaAddress.current === walletAddress) return;

    boundSolanaAddress.current = walletAddress;
    void getSolanaDevnetBalance(walletAddress)
      .then((balance) => {
        setConnectedIdentity({
          kind: "SOLANA",
          address: walletAddress,
          chainId: SOLANA_DEVNET.chain,
          network: SOLANA_DEVNET.name,
          nativeAsset: SOLANA_DEVNET.nativeAsset,
          balance,
          mode: "TESTNET"
        });
      })
      .catch((error: unknown) => {
        boundSolanaAddress.current = null;
        setUiError(errorMessage(error));
      });
  }, [connectedSolana?.account.address, setConnectedIdentity]);

  const connectEvm = async () => {
    setEvmBusy(true);
    setUiError(null);
    try {
      const wallet = await connectEvmTestnet();
      setConnectedIdentity(wallet);
    } catch (error) {
      setUiError(errorMessage(error));
    } finally {
      setEvmBusy(false);
    }
  };

  const disconnect = async () => {
    if (identity?.primaryWallet.kind === "SOLANA" && connectedSolana) {
      await disconnectSolana();
      boundSolanaAddress.current = null;
    }
    setIdentity(null);
    onIdentityChange(null);
    txDispatch({ type: "RESET" });
    onWorldEvent(buildWorldEvent("identity.wallet.disconnected", "IDENTITY SESSION CLEARED"));
  };

  const emitTxEvent = (event: TransactionEvent) => {
    txDispatch(event);
    if (event.type === "REQUEST_SIGNATURE") {
      onWorldEvent(buildWorldEvent("transaction.signature.requested", "WALLET SIGNATURE REQUESTED"));
    }
    if (event.type === "SUBMITTED") {
      onWorldEvent(buildWorldEvent("transaction.submitted", "TESTNET TRANSACTION SUBMITTED"));
    }
    if (event.type === "CONFIRMED") {
      onWorldEvent(buildWorldEvent("transaction.confirmed", "CHAIN CONFIRMED"));
    }
    if (event.type === "FAILED" || event.type === "BLOCKED") {
      onWorldEvent(buildWorldEvent("transaction.failed", event.message));
    }
  };

  const runTestTransaction = async () => {
    if (!identity) return;

    const wallet = identity.primaryWallet;
    const numericBalance = Number(wallet.balance);
    if (!Number.isFinite(numericBalance) || numericBalance <= 0) {
      emitTxEvent({
        type: "BLOCKED",
        message:
          wallet.kind === "EVM"
            ? "Sepolia ETH required for gas"
            : "Devnet SOL required for transaction fees"
      });
      return;
    }

    emitTxEvent({ type: "REQUEST_SIGNATURE", walletKind: wallet.kind });

    try {
      if (wallet.kind === "EVM") {
        const hash = await sendEvmSelfTestTransaction(wallet.address, {
          onSubmitted: (submittedHash) => {
            emitTxEvent({ type: "SUBMITTED", txId: submittedHash });
          }
        });
        emitTxEvent({ type: "CONFIRMED", txId: hash });
        return;
      }

      if (!connectedSolana?.signer) {
        throw new Error("Solana signer unavailable");
      }

      const result = await client.system.instructions
        .transferSol({
          source: connectedSolana.signer,
          destination: address(connectedSolana.account.address),
          amount: lamports(1n)
        })
        .sendTransaction();

      const signature = String(result.context.signature);
      emitTxEvent({ type: "SUBMITTED", txId: signature });
      await waitForSolanaConfirmation(signature);
      emitTxEvent({ type: "CONFIRMED", txId: signature });
    } catch (error) {
      emitTxEvent({ type: "FAILED", message: errorMessage(error) });
    }
  };

  if (!open) return null;

  return (
    <section className="identity-gate" aria-label="OSA Identity Gate">
      <div className="identity-grid" aria-hidden="true" />
      <div className="identity-head">
        <div>
          <span className="identity-kicker">IDENTITY GATE // TESTNET</span>
          <h2>{identity ? "IDENTITY LINKED" : "CONNECT TO THE WORLD"}</h2>
        </div>
        <button type="button" className="gate-close" onClick={onClose} aria-label="Enter as observer">
          OBSERVER ↗
        </button>
      </div>

      {!identity ? (
        <div className="wallet-choices">
          <button type="button" className="wallet-path evm-path" onClick={connectEvm} disabled={evmBusy}>
            <span>EVM</span>
            <strong>{evmBusy ? "CONNECTING..." : "ETHEREUM SEPOLIA"}</strong>
            <i>REAL TESTNET</i>
          </button>

          <div className="solana-wallets">
            <div className="wallet-path-label">
              <span>SOLANA</span>
              <strong>{isSolanaReady ? "DEVNET WALLETS" : "DISCOVERING WALLETS..."}</strong>
              <i>WALLET STANDARD</i>
            </div>
            <div className="wallet-list">
              {wallets.length === 0 ? (
                <div className="no-wallet">NO SOLANA WALLET DETECTED</div>
              ) : (
                wallets.map((wallet) => (
                  <button
                    type="button"
                    key={wallet.name}
                    disabled={isConnectingSolana}
                    onClick={() => void connectSolana(wallet)}
                  >
                    {wallet.name}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="identity-live">
          <div className="identity-core">
            <span>OSA IDENTITY</span>
            <strong>{identity.identityId}</strong>
            <i>{identity.primaryWallet.mode}</i>
          </div>

          <dl className="wallet-telemetry">
            <div>
              <dt>WALLET</dt>
              <dd>{shortenAddress(identity.primaryWallet.address, 6)}</dd>
            </div>
            <div>
              <dt>NETWORK</dt>
              <dd>{identity.primaryWallet.network}</dd>
            </div>
            <div>
              <dt>BALANCE</dt>
              <dd>
                {identity.primaryWallet.balance} {identity.primaryWallet.nativeAsset}
              </dd>
            </div>
            <div>
              <dt>RISK</dt>
              <dd>TESTNET ONLY</dd>
            </div>
          </dl>

          <div className="transaction-core">
            <div>
              <span>TRANSACTION LIFECYCLE</span>
              <strong>{tx.status}</strong>
              <i>{tx.txId ? shortenAddress(tx.txId, 8) : tx.message ?? "READY"}</i>
            </div>
            <button
              type="button"
              onClick={() => void runTestTransaction()}
              disabled={tx.status === "AWAITING_SIGNATURE" || tx.status === "SUBMITTED"}
            >
              SEND TEST PULSE
            </button>
          </div>

          <div className="identity-actions">
            <a
              href={
                identity.primaryWallet.kind === "EVM"
                  ? EVM_TESTNET.explorerBaseUrl
                  : `${SOLANA_DEVNET.explorerBaseUrl}/?cluster=devnet`
              }
              target="_blank"
              rel="noreferrer"
            >
              EXPLORER ↗
            </a>
            <button type="button" onClick={() => void disconnect()}>
              CLEAR SESSION
            </button>
          </div>
        </div>
      )}

      <div className="asset-rail">
        <span>TEST ASSETS</span>
        <b>ETH_TEST / SEPOLIA</b>
        <b>SOL_TEST / DEVNET</b>
        <i>OSA_TEST / SIMULATED</i>
      </div>

      {uiError ? <div className="identity-error">{uiError}</div> : null}
    </section>
  );
}
