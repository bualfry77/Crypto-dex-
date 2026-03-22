# Crypto DEX Router — USD.Z ⇄ USDC

A lightweight AMM-style router contract that manages a single **USD.Z / USDC** liquidity pool on Ethereum or Binance Smart Chain (BSC).  
It supports bidirectional token swaps, liquidity provision, and owner-controlled trading parameters.

---

## Table of Contents

1. [Contract Overview](#1-contract-overview)  
2. [Setting Up the Router](#2-setting-up-the-router)  
3. [Adding Tokens to Your Wallet](#3-adding-tokens-to-your-wallet)  
4. [Liquidity Management](#4-liquidity-management)  
5. [Token Swapping](#5-token-swapping)  
6. [Testing on Testnets](#6-testing-on-testnets)  
7. [Advanced Configuration](#7-advanced-configuration)  
8. [Contract ABI Quick Reference](#8-contract-abi-quick-reference)  
9. [Deployed Addresses](#9-deployed-addresses)  
10. [Security Notes](#10-security-notes)  

---

## 1. Contract Overview

| Feature | Detail |
|---|---|
| Language | Solidity `^0.8.20` |
| License | MIT |
| Swap mechanism | Constant-product AMM (x · y = k) |
| Fee model | Configurable basis-points fee (default: 30 bps = 0.30 %) |
| Networks | Ethereum Mainnet, BSC Mainnet, and compatible testnets |

### Key functions

| Function | Description |
|---|---|
| `addInitialLiquidity` | Seed the pool for the first time (owner only) |
| `addLiquidity` | Add proportional liquidity after pool is seeded |
| `removeLiquidity` | Withdraw liquidity by burning LP shares |
| `swapToUSDC` | Swap USD.Z → USDC |
| `swapToUSDZ` | Swap USDC → USD.Z |
| `enableTrading` | Enable / disable all swaps (owner only) |
| `updateFee` | Change the swap fee in basis-points (owner only) |
| `transferOwnership` | Transfer contract ownership (owner only) |
| `getReserves` | Read current pool reserves |
| `quoteSwapToUSDC` | Preview output for a USD.Z → USDC swap |
| `quoteSwapToUSDZ` | Preview output for a USDC → USD.Z swap |

---

## 2. Setting Up the Router

### Prerequisites

- **Remix IDE** — [https://remix.ethereum.org](https://remix.ethereum.org)  
- A Web3 wallet: **MetaMask** or **SafePal** connected to Remix via *Injected Provider (Web3)*.  
- Enough native token for gas:
  - **ETH** for Ethereum (approx. 0.02–0.05 ETH for deployment)  
  - **BNB** for Binance Smart Chain (approx. 0.01–0.02 BNB for deployment)

### Step-by-step deployment

#### Step 1 — Open Remix and load the contract

1. Go to [https://remix.ethereum.org](https://remix.ethereum.org).
2. In the *File Explorer* panel, click **+** to create a new file named `Router.sol`.
3. Paste the full content of `Router.sol` from this repository into the editor.

#### Step 2 — Compile the contract

1. Click the **Solidity Compiler** tab (icon looks like `<S>`).
2. Select compiler version **0.8.20** (or newer `0.8.x`).
3. Enable **Optimization** (200 runs) for lower gas costs.
4. Click **Compile Router.sol**.  
   ✅ No errors should appear.

#### Step 3 — Connect your wallet

1. In MetaMask or SafePal, switch to the target network:
   - Ethereum Mainnet, or  
   - Binance Smart Chain Mainnet.
2. In Remix, click the **Deploy & Run Transactions** tab (rocket icon).
3. Set *Environment* to **Injected Provider — MetaMask** (or SafePal DApp browser).
4. Your wallet address should appear under *Account*.

#### Step 4 — Deploy the Router

1. Under *Contract*, select **Router**.
2. Expand the **Deploy** input fields and enter the three constructor arguments:

| Parameter | Value |
|---|---|
| `_usdz` | USD.Z token contract address (see [§9 Deployed Addresses](#9-deployed-addresses)) |
| `_usdc` | USDC token contract address (see [§9 Deployed Addresses](#9-deployed-addresses)) |
| `_feeBps` | `30` (= 0.30 %) — or your preferred fee |

3. Click **Deploy** and confirm the transaction in your wallet.
4. After the transaction is mined, copy the **Router contract address** shown in Remix under *Deployed Contracts*.

> **Important:** Save the Router contract address. You will need it for every subsequent interaction.

---

## 3. Adding Tokens to Your Wallet

Before interacting with the contract you must add USD.Z and USDC as custom tokens in your wallet so their balances are visible.

### MetaMask

1. Open MetaMask → select the correct network.  
2. Scroll to the bottom of the *Tokens* tab and click **Import tokens**.  
3. Select the *Custom Token* tab.  
4. Paste the token contract address (USD.Z or USDC — see [§9](#9-deployed-addresses)).  
5. The *Token Symbol* and *Token Decimal* fields should auto-fill.  
6. Click **Add Custom Token** → **Import Tokens**.

### SafePal

1. Open the SafePal app.  
2. Tap the **+** button on the home screen (or go to *Assets* → *Manage*).  
3. Tap **Add Custom Token**.  
4. Select the correct network (Ethereum or BSC).  
5. Paste the token contract address.  
6. Confirm and save.

> After adding the tokens, make sure you have a balance of both USD.Z and USDC before proceeding with liquidity or swap operations.

---

## 4. Liquidity Management

### 4.1 Approve token spending

Before depositing tokens into the Router you must **approve** it to spend them.

**Using Remix:**

1. In *Deployed Contracts*, expand the **USD.Z** token contract (load it with its ABI).
2. Call the `approve` function:
   ```
   spender : <Router contract address>
   amount  : <amount in base units, e.g. 100000000000000000000000 for 100,000 tokens with 18 decimals>
   ```
3. Confirm the transaction.
4. Repeat for the **USDC** token contract.

### 4.2 Add initial liquidity (`addInitialLiquidity`)

This function seeds the pool for the first time. It can only be called **once** by the **owner**.

**Function signature:**
```solidity
function addInitialLiquidity(uint256 usdzAmount, uint256 usdcAmount) external
```

**Parameters:**

| Parameter | Description | Example |
|---|---|---|
| `usdzAmount` | USD.Z to deposit in base units (18 decimals) | `100000000000000000000000` (= 100,000 USD.Z) |
| `usdcAmount` | USDC to deposit in base units (6 decimals) | `100000000` (= 100 USDC) |

**Example in Remix:**
1. In *Deployed Contracts*, expand the Router.
2. Find `addInitialLiquidity` and enter both amounts.
3. Click the function button and confirm the transaction.

**Example command (ethers.js):**
```js
const routerContract = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, signer);

// Approve first (if not already done)
await usdzToken.approve(ROUTER_ADDRESS, ethers.parseUnits("100000", 18));
await usdcToken.approve(ROUTER_ADDRESS, ethers.parseUnits("100", 6));

// Add initial liquidity
await routerContract.addInitialLiquidity(
  ethers.parseUnits("100000", 18),   // 100,000 USD.Z
  ethers.parseUnits("100", 6)        // 100 USDC
);
```

### 4.3 Add more liquidity (`addLiquidity`)

After the pool is seeded, any address can add proportional liquidity.

**Function signature:**
```solidity
function addLiquidity(uint256 usdzAmount) external
```

The contract automatically calculates the required USDC amount based on the current pool ratio.

**Example command (ethers.js):**
```js
const usdzIn = ethers.parseUnits("1000", 18); // 1,000 USD.Z

// Preview required USDC amount
const [reserveUSDZ, reserveUSDC] = await routerContract.getReserves();
const requiredUSDC = usdzIn * reserveUSDC / reserveUSDZ;

// Approve both tokens
await usdzToken.approve(ROUTER_ADDRESS, usdzIn);
await usdcToken.approve(ROUTER_ADDRESS, requiredUSDC + 1n); // +1 for rounding

await routerContract.addLiquidity(usdzIn);
```

### 4.4 Remove liquidity (`removeLiquidity`)

Burn LP shares to reclaim your proportion of the pool.

**Function signature:**
```solidity
function removeLiquidity(uint256 shares) external
```

**Steps:**
1. Check your LP share balance:
   ```js
   const myShares = await routerContract.getLPShares(myAddress);
   ```
2. Choose how many shares to burn (you can burn all or a portion).
3. Call `removeLiquidity`:
   ```js
   await routerContract.removeLiquidity(myShares); // remove all
   ```

**Example in Remix:**
1. Expand the Router in *Deployed Contracts*.
2. Find `removeLiquidity` and enter the number of shares.
3. Click the function button and confirm.

---

## 5. Token Swapping

Trading must be enabled (see [§7 Advanced Configuration](#7-advanced-configuration)) before swaps work.

### 5.1 Preview a swap (quote)

Always preview a swap before executing it to check the expected output and decide on a minimum acceptable amount.

```js
// How much USDC will I receive for 500 USD.Z?
const usdzIn  = ethers.parseUnits("500", 18);
const usdcOut = await routerContract.quoteSwapToUSDC(usdzIn);
console.log("Expected USDC:", ethers.formatUnits(usdcOut, 6));

// How much USD.Z will I receive for 50 USDC?
const usdcIn  = ethers.parseUnits("50", 6);
const usdzOut = await routerContract.quoteSwapToUSDZ(usdcIn);
console.log("Expected USD.Z:", ethers.formatUnits(usdzOut, 18));
```

### 5.2 Swap USD.Z → USDC (`swapToUSDC`)

**Function signature:**
```solidity
function swapToUSDC(uint256 usdzIn, uint256 minUsdcOut) external returns (uint256 usdcOut)
```

| Parameter | Description |
|---|---|
| `usdzIn` | Amount of USD.Z to swap (base units) |
| `minUsdcOut` | Minimum USDC to accept — protects against slippage. Use the quote minus a small % tolerance. |

**Example command (ethers.js):**
```js
const usdzIn     = ethers.parseUnits("500", 18);      // 500 USD.Z
const quoted     = await routerContract.quoteSwapToUSDC(usdzIn);
const slippage   = quoted * 99n / 100n;                // 1 % slippage tolerance
const minUsdcOut = slippage;

// Approve USD.Z spend
await usdzToken.approve(ROUTER_ADDRESS, usdzIn);

// Execute swap
const tx = await routerContract.swapToUSDC(usdzIn, minUsdcOut);
await tx.wait();
console.log("Swap complete");
```

**In Remix:**
1. Expand the Router in *Deployed Contracts*.
2. Open `swapToUSDC`.
3. Enter `usdzIn` (base units) and `minUsdcOut`.
4. Confirm the transaction.

### 5.3 Swap USDC → USD.Z (`swapToUSDZ`)

**Function signature:**
```solidity
function swapToUSDZ(uint256 usdcIn, uint256 minUsdzOut) external returns (uint256 usdzOut)
```

**Example command (ethers.js):**
```js
const usdcIn     = ethers.parseUnits("50", 6);         // 50 USDC
const quoted     = await routerContract.quoteSwapToUSDZ(usdcIn);
const minUsdzOut = quoted * 99n / 100n;                 // 1 % slippage tolerance

// Approve USDC spend
await usdcToken.approve(ROUTER_ADDRESS, usdcIn);

// Execute swap
const tx = await routerContract.swapToUSDZ(usdcIn, minUsdzOut);
await tx.wait();
console.log("Swap complete");
```

**In Remix:**
1. Open `swapToUSDZ`.
2. Enter `usdcIn` (base units) and `minUsdzOut`.
3. Confirm the transaction.

### 5.4 Swap scenario examples

#### Scenario A — User swaps 1,000 USD.Z for USDC

Pool state before swap: 100,000 USD.Z / 100 USDC, fee = 0.30 %

```
amountInWithFee = 1000 * (10000 - 30) = 9_970_000
numerator       = 9_970_000 * 100 = 997_000_000
denominator     = 100_000 * 10_000 + 9_970_000 = 1_009_970_000
usdcOut         ≈ 0.9872 USDC
```

#### Scenario B — User swaps 10 USDC for USD.Z

Pool state before swap: 100,000 USD.Z / 100 USDC, fee = 0.30 %

```
amountInWithFee = 10 * (10000 - 30) = 99_700
numerator       = 99_700 * 100_000 = 9_970_000_000
denominator     = 100 * 10_000 + 99_700 = 1_099_700
usdzOut         ≈ 9,066.6 USD.Z
```

---

## 6. Testing on Testnets

**Always test on a testnet before deploying to mainnet.**

### Recommended testnets

| Network | Chain ID | Faucet |
|---|---|---|
| Ethereum Sepolia | 11155111 | [https://sepoliafaucet.com](https://sepoliafaucet.com) |
| BSC Testnet | 97 | [https://testnet.bnbchain.org/faucet-smart](https://testnet.bnbchain.org/faucet-smart) |

### Steps to test on Sepolia (Ethereum)

#### 1. Add Sepolia to your wallet

In MetaMask:
- Network Name: `Sepolia Test Network`
- RPC URL: `https://rpc.sepolia.org`
- Chain ID: `11155111`
- Currency Symbol: `ETH`
- Block Explorer: `https://sepolia.etherscan.io`

#### 2. Get testnet ETH

Visit [https://sepoliafaucet.com](https://sepoliafaucet.com) and paste your wallet address to receive test ETH.

#### 3. Deploy mock ERC-20 tokens

You need mock USD.Z and USDC contracts. Use this minimal ERC-20:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockToken is ERC20 {
    uint8 private _dec;
    constructor(string memory name, string memory symbol, uint8 dec) ERC20(name, symbol) {
        _dec = dec;
        _mint(msg.sender, 10_000_000 * 10 ** dec);
    }
    function decimals() public view override returns (uint8) { return _dec; }
}
```

Deploy one instance as "USD.Z" and another as "USDC". Note both addresses.

#### 4. Deploy the Router on Sepolia

Follow the same steps as [§2](#2-setting-up-the-router), but select **Sepolia** as the network and use the mock token addresses.

#### 5. Run a full test cycle

```
1. addInitialLiquidity  — seed the pool
2. enableTrading(true)  — open trading
3. quoteSwapToUSDC      — preview a swap
4. swapToUSDC           — execute the swap
5. swapToUSDZ           — swap back
6. addLiquidity         — add more liquidity
7. removeLiquidity      — remove liquidity
8. enableTrading(false) — pause trading
```

Verify each step on [Sepolia Etherscan](https://sepolia.etherscan.io) by searching your Router contract address.

---

## 7. Advanced Configuration

### 7.1 Enable / disable trading (`enableTrading`)

The owner can pause or resume all swaps and liquidity additions.

**Function signature:**
```solidity
function enableTrading(bool _enabled) external onlyOwner
```

**Enable trading:**
```js
await routerContract.enableTrading(true);
```

**Disable trading (emergency pause):**
```js
await routerContract.enableTrading(false);
```

> `addInitialLiquidity` can always be called by the owner regardless of trading status.

### 7.2 Update swap fee (`updateFee`)

**Function signature:**
```solidity
function updateFee(uint256 _feeBps) external onlyOwner
```

| Fee (bps) | Fee (%) | When to use |
|---|---|---|
| `0` | 0.00 % | Promotional / zero-fee period |
| `10` | 0.10 % | Ultra-low fee |
| `30` | 0.30 % | Standard (default, similar to Uniswap v2) |
| `100` | 1.00 % | Higher fee for exotic pairs |
| `1000` | 10.00 % | Maximum allowed |

**Example:**
```js
// Set fee to 0.50 %
await routerContract.updateFee(50);
```

### 7.3 Transfer ownership (`transferOwnership`)

**Function signature:**
```solidity
function transferOwnership(address newOwner) external onlyOwner
```

```js
await routerContract.transferOwnership("0xNewOwnerAddress");
```

> ⚠️ This action is irreversible without the new owner's cooperation. Double-check the address before confirming.

### 7.4 Reading pool state

```js
// Current reserves
const [reserveUSDZ, reserveUSDC] = await routerContract.getReserves();

// Your LP shares
const myShares = await routerContract.getLPShares(myAddress);
const totalShares = await routerContract.totalShares();
const myPoolShare = myShares * 100n / totalShares; // percentage

// Fee and trading status
const feeBps = await routerContract.feeBps();
const tradingEnabled = await routerContract.tradingEnabled();
```

---

## 8. Contract ABI Quick Reference

Below are the most commonly used function signatures:

```json
[
  "function addInitialLiquidity(uint256 usdzAmount, uint256 usdcAmount) external",
  "function addLiquidity(uint256 usdzAmount) external",
  "function removeLiquidity(uint256 shares) external",
  "function swapToUSDC(uint256 usdzIn, uint256 minUsdcOut) external returns (uint256)",
  "function swapToUSDZ(uint256 usdcIn, uint256 minUsdzOut) external returns (uint256)",
  "function quoteSwapToUSDC(uint256 usdzIn) external view returns (uint256)",
  "function quoteSwapToUSDZ(uint256 usdcIn) external view returns (uint256)",
  "function getReserves() external view returns (uint256, uint256)",
  "function getLPShares(address account) external view returns (uint256)",
  "function enableTrading(bool _enabled) external",
  "function updateFee(uint256 _feeBps) external",
  "function transferOwnership(address newOwner) external",
  "function usdz() external view returns (address)",
  "function usdc() external view returns (address)",
  "function feeBps() external view returns (uint256)",
  "function tradingEnabled() external view returns (bool)",
  "function liquidityInitialised() external view returns (bool)",
  "function totalShares() external view returns (uint256)"
]
```

---

## 9. Deployed Addresses

### USDC (official addresses)

| Network | Address |
|---|---|
| Ethereum Mainnet | `0xA0b86991c6218b36c1d19D4a2e9EB0cE3606eB48` |
| BSC Mainnet | `0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d` |

> USD.Z is a custom token — use the address provided by the USD.Z project team, or the address of the contract you deployed yourself.

### Router

> Fill in the Router address after deployment.

| Network | Router Address |
|---|---|
| Ethereum Mainnet | *(deploy and record here)* |
| BSC Mainnet | *(deploy and record here)* |
| Ethereum Sepolia (testnet) | *(deploy and record here)* |
| BSC Testnet | *(deploy and record here)* |

---

## 10. Security Notes

- **Audit before mainnet.** This contract has not been professionally audited. Use at your own risk.
- **Slippage protection.** Always set a non-zero `minOut` value in swap calls to protect against front-running and sandwich attacks.
- **Ownership.** The deployer is the initial owner. Protect your private key — the owner can pause trading, change fees, and seed the pool.
- **Token approvals.** Only approve the exact amount needed. Unlimited approvals increase risk.
- **No flash-loan protection.** This is a simple AMM. For production use, consider adding reentrancy guards and price oracle integration.

---

## License

MIT — see [LICENSE](LICENSE).
