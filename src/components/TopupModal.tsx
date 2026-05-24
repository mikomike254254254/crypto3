import { useMemo, useState } from "react";
import { BadgeDollarSign, Loader2, X } from "lucide-react";
import { useLiveMarketPrices } from "../hooks/useLiveMarketPrices";
import { useAuth } from "../context/AuthContext";
import { KES_PER_USDT } from "../constants/money";
import { startPaystackCheckout } from "../lib/paystack";
import { verifyPaystackDeposit } from "../services/walletBackend";
import { CryptoLogo } from "./CryptoLogo";
import type { Wallet } from "../types/crypto";

interface TopupModalProps {
  wallets: Wallet[];
  onClose: () => void;
  onSuccess: (wallets: Wallet[]) => void;
}

export function TopupModal({ wallets, onClose, onSuccess }: TopupModalProps) {
  const { user } = useAuth();
  const { assets: liveAssets } = useLiveMarketPrices(60_000);
  const [walletId, setWalletId] = useState(wallets[0]?.id || "usdt");
  const [amountKes, setAmountKes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedWallet = wallets.find((w) => w.id === walletId) || wallets[0];
  const kesValue = Number(amountKes);
  const usdValue = useMemo(() => (Number.isFinite(kesValue) && kesValue > 0 ? kesValue / KES_PER_USDT : 0), [kesValue]);
  const tokenPrice = liveAssets.find((a) => a.symbol === selectedWallet?.symbol)?.price || (selectedWallet?.symbol === "USDT" ? 1 : 1);
  const cryptoPreview = useMemo(() => {
    if (!Number.isFinite(usdValue) || usdValue <= 0) return 0;
    if (selectedWallet?.symbol === "USDT") return usdValue;
    return Number((usdValue / tokenPrice).toFixed(8));
  }, [usdValue, tokenPrice, selectedWallet?.symbol]);

  const handleTopup = async () => {
    const amount = Number(amountKes);
    if (!user?.email || !Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    setError("");
    setLoading(true);
    const reference = `WLX-PS-${Date.now()}`;
    try {
      await startPaystackCheckout({
        amount,
        currency: "KES",
        email: user.email,
        name: user.user_metadata?.full_name || user.email,
        reference,
        onSuccess: async (confirmedReference) => {
          try {
            const { wallets: nextWallets } = await verifyPaystackDeposit(confirmedReference, walletId, amount);
            onSuccess(nextWallets);
            onClose();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Verification failed");
            setLoading(false);
          }
        },
        onCancel: () => setLoading(false),
        onError: (msg) => { setError(msg); setLoading(false); },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[80] flex items-end sm:items-center justify-center" style={{ backdropFilter: "blur(6px)" }}>
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm">
              <BadgeDollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-black">Top up with card</h2>
              <p className="text-xs text-gray-500">Pay in KES — credited instantly</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Wallet to credit</label>
            <select
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm text-black focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.symbol})
                </option>
              ))}
            </select>
          </div>

          {selectedWallet && (
            <div className="flex items-center gap-3 rounded-xl bg-neutral-50 p-3 border border-neutral-200">
              <CryptoLogo symbol={selectedWallet.symbol} size={36} />
              <div>
                <p className="text-sm font-semibold text-black">{selectedWallet.name}</p>
                <p className="text-xs text-gray-500">Balance: {selectedWallet.balance.toLocaleString()} {selectedWallet.symbol}</p>
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Amount (KES)</label>
            <input
              type="number"
              min="1"
              step="0.01"
              value={amountKes}
              onChange={(e) => setAmountKes(e.target.value)}
              placeholder="e.g. 1000"
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-lg font-bold text-black focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
            />
          </div>

          {Number.isFinite(kesValue) && kesValue > 0 && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">You pay</span>
                <span className="font-bold text-black">KES {kesValue.toLocaleString("en-KE")}</span>
              </div>
              {usdValue > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">≈ USD</span>
                  <span className="font-semibold text-black">${usdValue.toFixed(2)}</span>
                </div>
              )}
              {cryptoPreview > 0 && (
                <div className="flex justify-between text-sm border-t border-emerald-200 pt-1.5 mt-1.5">
                  <span className="text-gray-600">You receive ≈</span>
                  <span className="font-bold text-emerald-700">{cryptoPreview.toLocaleString()} {selectedWallet?.symbol}</span>
                </div>
              )}
              <p className="text-[10px] text-emerald-600 mt-1 font-medium">No KYC required</p>
            </div>
          )}

          {error && (
            <p className="text-xs text-rose-600 bg-rose-50 rounded-lg p-3 border border-rose-200">{error}</p>
          )}

          <button
            onClick={handleTopup}
            disabled={loading || !amountKes || Number(amountKes) <= 0}
            className="w-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-xl py-3.5 text-sm font-semibold hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BadgeDollarSign className="w-4 h-4" />}
            {loading ? "Opening Paystack..." : "Proceed to payment"}
          </button>
        </div>
      </div>
    </div>
  );
}