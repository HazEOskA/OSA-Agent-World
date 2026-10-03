# OSA Crypto World — Bridge V0.1

## Scope

TASK 25–29:

- Bridge Tower scene,
- bridge domain / trace model,
- simulation bridge,
- Wormhole WTT testnet adapter,
- end-to-end cross-chain trace.

## Architecture

```text
WORLD
  ↓
BridgeTower
  ↓
Bridge Core
  ├── SIMULATED
  └── TESTNET
        ↓
    Wormhole WTT
```

## Simulation path

```text
ROUTED
→ SOURCE_SUBMITTED
→ SOURCE_CONFIRMED
→ ATTESTING
→ ATTESTED
→ DESTINATION_SUBMITTED
→ COMPLETED
```

No value moves in simulation.

## Testnet path

Current reference route:

```text
Arbitrum Sepolia
→ Wormhole Token Bridge
→ Guardian VAA
→ Base Sepolia
```

The source and destination use the browser EVM wallet.

The flow requires explicit wallet interaction on both chains:

```text
source approval
→ source tx
→ source finality
→ Wormhole attestation
→ destination network switch
→ destination approval
→ redeem tx
→ completed
```

## Security boundary

- testnet only,
- no raw private keys,
- no mainnet path,
- no production bridge claims,
- transfer is not marked completed before destination redeem,
- failed stages are appended to the trace rather than rewriting prior steps.

## Protocol basis

Wormhole TypeScript SDK 1.20.0 is used with the current `TokenBridge` protocol flow.
