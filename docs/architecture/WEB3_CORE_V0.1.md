# OSA Crypto World — Web3 Core V0.1

## Scope

TASK 14–19:

- Identity Gate,
- Wallet Core,
- EVM adapter,
- Solana adapter,
- test assets,
- real testnet transaction lifecycle,
- protocol event → World reaction.

## Networks

### EVM

- Ethereum Sepolia
- native test asset: `ETH_TEST`
- browser wallet approval only
- no private key storage
- zero-value self transaction used as the alpha transaction pulse

### Solana

- Solana Devnet
- native test asset: `SOL_TEST`
- Wallet Standard via `@solana/kit`
- browser wallet approval only
- 1-lamport self transfer used as the alpha transaction pulse

### OSA_TEST

`OSA_TEST` is explicitly **SIMULATED** in this slice.
No mint or production token exists yet.

## Transaction lifecycle

```text
IDLE
→ AWAITING_SIGNATURE
→ SUBMITTED
→ CONFIRMED
```

Failure branches:

```text
FAILED
BLOCKED
```

A confirmed testnet transaction emits `transaction.confirmed`, and the World Shell reacts with a protocol pulse without teleporting the user.

## Security boundary

- no embedded private keys,
- no silent signing,
- no mainnet transaction path,
- no production token,
- no agent-controlled signer,
- wallet approval remains explicit.

## Truth labels

```text
WORLD SHELL    REAL
WEB3 CORE      TESTNET
OSA_TEST       SIMULATED
```
