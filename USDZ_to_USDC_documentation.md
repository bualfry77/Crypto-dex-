# USD.Z ↔ USDC Swap Documentation

This document provides a focused reference for performing token swaps between **USD.Z** and **USDC** using the Router contract.

For full setup instructions, deployment steps, and advanced configuration, see the main [README.md](README.md).

---

## Quick-start checklist

- [ ] Router contract deployed (see README §2)
- [ ] USD.Z and USDC added to your wallet (see README §3)
- [ ] Initial liquidity added (see README §4)
- [ ] Trading enabled (`enableTrading(true)`)
- [ ] Both tokens approved for the Router address

---

## Swapping USD.Z → USDC

### 1. Approve USD.Z

Before swapping, approve the Router to spend your USD.Z tokens.

**In Remix:**
1. Load the USD.Z token contract using its address and the ERC-20 ABI.
2. Call `approve`:
   - `spender`: Router contract address
   - `amount`: amount in base units (e.g. `500000000000000000000` for 500 USD.Z with 18 decimals)

**ethers.js:**
```js
await usdzToken.approve(ROUTER_ADDRESS, ethers.parseUnits("500", 18));
```

### 2. Preview the swap (optional but recommended)

```js
const usdcOut = await router.quoteSwapToUSDC(ethers.parseUnits("500", 18));
console.log("You will receive:", ethers.formatUnits(usdcOut, 6), "USDC");
```

### 3. Execute the swap

**Function:**
```solidity
swapToUSDC(uint256 usdzIn, uint256 minUsdcOut) → uint256 usdcOut
```

**ethers.js example:**
```js
const usdzIn = ethers.parseUnits("500", 18);
const quoted = await router.quoteSwapToUSDC(usdzIn);
const minOut = quoted * 99n / 100n;  // 1 % slippage tolerance (accept ≥ 99 % of quoted output)

const tx = await router.swapToUSDC(usdzIn, minOut);
await tx.wait();
```

**Remix:**
- Open `swapToUSDC` in the Deployed Contracts panel.
- Enter `usdzIn` and `minUsdcOut`.
- Click the button and confirm in your wallet.

---

## Swapping USDC → USD.Z

### 1. Approve USDC

```js
await usdcToken.approve(ROUTER_ADDRESS, ethers.parseUnits("50", 6));
```

### 2. Preview the swap

```js
const usdzOut = await router.quoteSwapToUSDZ(ethers.parseUnits("50", 6));
console.log("You will receive:", ethers.formatUnits(usdzOut, 18), "USD.Z");
```

### 3. Execute the swap

**Function:**
```solidity
swapToUSDZ(uint256 usdcIn, uint256 minUsdzOut) → uint256 usdzOut
```

**ethers.js example:**
```js
const usdcIn = ethers.parseUnits("50", 6);
const quoted = await router.quoteSwapToUSDZ(usdcIn);
const minOut = quoted * 99n / 100n;  // 1 % slippage tolerance (accept ≥ 99 % of quoted output)

const tx = await router.swapToUSDZ(usdcIn, minOut);
await tx.wait();
```

---

## Fee calculation

The swap fee is deducted from the input amount before applying the constant-product formula:

```
effectiveInput = amountIn × (10,000 − feeBps) / 10,000
output         = effectiveInput × reserveOut / (reserveIn + effectiveInput)
```

With the default fee of **30 bps (0.30 %)**:

| Input | Direction | Approx. output (at 1:1 price parity) |
|---|---|---|
| 100 USD.Z | → USDC | ≈ 99.70 USDC |
| 100 USDC | → USD.Z | ≈ 99.70 USD.Z |

Actual output depends on current pool reserves and prior trading activity.

---

## Verifying token balances via the Router

You can verify that the Router holds the correct token balances at any time:

```js
const [reserveUSDZ, reserveUSDC] = await router.getReserves();
console.log("Pool USD.Z:", ethers.formatUnits(reserveUSDZ, 18));
console.log("Pool USDC:", ethers.formatUnits(reserveUSDC, 6));
```

To verify your own LP share of the pool:

```js
const myShares    = await router.getLPShares(myAddress);
const totalShares = await router.totalShares();
const pctShare    = Number(myShares * 10000n / totalShares) / 100;
console.log(`Your pool share: ${pctShare.toFixed(2)} %`);
```

---

For full documentation, see [README.md](README.md).
