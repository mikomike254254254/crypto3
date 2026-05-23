import { useMemo, useState } from "react";
import { ArrowLeftRight, Loader2, X } from "lucide-react";
import { CryptoLogo } from "./CryptoLogo";
import { swapWalletAssets } from "../services/walletBackend";
import { Wallet } from "../types/crypto";
import { useLiveMarketPrices } from "../hooks/useLiveMarketPrices";
import { useTheme } from "../context/ThemeContext";

interface SwapModalProps {
  wallets: Wallet[];
  onClose: () => void;
  onSwapped: (wallets: Wallet[]) => void;
}

export function SwapModal({ wallets, onClose, onSwapped }: SwapModalProps) {
  const { isDark } = useTheme();
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

  const panel = isDark ? "bg-neutral-950 border-neutral-800 text-white" : "bg-white border-neutral-200 text-black";
  const field = isDark ? "bg-neutral-900 border-neutral-700 text-white" : "bg-white border-neutral-200 text-black";

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${panel}`}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold">Swap crypto</h2>
          <button type="button" onClick={onClose} className={`rounded-lg p-2 ${isDark ? "hover:bg-neutral-800" : "hover:bg-neutral-100"}`} aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error ? <p className="text-sm text-red-500 mb-3 rounded-lg bg-red-500/10 px-3 py-2">{error}</p> : null}

        <label className={`text-xs font-semibold uppercase tracking-wide ${isDark ? "text-neutral-400" : "text-gray-500"}`}>From</label>
        <div className="flex gap-2 mt-1 mb-4">
          <select value={fromKey} onChange={(e) => setFromKey(e.target.value)} className={`flex-1 rounded-xl border px-3 py-3 text-sm ${field}`}>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>{w.symbol} — {w.balance}</option>
            ))}
          </select>
          {fromWallet ? <CryptoLogo symbol={fromWallet.symbol} size={44} /> : null}
        </div>

        <label className={`text-xs font-semibold uppercase tracking-wide ${isDark ? "text-neutral-400" : "text-gray-500"}`}>To</label>
        <div className="flex gap-2 mt-1 mb-4">
          <select value={toKey} onChange={(e) => setToKey(e.target.value)} className={`flex-1 rounded-xl border px-3 py-3 text-sm ${field}`}>
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
          className={`w-full rounded-xl border px-4 py-3 text-sm mb-3 ${field}`}
        />

        <p className={`text-sm mb-5 flex items-center gap-2 rounded-xl px-3 py-2.5 ${isDark ? "bg-neutral-900 text-neutral-300" : "bg-neutral-50 text-gray-700"}`}>
          <ArrowLeftRight className="w-4 h-4 shrink-0" />
          Live rate · you receive ≈ <strong>{receiveAmount}</strong> {toWallet?.symbol}
        </p>

        <button
          type="button"
          onClick={submit}
          disabled={loading}
          className="w-full rounded-xl bg-black text-white py-3.5 text-sm font-semibold hover:bg-neutral-800 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowLeftRight className="w-4 h-4" />}
          Confirm swap
        </button>
      </div>
    </div>
  );
}
