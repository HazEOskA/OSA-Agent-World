# OSA Crypto World

A cyberpunk Web4 world where agents, DeFi, bridges, proofs, chain layers, nodes and service markets are represented as one verifiable economy.

## V0.1 Goal

**Tasks 01–60 implemented.**

Reference path:

```text
ENTER WORLD
→ IDENTITY
→ AGENT / KAI
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
→ NODE GRID
→ MARKET
```

## Districts

- Central Nexus
- Agent District
- DeFi District
- Bridge Tower
- Proof Lab
- Chain Core
- Node Grid
- Market Zone

## Release proof

`GET /api/release-proof` executes the reference integration loop and returns canonical IDs, truth labels and the security-gate result.

## Truth labels

```text
REAL       real application behavior
TESTNET    real external-chain test networks
SIMULATED  executable models with no production-value claims
FUTURE     architecture not yet implemented
```

Current OSA L1/L2/L3 and node network are executable **SIMULATED DEVNET** models. They are not presented as a permissionless public mainnet.

## Development

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm world:dev
```

## Core invariants

**CLAIM != PROOF**

**AGENT != SIGNER**

**RUNTIME != SETTLEMENT AUTHORITY**

**PROOF != QUALITY JUDGMENT**

**SIMULATION != MAINNET**

See:

- `docs/architecture/MASTER_ROADMAP_V0.1.md`
- `docs/RELEASE_PROOF_V0.1.md`
- `docs/security/SECURITY_GATE_V0.1.md`
