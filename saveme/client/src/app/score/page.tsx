'use client';
import { useEffect, useState } from 'react';
import BlurText from '../../components/animated/BlurText';
import { FaShieldAlt } from 'react-icons/fa';
import { useTransactionHistory } from '../../hooks/useTransactionHistory';
import { Connect } from '../../components/wallet/Connect';
import Link from 'next/link';

export default function SecurityScorePage() {
  const { transactions, isLoading, error } = useTransactionHistory();
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    const runDetection = async () => {
      if (!transactions || transactions.length === 0) return;
      setLoading(true);
      try {
        const res = await fetch('/api/detect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transactions }),
        });
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.results;
        if (Array.isArray(list)) {
          setResults(list);
          const anomalous = list.filter((r) => r.is_anomaly).length;
          const s = Math.round(((list.length - anomalous) / list.length) * 100);
          setScore(s);
        }
      } catch (err) {
        console.error('Failed to fetch security score', err);
      } finally {
        setLoading(false);
      }
    };
    runDetection();
  }, [transactions]);

  return (
    <main className="bg-background w-screen min-h-screen px-4 md:px-8 lg:px-32 py-16 md:py-24 text-white">
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
            text="Score"
            delay={0.05}
            animateBy="letters"
            direction="top"
            className="text-4xl md:text-6xl lg:text-7xl font-semibold mb-6 text-foreground"
          />
          <p className="opacity-40 mb-8 max-w-lg">
            Analyze your recent transactions with our AI model to calculate an overall security score.
          </p>
          <div className="flex gap-4">
            <Connect />
            <Link
              href="/transactions"
              className="flex items-center gap-2 bg-foreground/10 hover:bg-foreground/20 rounded-lg px-4 py-2 text-white transition-colors"
            >
              View Transactions
            </Link>
          </div>
        </div>
        <div className="bg-foreground/10 p-8 rounded-full">
          <FaShieldAlt className="text-white text-6xl" />
        </div>
      </div>

      {loading && <p className="text-center mb-4">Calculating score...</p>}
      {error && <p className="text-red-400 mb-4">{error.message}</p>}
      {score !== null && (
        <div className="text-center mb-8">
          <h2 className="text-5xl font-bold mb-2">{score}%</h2>
          <p className="text-foreground">Overall Security Score</p>
        </div>
      )}

      {results && results.length > 0 && (
        <div className="space-y-4">
          {results.map((r, idx) => (
            <div
              key={idx}
              className="bg-background/20 backdrop-blur-sm p-4 rounded-lg border border-foreground/10"
            >
              <div className="flex items-center justify-between">
                <p className="font-mono break-all text-sm">{r.transaction_hash}</p>
                {r.is_anomaly ? (
                  <span className="text-red-400">Anomalous</span>
                ) : (
                  <span className="text-green-400">Safe</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
