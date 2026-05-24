import { useState } from "react";
import { ChevronDown, Eye, EyeOff, ArrowUpRight, ArrowDownLeft, MoreHorizontal, TrendingUp, TrendingDown, QrCode, Share2, Clock, Star, AlertCircle, X } from "lucide-react";
import { Wallet } from "../types/crypto";
import { useTheme } from "../context/ThemeContext";
import { AnimatedNumber } from "./AnimatedNumber";
import { CryptoLogo } from "./CryptoLogo";
import { formatFiat } from "../lib/currency";
import { computePortfolioDayChange } from "../lib/portfolioChange";
import type { MarketAsset } from "../hooks/useLiveMarketPrices";

interface BalanceCardProps {
  wallet: Wallet;
  wallets: Wallet[];
  totalValue: number;
  walletFiatValue?: number;
  portfolioTotal?: number;
  displayCurrency?: string;
  selectedWallet: string;
  onWalletChange: (id: string) => void;
  onDeposit: () => void;
  onSend: () => void;
  onWithdraw?: () => void;
  kycVerified: boolean;
  priceAssets?: MarketAsset[];
}

export function BalanceCard({
  wallet,
  wallets,
  totalValue,
  walletFiatValue,
  portfolioTotal,
  displayCurrency = "USD",
  selectedWallet,
  onWalletChange,
  onDeposit,
  onSend,
  kycVerified: _kycVerified,
  priceAssets = [],
}: BalanceCardProps) {
  const [showBalance, setShowBalance] = useState(true);
  const [showWalletSelect, setShowWalletSelect] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const { isDark } = useTheme();
  const { percent: dayChangePct } = computePortfolioDayChange(wallets, priceAssets);
  const isUp = dayChangePct >= 0;
  const displayAmount = walletFiatValue ?? totalValue;
  const allWalletsTotal = portfolioTotal ?? totalValue;

  const moreOptions = [
    { id: "qr", label: "Show QR Code", icon: QrCode, description: "Scan to receive" },
    { id: "share", label: "Share Address", icon: Share2, description: "Copy or share" },
    { id: "history", label: "Transaction History", icon: Clock, description: "View all transactions" },
    { id: "watchlist", label: "Add to Watchlist", icon: Star, description: "Track this wallet" },
    { id: "alert", label: "Price Alert", icon: AlertCircle, description: "Set price notifications" },
  ];

  return (
    <div className="relative" style={{ zIndex: 0 }}>
      {/* Wallet select dropdown — rendered outside card to avoid overflow:hidden clipping */}
      {showWalletSelect && (
        <>
          <button type="button" className="fixed inset-0 z-[45]" aria-label="Close wallet list" onClick={() => setShowWalletSelect(false)} />
          <div
            className={`absolute top-16 left-4 mt-2 rounded-xl shadow-xl z-[50] min-w-[200px] max-w-[min(100%,280px)] max-h-52 overflow-y-auto border ${
              isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-neutral-200"
            }`}
          >
            {wallets.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => {
                  onWalletChange(w.id);
                  setShowWalletSelect(false);
                }}
                className={`w-full px-3 py-2.5 flex items-center gap-2.5 border-b last:border-0 transition-colors ${
                  isDark ? "border-neutral-700 hover:bg-neutral-700" : "border-neutral-100 hover:bg-neutral-50"
                } ${w.id === wallet.id ? (isDark ? "bg-neutral-700/80" : "bg-neutral-50") : ""}`}
              >
                <CryptoLogo symbol={w.symbol} size={22} />
                <div className="text-left flex-1 min-w-0">
                  <p className={`text-xs font-semibold truncate ${isDark ? "text-white" : "text-black"}`}>{w.name}</p>
                  <p className={`text-[10px] truncate ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    {w.balance.toLocaleString(undefined, { maximumFractionDigits: 6 })} {w.symbol}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      <div
        className={`balance-card rounded-2xl p-4 shadow-lg border transition-colors duration-300 ${
          isDark ? "bg-neutral-900 border-neutral-700" : "bg-black border-black text-white"
        }`}
      >
        <div className="relative mb-2" style={{ zIndex: 3 }}>
          <button
            type="button"
            onClick={() => setShowWalletSelect(!showWalletSelect)}
            className={`inline-flex max-w-full items-center gap-2 rounded-full px-3 py-1.5 transition-all ${
              isDark ? "bg-neutral-800 hover:bg-neutral-700 border border-neutral-700" : "bg-white/10 hover:bg-white/15 border border-white/20"
            }`}
          >
            <CryptoLogo symbol={wallet.symbol} size={22} className="!border-white/30 shrink-0" />
            <span className="text-xs font-semibold truncate text-white">{wallet.name}</span>
            <ChevronDown className={`w-3 h-3 shrink-0 transition-transform duration-200 ${showWalletSelect ? "rotate-180" : ""} text-white/70`} />
          </button>
        </div>

        <div className="flex flex-nowrap gap-1.5 overflow-x-auto scrollbar-hide pb-2 mb-2 -mx-0.5 px-0.5">
          {wallets.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => onWalletChange(w.id)}
              className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold border transition-all ${
                w.id === selectedWallet
                  ? "bg-white text-black border-white shadow-sm"
                  : isDark
                    ? "bg-neutral-800/80 text-white/85 border-neutral-600"
                    : "bg-white/10 text-white/90 border-white/25 hover:bg-white/15"
              }`}
            >
              <CryptoLogo symbol={w.symbol} size={18} className="!border-0" />
              {w.symbol}
            </button>
          ))}
        </div>

        <p className={`text-[10px] mb-0.5 font-bold tracking-widest uppercase ${isDark ? "text-gray-400" : "text-white/60"}`}>{wallet.symbol} balance</p>

        <div className="flex flex-nowrap items-center justify-between gap-2 mb-3 min-h-[2.5rem]">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <h2 className="text-2xl font-bold tracking-tight balance-pulse truncate text-white">
              {showBalance ? <AnimatedNumber value={displayAmount} format={(v) => formatFiat(v, displayCurrency)} /> : "******"}
            </h2>
            <button type="button" onClick={() => setShowBalance(!showBalance)} className="p-1 rounded-full shrink-0 hover:bg-white/10">
              {showBalance ? <Eye className="w-4 h-4 text-white/60" /> : <EyeOff className="w-4 h-4 text-white/60" />}
            </button>
          </div>
          <div
            className={`shrink-0 px-2 py-1 rounded-md inline-flex items-center gap-1 border text-[10px] font-bold whitespace-nowrap ${
              isUp ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-300" : "bg-red-500/20 border-red-400/40 text-red-300"
            }`}
          >
            {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>
              {isUp ? "+" : ""}
              {dayChangePct.toFixed(2)}%
            </span>
          </div>
        </div>

        <p className={`text-[11px] mb-3 ${isDark ? "text-neutral-400" : "text-gray-500"}`}>
          {wallet.name}: {showBalance ? `${wallet.balance.toLocaleString("en-US", { maximumFractionDigits: 8 })} ${wallet.symbol}` : "******"}
          {showBalance ? ` · Portfolio ${formatFiat(allWalletsTotal, displayCurrency)}` : ""}
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSend}
            className={`flex-1 rounded-full py-2.5 flex items-center justify-center gap-1.5 transition-all duration-200 ease-out border-2 hover:scale-[1.02] active:scale-[0.97] shadow-sm ${
              isDark ? "bg-neutral-800 text-white border-neutral-700" : "bg-white text-black border-neutral-200"
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span className="text-xs font-semibold">Send</span>
          </button>
          <button
            type="button"
            onClick={onDeposit}
            className="flex-1 rounded-full py-2.5 flex items-center justify-center gap-1.5 transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.97] border-2 bg-transparent text-white border-white hover:bg-white/10 shadow-sm"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span className="text-xs font-semibold">Receive</span>
          </button>
          <button
            type="button"
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border-2 shrink-0 ${
              isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-neutral-200"
            }`}
          >
            <MoreHorizontal className={isDark ? "text-white" : "text-black"} />
          </button>
        </div>
      </div>

      {showMoreMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMoreMenu(false)} />
          <div
            className={`absolute bottom-full left-0 right-0 mb-2 rounded-2xl shadow-2xl border overflow-hidden z-50 ${
              isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-neutral-200"
            }`}
          >
            <div className={`p-3 border-b ${isDark ? "border-neutral-700" : "border-neutral-100"}`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-sm font-bold ${isDark ? "text-white" : "text-black"}`}>More Options</h3>
                <button type="button" onClick={() => setShowMoreMenu(false)} className="p-1 rounded-full">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
            <div className="p-2">
              {moreOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setShowMoreMenu(false)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl ${isDark ? "hover:bg-neutral-700" : "hover:bg-neutral-50"}`}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isDark ? "bg-neutral-700" : "bg-neutral-100"}`}>
                      <Icon className={`w-4 h-4 ${isDark ? "text-white" : "text-black"}`} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className={`text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>{option.label}</p>
                      <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>{option.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
