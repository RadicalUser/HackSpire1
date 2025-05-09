// Path: client/src/app/liquidity/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ethers } from 'ethers'
import LiquidityPoolABI from '@/src/abis/LiquidityPool.json'
import ERC20ABI from '@/src/abis/ERC20.json'

// Ensure these environment variables are set in .env.local:
// NEXT_PUBLIC_LP_ADDRESS=0x...YourLiquidityPoolAddress
// NEXT_PUBLIC_TOKEN_ADDRESS=0x...YourTokenAddress

const LIQUIDITY_POOL_ADDRESS = process.env.NEXT_PUBLIC_LP_ADDRESS!
const TOKEN_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_ADDRESS!


export default function LiquidityPage() {
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null)
  const [poolContract, setPoolContract] = useState<ethers.Contract | null>(null)
  const [ethAmount, setEthAmount] = useState('')
  const [tokenAmount, setTokenAmount] = useState('')
  const [lpShares, setLpShares] = useState('')

  // Initialize provider, signer, and pool contract
  useEffect(() => {
    async function init() {
      if (!window.ethereum) {
        alert('MetaMask not detected.')
        return
      }
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      setSigner(signer)
      const contract = new ethers.Contract(
        LIQUIDITY_POOL_ADDRESS,
        LiquidityPoolABI,
        signer
      )
      setPoolContract(contract)
    }
    init()
  }, [])

  // Add liquidity (ETH + token)
  const handleAddLiquidity = async () => {

    if (!signer || !poolContract) {
      alert('Web3 not initialized. Refresh the page.')
      return
    }
    try {
      const tokenContract = new ethers.Contract(TOKEN_ADDRESS, ERC20ABI, signer)
      const tokenAmt = ethers.parseUnits(tokenAmount, 18)
      // Approve token transfer
      const approveTx = await tokenContract.approve(
        LIQUIDITY_POOL_ADDRESS,
        tokenAmt
      )
      await approveTx.wait()

      // Call addLiquidity with ETH value
      const tx = await poolContract.addLiquidity(tokenAmt, {
        
        value: ethers.parseEther(ethAmount),
      })
      await tx.wait()
      alert('Liquidity added successfully!')
    } catch (err: any) {
      console.error('Add liquidity error:', err)
      alert('Failed to add liquidity. Check console.')
    }
  }

  // Remove liquidity
  const handleRemoveLiquidity = async () => {
    if (!poolContract) {
      alert('Web3 not initialized.')
      return
    }
    try {
      const shares = ethers.parseUnits(lpShares, 18)
      const tx = await poolContract.removeLiquidity(shares)
      await tx.wait()
      alert('Liquidity removed successfully!')
    } catch (err: any) {
      console.error('Remove liquidity error:', err)
      alert('Failed to remove liquidity. Check console.')
    }
  }

  // Swap ETH → Token
  const handleSwapEthForTokens = async () => {
    if (!poolContract) {
      alert('Web3 not initialized.')
      return
    }
    try {
      const tx = await poolContract.swapEthForTokens({
        value: ethers.parseEther(ethAmount),
      })
      await tx.wait()
      alert('Swapped ETH for tokens successfully!')
    } catch (err: any) {
      console.error('Swap ETH→Token error:', err)
      alert('Failed to swap ETH for tokens. Check console.')
    }
  }

  // Swap Token → ETH
  const handleSwapTokensForEth = async () => {
    if (!signer || !poolContract) {
      alert('Web3 not initialized.')
      return
    }
    try {
      const tokenContract = new ethers.Contract(TOKEN_ADDRESS, ERC20ABI, signer)
      const tokenAmt = ethers.parseUnits(tokenAmount, 18)
      const approveTx = await tokenContract.approve(
        LIQUIDITY_POOL_ADDRESS,
        tokenAmt
      )
      await approveTx.wait()

      const tx = await poolContract.swap(tokenAmt)
      await tx.wait()
      alert('Swapped tokens for ETH successfully!')
    } catch (err: any) {
      console.error('Swap Token→ETH error:', err)
      alert('Failed to swap tokens for ETH. Check console.')
    }
  }

  return (
    <div className="p-8 space-y-6">
      {/* Add Liquidity Section */}
      <Card>
        <CardHeader>
          <CardTitle>Add Liquidity</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 space-y-1">
            <Label htmlFor="add-eth">ETH Amount</Label>
            <Input
              id="add-eth"
              placeholder="0.1"
              value={ethAmount}
              onChange={e => setEthAmount(e.target.value)}
            />
          </div>
          <div className="flex-1 space-y-1">
            <Label htmlFor="add-token">Token Amount</Label>
            <Input
              id="add-token"
              placeholder="1000"
              value={tokenAmount}
              onChange={e => setTokenAmount(e.target.value)}
            />
          </div>
          <Button onClick={handleAddLiquidity}>Add Liquidity</Button>
        </CardContent>
      </Card>

      {/* Remove Liquidity Section */}
      <Card>
        <CardHeader>
          <CardTitle>Remove Liquidity</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4 items-end"> 
          <div className="flex-1 space-y-1">
            <Label htmlFor="remove-shares">LP Shares</Label>
            <Input
              id="remove-shares"
              placeholder="10"
              value={lpShares}
              onChange={e => setLpShares(e.target.value)}
            />
          </div>
          <Button variant="destructive" onClick={handleRemoveLiquidity}>
            Remove Liquidity
          </Button>
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
            <Label htmlFor="swap-eth">ETH Amount</Label>
            <Input
              id="swap-eth"
              placeholder="0.1"
              value={ethAmount}
              onChange={e => setEthAmount(e.target.value)}
            />
            <Button variant="outline" className="mt-2" onClick={handleSwapEthForTokens}>  
              Swap ETH → Token
            </Button>
          </div>

          {/* Token → ETH */}
          <div className="space-y-1">
            <Label htmlFor="swap-token">Token Amount</Label>
            <Input
              id="swap-token"
              placeholder="1000"
              value={tokenAmount}
              onChange={e => setTokenAmount(e.target.value)}
            />
            <Button variant="outline" className="mt-2" onClick={handleSwapTokensForEth}>
              Swap Token → ETH
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
