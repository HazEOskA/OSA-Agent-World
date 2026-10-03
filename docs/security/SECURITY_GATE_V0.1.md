# OSA Crypto World — Security Gate V0.1

Release gate invariants:

- TESTNET only for external chain execution.
- No raw private keys embedded in source.
- Agent never receives signer authority.
- LLM/runtime cannot release settlement.
- Settlement requires a VERIFIED proof.
- Proof requires mission / execution / agent / evidence binding.
- Reputation is event-derived, not user-editable.
- Bridge completion requires destination redemption.
- SIMULATED / TESTNET / REAL labels must remain explicit.
- Production mainnet, real OSA token and permissionless validator claims are forbidden in V0.1.

The executable gate lives in `@osa/security-core` and is exercised by the release E2E test.

HTTP hardening on the World app:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- strict referrer policy
- camera / microphone / geolocation disabled by Permissions Policy

Wallet signing remains browser-controlled.
