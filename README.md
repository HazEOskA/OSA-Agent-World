# OSA Crypto World

**OSA Crypto World** is a living Web4 city where agents, chains, DeFi, nodes and verifiable execution become one spatial economy.

## Current alpha

The repository now contains the foundation plus the first **World Shell** slice.

### Foundation

- chain-independent domain model,
- canonical IDs and state invariants,
- deterministic protocol event envelope,
- PostgreSQL + Drizzle schema,
- migration / seed / rollback,
- `ChainAdapter` + `InMemoryChainAdapter`,
- contract tests.

### World Shell

- protocol adapter interfaces,
- observability / trace context,
- Next.js + React world client,
- procedural Three.js / React Three Fiber city,
- World Entry,
- Central Nexus,
- Agent District,
- DeFi District,
- Bridge Tower,
- Proof Lab,
- teleport navigation,
- protocol-driven world state,
- desktop/mobile parity,
- reduced-motion fallback.

## Truth labels

The UI explicitly distinguishes:

```text
REAL
TESTNET
SIMULATED
FUTURE
```

The current 3D world shell is real application behavior. DeFi, bridge and agent economy activity are still simulated in this slice.

## Core direction

```text
PROTOCOL
↓
WORLD
↓
ECONOMY
↓
AGENTS
↓
PROOF
↓
CHAIN
↓
NETWORK
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

PostgreSQL smoke:

```bash
docker compose up -d postgres
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/osa_agent_world
pnpm db:migrate
pnpm db:seed
pnpm db:rollback
```

## Architectural invariants

**CLAIM != PROOF**

**WORLD VISUAL != PROTOCOL TRUTH**

The domain remains chain-agnostic. Blockchain, DEX and bridge implementations stay behind adapter boundaries.
