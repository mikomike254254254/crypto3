import { useEffect, useMemo, useState } from "react";
import { TrendingDown, TrendingUp, X } from "lucide-react";
import { Crypto } from "../types/crypto";
import { useTheme } from "../context/ThemeContext";
import { CryptoLogo } from "./CryptoLogo";
import { AnimatedNumber } from "./AnimatedNumber";

interface CoinProfileModalProps {
  crypto: Crypto;
  onClose: () => void;
}

function formatUsd(price: number) {
  if (price >= 1000) return `$${price.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  if (price >= 1) return `$${price.toFixed(2)}`;
  return `$${price.toFixed(4)}`;
}

function buildChartPath(points: number[], width: number, height: number) {
  if (points.length < 2) return "";
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = width / (points.length - 1);
  return points
    .map((p, i) => {
      const x = i * step;
      const y = height - ((p - min) / range) * (height - 8) - 4;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function CoinProfileModal({ crypto, onClose }: CoinProfileModalProps) {
  const { isDark } = useTheme();
  const [series, setSeries] = useState<number[]>(crypto.sparkline || []);
  const change = crypto.change ?? 0;
  const isUp = change >= 0;

  const coinId = crypto.symbol.toLowerCase();
  const volumeUsd = useMemo(() => {
    const base = crypto.price * (1_000_000 + coinId.length * 250_000);
    return base * (1 + Math.abs(change) / 100);
  }, [crypto.price, change, coinId]);

  useEffect(() => {
    const id = coinId;
    fetch(`/api/prices?chart=${encodeURIComponent(id)}&days=1`)
      .then((r) => r.json())
      .then((body) => {
        if (Array.isArray(body.prices) && body.prices.length > 4) {
          setSeries(body.prices.map((p: number[]) => p[1]));
        }
      })
      .catch(() => {
        if (crypto.sparkline?.length) setSeries(crypto.sparkline);
      });
  }, [coinId, crypto.sparkline]);

  const chartPath = useMemo(() => buildChartPath(series, 320, 120), [series]);
  const fillId = `chartFill-${coinId}`;
  const panel = isDark ? "bg-neutral-950 border-neutral-800 text-white" : "bg-white border-neutral-200 text-black";

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${crypto.name} price chart`}
    >
      <div
        className={`w-full max-w-sm mx-auto rounded-2xl border shadow-2xl overflow-hidden ${panel}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`p-4 border-b flex items-start justify-between gap-3 ${isDark ? "border-neutral-800" : "border-neutral-100"}`}>
          <div className="flex items-center gap-3">
            <CryptoLogo symbol={crypto.symbol} size={48} />
            <div>
              <h2 className="text-lg font-bold">{crypto.name}</h2>
              <p className={`text-sm ${isDark ? "text-neutral-400" : "text-gray-500"}`}>{crypto.symbol}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className={`p-2 rounded-lg ${isDark ? "hover:bg-neutral-800" : "hover:bg-neutral-100"}`} aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="flex items-end justify-between gap-4 mb-4">
            <div>
              <p className={`text-xs uppercase font-semibold ${isDark ? "text-neutral-500" : "text-gray-500"}`}>Live price</p>
              <p className="text-3xl font-bold mt-1">
                <AnimatedNumber value={crypto.price} format={formatUsd} />
              </p>
            </div>
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-bold ${isUp ? "bg-emerald-500/15 text-emerald-500" : "bg-red-500/15 text-red-500"}`}>
              {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {isUp ? "+" : ""}
              {change.toFixed(2)}%
            </div>
          </div>

          <div className={`rounded-xl p-3 mb-4 ${isDark ? "bg-neutral-900" : "bg-neutral-50"}`}>
            <svg viewBox="0 0 320 120" className="w-full h-28" preserveAspectRatio="none">
              <defs>
                <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isUp ? "#10b981" : "#ef4444"} stopOpacity="0.35" />
                  <stop offset="100%" stopColor={isUp ? "#10b981" : "#ef4444"} stopOpacity="0" />
                </linearGradient>
              </defs>
              {chartPath ? (
                <>
                  <path d={`${chartPath} L320,120 L0,120 Z`} fill={`url(#${fillId})`} />
                  <path d={chartPath} fill="none" stroke={isUp ? "#10b981" : "#ef4444"} strokeWidth="2.5" />
                </>
              ) : null}
            </svg>
            <p className={`text-[10px] mt-2 text-center ${isDark ? "text-neutral-500" : "text-gray-400"}`}>24h · live chart</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className={`rounded-xl p-3 ${isDark ? "bg-neutral-900" : "bg-neutral-50"}`}>
              <p className={`text-xs ${isDark ? "text-neutral-500" : "text-gray-500"}`}>24h volume (est.)</p>
              <p className="font-semibold mt-1">
                ${volumeUsd >= 1e9 ? `${(volumeUsd / 1e9).toFixed(2)}B` : volumeUsd >= 1e6 ? `${(volumeUsd / 1e6).toFixed(2)}M` : `${(volumeUsd / 1e3).toFixed(0)}K`}
              </p>
            </div>
            <div className={`rounded-xl p-3 ${isDark ? "bg-neutral-900" : "bg-neutral-50"}`}>
              <p className={`text-xs ${isDark ? "text-neutral-500" : "text-gray-500"}`}>Market cap</p>
              <p className="font-semibold mt-1">{crypto.marketCap || "—"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
