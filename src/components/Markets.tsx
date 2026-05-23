import { useState } from "react";
import { Star, TrendingDown, TrendingUp } from "lucide-react";
import { Crypto } from "../types/crypto";
import { useTheme } from "../context/ThemeContext";

interface MarketsProps {
  cryptoData: Crypto[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

interface SparklineChartProps {
  data: number[];
  isUp: boolean;
  width?: number;
  height?: number;
}

function SparklineChart({ data, isUp, width = 60, height = 28 }: SparklineChartProps) {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const padding = 3;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((value - min) / range) * chartHeight;
    return { x, y };
  });

  const createPath = (pts: { x: number; y: number }[]) => {
    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const midX = (prev.x + curr.x) / 2;
      path += ` C ${midX} ${prev.y}, ${midX} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    return path;
  };

  const linePath = createPath(points);
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;
  const strokeColor = isUp ? "#22c55e" : "#ef4444";
  const gradientId = `gradient-${isUp ? "up" : "down"}-${data.length}-${Math.round(data[0])}`;

  return (
    <svg width={width} height={height} className="overflow-visible flex-shrink-0">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path d={linePath} fill="none" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="2" fill={strokeColor} className="animate-pulse" />
    </svg>
  );
}

function CryptoIcon({ symbol }: { symbol: string }) {
  const iconData: Record<string, { bg: string; label: string; color: string }> = {
    BTC: { bg: "bg-gradient-to-br from-orange-400 to-orange-600", label: "BTC", color: "text-white" },
    ETH: { bg: "bg-gradient-to-br from-blue-400 to-indigo-600", label: "ETH", color: "text-white" },
    BNB: { bg: "bg-gradient-to-br from-yellow-300 to-yellow-500", label: "BNB", color: "text-yellow-900" },
    SOL: { bg: "bg-gradient-to-br from-blue-400 to-cyan-500", label: "SOL", color: "text-white" },
    XRP: { bg: "bg-gradient-to-br from-gray-600 to-gray-800", label: "XRP", color: "text-white" },
    ADA: { bg: "bg-gradient-to-br from-blue-500 to-blue-700", label: "ADA", color: "text-white" },
    DOGE: { bg: "bg-gradient-to-br from-yellow-200 to-yellow-400", label: "DOGE", color: "text-yellow-800" },
    AVAX: { bg: "bg-gradient-to-br from-red-400 to-red-600", label: "AVAX", color: "text-white" },
  };

  const icon = iconData[symbol] || { bg: "bg-gradient-to-br from-gray-400 to-gray-600", label: symbol.slice(0, 3), color: "text-white" };

  return (
    <div className={`w-8 h-8 rounded-full ${icon.bg} flex items-center justify-center shadow-sm relative overflow-hidden flex-shrink-0`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-full" />
      <span className={`${icon.color} text-[8px] font-bold relative z-10`}>{icon.label}</span>
    </div>
  );
}

function CryptoRow({ crypto }: { crypto: Crypto }) {
  const [isStarred, setIsStarred] = useState(false);
  const { isDark } = useTheme();
  const change = crypto.change ?? crypto.change24h ?? 0;
  const isUp = crypto.isUp ?? change >= 0;
  const sparkline = crypto.sparkline ?? [crypto.price * 0.98, crypto.price, crypto.price * 1.01];

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    if (price >= 1) {
      return `$${price.toFixed(2)}`;
    }

    return `$${price.toFixed(4)}`;
  };

  return (
    <div className={`flex items-center gap-1.5 py-2.5 border-b last:border-0 transition-colors ${isDark ? "border-neutral-800" : "border-neutral-100"}`}>
      <button
        onClick={() => setIsStarred(!isStarred)}
        className={`p-0.5 rounded-full transition-all flex-shrink-0 ${isDark ? "hover:bg-neutral-800" : "hover:bg-neutral-100"}`}
      >
        <Star
          className={`w-3.5 h-3.5 transition-all ${
            isStarred ? "fill-yellow-400 text-yellow-400 scale-110" : isDark ? "text-neutral-600 hover:text-yellow-400" : "text-gray-300 hover:text-yellow-400"
          }`}
        />
      </button>

      <CryptoIcon symbol={crypto.symbol} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`font-semibold text-xs ${isDark ? "text-white" : "text-black"}`}>{crypto.name}</span>
          <span className={`text-[9px] font-semibold px-1 py-0.5 rounded ${isDark ? "bg-neutral-800 text-neutral-400" : "bg-neutral-100 text-gray-500"}`}>
            {crypto.symbol}
          </span>
        </div>
        <span className={`text-[10px] ${isDark ? "text-neutral-500" : "text-gray-500"}`}>MCap: {crypto.marketCap}</span>
      </div>

      <SparklineChart data={sparkline} isUp={isUp} />

      <div className="text-right min-w-[60px] flex-shrink-0">
        <p className={`font-semibold text-xs ${isDark ? "text-white" : "text-black"}`}>{formatPrice(crypto.price)}</p>
        <div className={`flex items-center justify-end gap-0.5 mt-0.5 px-1 py-0.5 rounded-full ${isUp ? (isDark ? "bg-green-500/20" : "bg-green-50") : isDark ? "bg-red-500/20" : "bg-red-50"}`}>
          {isUp ? <TrendingUp className="w-2.5 h-2.5 text-green-500" /> : <TrendingDown className="w-2.5 h-2.5 text-red-500" />}
          <span className={`text-[10px] font-bold ${isUp ? "text-green-500" : "text-red-500"}`}>
            {isUp ? "+" : ""}
            {change.toFixed(2)}%
          </span>
        </div>
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

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <h3 className={`text-sm font-bold ${isDark ? "text-white" : "text-black"}`}>Markets</h3>
        <button className={`text-[10px] font-semibold transition-colors ${isDark ? "text-neutral-400 hover:text-white" : "text-gray-500 hover:text-black"}`}>
          Edit
        </button>
      </div>

      <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-semibold whitespace-nowrap transition-all border ${
              activeTab === tab.id
                ? isDark
                  ? "bg-white text-black border-white"
                  : "bg-black text-white border-black"
                : isDark
                  ? "bg-transparent text-neutral-400 border-neutral-700 hover:border-neutral-500"
                  : "bg-white text-gray-500 border-neutral-200 hover:border-neutral-300"
            }`}
          >
            {tab.hasStar && <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />}
            {tab.label}
          </button>
        ))}
      </div>

      <div className={`rounded-xl px-3 border transition-colors ${isDark ? "bg-black border-neutral-700" : "bg-white shadow-sm border-neutral-100"}`}>
        {cryptoData.map((crypto) => (
          <CryptoRow key={crypto.id} crypto={crypto} />
        ))}
      </div>
    </div>
  );
}
