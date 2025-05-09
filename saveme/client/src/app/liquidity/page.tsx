// Path: client/src/app/liquidity/page.tsx
'use client'

import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LiquidityPage() {
  const [ethAmount, setEthAmount] = useState('')
  const [tokenAmount, setTokenAmount] = useState('')
  const [lpShares, setLpShares] = useState('')
  const [minOutTokens, setMinOutTokens] = useState('')
  const [minOutEth, setMinOutEth] = useState('')

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
          <Button>Init Pool</Button>
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
          <Button variant="outline">Deposit</Button>
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
          <Button variant="destructive">Withdraw</Button>
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
            <Button className="mt-2">Swap ETH → Token</Button>
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
            <Button variant="outline" className="mt-2">Swap Token → ETH</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
