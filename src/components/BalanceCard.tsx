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
  displayCurrency?: string;
  selectedWallet: string;
  onWalletChange: (id: string) => void;
  onDeposit: () => void;
  onWithdraw: () => void;
  kycVerified: boolean;
  priceAssets?: MarketAsset[];
}

export function BalanceCard({ wallet, wallets, totalValue, displayCurrency = "USD", selectedWallet, onWalletChange, onDeposit, onWithdraw, kycVerified, priceAssets = [] }: BalanceCardProps) {
  const [showBalance, setShowBalance] = useState(true);
  const [showWalletSelect, setShowWalletSelect] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const { isDark } = useTheme();
  const { percent: dayChangePct } = computePortfolioDayChange(wallets, priceAssets);
  const isUp = dayChangePct >= 0;

  const moreOptions = [
    { id: 'qr', label: 'Show QR Code', icon: QrCode, description: 'Scan to receive' },
    { id: 'share', label: 'Share Address', icon: Share2, description: 'Copy or share' },
    { id: 'history', label: 'Transaction History', icon: Clock, description: 'View all transactions' },
    { id: 'watchlist', label: 'Add to Watchlist', icon: Star, description: 'Track this wallet' },
    { id: 'alert', label: 'Price Alert', icon: AlertCircle, description: 'Set price notifications' },
  ];

  const formatBalance = (value: number) => {
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="relative">
      <div className={`rounded-2xl p-4 shadow-lg border transition-colors duration-300 ${isDark ? "bg-neutral-900 border-neutral-700" : "bg-black border-black text-white"}`}>
        <div className="relative mb-3">
          <button onClick={() => setShowWalletSelect(!showWalletSelect)} className={`flex items-center gap-2 rounded-full px-3 py-1.5 transition-all ${isDark ? "bg-neutral-800 hover:bg-neutral-700 border border-neutral-700" : "bg-white/10 hover:bg-white/15 border border-white/20"}`}>
            <CryptoLogo symbol={wallet.symbol} size={22} className="!border-white/30" />
            <span className={`text-xs font-semibold ${isDark ? "text-white" : "text-white"}`}>{wallet.name}</span>
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showWalletSelect ? "rotate-180" : ""} text-white/70`} />
          </button>

          {showWalletSelect && (
            <div className={`absolute top-full left-0 mt-2 rounded-xl shadow-xl overflow-hidden z-20 min-w-[180px] border animate-in fade-in-0 zoom-in-95 duration-200 ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200'}`}>
              {wallets.map((w) => (
                <button key={w.id} onClick={() => { onWalletChange(w.id); setShowWalletSelect(false); }} className={`w-full px-3 py-2.5 flex items-center gap-2.5 border-b last:border-0 transition-colors ${isDark ? "border-neutral-700 hover:bg-neutral-700" : "border-neutral-100 hover:bg-neutral-50"}`}>
                  <CryptoLogo symbol={w.symbol} size={22} />
                  <div className="text-left flex-1">
                    <p className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-black'}`}>{w.name}</p>
                    <p className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>${w.balance.toLocaleString()}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <p className={`text-[10px] mb-0.5 font-bold tracking-widest uppercase ${isDark ? "text-gray-400" : "text-white/60"}`}>Total Value</p>

        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1.5">
            <h2 className={`text-2xl font-bold tracking-tight balance-pulse ${isDark ? "text-white" : "text-white"}`}>
              {showBalance ? (
                <AnimatedNumber value={totalValue} format={(v) => formatFiat(v, displayCurrency)} />
              ) : (
                "******"
              )}
            </h2>
            <button onClick={() => setShowBalance(!showBalance)} className={`p-1 rounded-full transition-all ${isDark ? "hover:bg-neutral-800" : "hover:bg-white/10"}`}>
              {showBalance ? <Eye className="w-4 h-4 text-white/60" /> : <EyeOff className="w-4 h-4 text-white/60" />}
            </button>
          </div>
          <div
            className={`ml-auto px-2.5 py-1 rounded-md flex items-center gap-1 border text-[10px] font-bold ${
              isUp
                ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-300"
                : "bg-red-500/20 border-red-400/40 text-red-300"
            }`}
          >
            {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{isUp ? "+" : ""}{dayChangePct.toFixed(2)}%</span>
            <span className="text-white/50 font-normal hidden sm:inline">24h</span>
          </div>
        </div>

        <p className={`text-[11px] mb-3 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
          {wallet.name}: {showBalance ? `${wallet.balance.toLocaleString("en-US", { maximumFractionDigits: 8 })} ${wallet.symbol}` : "******"}
        </p>

        <div className="flex items-center gap-2">
          <button onClick={onWithdraw} className={`flex-1 rounded-full py-2.5 flex items-center justify-center gap-1.5 transition-all border-2 hover:scale-[1.02] active:scale-[0.98] ${isDark ? 'bg-neutral-800 text-white border-neutral-700 hover:border-neutral-500' : 'bg-white text-black border-neutral-200 hover:border-neutral-300'}`}>
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold">Send</span>
          </button>
          <button
            onClick={onDeposit}
            className={`flex-1 rounded-full py-2.5 flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98] border-2 ${
              isDark
                ? "bg-transparent text-white border-white hover:bg-white/10"
                : "bg-transparent text-white border-white hover:bg-white/10"
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold">Receive</span>
          </button>
          <button onClick={() => setShowMoreMenu(!showMoreMenu)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border-2 hover:scale-105 active:scale-95 ${isDark ? 'bg-neutral-800 border-neutral-700 hover:bg-neutral-700' : 'bg-white border-neutral-200 hover:bg-neutral-50'}`}>
            <MoreHorizontal className={`w-4 h-4 ${isDark ? 'text-white' : 'text-black'}`} />
          </button>
        </div>
      </div>

      {showMoreMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMoreMenu(false)} />
          <div className={`absolute bottom-full left-0 right-0 mb-2 rounded-2xl shadow-2xl border overflow-hidden z-50 animate-in fade-in-0 slide-in-from-bottom-4 duration-200 ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200'}`}>
            <div className={`p-3 border-b ${isDark ? 'border-neutral-700' : 'border-neutral-100'}`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>More Options</h3>
                <button onClick={() => setShowMoreMenu(false)} className={`p-1 rounded-full ${isDark ? 'hover:bg-neutral-700' : 'hover:bg-neutral-100'}`}>
                  <X className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                </button>
              </div>
            </div>
            <div className="p-2">
              {moreOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button key={option.id} onClick={() => setShowMoreMenu(false)} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${isDark ? 'hover:bg-neutral-700' : 'hover:bg-neutral-50'}`}>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isDark ? 'bg-neutral-700' : 'bg-neutral-100'}`}>
                      <Icon className={`w-4 h-4 ${isDark ? 'text-white' : 'text-black'}`} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-black'}`}>{option.label}</p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{option.description}</p>
                    </div>
                    <ChevronDown className={`w-4 h-4 -rotate-90 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
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
