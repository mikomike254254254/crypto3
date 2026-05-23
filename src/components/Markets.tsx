import { useState } from "react";
import { Star, TrendingDown, TrendingUp } from "lucide-react";
import { Crypto } from "../types/crypto";
import { useTheme } from "../context/ThemeContext";
import { CryptoLogo } from "./CryptoLogo";
import { CoinProfileModal } from "./CoinProfileModal";

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

function WatchlistRow({ crypto, onSelect }: { crypto: Crypto; onSelect: (crypto: Crypto) => void }) {
  const { isDark } = useTheme();
  const change = crypto.change ?? 0;

  return (
    <button
      type="button"
      onClick={() => onSelect(crypto)}
      className={`watchlist-row-3d flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] ${
        isDark ? "bg-neutral-900/95 border-neutral-600/80" : "bg-white border-slate-200/90"
      }`}
    >
      <CryptoLogo symbol={crypto.symbol} size={42} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold ${isDark ? "text-white" : "text-black"}`}>{crypto.name}</p>
        <p className={`text-xs ${isDark ? "text-neutral-500" : "text-gray-500"}`}>{crypto.symbol}</p>
      </div>
      <div className="text-right shrink-0">
        <p className={`text-sm font-semibold tabular-nums ${isDark ? "text-white" : "text-black"}`}>{formatMarketPrice(crypto.price)}</p>
        <ChangeBadge change={change} className="justify-end mt-0.5 text-xs" />
      </div>
    </button>
  );
}

export function Markets({ cryptoData, activeTab, onTabChange }: MarketsProps) {
  const { isDark } = useTheme();
  const [selectedCoin, setSelectedCoin] = useState<Crypto | null>(null);
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
        Watchlist · live
      </p>

      <div className="flex flex-col gap-2.5 mb-4">
        {watchlistCoins.map((crypto) => (
          <WatchlistRow key={`${crypto.id}-row`} crypto={crypto} onSelect={setSelectedCoin} />
        ))}
      </div>

      {selectedCoin ? <CoinProfileModal crypto={selectedCoin} onClose={() => setSelectedCoin(null)} /> : null}
    </div>
  );
}
