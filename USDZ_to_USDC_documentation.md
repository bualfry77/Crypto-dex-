# USD.Z ↔ USDC Router — Documentation

## Overview

`Router.sol` is a self-contained, auditable Solidity smart contract that enables
trustless 1-to-1 swapping between **USD.Z** and **USDC** on any EVM-compatible
chain (Ethereum, BSC, Polygon, …).

The contract is written for **Solidity ≥ 0.8.20** and requires no external
libraries (no OpenZeppelin dependency), making deployment straightforward from
any IDE or CLI tool.

---

## Contract Address (after deployment)

| Network | Contract Address |
|---------|-----------------|
| Ethereum Mainnet | _deploy & fill in_ |
| BSC Mainnet | _deploy & fill in_ |
| Ethereum Sepolia (testnet) | _deploy & fill in_ |

---

## Key Features

| Feature | Details |
|---------|---------|
| **Swap USD.Z → USDC** | `swapToUSDC(uint256 usdzIn)` |
| **Swap USDC → USD.Z** | `swapToUSDZ(uint256 usdcIn)` |
| **Fee mechanism** | Default **1 %** (100 bps). Adjustable by owner, capped at 10 %. |
| **Liquidity — initial** | `addInitialLiquidity(usdzAmount, usdcAmount)` — one-time setup |
| **Liquidity — add more** | `addLiquidity(usdzAmount, usdcAmount)` |
| **Liquidity — remove** | `removeLiquidity(usdzAmount, usdcAmount)` |
| **Enable trading** | `enableTrading()` — owner only |
| **Disable trading** | `disableTrading()` — owner only |
| **Update fee** | `setFee(newFeeBasisPoints)` — owner only |
| **Transfer ownership** | `transferOwnership(newOwner)` |
| **Quote helpers** | `getUSDCAmountOut(usdzIn)`, `getUSDZAmountOut(usdcIn)` |

---

## Deployment

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `_usdzToken` | `address` | Address of the USD.Z ERC-20 token on the target chain |
| `_usdcToken` | `address` | Address of the USDC ERC-20 token on the target chain |
| `_feeBasisPoints` | `uint256` | Initial swap fee in basis points (e.g. `100` = 1 %) |

### Ethereum Mainnet — known USDC address

```
0xA0b86991c6218b36c1d19D4a2e9EB0cE3606eB48
```

### Using Remix IDE

