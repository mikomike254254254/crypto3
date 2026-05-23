import type { Wallet } from "../types/crypto";

type PriceAsset = { symbol: string; price: number; change: number };

/** Weighted 24h portfolio change % from live market data */
export function computePortfolioDayChange(wallets: Wallet[], assets: PriceAsset[]) {
  const priceMap = Object.fromEntries(assets.map((a) => [a.symbol.toUpperCase(), a]));
  let totalUsd = 0;
  let weightedChange = 0;

  for (const w of wallets) {
    const sym = w.symbol.toUpperCase();
    const asset = priceMap[sym];
    const usd = w.balance * (asset?.price ?? (sym === "USDT" ? 1 : 0));
    const ch = asset?.change ?? w.change ?? 0;
    if (usd > 0) {
      totalUsd += usd;
      weightedChange += usd * ch;
    }
  }

  if (totalUsd <= 0) {
    const avg = wallets.reduce((s, w) => s + (w.change ?? 0), 0) / Math.max(wallets.length, 1);
    return { percent: avg, usdDelta: 0 };
  }

  const percent = weightedChange / totalUsd;
  const usdDelta = (totalUsd * percent) / 100;
  return { percent, usdDelta };
}
