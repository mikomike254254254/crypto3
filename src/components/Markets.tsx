import { useState } from "react";
import { Star, TrendingDown, TrendingUp } from "lucide-react";
import { Crypto } from "../types/crypto";
import { useTheme } from "../context/ThemeContext";
import { CryptoLogo } from "./CryptoLogo";

interface MarketsProps {
  cryptoData: Crypto[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

function formatMarketPrice(price: number) {
  if (price >= 1000) return `$${price.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  if (price >= 1) return `$${price.toFixed(2)}`;
  return `$${price.toFixed(4)}`;
}

function ChangeBadge({ change, className = "" }: { change: number; className?: string }) {
  const isUp = change >= 0;
  return (
    <div className={`flex items-center gap-0.5 font-bold ${isUp ? "text-emerald-500" : "text-red-500"} ${className}`}>
      {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      <span>
        {isUp ? "+" : ""}
        {change.toFixed(2)}%
      </span>
    </div>
  );
}

function CryptoRow({ crypto }: { crypto: Crypto }) {
  const [isStarred, setIsStarred] = useState(false);
  const { isDark } = useTheme();
  const change = crypto.change ?? crypto.change24h ?? 0;

  return (
    <div className={`flex items-center gap-2 py-2.5 border-b last:border-0 ${isDark ? "border-neutral-800" : "border-neutral-100"}`}>
      <button
        type="button"
        onClick={() => setIsStarred(!isStarred)}
        className={`p-0.5 rounded-full flex-shrink-0 ${isDark ? "hover:bg-neutral-800" : "hover:bg-neutral-100"}`}
      >
        <Star
          className={`w-3.5 h-3.5 ${isStarred ? "fill-yellow-400 text-yellow-400" : isDark ? "text-neutral-600" : "text-gray-300"}`}
        />
      </button>
      <CryptoLogo symbol={crypto.symbol} size={32} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`font-semibold text-xs ${isDark ? "text-white" : "text-black"}`}>{crypto.name}</span>
          <span className={`text-[9px] font-semibold px-1 py-0.5 rounded ${isDark ? "bg-neutral-800 text-neutral-400" : "bg-neutral-100 text-gray-500"}`}>
            {crypto.symbol}
          </span>
        </div>
      </div>
      <div className="text-right min-w-[72px] flex-shrink-0">
        <p className={`font-semibold text-xs ${isDark ? "text-white" : "text-black"}`}>{formatMarketPrice(crypto.price)}</p>
        <ChangeBadge change={change} className="justify-end mt-0.5 text-[10px]" />
      </div>
    </div>
  );
}

function WatchlistRow({ crypto }: { crypto: Crypto }) {
  const { isDark } = useTheme();
  const change = crypto.change ?? 0;

  return (
    <div
      className={`watch-bubble-3d flex items-center gap-3 w-full rounded-xl border px-3 py-3 ${
        isDark ? "bg-neutral-900 border-neutral-700" : "bg-white border-slate-200"
      }`}
    >
      <CryptoLogo symbol={crypto.symbol} size={40} />
      <div className="flex-1 min-w-0 text-left">
        <p className={`text-sm font-bold ${isDark ? "text-white" : "text-black"}`}>{crypto.name}</p>
        <p className={`text-xs ${isDark ? "text-neutral-500" : "text-gray-500"}`}>{crypto.symbol}</p>
      </div>
      <div className="text-right shrink-0">
        <p className={`text-sm font-semibold tabular-nums ${isDark ? "text-white" : "text-black"}`}>{formatMarketPrice(crypto.price)}</p>
        <ChangeBadge change={change} className="justify-end mt-1 text-xs" />
      </div>
    </div>
  );
}

export function Markets({ cryptoData, activeTab, onTabChange }: MarketsProps) {
  const { isDark } = useTheme();
  const tabs = [
    { id: "watchlist", label: "Watchlist", hasStar: true },
    { id: "turnover", label: "Turnover" },
    { id: "assets", label: "Assets" },
    { id: "hot", label: "Hot" },
  ];

  const watchlistCoins = cryptoData.slice(0, 8);

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <h3 className={`text-sm font-bold ${isDark ? "text-white" : "text-black"}`}>Markets</h3>
      </div>

      <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-semibold whitespace-nowrap border transition-all duration-200 ${
              activeTab === tab.id
                ? isDark
                  ? "bg-white text-black border-white"
                  : "bg-black text-white border-black"
                : isDark
                  ? "bg-transparent text-neutral-400 border-neutral-700"
                  : "bg-white text-gray-500 border-neutral-200"
            }`}
          >
            {tab.hasStar && <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />}
            {tab.label}
          </button>
        ))}
      </div>

      <p className={`text-[10px] font-semibold uppercase tracking-wide mb-2 ${isDark ? "text-neutral-500" : "text-gray-500"}`}>
        Watchlist
      </p>

      <div className="flex flex-col gap-2 mb-4">
        {watchlistCoins.map((crypto) => (
          <WatchlistRow key={crypto.id} crypto={crypto} />
        ))}
      </div>

      <div className={`rounded-xl px-3 border max-h-72 overflow-y-auto scroll-smooth-y ${isDark ? "bg-black border-neutral-700" : "bg-white shadow-sm border-neutral-100"}`}>
        {cryptoData.map((crypto) => (
          <CryptoRow key={crypto.id} crypto={crypto} />
        ))}
      </div>
    </div>
  );
}
