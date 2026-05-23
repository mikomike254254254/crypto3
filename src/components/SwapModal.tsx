import { useMemo, useState } from "react";
import { ArrowLeftRight, Loader2, X } from "lucide-react";
import { CryptoLogo } from "./CryptoLogo";
import { swapWalletAssets } from "../services/walletBackend";
import { Wallet } from "../types/crypto";
import { useLiveMarketPrices } from "../hooks/useLiveMarketPrices";

interface SwapModalProps {
  wallets: Wallet[];
  onClose: () => void;
  onSwapped: (wallets: Wallet[]) => void;
}

export function SwapModal({ wallets, onClose, onSwapped }: SwapModalProps) {
  const { assets: liveAssets } = useLiveMarketPrices(60_000);
  const [fromKey, setFromKey] = useState(wallets[0]?.id || "usdt");
  const [toKey, setToKey] = useState(wallets[1]?.id || "xrp");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fromWallet = wallets.find((w) => w.id === fromKey) || wallets[0];
  const toWallet = wallets.find((w) => w.id === toKey) || wallets[1];

  const receiveAmount = useMemo(() => {
    const parsed = Number(amount);
    if (!fromWallet || !toWallet || !Number.isFinite(parsed) || parsed <= 0) return 0;
    const fromRate = liveAssets.find((a) => a.symbol === fromWallet.symbol)?.price || 1;
    const toRate = liveAssets.find((a) => a.symbol === toWallet.symbol)?.price || 1;
    return Number(((parsed * fromRate) / toRate).toFixed(8));
  }, [amount, fromWallet, toWallet, liveAssets]);

  const submit = async () => {
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    if (fromKey === toKey) {
      setError("Pick two different assets.");
      return;
    }
    if (parsed > (fromWallet?.balance || 0)) {
      setError(`Insufficient ${fromWallet?.symbol} balance.`);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const { wallets: next } = await swapWalletAssets(fromKey, toKey, parsed);
      onSwapped(next);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Swap failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-slate-950">Swap crypto</h2>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-slate-100" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error ? <p className="text-sm text-rose-600 mb-3">{error}</p> : null}

        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">From</label>
        <div className="flex gap-2 mt-1 mb-4">
          <select value={fromKey} onChange={(e) => setFromKey(e.target.value)} className="flex-1 rounded-2xl border border-slate-200 px-3 py-3 text-sm">
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>{w.symbol} — {w.balance}</option>
            ))}
          </select>
          {fromWallet ? <CryptoLogo symbol={fromWallet.symbol} size={44} /> : null}
        </div>

        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">To</label>
        <div className="flex gap-2 mt-1 mb-4">
          <select value={toKey} onChange={(e) => setToKey(e.target.value)} className="flex-1 rounded-2xl border border-slate-200 px-3 py-3 text-sm">
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>{w.symbol}</option>
            ))}
          </select>
          {toWallet ? <CryptoLogo symbol={toWallet.symbol} size={44} /> : null}
        </div>

        <input
          type="number"
          min="0"
          step="any"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={`Amount in ${fromWallet?.symbol || "USDT"}`}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm mb-3"
        />

        <p className="text-sm text-slate-600 mb-5 flex items-center gap-2">
          <ArrowLeftRight className="w-4 h-4 text-cyan-600" />
          You receive ≈ <strong>{receiveAmount}</strong> {toWallet?.symbol}
        </p>

        <button
          type="button"
          onClick={submit}
          disabled={loading}
          className="w-full rounded-2xl bg-slate-950 text-white py-3.5 text-sm font-semibold hover:bg-slate-800 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowLeftRight className="w-4 h-4" />}
          Confirm swap
        </button>
      </div>
    </div>
  );
}
