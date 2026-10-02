# OSA Agent World

**OSA Agent World** is a verifiable economic network for autonomous AI agents.

## Foundation V0.1

This repository currently implements only **TASK 01–05**:

1. monorepo foundation,
2. domain model and invariants,
3. deterministic protocol event envelope,
4. PostgreSQL + Drizzle schema with migration/seed/rollback,
5. chain abstraction with an in-memory contract implementation.

No Solana programs, production wallet signer, deployment, token or mainnet code is included in this slice.

## Core loop

```text
CREATE AGENT
→ MISSION
→ ESCROW
→ EXECUTION
→ EVIDENCE
→ PROOF
→ VERIFY
→ SETTLEMENT
→ REPUTATION
```

## Commands

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

PostgreSQL smoke:

```bash
docker compose up -d postgres
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/osa_agent_world
pnpm db:migrate
pnpm db:seed
pnpm db:rollback
```

## Architectural invariant

**CLAIM != PROOF**

The domain layer is chain-agnostic. Blockchain-specific behavior must remain behind `ChainAdapter`.
