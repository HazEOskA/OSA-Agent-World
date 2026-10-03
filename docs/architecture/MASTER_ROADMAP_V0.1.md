# OSA Crypto World — Master Roadmap V0.1

## Goal

One reference implementation linking:

```text
IDENTITY
→ AGENT
→ MISSION
→ AUTHORITY
→ EXECUTION
→ EVIDENCE
→ PROOF
→ SETTLEMENT
→ REPUTATION
→ DEFI
→ BRIDGE
→ OSA L3
→ OSA L2
→ OSA L1
→ NODE NETWORK
→ MARKET
→ WORLD
```

## Tasks 01–60

### 01–07 Foundation
Monorepo, domain, canonical IDs, event protocol, PostgreSQL, adapter interfaces, observability.

### 08–13 World Shell
Own visual primitives, World Entry, Central Nexus, teleport engine, world-state events, desktop/mobile parity.

### 14–19 Web3 Core
Identity Gate, wallet core, EVM Sepolia adapter, Solana Devnet adapter, test assets, transaction lifecycle.

### 20–24 DeFi
DeFi District, constant-product simulation, Sepolia Uniswap path, liquidity model, position visualization.

### 25–29 Bridge
Bridge Tower, bridge abstraction, simulation trace, Wormhole testnet path, cross-chain trace.

### 30–35 Agents
Agent District, KAI identity, wallet policy, mission state machine, OSA Runtime adapter, Authority Gate.

### 36–41 Proof Economy
Evidence root, APR bridge, ProofReceipt, verifier, tamper detection, settlement + reputation projection.

### 42–47 OSA Chain Stack
L1 model, L2 economy layer, L3 agent/DeFi layers, chain abstraction, genesis/devnet, explorer.

### 48–52 OSA Network
Node registry, RPC, relayer, indexer, topology, validator/sequencer finality simulation.

### 53–56 Agent Economy
Marketplace, skills/API/compute/data catalog, agent payment intents, service discovery.

### 57–60 Release
Integrated world, end-to-end release trace, security gate, release proof/documentation.

## Truth boundary

| Layer | Current V0.1 truth |
|---|---|
| World UI / navigation / APIs | REAL application code |
| EVM | TESTNET |
| Solana | DEVNET |
| Uniswap integration | TESTNET path |
| Wormhole integration | TESTNET path |
| OSA DeFi primitives | SIMULATED |
| OSA L1/L2/L3 | EXECUTABLE SIMULATED DEVNET |
| OSA validator/sequencer network | SIMULATED |
| OSA marketplace payments | POLICY-EXECUTABLE / SIMULATED settlement |
| Permissionless OSA mainnet | NOT CLAIMED |

**CLAIM != PROOF.**
