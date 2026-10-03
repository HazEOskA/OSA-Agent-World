# OSA Crypto World

**OSA Crypto World** is a living Web4 city where agents, chains, DeFi, bridges, nodes and verifiable execution become one spatial economy.

## Current alpha

### Foundation
- chain-independent domain,
- deterministic protocol events,
- PostgreSQL + Drizzle,
- adapters,
- observability.

### World Shell
- procedural Three.js city,
- Central Nexus,
- Agent / DeFi / Bridge / Proof districts,
- teleport navigation,
- desktop/mobile parity.

### Web3 Core
- OSA Identity Gate,
- Ethereum Sepolia,
- Solana Devnet,
- browser wallet signing,
- real testnet transaction lifecycle.

### DeFi
- OSA AMM simulation,
- Sepolia Uniswap V3 quote + swap path,
- Liquidity Core,
- LP position visualization.

### Bridge — TASK 25–29
- Bridge Tower,
- reusable Bridge Trace state model,
- full simulation trace,
- Wormhole WTT testnet adapter,
- Arbitrum Sepolia → Base Sepolia reference route,
- source transaction,
- VAA / attestation stage,
- destination redeem,
- complete cross-chain trace,
- World pulse on bridge completion.

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

**SIMULATION != LIQUIDITY**

**SOURCE TX != BRIDGE COMPLETE**

Production bridge security, mainnet assets and OSA-native bridge infrastructure remain outside this slice.
