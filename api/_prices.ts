import { SWAP_RATES_USD } from "./_supabase.js";

const MARKET_COINS = [
  { symbol: "BTC", id: "bitcoin" },
  { symbol: "ETH", id: "ethereum" },
  { symbol: "USDT", id: "tether" },
  { symbol: "SOL", id: "solana" },
  { symbol: "XRP", id: "ripple" },
] as const;

let cache: { at: number; prices: Record<string, number> } | null = null;
const CACHE_MS = 60_000;

export async function fetchLiveUsdPrices(): Promise<Record<string, number>> {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_MS) {
    return cache.prices;
  }

  try {
    const ids = MARKET_COINS.map((c) => c.id).join(",");
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`,
      { headers: { accept: "application/json" } },
    );

    if (!response.ok) {
      throw new Error(`CoinGecko ${response.status}`);
    }

    const payload = (await response.json()) as Record<string, { usd?: number }>;
    const prices: Record<string, number> = { ...SWAP_RATES_USD };

    for (const coin of MARKET_COINS) {
      const usd = Number(payload[coin.id]?.usd ?? 0);
      if (usd > 0) prices[coin.symbol] = usd;
    }

    cache = { at: now, prices };
    return prices;
  } catch {
    return cache?.prices || { ...SWAP_RATES_USD };
  }
}

export function usdToTokenAmount(usd: number, symbol: string, prices: Record<string, number>) {
  const token = symbol.toUpperCase();
  if (token === "USDT") return Number(usd.toFixed(2));
  const price = prices[token] || SWAP_RATES_USD[token] || 1;
  return Number((usd / price).toFixed(8));
}
