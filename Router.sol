// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title USDZRouter
 * @notice A router contract for swapping between USD.Z and USDC tokens.
 *
 * Features:
 *  - Swap USD.Z → USDC and USDC → USD.Z with a configurable fee (default 1%).
 *  - Owner-controlled liquidity management (add / remove).
 *  - Owner-controlled trading enable / disable switch.
 *  - Owner-controlled fee updates (capped at 10%).
 *  - Full ERC-20 compatibility via a minimal interface; works on any EVM chain
 *    (Ethereum, BSC, Polygon, …).
 *
 * USDC on Ethereum Mainnet : 0xA0b86991c6218b36c1d19D4a2e9EB0cE3606eB48
 * Deploy with the addresses of your USD.Z token and the USDC token for the
 * target chain.
 */

/// @dev Minimal ERC-20 interface required by this router.
interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function decimals() external view returns (uint8);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract USDZRouter {
    // ─────────────────────────────────────────────────────────────
    //  State variables
    // ─────────────────────────────────────────────────────────────

    /// @notice Owner of the contract (deployer by default).
    address public owner;

    /// @notice The USD.Z token address.
    address public immutable usdzToken;

    /// @notice The USDC token address.
    address public immutable usdcToken;

    /// @notice Swap fee expressed in basis points (100 = 1 %).
    /// Maximum allowed value is 1 000 (10 %).
    uint256 public feeBasisPoints;

    /// @notice Whether swapping is currently enabled.
    bool public tradingEnabled;

    /// @notice Internal accounting of USD.Z reserves held by this router.
    uint256 public usdzReserve;

    /// @notice Internal accounting of USDC reserves held by this router.
    uint256 public usdcReserve;

    /// @notice Decimal places of the USD.Z token (e.g. 18).
    uint8 public immutable usdzDecimals;

    /// @notice Decimal places of the USDC token (e.g. 6).
    uint8 public immutable usdcDecimals;

    /**
     * @dev Scaling factor used when converting USD.Z amounts to USDC amounts.
     *      If USD.Z has more decimals than USDC, usdcOut = usdzIn / scalingFactor.
     *      If USDC has more decimals than USD.Z, usdcOut = usdzIn * scalingFactor.
     *      scalingFactor == 10 ** |usdzDecimals - usdcDecimals|
     */
    uint256 public immutable scalingFactor;

    /// @dev True when USD.Z has more (or equal) decimals than USDC.
    bool public immutable usdzHasMoreDecimals;

    // ─────────────────────────────────────────────────────────────
    //  Constants
    // ─────────────────────────────────────────────────────────────

    uint256 private constant FEE_DENOMINATOR = 10_000;
    uint256 private constant MAX_FEE_BPS     = 1_000; // 10 %

    // ─────────────────────────────────────────────────────────────
    //  Events
    // ─────────────────────────────────────────────────────────────

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event TradingEnabled(address indexed by);
    event TradingDisabled(address indexed by);
    event FeeUpdated(uint256 previousFeeBps, uint256 newFeeBps);
    event LiquidityAdded(address indexed by, uint256 usdzAmount, uint256 usdcAmount);
    event LiquidityRemoved(address indexed by, uint256 usdzAmount, uint256 usdcAmount);
    event SwappedToUSDC(address indexed user, uint256 usdzIn, uint256 usdcOut, uint256 feeCharged);
    event SwappedToUSDZ(address indexed user, uint256 usdcIn, uint256 usdzOut, uint256 feeCharged);

    // ─────────────────────────────────────────────────────────────
    //  Modifiers
    // ─────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "USDZRouter: caller is not the owner");
        _;
    }

    modifier whenTradingEnabled() {
        require(tradingEnabled, "USDZRouter: trading is currently disabled");
        _;
    }

    // ─────────────────────────────────────────────────────────────
    //  Constructor
    // ─────────────────────────────────────────────────────────────

    /**
     * @param _usdzToken   Address of the USD.Z ERC-20 token.
     * @param _usdcToken   Address of the USDC ERC-20 token.
     * @param _feeBasisPoints  Initial swap fee in basis points (e.g. 100 = 1 %).
     */
    constructor(
        address _usdzToken,
        address _usdcToken,
        uint256 _feeBasisPoints
    ) {
        require(_usdzToken != address(0), "USDZRouter: zero address for USD.Z");
        require(_usdcToken != address(0), "USDZRouter: zero address for USDC");
        require(_feeBasisPoints <= MAX_FEE_BPS, "USDZRouter: fee exceeds maximum");

        owner          = msg.sender;
        usdzToken      = _usdzToken;
        usdcToken      = _usdcToken;
        feeBasisPoints = _feeBasisPoints;
        tradingEnabled = false;

        // Determine decimal scaling between the two tokens.
        uint8 ud = IERC20(_usdzToken).decimals();
        uint8 uc = IERC20(_usdcToken).decimals();
        usdzDecimals = ud;
        usdcDecimals = uc;

        if (ud >= uc) {
            usdzHasMoreDecimals = true;
            scalingFactor = 10 ** (ud - uc);
        } else {
            usdzHasMoreDecimals = false;
            scalingFactor = 10 ** (uc - ud);
        }
    }

    // ─────────────────────────────────────────────────────────────
    //  Ownership
    // ─────────────────────────────────────────────────────────────

    /**
     * @notice Transfer ownership to a new address.
     * @param newOwner The address that will become the new owner.
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "USDZRouter: new owner is zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    // ─────────────────────────────────────────────────────────────
    //  Trading control
    // ─────────────────────────────────────────────────────────────

    /// @notice Enable swapping. Can only be called by the owner.
    function enableTrading() external onlyOwner {
        require(!tradingEnabled, "USDZRouter: trading already enabled");
        tradingEnabled = true;
        emit TradingEnabled(msg.sender);
    }

    /// @notice Disable swapping. Can only be called by the owner.
    function disableTrading() external onlyOwner {
        require(tradingEnabled, "USDZRouter: trading already disabled");
        tradingEnabled = false;
        emit TradingDisabled(msg.sender);
    }

    // ─────────────────────────────────────────────────────────────
    //  Fee management
    // ─────────────────────────────────────────────────────────────

    /**
     * @notice Update the swap fee.
     * @param newFeeBasisPoints New fee in basis points (max 1 000 = 10 %).
     */
    function setFee(uint256 newFeeBasisPoints) external onlyOwner {
        require(newFeeBasisPoints <= MAX_FEE_BPS, "USDZRouter: fee exceeds maximum");
        emit FeeUpdated(feeBasisPoints, newFeeBasisPoints);
        feeBasisPoints = newFeeBasisPoints;
    }

    // ─────────────────────────────────────────────────────────────
    //  Liquidity management
    // ─────────────────────────────────────────────────────────────

    /**
     * @notice Add liquidity to the router pool.
     * @dev    Caller must have pre-approved this contract for at least
     *         `usdzAmount` of USD.Z and `usdcAmount` of USDC.
     * @param usdzAmount Amount of USD.Z tokens to deposit.
     * @param usdcAmount Amount of USDC tokens to deposit.
     */
    function addLiquidity(uint256 usdzAmount, uint256 usdcAmount) external onlyOwner {
        require(usdzAmount > 0 && usdcAmount > 0, "USDZRouter: amounts must be > 0");

        _safeTransferFrom(usdzToken, msg.sender, address(this), usdzAmount);
        _safeTransferFrom(usdcToken, msg.sender, address(this), usdcAmount);

        usdzReserve += usdzAmount;
        usdcReserve += usdcAmount;

        emit LiquidityAdded(msg.sender, usdzAmount, usdcAmount);
    }

    /**
     * @notice Convenience function to add the initial pool liquidity
     *         (100 000 USD.Z equivalent).
     * @dev    Equivalent to calling addLiquidity with the specified amounts.
     *         Caller must pre-approve both tokens before calling.
     * @param usdzAmount Amount of USD.Z tokens (recommended: 100_000 * 10**decimals).
     * @param usdcAmount Equivalent amount of USDC tokens.
     */
    function addInitialLiquidity(uint256 usdzAmount, uint256 usdcAmount) external onlyOwner {
        require(usdzReserve == 0 && usdcReserve == 0, "USDZRouter: liquidity already exists");
        require(usdzAmount > 0 && usdcAmount > 0, "USDZRouter: amounts must be > 0");

        _safeTransferFrom(usdzToken, msg.sender, address(this), usdzAmount);
        _safeTransferFrom(usdcToken, msg.sender, address(this), usdcAmount);

        usdzReserve = usdzAmount;
        usdcReserve = usdcAmount;

        emit LiquidityAdded(msg.sender, usdzAmount, usdcAmount);
    }

    /**
     * @notice Remove liquidity from the router pool.
     * @param usdzAmount Amount of USD.Z tokens to withdraw (0 to skip).
     * @param usdcAmount Amount of USDC tokens to withdraw (0 to skip).
     */
    function removeLiquidity(uint256 usdzAmount, uint256 usdcAmount) external onlyOwner {
        require(usdzAmount <= usdzReserve, "USDZRouter: insufficient USD.Z reserve");
        require(usdcAmount <= usdcReserve, "USDZRouter: insufficient USDC reserve");

        if (usdzAmount > 0) {
            usdzReserve -= usdzAmount;
            _safeTransfer(usdzToken, msg.sender, usdzAmount);
        }
        if (usdcAmount > 0) {
            usdcReserve -= usdcAmount;
            _safeTransfer(usdcToken, msg.sender, usdcAmount);
        }

        emit LiquidityRemoved(msg.sender, usdzAmount, usdcAmount);
    }

    // ─────────────────────────────────────────────────────────────
    //  Swap functions
    // ─────────────────────────────────────────────────────────────

    /**
     * @notice Swap USD.Z for USDC at a 1:1 rate minus the fee.
     * @dev    Caller must have pre-approved this contract for at least
     *         `usdzIn` of USD.Z.
     * @param usdzIn Amount of USD.Z to swap.
     * @return usdcOut Amount of USDC received by the caller.
     */
    function swapToUSDC(uint256 usdzIn) external whenTradingEnabled returns (uint256 usdcOut) {
        require(usdzIn > 0, "USDZRouter: amount must be > 0");

        // Apply fee (denominated in USD.Z units before conversion).
        uint256 fee = (usdzIn * feeBasisPoints) / FEE_DENOMINATOR;
        uint256 usdzNetIn = usdzIn - fee;

        // Convert USD.Z net amount to USDC units, accounting for decimal difference.
        usdcOut = usdzHasMoreDecimals
            ? usdzNetIn / scalingFactor
            : usdzNetIn * scalingFactor;

        require(usdcOut > 0, "USDZRouter: output amount rounds to zero");
        require(usdcOut <= usdcReserve, "USDZRouter: insufficient USDC liquidity");

        _safeTransferFrom(usdzToken, msg.sender, address(this), usdzIn);
        usdzReserve += usdzIn;

        usdcReserve -= usdcOut;
        _safeTransfer(usdcToken, msg.sender, usdcOut);

        emit SwappedToUSDC(msg.sender, usdzIn, usdcOut, fee);
    }

    /**
     * @notice Swap USDC for USD.Z at a 1:1 rate minus the fee.
     * @dev    Caller must have pre-approved this contract for at least
     *         `usdcIn` of USDC.
     * @param usdcIn Amount of USDC to swap.
     * @return usdzOut Amount of USD.Z received by the caller.
     */
    function swapToUSDZ(uint256 usdcIn) external whenTradingEnabled returns (uint256 usdzOut) {
        require(usdcIn > 0, "USDZRouter: amount must be > 0");

        // Apply fee (denominated in USDC units before conversion).
        uint256 fee = (usdcIn * feeBasisPoints) / FEE_DENOMINATOR;
        uint256 usdcNetIn = usdcIn - fee;

        // Convert USDC net amount to USD.Z units, accounting for decimal difference.
        usdzOut = usdzHasMoreDecimals
            ? usdcNetIn * scalingFactor
            : usdcNetIn / scalingFactor;

        require(usdzOut > 0, "USDZRouter: output amount rounds to zero");
        require(usdzOut <= usdzReserve, "USDZRouter: insufficient USD.Z liquidity");

        _safeTransferFrom(usdcToken, msg.sender, address(this), usdcIn);
        usdcReserve += usdcIn;

        usdzReserve -= usdzOut;
        _safeTransfer(usdzToken, msg.sender, usdzOut);

        emit SwappedToUSDZ(msg.sender, usdcIn, usdzOut, fee);
    }

    // ─────────────────────────────────────────────────────────────
    //  View helpers
    // ─────────────────────────────────────────────────────────────

    /**
     * @notice Calculate the USDC output for a given USD.Z input (no state change).
     * @param usdzIn Amount of USD.Z being considered.
     * @return usdcOut Expected USDC output after fee.
     * @return fee     Fee amount deducted.
     */
    function getUSDCAmountOut(uint256 usdzIn)
        external
        view
        returns (uint256 usdcOut, uint256 fee)
    {
        fee = (usdzIn * feeBasisPoints) / FEE_DENOMINATOR;
        uint256 usdzNetIn = usdzIn - fee;
        usdcOut = usdzHasMoreDecimals
            ? usdzNetIn / scalingFactor
            : usdzNetIn * scalingFactor;
    }

    /**
     * @notice Calculate the USD.Z output for a given USDC input (no state change).
     * @param usdcIn Amount of USDC being considered.
     * @return usdzOut Expected USD.Z output after fee.
     * @return fee     Fee amount deducted.
     */
    function getUSDZAmountOut(uint256 usdcIn)
        external
        view
        returns (uint256 usdzOut, uint256 fee)
    {
        fee = (usdcIn * feeBasisPoints) / FEE_DENOMINATOR;
        uint256 usdcNetIn = usdcIn - fee;
        usdzOut = usdzHasMoreDecimals
            ? usdcNetIn * scalingFactor
            : usdcNetIn / scalingFactor;
    }

    /**
     * @notice Returns current reserve balances held by the router.
     */
    function getReserves()
        external
        view
        returns (uint256 _usdzReserve, uint256 _usdcReserve)
    {
        _usdzReserve = usdzReserve;
        _usdcReserve = usdcReserve;
    }

    // ─────────────────────────────────────────────────────────────
    //  Internal helpers
    // ─────────────────────────────────────────────────────────────

    function _safeTransfer(address token, address to, uint256 amount) internal {
        (bool success, bytes memory data) =
            token.call(abi.encodeWithSelector(IERC20.transfer.selector, to, amount));
        require(
            success && (data.length == 0 || abi.decode(data, (bool))),
            "USDZRouter: transfer failed"
        );
    }

    function _safeTransferFrom(
        address token,
        address from,
        address to,
        uint256 amount
    ) internal {
        (bool success, bytes memory data) =
            token.call(abi.encodeWithSelector(IERC20.transferFrom.selector, from, to, amount));
        require(
            success && (data.length == 0 || abi.decode(data, (bool))),
            "USDZRouter: transferFrom failed"
        );
    }
}
