# OSA Crypto World — DeFi V0.1

## Scope

TASK 20–24:

- DeFi District terminal,
- OSA swap simulation,
- real Sepolia quote + swap path,
- Liquidity Core,
- position visualization.

## Two truth modes

### SIMULATED

`@osa/defi-core` implements a browser-safe constant-product AMM model for:

- `OSA_TEST / USDC_TEST`,
- quote generation,
- slippage floor,
- fee calculation,
- price impact,
- deterministic simulated LP positions.

No asset value is moved.

### Coco Swap simulation

The Coco terminal uses integer base units (OSA_TEST: 18 decimals; USDC_TEST: 6)
for quotes, swaps and simulated LP deposits and withdrawals. Swap and LP
operations include minimum-output limits; excess amounts in an unbalanced LP
deposit are not added to the pool. The UI's virtual pool and LP position remain
in the current browser session only.

For each operation, the API recalculates the result and produces an L3_DEFI
block using a fresh in-memory OSA devnet instance. The displayed transaction
and block hash describe that temporary model: they are not persisted, anchored,
shared with the chain explorer, or proof of an on-chain settlement. The
request supplies its own simulated pool and LP state and is not an
authoritative account ledger. No Coco token or Solidity contract is deployed.

### TESTNET

`@osa/defi-uniswap` integrates Ethereum Sepolia with Uniswap V3.

Current verified contract boundaries:

- Uniswap V3 Factory,
- QuoterV2,
- SwapRouter02,
- WETH9,
- Circle testnet USDC.

The runtime does not hardcode a pool address. It asks the factory for the first available WETH/USDC pool across supported fee tiers, then obtains a quote from QuoterV2.

## Live swap flow

```text
EVM IDENTITY
→ ETH AMOUNT
→ FACTORY POOL DISCOVERY
→ QUOTER V2
→ SHOW MIN RECEIVE
→ EXPLICIT WALLET SIGNATURE
→ SWAP ROUTER 02
→ SUBMITTED
→ CONFIRMED
→ WORLD PULSE
```

## Security

- Sepolia only.
- Explicit wallet approval.
- 50 bps default slippage bound.
- No private key storage.
- No mainnet path.
- No production LP deposit path.
- Liquidity positions remain explicitly SIMULATED in this slice.
