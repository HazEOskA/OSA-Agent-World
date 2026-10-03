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
