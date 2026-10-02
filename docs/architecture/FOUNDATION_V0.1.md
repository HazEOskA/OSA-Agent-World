# Foundation V0.1 — TASK 01–05

## Scope

Implemented:

- monorepo skeleton,
- chain-independent domain model,
- canonical IDs and state invariants,
- deterministic event serialization + SHA-256 payload digest,
- PostgreSQL/Drizzle schema,
- migration / seed / rollback,
- `ChainAdapter`,
- `InMemoryChainAdapter`,
- contract tests.

Explicitly not implemented:

- Solana programs,
- Solana adapter,
- wallet signer,
- runtime execution,
- APR bridge,
- settlement service,
- reputation engine,
- frontend,
- deployment.

## Boundary

```text
domain
  ↑
chain-adapter interface
  ↑
future chain implementations
```

The domain package contains no blockchain, database, HTTP or framework imports.

## Proof rule

`payloadDigest = SHA256(canonical_json(payload))`

Object keys are sorted recursively before hashing, making event payload digests reproducible.
