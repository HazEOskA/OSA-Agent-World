# OSA Crypto World

**OSA Crypto World** is a living Web4 city where agents, chains, DeFi, nodes and verifiable execution become one spatial economy.

## Current alpha

### Foundation

- chain-independent domain model,
- deterministic protocol events,
- PostgreSQL + Drizzle,
- ChainAdapter + InMemoryChainAdapter,
- observability / correlation IDs.

### World Shell

- procedural Three.js / React Three Fiber city,
- Central Nexus,
- Agent / DeFi / Bridge / Proof districts,
- teleport navigation,
- desktop/mobile parity,
- no stock graphics.

### Web3 Core — TASK 14–19

- OSA Identity Gate,
- Wallet Core state machine,
- Ethereum Sepolia adapter via viem,
- Solana Devnet adapter via current `@solana/kit`,
- Wallet Standard discovery for Solana,
- native test assets `ETH_TEST` and `SOL_TEST`,
- explicit simulated `OSA_TEST`,
- real browser-wallet testnet transaction path,
- `AWAITING_SIGNATURE → SUBMITTED → CONFIRMED` lifecycle,
- protocol event → visual World pulse.

## Truth labels

```text
REAL       application/world behavior
TESTNET    live blockchain test networks
SIMULATED  modeled behavior with no real asset movement
FUTURE     reserved architecture only
```

## Commands

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm world:dev
```

## Invariants

**CLAIM != PROOF**

**WORLD VISUAL != PROTOCOL TRUTH**

**NO RAW PRIVATE KEYS**

The Web3 alpha is testnet-only. Production DeFi, bridge and OSA-native chain assets are not part of this slice.
