'use client';
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowRight, FaPlus, FaCoins } from 'react-icons/fa';
import { SiEthereum } from 'react-icons/si';
import { useWalletContext } from '../../context/WalletContext';
import { useTokenCreation } from '../../hooks/useTokenCreation';
import { toast, Toaster } from 'react-hot-toast';

export default function CreateTokenPage() {
  const [step, setStep] = useState(1);
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [initialSupply, setInitialSupply] = useState('1000000');
  const [tokenImage, setTokenImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isConnected, address } = useWalletContext();
  const {
    createToken,
    saveTokenImage,
    isLoading,
    isPending,
    isConfirming,
    isConfirmed,
    isError,
    error,
    newTokenAddress,
  } = useTokenCreation();

  useEffect(() => {
    if (isConfirmed && newTokenAddress) {
      toast.success(`Token created successfully! Address: ${newTokenAddress}`);
      if (tokenImage) {
        saveTokenImage(newTokenAddress, tokenImage);
      }
    }
  }, [isConfirmed, newTokenAddress, tokenImage, saveTokenImage]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setTokenImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleNextStep = () => {
    if ((step === 1 && tokenName) || (step === 2 && tokenSymbol)) {
      setStep(step + 1);
    }
  };

  const handlePreviousStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!tokenName || !tokenSymbol) {
      toast.error('Please fill out both token name and symbol');
      return;
    }

    try {
      createToken(tokenName, tokenSymbol, initialSupply);
      toast.success('Creating token...');
    } catch (err) {
      console.error('Error creating token:', err);
      toast.error('Failed to create token');
    }
  };

  const fadeInUpVariant = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: 'easeIn' } },
  };

  const ActionButton = ({
    onClick,
    disabled,
    children,
    fullWidth = false,
  }: {
    onClick: (e?: React.MouseEvent) => void;
    disabled?: boolean;
    children: React.ReactNode;
    fullWidth?: boolean;
  }) => (
    <motion.button
      initial={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
      whileHover={{ backgroundColor: 'var(--foreground)', color: 'var(--background)' }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.1 }}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${
        fullWidth ? 'w-full' : 'flex-1'
      } flex items-center justify-center gap-2 bg-foreground/10 cursor-pointer text-foreground py-3 rounded-full font-medium transition-all ${
        disabled || isLoading ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {isLoading ? (
        <span>
          {isPending ? 'Waiting for approval...' : isConfirming ? 'Confirming...' : 'Processing...'}
        </span>
      ) : (
        children
      )}
    </motion.button>
  );

  const ArrowIcon = () => (
    <motion.div initial={{ x: 0 }} whileHover={{ x: 4 }} transition={{ type: 'spring', stiffness: 400 }}>
      <FaArrowRight />
    </motion.div>
  );

  return (
    <main className="bg-background text-white min-h-screen flex flex-col items-center justify-center px-4">
      <Toaster />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <SiEthereum className="text-foreground" />
              Create Token
            </h2>
          </motion.div>

          <motion.div className="flex items-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className={`h-2 w-8 rounded-full ${i === step ? 'bg-foreground' : 'bg-white/10'}`}
                animate={{ scale: i === step ? [1, 1.05, 1] : 1 }}
                transition={{ duration: 0.5, repeat: i === step ? Infinity : 0, repeatType: 'reverse' }}
              />
            ))}
          </motion.div>
        </div>

        {/* Steps */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              variants={fadeInUpVariant}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white/5 rounded-3xl p-6 shadow-lg"
            >
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Token Name</h3>
                  <input
                    type="text"
                    value={tokenName}
                    onChange={(e) => setTokenName(e.target.value)}
                    placeholder="e.g. My Awesome Token"
                    className="w-full bg-white/5 rounded-xl px-4 py-3 outline-none"
                  />
                  <p className="text-xs text-foreground/60 mt-2">Official name of your token</p>
                </div>

                <ActionButton onClick={handleNextStep} disabled={!tokenName} fullWidth>
                  <span>Continue</span>
                  <ArrowIcon />
                </ActionButton>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              variants={fadeInUpVariant}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white/5 rounded-3xl p-6 shadow-lg"
            >
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Token Symbol</h3>
                  <input
                    type="text"
                    value={tokenSymbol}
                    onChange={(e) => setTokenSymbol(e.target.value.toUpperCase())}
                    placeholder="e.g. MAT"
                    maxLength={5}
                    className="w-full bg-white/5 rounded-xl px-4 py-3 outline-none"
                  />
                  <p className="text-xs text-foreground/60 mt-2">Ticker symbol (max 5 characters)</p>
                </div>

                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handlePreviousStep}
                    className="flex-1 bg-white/5 text-white rounded-full py-3 transition-all"
                  >
                    Back
                  </motion.button>

                  <ActionButton onClick={handleNextStep} disabled={!tokenSymbol}>
                    <span>Continue</span>
                    <ArrowIcon />
                  </ActionButton>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              variants={fadeInUpVariant}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white/5 rounded-3xl p-6 shadow-lg"
            >
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Token Details</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-foreground/70 mb-1 block">Initial Supply</label>
                      <input
                        type="text"
                        value={initialSupply}
                        onChange={(e) => setInitialSupply(e.target.value)}
                        placeholder="e.g. 1000000"
                        className="w-full bg-white/5 rounded-xl px-4 py-3 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-foreground/70 mb-1 block">Token Image (optional)</label>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-40 flex flex-col items-center justify-center bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors"
                      >
                        {tokenImage ? (
                          <img src={tokenImage} alt="Token" className="w-24 h-24 rounded-full object-cover" />
                        ) : (
                          <>
                            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-2">
                              <FaPlus className="text-foreground text-xl" />
                            </div>
                            <p className="text-foreground text-sm">Upload token icon</p>
                          </>
                        )}
                      </motion.div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handlePreviousStep}
                    className="flex-1 bg-white/5 text-white rounded-full py-3 transition-all"
                  >
                    Back
                  </motion.button>

                  <ActionButton onClick={handleSubmit}>
                    <FaCoins className="text-sm" />
                    <span>Create Token</span>
                  </ActionButton>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!isConnected && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 bg-red-500/10 rounded-xl">
            <p className="text-red-400 text-sm text-center">Please connect your wallet to create a token</p>
          </motion.div>
        )}

        {isError && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 bg-red-500/10 rounded-xl">
            <p className="text-red-400 text-sm text-center">Error: {error?.message || 'Unknown error'}</p>
          </motion.div>
        )}
      </motion.div>
    </main>
  );
}