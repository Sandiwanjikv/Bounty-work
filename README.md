# DeFi Script for Uniswap and Aave Integration

## Overview of Script

This script is a sophisticated DeFi application that integrates the functionalities of Uniswap and Aave protocols. The workflow involves swapping USDC for LINK tokens on Uniswap and then utilizing the swapped LINK tokens to supply liquidity on Aave, thus earning interest.

### Key Steps in the Workflow:

1. **User Initiates Token Swap**: The script starts by allowing the user to specify the amount of USDC they wish to swap for LINK on the Uniswap decentralized exchange.

2. **Approve USDC**: Before the swap can occur, the user must approve the Uniswap Swap Router to spend their USDC.

3. **Retrieve Pool Information**: The script fetches the necessary pool information from Uniswap's Factory contract to ensure that the correct swap parameters are set.

4. **Execute Swap**: The script then performs the token swap on Uniswap, converting the specified amount of USDC to LINK.

5. **Approve LINK for Aave**: After the successful swap, the script approves the swapped LINK tokens for Aave's lending pool.

6. **Deposit LINK to Aave**: The LINK tokens are deposited into Aave, where they start earning interest.

7. **Error Handling**: The script includes error handling to manage any issues that may arise during the token swap or deposit processes.

This script demonstrates the power of DeFi composability by integrating multiple protocols to optimize asset utility and generate yield.

## Diagram Illustration

The diagram below illustrates the sequence of steps and interactions between the Uniswap and Aave protocols.

![Workflow Diagram](./Image/Diagram.png)
