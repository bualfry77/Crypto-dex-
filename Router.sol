// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Router {
    ISwapRouter public immutable swapRouter;

    address public recipient; // Address to receive the swapped assets

    constructor(address _swapRouter, address _recipient) {
        swapRouter = _swapRouter;
        recipient = _recipient; // Set recipient address
    }

    function swapUSDCForETH(
        address usdcToken,
        uint256 amountIn,
        uint256 amountOutMin
    ) external {
        IERC20(usdcToken).transferFrom(msg.sender, address(this), amountIn);
        IERC20(usdcToken).approve(address(swapRouter), amountIn);

        ISwapRouter.ExactInputSingleParams memory params =
            ISwapRouter.ExactInputSingleParams({
                tokenIn: usdcToken,
                tokenOut: address(0), // ETH
                fee: 3000,
                recipient: recipient, // Send Eth to the specified recipient
                deadline: block.timestamp + 15,
                amountIn: amountIn,
                amountOutMinimum: amountOutMin,
                sqrtPriceLimitX96: 0
            });

        swapRouter.exactInputSingle(params);
    }
}