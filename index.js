const { ethers } = require("ethers");
require("dotenv").config();

// Provider and Wallet Setup
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const signer = wallet.connect(provider);

// Token and Contract Addresses
const USDC = {
    address: "0xYourUSDCAddress", // Replace with the actual USDC address on Sepolia
    decimals: 6
};

const LINK = {
    address: "0xYourLINKAddress", // Replace with the actual LINK address on Sepolia
    decimals: 18
};

const SWAP_ROUTER_CONTRACT_ADDRESS = "0xYourUniswapRouterAddress"; // Replace with Uniswap V3 Swap Router address
const SWAP_ROUTER_ABI = [/* ABI of Uniswap V3 Swap Router */];
const POOL_ABI = [/* ABI of Uniswap V3 Pool */];
const TOKEN_IN_ABI = [/* ABI of USDC */];
const TOKEN_OUT_ABI = [/* ABI of LINK */];

const AAVE_LENDING_POOL_ADDRESS = "0xYourAaveLendingPoolAddress"; // Replace with Aave Lending Pool address
const AAVE_LENDING_POOL_ABI = [/* ABI of Aave Lending Pool */];

const factoryContract = new ethers.Contract("0xYourUniswapFactoryAddress", [/* ABI of Uniswap Factory */], provider);

// Function to Approve Token Transfer
async function approveToken(tokenAddress, tokenABI, amount, wallet) {
    try {
        const tokenContract = new ethers.Contract(tokenAddress, tokenABI, wallet);
        const approveAmount = ethers.utils.parseUnits(amount.toString(), USDC.decimals);
        const approveTransaction = await tokenContract.approve(
            SWAP_ROUTER_CONTRACT_ADDRESS,
            approveAmount
        );
        const transactionResponse = await wallet.sendTransaction(approveTransaction);
        console.log("-------------------------------");
        console.log("Sending Approval Transaction...");
        console.log("-------------------------------");
        console.log(`Transaction Sent: ${transactionResponse.hash}`);
        console.log("-------------------------------");
        const receipt = await transactionResponse.wait();
        console.log(`Approval Transaction Confirmed! https://sepolia.etherscan.io/tx/${receipt.hash}`);
    } catch (error) {
        console.error("An error occurred during token approval:", error);
        throw new Error("Token approval failed");
    }
}

// Function to Get Pool Information
async function getPoolInfo(factoryContract, tokenIn, tokenOut) {
    const poolAddress = await factoryContract.getPool(
        tokenIn.address,
        tokenOut.address,
        3000
    );
    if (!poolAddress) {
        throw new Error("Failed to get pool address");
    }
    const poolContract = new ethers.Contract(poolAddress, POOL_ABI, provider);
    const [token0, token1, fee] = await Promise.all([
        poolContract.token0(),
        poolContract.token1(),
        poolContract.fee(),
    ]);
    return { poolContract, token0, token1, fee };
}

// Function to Prepare Swap Parameters
async function prepareSwapParams(poolContract, signer, amountIn) {
    return {
        tokenIn: USDC.address,
        tokenOut: LINK.address,
        fee: await poolContract.fee(),
        recipient: signer.address,
        amountIn: amountIn,
        amountOutMinimum: 0,
        sqrtPriceLimitX96: 0,
    };
}

// Function to Execute the Swap
async function executeSwap(swapRouter, params, signer) {
    const transaction = await swapRouter.exactInputSingle(params);
    const receipt = await signer.sendTransaction(transaction);
    console.log("-------------------------------");
    console.log(`Receipt: https://sepolia.etherscan.io/tx/${receipt.hash}`);
    console.log("-------------------------------");
}

// Function to Approve LINK on Aave
async function approveAave(tokenAddress, tokenABI, amount, wallet) {
    try {
        const tokenContract = new ethers.Contract(tokenAddress, tokenABI, wallet);
        const approveAmount = ethers.utils.parseUnits(amount.toString(), LINK.decimals);
        const approveTransaction = await tokenContract.approve(
            AAVE_LENDING_POOL_ADDRESS,
            approveAmount
        );
        const transactionResponse = await wallet.sendTransaction(approveTransaction);
        const receipt = await transactionResponse.wait();
        console.log(`Aave Approval Transaction Confirmed! ${receipt.transactionHash}`);
    } catch (error) {
        console.error("Aave approval failed", error);
        throw new Error("Aave approval failed");
    }
}

// Function to Deposit LINK into Aave
async function depositAave(lendingPoolContract, tokenAddress, amount, wallet) {
    try {
        const depositAmount = ethers.utils.parseUnits(amount.toString(), LINK.decimals);
        const depositTransaction = await lendingPoolContract.deposit(
            tokenAddress,
            depositAmount,
            wallet.address,
            0 // referral code
        );
        const transactionResponse = await wallet.sendTransaction(depositTransaction);
        const receipt = await transactionResponse.wait();
        console.log(`Deposit Transaction: ${receipt.transactionHash}`);
    } catch (error) {
        console.error("Deposit to Aave failed", error);
        throw new Error("Deposit to Aave failed");
    }
}

// Main Function
async function main(swapAmount) {
    const inputAmount = swapAmount;
    const amountIn = ethers.utils.parseUnits(inputAmount.toString(), USDC.decimals);

    try {
        await approveToken(USDC.address, TOKEN_IN_ABI, inputAmount, signer);
        const { poolContract } = await getPoolInfo(factoryContract, USDC, LINK);
        const params = await prepareSwapParams(poolContract, signer, amountIn);
        const swapRouter = new ethers.Contract(
            SWAP_ROUTER_CONTRACT_ADDRESS,
            SWAP_ROUTER_ABI,
            signer
        );
        await executeSwap(swapRouter, params, signer);

        // Aave integration
        await approveAave(LINK.address, TOKEN_OUT_ABI, inputAmount, signer);
        const lendingPool = new ethers.Contract(AAVE_LENDING_POOL_ADDRESS, AAVE_LENDING_POOL_ABI, signer);
        await depositAave(lendingPool, LINK.address, inputAmount, signer);
    } catch (error) {
        console.error("An error occurred:", error.message);
    }
}

// Execute the Main Function with Desired Swap Amount
main(1); // Example: Swapping 1 USDC to LINK and depositing to Aave
