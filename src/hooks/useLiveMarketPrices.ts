import { useCallback, useEffect, useState } from "react";

export type MarketAsset = {
  symbol: string;
  name: string;
  price: number;
  change: number;
};

const FALLBACK: MarketAsset[] = [
  { symbol: "BTC", name: "Bitcoin", price: 67432, change: 0 },
  { symbol: "ETH", name: "Ethereum", price: 3521, change: 0 },
  { symbol: "USDT", name: "Tether", price: 1, change: 0 },
  { symbol: "SOL", name: "Solana", price: 142, change: 0 },
  { symbol: "XRP", name: "XRP", price: 0.52, change: 0 },
  { symbol: "BNB", name: "BNB", price: 612, change: 0 },
  { symbol: "ADA", name: "Cardano", price: 0.45, change: 0 },
  { symbol: "DOGE", name: "Dogecoin", price: 0.082, change: 0 },
  { symbol: "AVAX", name: "Avalanche", price: 35.67, change: 0 },
  { symbol: "MATIC", name: "Polygon", price: 0.72, change: 0 },
  { symbol: "LTC", name: "Litecoin", price: 84.2, change: 0 },
  { symbol: "TRX", name: "Tron", price: 0.12, change: 0 },
  { symbol: "LINK", name: "Chainlink", price: 14.2, change: 0 },
  { symbol: "DOT", name: "Polkadot", price: 7.1, change: 0 },
  { symbol: "SHIB", name: "Shiba Inu", price: 0.00002, change: 0 },
  { symbol: "ATOM", name: "Cosmos", price: 8.5, change: 0 },
  { symbol: "UNI", name: "Uniswap", price: 9.2, change: 0 },
  { symbol: "XLM", name: "Stellar", price: 0.11, change: 0 },
  { symbol: "BCH", name: "Bitcoin Cash", price: 420, change: 0 },
  { symbol: "NEAR", name: "NEAR", price: 5.2, change: 0 },
];

/** Live USD prices via /api/prices (CoinGecko). Refreshes every 5 minutes. */
export function useLiveMarketPrices(pollMs = 5 * 60 * 1000) {
  const [assets, setAssets] = useState<MarketAsset[]>(FALLBACK);
  const [priceTick, setPriceTick] = useState(0);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/prices");
      if (!response.ok) return;
      const body = await response.json();
      if (Array.isArray(body.assets) && body.assets.length) {
        setAssets(body.assets);
        setUpdatedAt(body.updatedAt || new Date().toISOString());
        setPriceTick((tick) => tick + 1);
      }
    } catch {
      // keep last good prices
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = window.setInterval(refresh, pollMs);
    return () => window.clearInterval(interval);
  }, [pollMs, refresh]);

  return { assets, priceTick, updatedAt, loading, refresh };
}

export function marketAssetsToCrypto(assets: MarketAsset[]) {
  return assets.map((asset) => ({
    id: asset.symbol.toLowerCase(),
    name: asset.name,
    symbol: asset.symbol,
    price: asset.price,
    change: asset.change,
    isUp: asset.change >= 0,
    sparkline: [
      asset.price * 0.99,
      asset.price * 0.995,
      asset.price * 1.002,
      asset.price * 0.998,
      asset.price * 1.01,
      asset.price,
    ],
    marketCap: "—",
    volume: "—",
  }));
}
