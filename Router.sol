// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IERC20
 * @dev Minimal ERC-20 interface used by the Router.
 */
interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/**
 * @title Router
 * @notice Lightweight AMM-style router that manages a single USD.Z / USDC liquidity pool.
 *         Supports adding / removing liquidity and bidirectional token swaps.
 *
 * Deployment constructor arguments
 * ---------------------------------
 *  _usdz   – address of the USD.Z ERC-20 token contract
 *  _usdc   – address of the USDC  ERC-20 token contract
 *  _feeBps – swap fee expressed in basis-points (e.g. 30 = 0.30 %)
 *
 * Tokens with different decimals (e.g. USD.Z with 18 decimals and USDC with
 * 6 decimals) are fully supported.  All amounts passed to this contract must
 * be expressed in each token's own base units.  Callers are responsible for
 * applying the correct decimal conversion before invoking any function.
 */
contract Router {

    // ─────────────────────────────────────────────────────────────
    //  State
    // ─────────────────────────────────────────────────────────────

    address public owner;

    IERC20 public immutable usdz;
    IERC20 public immutable usdc;

    uint256 public reserveUSDZ;
    uint256 public reserveUSDC;

    uint256 public feeBps;          // swap fee in basis-points
    uint256 public constant MAX_FEE_BPS = 1000; // 10 % cap

    bool public tradingEnabled;
    bool public liquidityInitialised;

    // LP-share accounting
    mapping(address => uint256) public lpShares;
    uint256 public totalShares;

    // ─────────────────────────────────────────────────────────────
    //  Events
    // ─────────────────────────────────────────────────────────────

    event LiquidityAdded(
        address indexed provider,
        uint256 usdzAmount,
        uint256 usdcAmount,
        uint256 sharesIssued
    );

    event LiquidityRemoved(
        address indexed provider,
        uint256 usdzAmount,
        uint256 usdcAmount,
        uint256 sharesBurned
    );

    event SwappedToUSDC(
        address indexed user,
        uint256 usdzIn,
        uint256 usdcOut
    );

    event SwappedToUSDZ(
        address indexed user,
        uint256 usdcIn,
        uint256 usdzOut
    );

    event TradingEnabled(bool status);
    event FeeUpdated(uint256 oldFeeBps, uint256 newFeeBps);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // ─────────────────────────────────────────────────────────────
    //  Modifiers
    // ─────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "Router: caller is not the owner");
        _;
    }

    modifier whenTradingEnabled() {
        require(tradingEnabled, "Router: trading is not enabled");
        _;
    }

    // ─────────────────────────────────────────────────────────────
    //  Constructor
    // ─────────────────────────────────────────────────────────────

    /**
     * @param _usdz   Address of the USD.Z token contract.
     * @param _usdc   Address of the USDC  token contract.
     * @param _feeBps Swap fee in basis-points (100 bps = 1 %).
     */
    constructor(address _usdz, address _usdc, uint256 _feeBps) {
        require(_usdz != address(0), "Router: zero address for USD.Z");
        require(_usdc != address(0), "Router: zero address for USDC");
        require(_feeBps <= MAX_FEE_BPS, "Router: fee exceeds maximum");

        owner  = msg.sender;
        usdz   = IERC20(_usdz);
        usdc   = IERC20(_usdc);
        feeBps = _feeBps;
    }

    // ─────────────────────────────────────────────────────────────
    //  Liquidity management
    // ─────────────────────────────────────────────────────────────

    /**
     * @notice Deposit the very first liquidity into the pool.
     *         Can only be called once by the owner.
     * @param usdzAmount Amount of USD.Z to deposit (in token base units).
     * @param usdcAmount Amount of USDC  to deposit (in token base units).
     *
     * Before calling, the owner must approve this contract to spend at least
     * `usdzAmount` USD.Z and `usdcAmount` USDC.
     */
    function addInitialLiquidity(uint256 usdzAmount, uint256 usdcAmount)
        external
        onlyOwner
    {
        require(!liquidityInitialised, "Router: liquidity already initialised");
        require(usdzAmount > 0 && usdcAmount > 0, "Router: amounts must be > 0");

        liquidityInitialised = true;

        usdz.transferFrom(msg.sender, address(this), usdzAmount);
        usdc.transferFrom(msg.sender, address(this), usdcAmount);

        reserveUSDZ = usdzAmount;
        reserveUSDC = usdcAmount;

        // Seed LP shares proportional to geometric mean (sqrt(a*b))
        uint256 shares = _sqrt(usdzAmount * usdcAmount);
        require(shares > 0, "Router: insufficient initial liquidity");

        lpShares[msg.sender] = shares;
        totalShares = shares;

        emit LiquidityAdded(msg.sender, usdzAmount, usdcAmount, shares);
    }

    /**
     * @notice Add additional liquidity proportional to the current pool ratio.
     * @param usdzAmount Desired USD.Z amount. The contract calculates the
     *                   proportional USDC amount automatically.
     *
     * The caller must approve this contract to spend at least `usdzAmount`
     * USD.Z and the computed USDC amount.
     */
    function addLiquidity(uint256 usdzAmount) external whenTradingEnabled {
        require(liquidityInitialised, "Router: pool not initialised");
        require(usdzAmount > 0, "Router: amount must be > 0");

        // Proportional USDC required — multiply before divide to preserve precision
        uint256 usdcAmount = (usdzAmount * reserveUSDC) / reserveUSDZ;
        require(usdcAmount > 0, "Router: USDC amount rounds to zero");

        usdz.transferFrom(msg.sender, address(this), usdzAmount);
        usdc.transferFrom(msg.sender, address(this), usdcAmount);

        uint256 shares = (usdzAmount * totalShares) / reserveUSDZ;
        require(shares > 0, "Router: shares round to zero");

        reserveUSDZ += usdzAmount;
        reserveUSDC += usdcAmount;
        lpShares[msg.sender] += shares;
        totalShares += shares;

        emit LiquidityAdded(msg.sender, usdzAmount, usdcAmount, shares);
    }

    /**
     * @notice Remove liquidity by burning LP shares.
     * @param shares Number of LP shares to burn.
     *
     * The caller receives USD.Z and USDC proportional to their share of the pool.
     */
    function removeLiquidity(uint256 shares) external {
        require(shares > 0, "Router: shares must be > 0");
        require(lpShares[msg.sender] >= shares, "Router: insufficient LP shares");

        uint256 usdzOut = (shares * reserveUSDZ) / totalShares;
        uint256 usdcOut = (shares * reserveUSDC) / totalShares;

        require(usdzOut > 0 && usdcOut > 0, "Router: insufficient liquidity burned");

        lpShares[msg.sender] -= shares;
        totalShares -= shares;
        reserveUSDZ -= usdzOut;
        reserveUSDC -= usdcOut;

        usdz.transfer(msg.sender, usdzOut);
        usdc.transfer(msg.sender, usdcOut);

        emit LiquidityRemoved(msg.sender, usdzOut, usdcOut, shares);
    }

    // ─────────────────────────────────────────────────────────────
    //  Swap functions
    // ─────────────────────────────────────────────────────────────

    /**
     * @notice Swap USD.Z → USDC.
     * @param usdzIn   Exact amount of USD.Z to send.
     * @param minUsdcOut Minimum USDC to receive (slippage guard).
     *
     * Uses the constant-product formula: (x + Δx·(1 − fee)) · (y − Δy) = x · y
     */
    function swapToUSDC(uint256 usdzIn, uint256 minUsdcOut)
        external
        whenTradingEnabled
        returns (uint256 usdcOut)
    {
        require(usdzIn > 0, "Router: input amount must be > 0");

        usdcOut = _getAmountOut(usdzIn, reserveUSDZ, reserveUSDC);
        require(usdcOut >= minUsdcOut, "Router: slippage exceeded");

        usdz.transferFrom(msg.sender, address(this), usdzIn);
        usdc.transfer(msg.sender, usdcOut);

        reserveUSDZ += usdzIn;
        reserveUSDC -= usdcOut;

        emit SwappedToUSDC(msg.sender, usdzIn, usdcOut);
    }

    /**
     * @notice Swap USDC → USD.Z.
     * @param usdcIn   Exact amount of USDC to send.
     * @param minUsdzOut Minimum USD.Z to receive (slippage guard).
     */
    function swapToUSDZ(uint256 usdcIn, uint256 minUsdzOut)
        external
        whenTradingEnabled
        returns (uint256 usdzOut)
    {
        require(usdcIn > 0, "Router: input amount must be > 0");

        usdzOut = _getAmountOut(usdcIn, reserveUSDC, reserveUSDZ);
        require(usdzOut >= minUsdzOut, "Router: slippage exceeded");

        usdc.transferFrom(msg.sender, address(this), usdcIn);
        usdz.transfer(msg.sender, usdzOut);

        reserveUSDC += usdcIn;
        reserveUSDZ -= usdzOut;

        emit SwappedToUSDZ(msg.sender, usdcIn, usdzOut);
    }

    // ─────────────────────────────────────────────────────────────
    //  View helpers
    // ─────────────────────────────────────────────────────────────

    /**
     * @notice Quote how much USDC you receive for `usdzIn` USD.Z.
     */
    function quoteSwapToUSDC(uint256 usdzIn) external view returns (uint256) {
        return _getAmountOut(usdzIn, reserveUSDZ, reserveUSDC);
    }

    /**
     * @notice Quote how much USD.Z you receive for `usdcIn` USDC.
     */
    function quoteSwapToUSDZ(uint256 usdcIn) external view returns (uint256) {
        return _getAmountOut(usdcIn, reserveUSDC, reserveUSDZ);
    }

    /**
     * @notice Returns the current pool reserves.
     */
    function getReserves() external view returns (uint256 _reserveUSDZ, uint256 _reserveUSDC) {
        _reserveUSDZ = reserveUSDZ;
        _reserveUSDC = reserveUSDC;
    }

    /**
     * @notice Returns the LP share balance of `account`.
     */
    function getLPShares(address account) external view returns (uint256) {
        return lpShares[account];
    }

    // ─────────────────────────────────────────────────────────────
    //  Owner administration
    // ─────────────────────────────────────────────────────────────

    /**
     * @notice Enable or disable trading (swaps and liquidity additions).
     * @param _enabled Pass `true` to enable, `false` to disable.
     */
    function enableTrading(bool _enabled) external onlyOwner {
        tradingEnabled = _enabled;
        emit TradingEnabled(_enabled);
    }

    /**
     * @notice Update the swap fee.
     * @param _feeBps New fee in basis-points (e.g. 30 = 0.30 %). Cannot exceed MAX_FEE_BPS.
     */
    function updateFee(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= MAX_FEE_BPS, "Router: fee exceeds maximum");
        emit FeeUpdated(feeBps, _feeBps);
        feeBps = _feeBps;
    }

    /**
     * @notice Transfer contract ownership to a new address.
     * @param newOwner The address that will become the new owner.
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Router: new owner is the zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    // ─────────────────────────────────────────────────────────────
    //  Internal helpers
    // ─────────────────────────────────────────────────────────────

    /**
     * @dev Constant-product AMM output calculation with fee deduction.
     *      amountOut = (amountIn * (10000 - feeBps) * reserveOut)
     *                  / (reserveIn * 10000 + amountIn * (10000 - feeBps))
     */
    function _getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) internal view returns (uint256 amountOut) {
        require(reserveIn > 0 && reserveOut > 0, "Router: insufficient liquidity");
        uint256 amountInWithFee = amountIn * (10_000 - feeBps);
        uint256 numerator       = amountInWithFee * reserveOut;
        uint256 denominator     = reserveIn * 10_000 + amountInWithFee;
        amountOut = numerator / denominator;
    }

    /**
     * @dev Integer square-root (Babylonian method).
     */
    function _sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
}