1. Open [Remix IDE](https://remix.ethereum.org/).
2. In **File Explorer** → **Upload** → select `Router.sol`.
3. Go to **Solidity Compiler**, select version **0.8.20+**, click **Compile Router.sol**.
4. Go to **Deploy & Run Transactions**:
   - Environment: **Injected Provider** (connects to MetaMask / SafePal browser wallet).
   - Select the correct network in your wallet (Ethereum Mainnet, BSC, etc.).
   - In the **Deploy** input box enter:
     ```
     "<USD.Z_ADDRESS>", "<USDC_ADDRESS>", 100
     ```
   - Click **Deploy** and confirm in your wallet.
5. Copy the deployed contract address — you will need it for the next steps.

---

## Post-Deployment Setup

### 1 — Approve tokens

Before adding liquidity the router must be approved to spend your tokens.
Call `approve(routerAddress, amount)` on both the USD.Z contract and the USDC
contract from your wallet / Remix.

The router automatically reads each token's `decimals()` at construction time and
derives a `scalingFactor` (`10 ** |usdzDecimals - usdcDecimals|`). All swap
amounts are normalized before exchange so that USD 1.00 worth of USD.Z always
maps to USD 1.00 worth of USDC regardless of token precision.

Example with **USD.Z (18 dec) ↔ USDC (6 dec)** — scalingFactor = `10^12`:
- Swap **1 USD.Z** (`1e18` wei) → receives **1 USDC** (`1e6` wei) minus fee.
- Swap **1 USDC** (`1e6` wei) → receives **1 USD.Z** (`1e18` wei) minus fee.

### 2 — Add initial liquidity

Call `addInitialLiquidity` with the desired amounts (18 decimals for USD.Z,
6 decimals for USDC unless your USD.Z uses 6 decimals too).

Example — 100 000 USD.Z (18 decimals) + 100 000 USDC (6 decimals):

```
usdzAmount = 100000 * 10**18  = 100000000000000000000000
usdcAmount = 100000 * 10**6   = 100000000000
```

### 3 — Enable trading

```solidity
enableTrading()   // owner only
```

After this call any user can swap tokens.

---

## Swap Flow

### USD.Z → USDC

```
User calls: swapToUSDC(usdzIn)
  1. Pre-condition: user has approved router for ≥ usdzIn USD.Z
  2. Router deducts fee:  fee = usdzIn * feeBasisPoints / 10000
  3. usdzNetIn = usdzIn - fee
  4. Convert to USDC units: usdcOut = usdzNetIn / scalingFactor
     (scalingFactor = 10^(usdzDecimals - usdcDecimals), e.g. 10^12 for 18↔6)
  5. USD.Z transferred from user → router
  6. USDC transferred from router → user
  Emits: SwappedToUSDC(user, usdzIn, usdcOut, fee)
```

### USDC → USD.Z

```
User calls: swapToUSDZ(usdcIn)
  1. Pre-condition: user has approved router for ≥ usdcIn USDC
  2. Router deducts fee:  fee = usdcIn * feeBasisPoints / 10000
  3. usdcNetIn = usdcIn - fee
  4. Convert to USD.Z units: usdzOut = usdcNetIn * scalingFactor
     (scalingFactor = 10^(usdzDecimals - usdcDecimals), e.g. 10^12 for 18↔6)
  5. USDC transferred from user → router
  6. USD.Z transferred from router → user
  Emits: SwappedToUSDZ(user, usdcIn, usdzOut, fee)
```

---

## Using with SafePal

1. Open SafePal → **DApp Browser** → navigate to [Remix IDE](https://remix.ethereum.org/).
2. Connect SafePal wallet (choose **Injected Provider** in Remix).
3. Select **Ethereum Mainnet** (or BSC) in SafePal network settings.
4. Follow the deployment & setup steps above — all wallet actions will appear
   as SafePal signing requests.

---

## Owner Functions Reference

| Function | Description |
|----------|-------------|
| `transferOwnership(address)` | Transfer contract ownership |
| `enableTrading()` | Allow public swaps |
| `disableTrading()` | Pause public swaps |
| `setFee(uint256)` | Update fee (max 10 % / 1_000 bps) |
| `addInitialLiquidity(uint256, uint256)` | Seed the pool (one-time) |
| `addLiquidity(uint256, uint256)` | Add more liquidity |
| `removeLiquidity(uint256, uint256)` | Withdraw liquidity |

---

## Events

| Event | Emitted when |
|-------|-------------|
| `OwnershipTransferred(prev, next)` | Ownership transferred |
| `TradingEnabled(by)` | Trading enabled |
| `TradingDisabled(by)` | Trading disabled |
| `FeeUpdated(prevBps, newBps)` | Fee changed |
| `LiquidityAdded(by, usdzAmt, usdcAmt)` | Liquidity added |
| `LiquidityRemoved(by, usdzAmt, usdcAmt)` | Liquidity removed |
| `SwappedToUSDC(user, usdzIn, usdcOut, fee)` | USD.Z → USDC swap |
| `SwappedToUSDZ(user, usdcIn, usdzOut, fee)` | USDC → USD.Z swap |

---

## Security Notes

- The contract uses **safe transfer helpers** to handle non-standard ERC-20
  tokens that do not return a boolean (e.g. USDT-style).
- The fee is **capped at 10 %** in the contract code to prevent accidental
  or malicious fee increases.
- Trading is **disabled by default** — owner must explicitly call
  `enableTrading()` after funding the pool.
- Always test on a public testnet (Sepolia, BSC Testnet) before mainnet
  deployment.

---

## License

MIT
