import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { ProfileAvatar } from "../components/ProfileAvatar";
import { SwipeToConfirm } from "../components/SwipeToConfirm";
import { lookupPayRecipient, PayRecipient } from "../services/walletBackend";
import { Wallet } from "../types/crypto";

interface PaySendPageProps {
  user: User | null;
  wallets: Wallet[];
  kycVerified: boolean;
  onSend: (amount: number, walletId: string, address: string, network: string) => Promise<void>;
  onNeedLogin: () => void;
  onNeedKyc: () => void;
  onDone: () => void;
}

export function PaySendPage({ user, wallets, kycVerified, onSend, onNeedLogin, onNeedKyc, onDone }: PaySendPageProps) {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const account = params.get("account") || "";
  const symbol = (params.get("symbol") || "USDT").toUpperCase();
  const walletKey = params.get("wallet") || symbol.toLowerCase();
  const network = params.get("network") || "TRC20";

  const [recipient, setRecipient] = useState<PayRecipient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [amount, setAmount] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const senderWallet = wallets.find((w) => w.id === walletKey || w.symbol === symbol) || wallets[0];
  useEffect(() => {
    if (!account) {
      setError("Invalid payment link — missing account.");
      setLoading(false);
      return;
    }

    lookupPayRecipient(account, symbol, walletKey, network)
      .then(({ recipient: row }) => setRecipient(row))
      .catch((err) => setError(err instanceof Error ? err.message : "Could not find this wallet."))
      .finally(() => setLoading(false));
  }, [account, symbol, walletKey, network]);

  const handleSwipeSend = async () => {
    if (!user) {
      onNeedLogin();
      return;
    }
    if (!kycVerified) {
      onNeedKyc();
      return;
    }
    if (!recipient || !senderWallet) return;

    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    if (parsed > senderWallet.balance) {
      setError(`Insufficient ${senderWallet.symbol} balance.`);
      return;
    }

    setSending(true);
    setError("");
    try {
      await onSend(parsed, senderWallet.id, recipient.wallet, network);
      setSent(true);
      window.setTimeout(onDone, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed.");
      throw err;
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 via-white to-slate-50">
      <div className="max-w-md mx-auto px-4 py-6">
        <button type="button" onClick={onDone} className="flex items-center gap-2 text-slate-600 mb-6">
          <ArrowLeft className="w-5 h-5" />
          Back to wallet
        </button>

        {loading ? (
          <div className="flex flex-col items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-800" />
            <p className="text-sm text-slate-500 mt-3">Loading recipient...</p>
          </div>
        ) : error && !recipient ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
        ) : recipient ? (
          <div className="space-y-6">
            <div className="text-center">
              <ProfileAvatar
                characterId={recipient.avatarCharacter || undefined}
                avatarUrl={recipient.avatarUrl || undefined}
                size={88}
                className="mx-auto"
              />
              <h1 className="text-xl font-bold text-slate-950 mt-4">{recipient.fullName}</h1>
              <p className="text-xs text-slate-500 font-mono mt-1 break-all">{recipient.wallet}</p>
              <p className="text-sm text-slate-600 mt-2">Send {symbol} on Wallex</p>
            </div>

            {!user ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-semibold">Log in to send</p>
                <p className="text-xs mt-1">Sign in to complete this payment.</p>
                <button type="button" onClick={onNeedLogin} className="mt-3 w-full rounded-xl bg-black text-white py-3 text-sm font-semibold">
                  Log in
                </button>
              </div>
            ) : null}

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount ({symbol})</label>
              <div className="mt-2 bg-white rounded-2xl border border-slate-200 p-4">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full text-3xl font-bold text-slate-950 bg-transparent focus:outline-none"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Your balance: {senderWallet?.balance.toLocaleString() ?? "0"} {senderWallet?.symbol}
                </p>
              </div>
            </div>

            {error ? <p className="text-sm text-rose-600">{error}</p> : null}

            {sent ? (
              <div className="rounded-2xl bg-green-50 border border-green-200 p-4 text-center text-green-800 font-semibold">
                Payment sent successfully
              </div>
            ) : (
              <SwipeToConfirm
                label="Swipe to send"
                disabled={!user || !amount || sending}
                loading={sending}
                onConfirm={handleSwipeSend}
              />
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
