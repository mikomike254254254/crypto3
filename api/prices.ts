import type { VercelRequest, VercelResponse } from "@vercel/node";

const MARKET_COINS = [
  { symbol: "BTC", name: "Bitcoin", id: "bitcoin" },
  { symbol: "ETH", name: "Ethereum", id: "ethereum" },
  { symbol: "USDT", name: "Tether", id: "tether" },
  { symbol: "SOL", name: "Solana", id: "solana" },
  { symbol: "XRP", name: "XRP", id: "ripple" },
  { symbol: "BNB", name: "BNB", id: "binancecoin" },
  { symbol: "ADA", name: "Cardano", id: "cardano" },
  { symbol: "DOGE", name: "Dogecoin", id: "dogecoin" },
  { symbol: "AVAX", name: "Avalanche", id: "avalanche-2" },
  { symbol: "MATIC", name: "Polygon", id: "matic-network" },
  { symbol: "LTC", name: "Litecoin", id: "litecoin" },
  { symbol: "TRX", name: "Tron", id: "tron" },
  { symbol: "LINK", name: "Chainlink", id: "chainlink" },
  { symbol: "DOT", name: "Polkadot", id: "polkadot" },
  { symbol: "SHIB", name: "Shiba Inu", id: "shiba-inu" },
  { symbol: "ATOM", name: "Cosmos", id: "cosmos" },
  { symbol: "UNI", name: "Uniswap", id: "uniswap" },
  { symbol: "XLM", name: "Stellar", id: "stellar" },
  { symbol: "BCH", name: "Bitcoin Cash", id: "bitcoin-cash" },
  { symbol: "NEAR", name: "NEAR", id: "near" },
] as const;

let cache: { at: number; assets: unknown[] } | null = null;
const CACHE_MS = 60_000;

const COIN_ID_MAP: Record<string, string> = Object.fromEntries(
  MARKET_COINS.map((c) => [c.symbol.toLowerCase(), c.id]),
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const chartSymbol = String(req.query.chart || "").toLowerCase();
  const days = String(req.query.days || "1");

  if (chartSymbol) {
    const geckoId = COIN_ID_MAP[chartSymbol] || chartSymbol;
    try {
      const chartRes = await fetch(
        `https://api.coingecko.com/api/v3/coins/${geckoId}/market_chart?vs_currency=usd&days=${days}`,
        { headers: { accept: "application/json" } },
      );
      if (!chartRes.ok) throw new Error(`Chart ${chartRes.status}`);
      const chartData = (await chartRes.json()) as { prices?: [number, number][] };
      res.setHeader("Cache-Control", "public, s-maxage=120, stale-while-revalidate=300");
      return res.status(200).json({ prices: chartData.prices || [] });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Chart unavailable";
      return res.status(502).json({ error: message, prices: [] });
    }
  }

  try {
    const now = Date.now();
    if (cache && now - cache.at < CACHE_MS) {
      res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
      return res.status(200).json({ assets: cache.assets, source: "coingecko", cached: true, updatedAt: new Date(cache.at).toISOString() });
    }

    const ids = MARKET_COINS.map((c) => c.id).join(",");
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;

    const response = await fetch(url, {
      headers: { accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`CoinGecko returned ${response.status}`);
    }

    const payload = (await response.json()) as Record<string, { usd?: number; usd_24h_change?: number }>;

    const assets = MARKET_COINS.map((coin) => {
      const row = payload[coin.id] || {};
      const price = Number(row.usd ?? 0);
      const change = Number(row.usd_24h_change ?? 0);
      return {
        symbol: coin.symbol,
        name: coin.name,
        price: price > 0 ? price : 0,
        change: Number.isFinite(change) ? change : 0,
      };
    });

    cache = { at: now, assets };
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    return res.status(200).json({
      assets,
      source: "coingecko",
      cached: false,
      updatedAt: new Date(now).toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Price feed unavailable";
    if (cache) {
      return res.status(200).json({
        assets: cache.assets,
        source: "coingecko",
        cached: true,
        stale: true,
        updatedAt: new Date(cache.at).toISOString(),
        warning: message,
      });
    }
    return res.status(502).json({ error: message });
  }
}
