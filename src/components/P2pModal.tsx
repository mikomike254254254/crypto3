import { useMemo, useState } from "react";
import { BadgeCheck, Loader2, Mail, MessageCircle, X } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { createP2pOrder } from "../services/walletBackend";
import type { P2pTrader } from "../lib/p2pTrader";
import type { Wallet } from "../types/crypto";
import { KenyaFlag } from "./KenyaFlag";
import { SUPPORT_EMAIL } from "../constants/support";

interface P2pModalProps {
  trader: P2pTrader;
  wallets: Wallet[];
  onClose: () => void;
  onOrdered: () => void;
}

export function P2pModal({ trader, wallets, onClose, onOrdered }: P2pModalProps) {
  const { isDark } = useTheme();
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [usdtAmount, setUsdtAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const usdt = wallets.find((w) => w.id === "usdt")?.balance ?? 0;

  const fiatTotal = useMemo(() => {
    const n = Number(usdtAmount);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return side === "buy" ? n * trader.kesPerUsdt : n * trader.rate;
  }, [usdtAmount, side, trader.kesPerUsdt, trader.rate]);

  const panel = isDark ? "bg-neutral-950 border-neutral-800 text-white" : "bg-white border-neutral-200 text-black";

  const submit = async () => {
    const amount = Number(usdtAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid USDT amount.");
      return;
    }
    if (side === "sell" && amount > usdt) {
      setError("Insufficient USDT balance.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await createP2pOrder(amount, side, trader.name);
      setSuccess(
        side === "buy"
          ? `Order sent. ${trader.name} replies by email — check ${SUPPORT_EMAIL} within ~${trader.responseMins} min.`
          : `Sell order sent. ${trader.name} will reply by email at ${SUPPORT_EMAIL}.`,
      );
      onOrdered();
      window.setTimeout(onClose, 2200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not place P2P order.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[75] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden ${panel}`}>
        <div className={`p-4 border-b flex items-start justify-between gap-3 ${isDark ? "border-neutral-800" : "border-neutral-100"}`}>
          <div className="flex gap-3 min-w-0">
            <div className="relative shrink-0">
              {trader.avatarUrl ? (
                <img src={trader.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover ring-2 ring-white/20" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-500 to-emerald-600 flex items-center justify-center text-lg font-bold text-white">
                  {trader.name.charAt(0)}
                </div>
              )}
              {trader.online ? (
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" title="Online" />
              ) : null}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-lg font-bold">{trader.name}</h2>
                {trader.verified ? (
                  <span className="inline-flex items-center gap-0.5 text-sky-500" title="Verified merchant">
                    <BadgeCheck className="w-4 h-4" />
                  </span>
                ) : null}
                <KenyaFlag className="h-4 w-6" />
                <span className={`text-[10px] font-medium ${isDark ? "text-neutral-400" : "text-gray-500"}`}>{trader.countryName}</span>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? "text-neutral-400" : "text-gray-600"}`}>
                {trader.online ? "Online now" : "Away"} · {trader.completedTrades.toLocaleString()} trades
              </p>
              <p className="text-sm font-semibold mt-1 text-emerald-500">
                {trader.rateDisplay} <span className={`font-normal text-xs ${isDark ? "text-neutral-500" : "text-gray-500"}`}>/ USDT</span>
              </p>
              <p className={`text-[10px] ${isDark ? "text-neutral-500" : "text-gray-500"}`}>
                KES {trader.kesPerUsdt.toFixed(2)} / USDT · Wallex P2P desk
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className={`p-2 rounded-lg shrink-0 ${isDark ? "hover:bg-neutral-800" : "hover:bg-neutral-100"}`} aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex gap-2">
            {(["buy", "sell"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSide(s)}
                className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all ${
                  side === s ? "bg-black text-white" : isDark ? "bg-neutral-900 text-neutral-400" : "bg-neutral-100 text-gray-600"
                }`}
              >
                {s === "buy" ? "Buy USDT" : "Sell USDT"}
              </button>
            ))}
          </div>

          <div>
            <label className={`text-xs font-semibold uppercase ${isDark ? "text-neutral-500" : "text-gray-500"}`}>Amount (USDT)</label>
            <input
              type="number"
              min="0"
              step="any"
              value={usdtAmount}
              onChange={(e) => setUsdtAmount(e.target.value)}
              placeholder="0.00"
              className={`mt-1 w-full rounded-xl border px-4 py-3 text-sm ${
                isDark ? "bg-neutral-900 border-neutral-700 text-white" : "bg-white border-neutral-200"
              }`}
            />
            {side === "sell" ? (
              <p className={`text-[10px] mt-1 ${isDark ? "text-neutral-500" : "text-gray-500"}`}>Available: {usdt.toFixed(2)} USDT</p>
            ) : null}
          </div>

          <div className={`rounded-xl px-3 py-2.5 text-sm ${isDark ? "bg-neutral-900" : "bg-neutral-50"}`}>
            {side === "buy" ? (
              <p>
                You pay ≈ <strong>KES {fiatTotal.toFixed(2)}</strong> · receive <strong>{usdtAmount || "0"} USDT</strong>
              </p>
            ) : (
              <p>
                You sell <strong>{usdtAmount || "0"} USDT</strong> · receive ≈ <strong>{trader.rateDisplay}</strong> rate (
                {fiatTotal.toFixed(2)} {trader.rateCurrency})
              </p>
            )}
          </div>

          {side === "buy" ? (
            <div className={`rounded-xl px-3 py-2.5 text-xs flex items-start gap-2 ${isDark ? "bg-sky-950/50 border border-sky-900 text-sky-200" : "bg-sky-50 border border-sky-100 text-sky-900"}`}>
              <Mail className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                After you buy, <strong>{trader.name}</strong> replies by <strong>email</strong> ({SUPPORT_EMAIL}) with payment steps.
              </span>
            </div>
          ) : null}

          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          {success ? <p className="text-sm text-emerald-600">{success}</p> : null}

          <button
            type="button"
            disabled={loading || Boolean(success)}
            onClick={submit}
            className="w-full rounded-full bg-black text-white py-3.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
            {side === "buy" ? `Buy from ${trader.name}` : `Sell to ${trader.name}`}
          </button>
        </div>
      </div>
    </div>
  );
}
