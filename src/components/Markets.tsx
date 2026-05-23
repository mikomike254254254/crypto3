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
      {isUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
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

function WatchBubble({ crypto, variant }: { crypto: Crypto; variant: "pill" | "card" }) {
  const { isDark } = useTheme();
  const change = crypto.change ?? 0;
  const isUp = change >= 0;

  if (variant === "pill") {
    return (
      <div
        className={`watch-bubble-3d flex-shrink-0 flex items-center gap-2 rounded-full pl-1 pr-3 py-1.5 border ${
          isDark ? "bg-neutral-900 border-neutral-700" : "bg-white border-slate-200"
        }`}
      >
        <CryptoLogo symbol={crypto.symbol} size={28} />
        <div className="min-w-0">
          <p className={`text-xs font-bold ${isDark ? "text-white" : "text-black"}`}>{crypto.symbol}</p>
          <ChangeBadge change={change} className="text-[10px]" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`watch-bubble-3d flex flex-col items-center justify-center gap-1.5 rounded-2xl p-3 min-w-[88px] border ${
        isDark ? "bg-neutral-900 border-neutral-700" : "bg-white border-slate-200"
      }`}
    >
      <CryptoLogo symbol={crypto.symbol} size={36} />
      <p className={`text-xs font-bold ${isDark ? "text-white" : "text-black"}`}>{crypto.symbol}</p>
      <p className={`text-[10px] font-semibold ${isDark ? "text-neutral-400" : "text-gray-500"}`}>{formatMarketPrice(crypto.price)}</p>
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isUp ? "bg-emerald-500/15 text-emerald-500" : "bg-red-500/15 text-red-500"}`}>
        {isUp ? "+" : ""}
        {change.toFixed(1)}%
      </span>
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
  const marqueeCoins = [...watchlistCoins, ...watchlistCoins];

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
        Watchlist · live
      </p>

      <div className="overflow-hidden mb-3 rounded-xl">
        <div className="marquee-track gap-2 py-1">
          {marqueeCoins.map((crypto, i) => (
            <WatchBubble key={`${crypto.id}-marquee-${i}`} crypto={crypto} variant="pill" />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-4 sm:grid-cols-4">
        {watchlistCoins.map((crypto) => (
          <WatchBubble key={`${crypto.id}-card`} crypto={crypto} variant="card" />
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
