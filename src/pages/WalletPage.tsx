import { useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft, BadgeDollarSign, Clock, ChevronRight, Eye, EyeOff, TrendingDown, TrendingUp } from "lucide-react";
import { Wallet, Transaction } from "../types/crypto";
import { useTheme } from "../context/ThemeContext";
import { CryptoLogo } from "../components/CryptoLogo";
import { formatFiat } from "../lib/currency";
import { computePortfolioDayChange } from "../lib/portfolioChange";
import { formatTxStatus, getTransactionDisplay } from "../lib/transactionDisplay";
import type { MarketAsset } from "../hooks/useLiveMarketPrices";

interface WalletPageProps {
  wallets: Wallet[];
  totalValue?: number;
  displayCurrency?: string;
  priceAssets?: MarketAsset[];
  transactions?: Transaction[];
  onDeposit: () => void;
  onSend: () => void;
  onTopup?: () => void;
  onWithdraw?: () => void;
  kycVerified?: boolean;
}

export function WalletPage({
  wallets,
  totalValue,
  displayCurrency = "USD",
  priceAssets = [],
  transactions = [],
  onDeposit,
  onSend,
  onTopup,
}: WalletPageProps) {
  const [selectedWallet, setSelectedWallet] = useState(0);
  const [isHidden, setIsHidden] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const { isDark } = useTheme();

  const totalBalance = totalValue ?? wallets.reduce((sum, w) => sum + w.balance, 0);
  const { percent: dayChangePct, usdDelta } = computePortfolioDayChange(wallets, priceAssets);
  const isUp = dayChangePct >= 0;

  const filters = [
    { id: "all", label: "All" },
    { id: "send", label: "Sent" },
    { id: "receive", label: "Received" },
    { id: "swap", label: "Swaps" },
    { id: "pending", label: "Pending" },
  ];

  const activeWallet = wallets[selectedWallet] || wallets[0];
  const priceBySymbol = Object.fromEntries(priceAssets.map((a) => [a.symbol, a.price]));
  const walletFiatValue = activeWallet
    ? activeWallet.balance * (priceBySymbol[activeWallet.symbol] || 1)
    : totalBalance;

  const walletSymbol = activeWallet?.symbol?.toUpperCase() || "";

  const filteredTransactions = (() => {
    let list = transactions.filter((t) => {
      const txCurrency = (t.currency || t.symbol || "").toUpperCase();
      return !walletSymbol || txCurrency === walletSymbol || t.label?.includes(walletSymbol);
    });
    if (activeFilter === "all") return list;
    if (activeFilter === "pending") return list.filter((t) => t.status === "pending");
    if (activeFilter === "swap") {
      return list.filter((t) => t.type === "swap" || t.label?.startsWith("Swap "));
    }
    return list.filter((t) => t.type === activeFilter || (activeFilter === "receive" && (t.type === "deposit" || t.type === "receive")));
  })();

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "send":
      case "withdraw":
      case "sell":
        return <ArrowUpFromLine className="w-4 h-4" />;
      case "receive":
      case "deposit":
      case "buy":
      case "kyc_bonus":
      case "gas_fee":
        return <ArrowDownToLine className="w-4 h-4" />;
      case "swap":
        return <ArrowRightLeft className="w-4 h-4" />;
      default:
        return <ArrowRightLeft className="w-4 h-4" />;
    }
  };

  const getTransactionColor = (tx: Transaction, isCredit: boolean) => {
    if (isDark) {
      return isCredit ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800/50" : "bg-red-950/60 text-red-300 border border-red-900/40";
    }
    return isCredit ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return isDark ? "text-emerald-400/90" : "text-emerald-700";
      case "pending":
        return isDark ? "text-amber-400" : "text-amber-700";
      case "failed":
        return isDark ? "text-red-400" : "text-red-600";
      default:
        return isDark ? "text-neutral-500" : "text-gray-500";
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today · ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
    }
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="px-4 pt-2 pb-6">
      <h1 className={`text-xl font-bold mb-4 ${isDark ? "text-white" : "text-black"}`}>Wallet</h1>

      <div className="balance-card-silver relative overflow-hidden rounded-2xl p-5 mb-4 border shadow-xl bg-black border-neutral-800">
        <div className="relative z-[2]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">{activeWallet?.symbol} Balance</p>
            <button type="button" onClick={() => setIsHidden(!isHidden)} className="p-1 rounded-md hover:bg-white/10" aria-label="Toggle balance">
              {isHidden ? <EyeOff className="w-4 h-4 text-neutral-400" /> : <Eye className="w-4 h-4 text-neutral-400" />}
            </button>
          </div>

          <h2 className="text-3xl font-bold text-white mb-1 tracking-tight">
            {isHidden ? "••••••" : formatFiat(walletFiatValue, displayCurrency)}
          </h2>
          {!isHidden && activeWallet ? (
            <p className="text-sm text-neutral-400 mb-2">
              {activeWallet.balance.toLocaleString(undefined, { maximumFractionDigits: 8 })} {activeWallet.symbol}
              <span className="text-neutral-500"> · Portfolio {formatFiat(totalBalance, displayCurrency)}</span>
            </p>
          ) : null}

          <div className="flex items-center gap-2 mb-4">
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                isUp ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "bg-red-500/15 text-red-400 border border-red-500/30"
              }`}
            >
              {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {isUp ? "+" : ""}
              {dayChangePct.toFixed(2)}% today
            </div>
            {!isHidden && Math.abs(usdDelta) > 0.001 ? (
              <span className={`text-xs font-medium ${isUp ? "text-emerald-400/90" : "text-red-400/90"}`}>
                {isUp ? "+" : ""}
                {formatFiat(Math.abs(usdDelta), displayCurrency)}
              </span>
            ) : null}
          </div>

          <p className="text-[10px] text-emerald-400/90 font-medium mb-2">Receive &amp; top up — no KYC required</p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onDeposit}
              className="flex-1 flex items-center justify-center gap-2 bg-white text-black rounded-full py-2.5 font-semibold text-sm hover:bg-neutral-100 transition-all active:scale-[0.98]"
            >
              <ArrowDownToLine className="w-4 h-4" />
              Deposit
            </button>
            <button
              type="button"
              onClick={onSend}
              className="flex-1 flex items-center justify-center gap-2 bg-transparent text-white rounded-full py-2.5 font-semibold text-sm border-2 border-white/80 hover:bg-white/10 transition-all active:scale-[0.98]"
            >
              <ArrowUpFromLine className="w-4 h-4" />
              Send
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
        {wallets.map((wallet, index) => (
          <button
            key={wallet.id}
            type="button"
            onClick={() => setSelectedWallet(index)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
              selectedWallet === index
                ? "bg-black text-white scale-[1.02] shadow-md"
                : isDark
                  ? "bg-neutral-900 text-neutral-300 border border-neutral-800 hover:border-neutral-600"
                  : "bg-white text-gray-600 border border-neutral-200 hover:border-neutral-300"
            }`}
          >
            <CryptoLogo symbol={wallet.symbol} size={22} className="!border-0" />
            {wallet.symbol}
          </button>
        ))}
      </div>

      {/* Top-up card button */}
      <button
        onClick={onTopup}
        className={`w-full mb-4 rounded-xl border p-4 flex items-center gap-3 transition-all hover:shadow-md ${isDark ? "bg-neutral-900 border-neutral-700 hover:border-emerald-600" : "bg-white border-neutral-200 hover:border-emerald-400"}`}
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
          <BadgeDollarSign className="w-5 h-5 text-white" />
        </div>
        <div className="text-left flex-1">
          <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-black"}`}>Top up with card or bank</p>
          <p className={`text-xs ${isDark ? "text-neutral-400" : "text-gray-500"}`}>Pay in KES · credited instantly · no KYC required</p>
        </div>
        <ChevronRight className={`w-5 h-5 ${isDark ? "text-neutral-500" : "text-gray-400"}`} />
      </button>

      <div className="flex items-center justify-between mb-3">
        <h3 className={`text-base font-semibold ${isDark ? "text-white" : "text-black"}`}>
          {activeWallet?.symbol} transactions
        </h3>
        <span className={`text-xs ${isDark ? "text-neutral-500" : "text-gray-500"}`}>{filteredTransactions.length} shown</span>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
        {filters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => setActiveFilter(filter.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 ${
              activeFilter === filter.id
                ? "bg-black text-white shadow-sm"
                : isDark
                  ? "bg-neutral-900 text-neutral-400 border border-neutral-800"
                  : "bg-white text-gray-500 border border-neutral-200"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className={`rounded-xl overflow-hidden border ${isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-neutral-200"}`}>
        {filteredTransactions.map((tx, index) => {
          const display = getTransactionDisplay(tx);
          return (
            <div
              key={tx.id}
              className={`flex items-center gap-3 p-4 transition-colors ${
                index !== filteredTransactions.length - 1 ? (isDark ? "border-b border-neutral-800" : "border-b border-neutral-100") : ""
              } ${isDark ? "hover:bg-neutral-800/50" : "hover:bg-neutral-50"}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getTransactionColor(tx, display.isCredit)}`}>
                {getTransactionIcon(tx.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className={`font-semibold text-sm truncate ${isDark ? "text-white" : "text-black"}`}>{display.title}</p>
                    <p className={`text-xs truncate mt-0.5 ${isDark ? "text-neutral-400" : "text-gray-500"}`}>{display.subtitle}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-bold text-sm tabular-nums ${display.isCredit ? (isDark ? "text-emerald-400" : "text-emerald-600") : isDark ? "text-red-400" : "text-red-600"}`}>
                      {display.sign}
                      {tx.amount.toLocaleString(undefined, { maximumFractionDigits: 8 })} {tx.currency}
                    </p>
                    <p className={`text-[10px] font-medium mt-0.5 ${getStatusColor(tx.status)}`}>{formatTxStatus(tx.status)}</p>
                  </div>
                </div>
                <p className={`text-[10px] mt-1.5 ${isDark ? "text-neutral-500" : "text-gray-400"}`}>{formatDate(tx.date ?? new Date().toISOString())}</p>
              </div>

              <ChevronRight className={`w-4 h-4 shrink-0 ${isDark ? "text-neutral-600" : "text-gray-300"}`} />
            </div>
          );
        })}

        {filteredTransactions.length === 0 && (
          <div className="p-10 text-center">
            <Clock className={`w-8 h-8 mx-auto mb-2 ${isDark ? "text-neutral-600" : "text-gray-300"}`} />
            <p className={`text-sm font-medium ${isDark ? "text-neutral-400" : "text-gray-600"}`}>No transactions yet</p>
            <p className={`text-xs mt-1 ${isDark ? "text-neutral-500" : "text-gray-400"}`}>Deposits and swaps will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
