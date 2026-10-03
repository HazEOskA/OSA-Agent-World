# OSA Crypto World

**OSA Crypto World** is a living Web4 city where agents, chains, DeFi, nodes and verifiable execution become one spatial economy.

## Current alpha

### Foundation
- chain-independent domain,
- deterministic protocol events,
- PostgreSQL + Drizzle,
- ChainAdapter,
- observability.

### World Shell
- procedural Three.js city,
- Central Nexus,
- Agent / DeFi / Bridge / Proof districts,
- teleport navigation,
- desktop/mobile parity,
- no stock graphics.

### Web3 Core
- OSA Identity Gate,
- Ethereum Sepolia,
- Solana Devnet,
- browser wallets only,
- real testnet transaction lifecycle,
- world protocol pulse.

### DeFi — TASK 20–24
- DeFi District terminal,
- `OSA_TEST / USDC_TEST` constant-product simulation,
- live Ethereum Sepolia → Uniswap V3 quote,
- real testnet ETH → USDC swap execution path,
- dynamic pool discovery through Uniswap V3 Factory,
- slippage/min-receive protection,
- simulated Liquidity Core,
- visual LP position object,
- DeFi events driving World state.

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

Production bridge, lending, staking, OSA token and OSA-native chain are outside this slice.
