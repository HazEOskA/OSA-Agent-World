# OSA Crypto World — World Shell V0.1

## Scope

This slice closes TASK 06–13 on top of the already-present foundation.

Implemented:

- protocol adapter interfaces for wallet / DEX / bridge / nodes,
- correlation-aware observability primitives,
- Next.js world application,
- custom procedural WebGL scene built with Three.js / React Three Fiber,
- World Entry,
- Central Nexus,
- Agent District,
- DeFi District,
- Bridge Tower,
- Proof Lab,
- teleport camera + transition system,
- protocol-driven World State reducer,
- desktop and mobile layouts,
- reduced-motion fallback,
- explicit REAL vs SIMULATED labels.

## Visual rule

No stock imagery is used.

The alpha world is generated from project-owned geometry, lighting, motion, typography, gradients and protocol UI primitives.

## Truth boundary

The World Shell and teleport state are real application behavior.

The economy, bridge operations, DeFi state and agent activity shown in this slice are explicitly **SIMULATED** until their later protocol phases are implemented.

## Architecture boundary

```text
WORLD
  ↓
PROTOCOL ADAPTERS
  ↓
future real / testnet / simulation implementations
```

The World Client must not know which concrete chain, bridge or DEX implementation is behind an adapter.

## Acceptance

```text
ENTER WORLD
→ CENTRAL NEXUS
→ TELEPORT AGENT
→ TELEPORT DEFI
→ TELEPORT BRIDGE
→ TELEPORT PROOF
→ RETURN NEXUS
```

Desktop and mobile are both first-class targets.
