'use client';
import { useState } from 'react';

import BlurText from '../../components/animated/BlurText';
import { FaShieldAlt } from 'react-icons/fa';
import { Connect } from '../../components/wallet/Connect';


export default function DetectPage() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const parsed = JSON.parse(input);
      const res = await fetch('/api/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: parsed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Detection failed');
      setResult(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-background w-screen min-h-screen px-4 md:px-8 lg:px-32 py-16 md:py-24">
      <div className="flex flex-col lg:flex-row items-center w-full justify-between gap-12 mb-16">
        <div>
          <BlurText
            text="Security"
            delay={0.01}
            animateBy="letters"
            direction="top"
            className="text-4xl md:text-6xl lg:text-7xl font-semibold mb-1 text-white"
          />
          <BlurText
            text="Detection"
            delay={0.05}
            animateBy="letters"
            direction="top"
            className="text-4xl md:text-6xl lg:text-7xl font-semibold mb-6 text-foreground"
          />
          <p className="opacity-40 mb-8 max-w-lg text-white">
            Paste recent transactions to analyse them for suspicious behaviour.
          </p>
          <Connect />
        </div>
        <div className="bg-foreground/10 p-8 rounded-full">
          <FaShieldAlt className="text-white text-6xl" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='[{"hash": "0x...", "value": "0", ...}]'
          className="w-full min-h-40 bg-background/50 border border-foreground/20 rounded-lg p-3 text-white"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-foreground text-background rounded-lg p-3 hover:opacity-90 transition-colors disabled:opacity-50"
        >
          {loading ? 'Checking...' : 'Run Detection'}
        </button>
      </form>

      {error && <p className="text-red-400 mb-4">{error}</p>}
      {result && (
        <pre className="bg-background/50 border border-foreground/20 rounded-lg p-4 text-white overflow-x-auto">
{JSON.stringify(result, null, 2)}
        </pre>
      )}
    </main>
  );
}
