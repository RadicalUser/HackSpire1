// useTokenCreation.ts
import { useState } from 'react';
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useWatchContractEvent,
} from 'wagmi';
import { parseEther } from 'viem';
import { TokenFactoryABI } from '../lib/abi/TokenFactoryABI';

const TOKEN_FACTORY_ADDRESS =
  '0x5FbDB2315678afecb367f032d93F642f64180aa3' as const;

interface TokenCreatedEvent {
  tokenAddress: `0x${string}`;
  name: string;
  symbol: string;
  initialSupply: bigint;
  creator: `0x${string}`;
}

export function useTokenCreation() {
  const [isLoading, setIsLoading] = useState(false);
  const [newTokenAddress, setNewTokenAddress] = useState<`0x${string}` | null>(null);
  const [creationData, setCreationData] = useState<TokenCreatedEvent | null>(null);

  // — Helpers for DB persistence —
  const saveTokenToDatabase = async (
    tokenAddress: `0x${string}`,
    name: string,
    symbol: string,
    supply: string
  ) => {
    try {
      const res = await fetch('/api/savecoin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBuffer: '',
          tokenAddress,
          tokenName: name,
          tokenSymbol: symbol,
          initialSupply: supply,
        }),
      });
      if (!res.ok) throw new Error('Failed to save token');
      return await res.json();
    } catch (err) {
      console.error('DB save error:', err);
      return null;
    }
  };

  const saveTokenImage = async (
    tokenAddress: `0x${string}`,
    imageData: string
  ) => {
    if (!imageData) return null;
    try {
      const base64 = imageData.split(',')[1];
      const res = await fetch('/api/savecoin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBuffer: base64,
          tokenAddress,
          tokenName: creationData?.name,
          tokenSymbol: creationData?.symbol,
          initialSupply: creationData?.initialSupply?.toString(),
        }),
      });
      if (!res.ok) throw new Error('Failed to save token image');
      return await res.json();
    } catch (err) {
      console.error('Image save error:', err);
      return null;
    }
  };

  // — Write the contract and grab its tx.hash directly —
  const {
    writeContract,
    isPending,
    isError,
    error,
    data: hash,
  } = useWriteContract();

  // — Wait for that hash (string) to be mined —
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash, query: { enabled: !!hash } });

  // — Watch & decode the TokenCreated event —
  useWatchContractEvent({
    address: TOKEN_FACTORY_ADDRESS,
    abi: TokenFactoryABI,
    eventName: 'TokenCreated',
    // onLogs gives you an array of decoded EventLog objects
    onLogs: (logs) => {
      if (!logs?.length) return;
      // wagmi decodes args for you
      const log = logs[0] as any;
      const args = log.args as {
        tokenAddress: `0x${string}`;
        name: string;
        symbol: string;
        initialSupply: bigint;
        creator: `0x${string}`;
      };

      const tokenData: TokenCreatedEvent = {
        tokenAddress: args.tokenAddress,
        name: args.name,
        symbol: args.symbol,
        initialSupply: args.initialSupply,
        creator: args.creator,
      };

      console.log('TokenCreated event:', tokenData);
      setNewTokenAddress(tokenData.tokenAddress);
      setCreationData(tokenData);
      setIsLoading(false);

      // Persist immediately
      saveTokenToDatabase(
        tokenData.tokenAddress,
        tokenData.name,
        tokenData.symbol,
        tokenData.initialSupply.toString()
      );
    },
  });

  // — Exposed function to kick off creation —
  const createToken = (
    name: string,
    symbol: string,
    initialSupply: string
  ) => {
    setIsLoading(true);
    setNewTokenAddress(null);
    setCreationData(null);

    writeContract({
      address: TOKEN_FACTORY_ADDRESS,
      abi: TokenFactoryABI,
      functionName: 'createToken',
      args: [name, symbol, parseEther(initialSupply)],
    });
  };

  return {
    createToken,
    saveTokenImage,
    isLoading: isLoading || isPending || isConfirming,
    isPending,
    isConfirming,
    isConfirmed,
    isError,
    error,
    newTokenAddress,
    creationData,
    transactionHash: hash,
  };
}