// Path: client/src/app/liquidity/page.tsx
'use client'

import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ethers } from 'ethers';
import LiquidityPoolABI from '@/src/abis/LiquidityPool.json';

const LIQUIDITY_POOL_ADDRESS = '0xYourContractAddressHere'; // Replace with the actual contract address

export default function LiquidityPage() {
  const [ethAmount, setEthAmount] = useState('')
  const [tokenAmount, setTokenAmount] = useState('')
  const [lpShares, setLpShares] = useState('')
  const [minOutTokens, setMinOutTokens] = useState('')
  const [minOutEth, setMinOutEth] = useState('')

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const liquidityPoolContract = new ethers.Contract(
    LIQUIDITY_POOL_ADDRESS,
    LiquidityPoolABI,
    signer
  );

  const initializePool = async () => {
    try {
      const tx = await liquidityPoolContract.initializePool(
        ethers.utils.parseEther(ethAmount),
        ethers.utils.parseUnits(tokenAmount, 18) // Assuming token has 18 decimals
      );
      await tx.wait();
      alert('Pool initialized successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to initialize pool.');
    }
  };

  const depositLiquidity = async () => {
    try {
      const tx = await liquidityPoolContract.deposit(
        ethers.utils.parseEther(ethAmount),
        { value: ethers.utils.parseEther(ethAmount) }
      );
      await tx.wait();
      alert('Liquidity deposited successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to deposit liquidity.');
    }
  };

  const withdrawLiquidity = async () => {
    try {
      const tx = await liquidityPoolContract.withdraw(
        ethers.utils.parseUnits(lpShares, 18)
      );
      await tx.wait();
      alert('Liquidity withdrawn successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to withdraw liquidity.');
    }
  };

  const swapEthToToken = async () => {
    try {
      const tx = await liquidityPoolContract.swapEthToToken(
        ethers.utils.parseEther(ethAmount),
        ethers.utils.parseUnits(minOutTokens, 18),
        { value: ethers.utils.parseEther(ethAmount) }
      );
      await tx.wait();
      alert('Swap ETH to Token successful!');
    } catch (error) {
      console.error(error);
      alert('Failed to swap ETH to Token.');
    }
  };

  const swapTokenToEth = async () => {
    try {
      const tx = await liquidityPoolContract.swapTokenToEth(
        ethers.utils.parseUnits(tokenAmount, 18),
        ethers.utils.parseEther(minOutEth)
      );
      await tx.wait();
      alert('Swap Token to ETH successful!');
    } catch (error) {
      console.error(error);
      alert('Failed to swap Token to ETH.');
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Initialize Pool */}
      <Card>
        <CardHeader>
          <CardTitle>Initialize Pool</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 space-y-1">
            <Label htmlFor="init-eth">ETH Amount</Label>
            <Input
              id="init-eth"
              placeholder="0.1"
              value={ethAmount}
              onChange={e => setEthAmount(e.target.value)}
            />
          </div>
          <div className="flex-1 space-y-1">
            <Label htmlFor="init-token">Token Amount</Label>
            <Input
              id="init-token"
              placeholder="1000"
              value={tokenAmount}
              onChange={e => setTokenAmount(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={initializePool}>Init Pool</Button>
        </CardContent>
      </Card>

      {/* Deposit Liquidity */}
      <Card>
        <CardHeader>
          <CardTitle>Deposit Liquidity</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 space-y-1">
            <Label htmlFor="deposit-eth">ETH Amount</Label>
            <Input
              id="deposit-eth"
              placeholder="0.1"
              value={ethAmount}
              onChange={e => setEthAmount(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={depositLiquidity}>Deposit</Button>
        </CardContent>
      </Card>

      {/* Withdraw Liquidity */}
      <Card>
        <CardHeader>
          <CardTitle>Withdraw Liquidity</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 space-y-1">
            <Label htmlFor="withdraw-shares">LP Shares</Label>
            <Input
              id="withdraw-shares"
              placeholder="10"
              value={lpShares}
              onChange={e => setLpShares(e.target.value)}
            />
          </div>
          <Button variant="destructive" onClick={withdrawLiquidity}>Withdraw</Button>
        </CardContent>
      </Card>

      {/* Swap Section */}
      <Card>
        <CardHeader>
          <CardTitle>Swap</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ETH → Token */}
          <div className="space-y-1">
            <Label htmlFor="swap-eth-token-amount">ETH Amount</Label>
            <Input
              id="swap-eth-token-amount"
              placeholder="0.1"
              value={ethAmount}
              onChange={e => setEthAmount(e.target.value)}
            />
            <Label htmlFor="swap-min-token">Min Tokens Out</Label>
            <Input
              id="swap-min-token"
              placeholder="10"
              value={minOutTokens}
              onChange={e => setMinOutTokens(e.target.value)}
            />
            <Button className="mt-2" variant="outline" onClick={swapEthToToken}>Swap ETH → Token</Button>
          </div>

          {/* Token → ETH */}
          <div className="space-y-1">
            <Label htmlFor="swap-token-amount">Token Amount</Label>
            <Input
              id="swap-token-amount"
              placeholder="1000"
              value={tokenAmount}
              onChange={e => setTokenAmount(e.target.value)}
            />
            <Label htmlFor="swap-min-eth">Min ETH Out</Label>
            <Input
              id="swap-min-eth"
              placeholder="0.09"
              value={minOutEth}
              onChange={e => setMinOutEth(e.target.value)}
            />
            <Button variant="outline" className="mt-2" onClick={swapTokenToEth}>Swap Token → ETH</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
