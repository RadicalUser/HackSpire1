// File: saveme/contract/ignition/modules/TokenFactoryLPModule.js
const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
const { ethers } = require("ethers");

module.exports = buildModule("TokenFactoryLPModule", (m) => {
  const deployer = m.getAccount(0);

  // 1) Deploy the TokenFactory (already done by TokenFactoryModule)
  //    Here we just get the existing instance:
  const tokenFactory = m.contract("TokenFactory", []);

  // 2) Create a new token
  const tokenName = "Custom Token";
  const tokenSymbol = "CTK";
  const initialSupply = ethers.parseEther("1000000");
  const createTokenTx = m.call(
    tokenFactory,
    "createToken",
    [tokenName, tokenSymbol, initialSupply],
    { from: deployer }
  );

  // 3) Read the new token’s address from the TokenCreated event
  const tokenAddress = m.readEventArgument(createTokenTx, "TokenCreated", 0);

  // 4) Get a proper contract instance for the newly deployed token
  //    Make sure your Solidity contract in contracts/ is named CustomToken
  const token = m.contractAt("CustomToken", tokenAddress);

  // 5) Deploy a LiquidityPool for this token
  const liquidityPool = m.contract("LiquidityPool", [tokenAddress]);

  // 6) Approve the pool to move tokens
  const approveTx = m.call(
    token,
    "approve",
    [liquidityPool, ethers.parseEther("10000")],
    { from: deployer }
  );

  // 7) Add initial liquidity (token + ETH)
  const addLiquidityTx = m.call(
    liquidityPool,
    "addLiquidity",
    [ethers.parseEther("10000")],
    { from: deployer, value: ethers.parseEther("10") }
  );

  return {
    tokenFactory,
    createTokenTx,
    token,
    liquidityPool,
    approveTx,
    addLiquidityTx,
  };
});